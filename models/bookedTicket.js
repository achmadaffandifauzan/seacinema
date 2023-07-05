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
});

module.exports = mongoose.model('BookedTicket', bookedTicketSchema);