const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MusicSchema = new Schema(
    {
        name: String,
        filename: String
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Music", MusicSchema);