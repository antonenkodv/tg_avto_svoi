const {Schema, model, Types} = require('mongoose')

const schema = new Schema({
    number: {type: String, required: true},
    owner: {type: String},
    type: {type: String},
    gabarits: {type: Object},
    events: ({type: Types.ObjectId, ref: 'Event'})
})

module.exports = model('Auto', schema)