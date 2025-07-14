require("dotenv").config();
const multer  = require('multer')
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const path=require('path')
const crypto=require('crypto')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
  params: {
    folder: "notesApp", // folder name in Cloudinary
    allowed_formats: ["jpg", "png", "jpeg"],
  },
  })
  
  const upload = multer({ storage: storage })
  module.exports=upload