const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const mongoose = require('mongoose')
const DB = process.env.DATABASE

console.log("Loaded DB URI from env:", DB);

if (!DB) {
    throw new Error("Environment variable is not defined")
}

const connectToMongo = async () => {
    try {
        await mongoose.connect(DB)
        console.log("Connected to mongoDB")
    } catch (err) {
        console.log(err)
    }
}

module.exports = connectToMongo
