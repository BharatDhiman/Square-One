const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    isAdmin:{
        type:Boolean,
        required: false
    },
    rechargeReq: [{amount:Number,email:String,contact:Number}],
    orders: [{item:String,quant:Number,price:Number}],
    prevorder:[],
    name: {
        type:String,
        required: true
    },
    rollnumber: {
        type: Number,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    dob: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    contactnumber: {
        type: Number,
        required: true
    },
    balance: {
        type:Number,
        required: false
    }
});


const User = mongoose.model('User', UserSchema);

module.exports = User;