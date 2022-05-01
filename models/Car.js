const {Schema, model, Types} = require('mongoose')
const car = new Schema({
    model: {type: String, required: true},
    digits: {type: String, require: true},
    owner: {type: Types.ObjectId, ref: 'User'},
    dimensions: {type: String, default : null},
    carrying: {type: String,default : null},
    color : {type : String},
    type: {type: String, default : null},
    subtype : {type : String , default : null}
})

module.exports = model('Car', car)