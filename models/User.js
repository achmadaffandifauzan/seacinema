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
        required: true
    },
    dateCreated: {
        type: String,
    },
    balance: {
        type: Number,
    },
    cart: [
        {
            movieIndexInArray: Number,
            movieName: String,
            quantity: Number,
        }
    ],
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);
