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
        // total updated many times on router
        type: Number,
        min: 0,
    },
    tickets: [
        {
            type: Schema.Types.ObjectId,
            ref: 'BookedSeat'
        }
    ],
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);