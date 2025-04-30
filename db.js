const mongoose=require('mongoose')
const mongoURI="mongodb://localhost:27017/testing"
const connectToMongo=async()=>{
    await mongoose.connect(mongoURI)
    console.log("Connected to mongoDB")
}

module.exports=connectToMongo