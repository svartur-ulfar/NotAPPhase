const mongoose = require("mongoose");

const photoSchema = mongoose.Schema({
    filename: String,
    date: String,
    s3_file: String
});

module.exports = mongoose.model('Photo', photoSchema);