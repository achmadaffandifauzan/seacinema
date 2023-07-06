const mongoose = require('mongoose');
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
    quantity: {
        type: Number,
        min: 1,
    }, title: {
        type: String,
    },
    description: {
        type: String,
    },
    release_date: {
        type: String,
    },
    poster_url: {
        type: String,
    },
    age_rating: {
        type: Number,
        min: 0
    },
    ticket_price: {
        type: Number,
        min: 0
    },
});


module.exports = mongoose.model('Cart', cartSchema);