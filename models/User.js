const {Schema, model, Types} = require('mongoose')

const user = new Schema({
        adress: {type: String, default: null},
        name: {type: String, default: null},
        tel_number: {type: String, default: null},
        chat_id: {type: String, required: true},
        cars: [{type: Types.ObjectId, ref: 'Car'}],
        cars_approved: {type: Boolean, default: false},
        type: {type: String, default: null},
        radius: {done: {type: Boolean, default: false}, regions: [{type: String}]},
        schedule: {type: String, default: null},
        district: {type: String, default: null},
        microdistrict: {type: String, default: null},
        certification : {type : String , default : null}
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    })

module.exports = model('User', user)
