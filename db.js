const mongoose=require('mongoose')
const mongoURI="mongodb+srv://pratikvj9370:Pratik2605@cluster0.i7ubh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
const connectToMongo=async()=>{
    await mongoose.connect(mongoURI)
    console.log("Connected to mongoDB")
}

module.exports=connectToMongo