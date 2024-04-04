const mongoose = require("mongoose");
const Comm =  require("./Comm")
const Follwers = require("./Follwers");
const Follwing = require("./Follwing");

const FeedSchema = mongoose.Schema({
    id: String,
    filename: String,
    date: String,
    s3_file: String,
    profile_name: String,
    s3_profile: {type: String, default: "https://proiect-licenta.s3.eu-central-1.amazonaws.com/profileDefault"},
    lights: Number,
    des: String,
    comm: [Comm.schema],
    follwers: [Follwers.schema]
});

module.exports = mongoose.model('Feed', FeedSchema);