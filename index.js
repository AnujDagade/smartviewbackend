const { upload } = require("./middleware/multer.js");
const { app } = require("./app.js");
require('dotenv').config()
const { getCredentials, saveImages, getImages } = require("./util/db.js")
const jwt = require('jsonwebtoken')
const { getCaption } = require("./util/gemini.js");
const fs = require("fs");
const secret = "temp secret"
const path = require("path");
const exiftool = require('node-exiftool');
const ep = new exiftool.ExiftoolProcess();


function getImageType(extension) {
	const mappings = {
		'.jpg': 'image/jpeg',
		'.jpeg': 'image/jpeg',
		'.png': 'image/png',
		'.gif': 'image/gif',
		'.bmp': 'image/bmp',
		'.webp': 'image/webp',
		'.svg': 'image/svg+xml',
		'.ico': 'image/x-icon',
	};

	return mappings[extension.toLowerCase()];
}

function authenticate(req, res, next) {
	console.log("In auth", req.headers.authorization);
	const token = req.headers.authorization.split(' ')[1];
	console.log("in middlwware", token);
	if (!token)
		return res.status(401).send('Unauthorized');
	try {
		const payload = jwt.verify(token, secret);
		req.user = payload;
		next();
	} catch (err) {
		return res.status(401).send('Unauthorized');
	}
}



app.get("/caption", async (req, res) => {
	const caption = await getCaption("util/austria.jpg");
	res.send(caption);
});

app.post('/test', authenticate, (req, res) => {
	console.log(req.user);
	res.send({ message: req.user });
})




app.post("/login", async (req, res) => {


	let user;

	try {
		user = await getCredentials(req.body.email)
	} catch (error) {
		console.log(error);
		res.status(500).send({ message: "Internal Server Error" });
	}
	if(!user){
		res.status(401).send({ message: "Login Failed" });
		return;
	}

	console.log(user)
	if (user.username === req.body.email && req.body.password === user.password) {
		const token = jwt.sign({ username: user.username }, secret, { expiresIn: '1h' });

		res.status(200).send({ token: token, message: "Login Successful" });
	} else {
		res.status(401).send({ message: "Login Failed" });
	}
})


app.post("/upload", authenticate, upload.array('images', 100), async (req, res) => {
	/**
	 * Get Images from request
	 * Loop through images
	 * Get caption and tags for each image
	 * Save caption and tags as metadata or in a database
	 */
	
	console.log(req.user);

	//TODO
	//Learn more about how async functions are working
	const imageNames = []
	const captionList = []
	const tagsList = []

	await ep.open();
	for (const image of req.files) {
		imageNames.push(image.filename);
		const imagePath = path.join(__dirname, 'images', image.filename);
		const {caption, tags} = await getCaption(imagePath);
		console.log(caption);
		captionList.push(caption);
		tagsList.push(tags);
		// Write the caption to the image metadata
		await ep.writeMetadata(imagePath, { 'ImageDescription': caption}, ['overwrite_original']);
		await ep.writeMetadata(imagePath, { 'Keywords': tags}, ['overwrite_original']);
	}
	await ep.close();


	const isSaved = await saveImages(req.user.username, imageNames)
	if (isSaved)
		res.status(200).send({ message: "Images Saved", caption: captionList ,tags: tagsList});
	else
		res.status(500).send({ message: "Internal Server Error" });

})


//TODO
app.get("/getImages", authenticate, async (req, res) => {
	const images = await getImages(req.user.username)
	const dataUrls = [];
	// const dataUrls = await Promise.all(images.map(async image => {
	// 	const filePath = path.join(__dirname, 'images', image)
	// 	console.log("PATH", filePath);
	// 	const fileData = await fs.promises.readFile(filePath)
	// 	const extension = path.extname(image);
	// 	const mimeType = getImageType(extension);
	// 	const dataUrl = `data:${mimeType};base64,${fileData.toString('base64')}`
	// 	return dataUrl;
	// }))


	await ep.open();
    for (const image of images) {
        try{
			const imagePath = path.join(__dirname, 'images', image);
        const fileData = await fs.promises.readFile(imagePath);
        const extension = path.extname(image);
        const mimeType = getImageType(extension);
        const dataUrl = `data:${mimeType};base64,${fileData.toString('base64')}`;
		// Read the caption from the image metadata
        const metadata = await ep.readMetadata(imagePath, ['-File:all']);
        const caption = metadata.data[0].ImageDescription;
		const tags = metadata.data[0].Keywords;
        dataUrls.push({dataUrl, caption ,tags});
		}catch(err){
			console.log(err);
		}

        
        
    }
    await ep.close();


	if (dataUrls)
		res.status(200).send(dataUrls);
	else
		res.status(500).send({ message: "Internal Server Error" })

})


app.listen(8000, () => {
	console.log("server is running at http://localhost:8000");
});


