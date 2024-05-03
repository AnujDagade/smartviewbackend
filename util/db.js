const { MongoClient } = require('mongodb');


const URI = process.env.MONGO_URI
console.log(URI);
const client = new MongoClient(URI)

try {
    client.connect()
} catch (err) {
    console.error(err)
}


async function getCredentials(username) {
    const db = client.db("Smartview")
    const users = db.collection("Users")
    const user = await users.findOne({ email: username })
    console.log("in db \n",user)
    if (user) {
        return {
            username: user.email,
            password: user.password
        }
    } else {
        return null
    }

}

async function saveImages(username, images) {
    const db = client.db("Smartview")
    const users = db.collection("Users")
    const result = await users.updateOne({ email: username }, { $push: { images: {$each:images} } })
    console.log("images saved", result);
    if(result){
        return true
    }else {
        return false
    }
}



async function getImages(username) {
   
    try{
        const db = client.db("Smartview")
        const users = db.collection("Users")
        let imageURls = await users.findOne({ email: username })
        console.log(imageURls)
        if(imageURls){
            return imageURls.images
        }else {
            return null
        }
        
    }catch(err){
        console.error(err)
        throw err
    }   
    
    
}

module.exports = { getCredentials , saveImages, getImages}