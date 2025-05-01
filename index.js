const express=require('express')
const connectToMongo=require("./db")
const app=express()
var cors = require('cors')
const cookieParser = require('cookie-parser')
const path = require('path');

connectToMongo()

const allowedOrigins = [
    'http://localhost:5173',
    'https://glittery-arithmetic-b2cbe0.netlify.app',
    "https://i-notebook-frontend-9hua0vpr8-pratik-jadhavs-projects-70fe9421.vercel.app/"
  ];
  
  app.use(cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
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
