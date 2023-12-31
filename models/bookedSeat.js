const mongoose = require('mongoose');
const { Schema } = mongoose;

const bookedSeatSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    fromBookedTicket: {
        type: Schema.Types.ObjectId,
        ref: 'BookedTicket',
    },
    seatNumber: {
        type: Number,
        min: 1,
        max: 64,
    },
    status: {
        type: String,
        // ongoing,past,cancelled
    },
    datePurchase: {
        type: String,
    },
    dateCancel: {
        type: String,
    }
});


module.exports = mongoose.model('BookedSeat', bookedSeatSchema);