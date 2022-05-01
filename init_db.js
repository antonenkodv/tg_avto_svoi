const mongoose = require('mongoose')
require('dotenv').config()
const mongoUrl = process.env.MONGO_URL

async function connectToDb() {
    try{
        await mongoose.connect((mongoUrl), {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
    }catch(err){
        console.log(err)
    }

}

module.exports = {connectToDb}