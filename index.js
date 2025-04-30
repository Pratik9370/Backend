const express=require('express')
const connectToMongo=require("./db")
const app=express()
var cors = require('cors')
const cookieParser = require('cookie-parser')
const path = require('path');

connectToMongo()

app.use(cors({
    origin: 'http://localhost:5173', // frontend URL
    credentials: true,               // To Allow cookies to be sent
  }));
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', require('./routes/auth'))
app.use('/api/notes', require('./routes/notes'))
app.use('/images/uploads', express.static(path.join(__dirname, 'public/images/uploads')));


app.get("/",(req,res)=>{
    res.send("Hello Pratik")
})

app.listen(3000,()=>{
    console.log("Server is listening on port 3000")
})
