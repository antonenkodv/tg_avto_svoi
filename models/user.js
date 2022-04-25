const {Schema, model, Types} = require('mongoose')

const schema = new Schema({
    userid: {type: String, required: true, unique: true},
    chat_id: {type: String, unique: true},
    name: {type: String},
    autos: {type: Array},
    tel_number: {type: String},
    radius: {type: Array},
    schedule: {type: Date},
    default_destination: {type: String},
    commitment: {type: Boolean},
    events: ({type: Types.ObjectId, ref: 'Event'})
})

module.exports = model('User', schema)