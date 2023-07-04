const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const { Schema } = mongoose;

const transactionSchema = new Schema({
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    status: {
        type: String,
    },
});


module.exports = mongoose.model('Transaction', transactionSchema);