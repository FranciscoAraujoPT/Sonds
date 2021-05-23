const mongoose = require("mongoose");
const Music = require("./music");
const fs = require('fs');
const del = require('del');
const Schema = mongoose.Schema;

const AlbumSchema = new Schema(
    {
        name: String,
        artist: String,
        musics: [{ type: Schema.Types.ObjectId, ref: "Music" }]
    },
    {
        timestamps: true
    }
);

AlbumSchema.post("findOneAndDelete", async function (album) {
    if (album.musics.length) {
        await Music.deleteMany({ _id: { $in: album.musics } });
    }

    const dir = `public/Albuns/${album._id}`;
    if (fs.existsSync(dir)) {
        try {
            await del(dir);
        } catch (err) {
            console.error(`Error while deleting ${dir}.`);
        }
    }
});

module.exports = mongoose.model("Album", AlbumSchema);
