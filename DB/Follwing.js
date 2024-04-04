const mongoose = require("mongoose");

const follwingSchema = mongoose.Schema({
    id: String,
    follwing: String
});

module.exports = mongoose.model('Follwing', follwingSchema);