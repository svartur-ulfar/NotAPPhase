const mongoose = require("mongoose");

const commSchema = mongoose.Schema({
    comm: String,
    profile_name: String
});

module.exports = mongoose.model('Comm', commSchema);