const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true,
        min: 0,
    },
    dateCreated: {
        type: String,
    },
    balance: {
        type: Number,
        min: 0,
    },
    carts: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Cart'
        }
    ],
    totalCartValue: {
        // total updated everytime on middleware
        type: Number,
        min: 0,
    },
    transactions: {
        type: Schema.Types.ObjectId,
        ref: 'Transaction'
    },
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema); 
