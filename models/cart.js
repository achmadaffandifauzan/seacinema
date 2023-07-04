const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const { Schema } = mongoose;

const cartSchema = new Schema({
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    movieIndexInArray: {
        type: Number,
        min: 0,
    },
    title: {
        type: String,
    },
    quantity: {
        type: Number,
        min: 1,
    },
});


module.exports = mongoose.model('Cart', cartSchema);