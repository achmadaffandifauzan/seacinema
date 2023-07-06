const mongoose = require('mongoose');
const { Schema } = mongoose;

const bookedTicketSchema = new Schema({
    bookedSeats: [
        {
            type: Schema.Types.ObjectId,
            ref: 'BookedSeat',
        }
    ],
    availableSeats: [
        {
            type: Number,
            min: 1,
            max: 64,
        }
    ],
    title: {
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

module.exports = mongoose.model('BookedTicket', bookedTicketSchema);