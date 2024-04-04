const mongoose = require("mongoose");

const follwersSchema = mongoose.Schema({
    id: String,
    follwers: String
});

module.exports = mongoose.model('Follwers', follwersSchema);