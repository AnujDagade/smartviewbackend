// importing google Gen AI package
const { GoogleGenerativeAI } = require("@google/generative-ai");
// importing fs library
const fs = require("fs");

// store the APiKEY (.env) so we acess APi Key in our code
require("dotenv").config();
console.log(process.env.API_KEY);
// creating an object genAI with a class googlegenerativeAI, store the APIKEY into the object
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
console.log(genAI);
// creating an object model with a class getGenerativeModel, store the model into the object
const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
console.log(model);

function fileToGenerativePart(path, mimeType) {
  return {
    inlineData: {
      // fs is a library where we can read files from pc
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType,
    },
  };
}
async function getCaption(path) {
  const result = await generateCaption(path);
  console.log(result);
  return result;
}

async function generateCaption(path) {
  const imageParts = [
    // fileToGenerativePart("image1.png", "image/png"),
    fileToGenerativePart(path, "image/jpeg"),
  ];
  const prompt =
    "Identify the place from image, just give me the name of the place, only the name of the place maximun 3 words";

  const res = await model.generateContent([prompt, ...imageParts]);
  const result = await res.response;

  const prompt2 = "Add 5 tags for the image based on the content of the image. Each tag needs to have a pound sign and a unique word only give me tags if you can't think of any tags just say none. Dont say anything else."
  let tags = await model.generateContent([prompt2, ...imageParts]);
  tags = await tags.response;

  return { caption: result.text(), tags: tags.text()};
}

//getCaption("util/austria.jpg");

module.exports = { getCaption };
 