const {Schema, model} = require('mongoose')

const message = new Schema({
    chat_id: {type: String, default: null},
    type: {type: String, default: null},
})


module.exports = model('Message', message)
