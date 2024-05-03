// import express package
// Load express library into our code
const express = require("express");
const cors = require('cors')
// Cretae an app object using express
const app = express();







app.use(cors({
    origin: "https://smartviewgal.netlify.app",
    credentials: true
}))




// session stores the data in the server so that I just have to login once, and the data entered

app.use(express.json())


// using app object to start the Server
module.exports = { app };
