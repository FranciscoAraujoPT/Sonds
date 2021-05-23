const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const Music = require("./models/music");
const Album = require("./models/album");
const multer = require("multer");
const uuid = require("uuid").v4;
const fs = require('fs');
const methodOverride = require("method-override");

mongoose.connect("mongodb://localhost:27017/sonds", {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

// -----------------------------auxiliary--------------------------------\\

const dest = async (req, file, cb) => {
    const album_id = req.params.id;
    if (!fs.existsSync(`public/Albuns/${album_id}`)) {
        fs.mkdirSync(`public/Albuns/${album_id}`);
    }
    cb(null, `public/Albuns/${album_id}`);
}

const file = async (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const id = uuid();
    const filePath = `${id}${ext}`
    const music = new Music({
        name: req.body.music.name,
        filename: filePath
    })
    await music.save();
    const album = await Album.findById(req.params.id);
    album.musics.push(music);
    await album.save();
    cb(null, filePath);
}

const file_updater = async (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const id = uuid();
    const filePath = `${id}${ext}`
    const music = await Music.findByIdAndUpdate(req.params.music_id,
        {
            name: req.body.music.name,
            filename: filePath
        });
    await music.save();
    const album_id = req.params.id;
    try {
        fs.unlinkSync(`public/Albuns/${album_id}/${music.filename}`);
    } catch (error) {
        console.log("Failed to delete the file.", error);
    }
    cb(null, filePath);
}

//-----------------------------------------------------------------------\\
const storage = multer.diskStorage({
    destination: dest,
    filename: file
});

const storage_updater = multer.diskStorage({
    destination: dest,
    filename: file_updater
});

const upload = multer({ storage });
const upload_updater = multer({ storage: storage_updater });
const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use("/", express.static(path.join(__dirname, "public/Albuns")));
app.use("/", express.static(path.join(__dirname, "public/images")));

app.get("/", async (req, res) => {
    const albums = await Album.find({});
    res.render("home", { albums });
});

app.get("/new", (req, res) => {
    res.render("new");
});

app.get("/:id/new", async (req, res) => {
    const album = await Album.findById(req.params.id);
    res.render("newMusic", { album });
});

app.get("/:id/edit", async (req, res) => {
    const album = await Album.findById(req.params.id);
    res.render("edit", { album });
});

app.get("/:id/:music_id/edit", async (req, res) => {
    const album_id = req.params.id;
    const music = await Music.findById(req.params.music_id);
    res.render("editMusic", { music, album_id });
});

app.get("/:id/:music_id", async (req, res) => {
    const album = await Album.findById(req.params.id)
    const music = await Music.findById(req.params.music_id)
    res.render("showMusic", { album, music });
});

app.get("/:id", async (req, res) => {
    const album = await Album.findById(req.params.id)
        .populate("musics");
    res.render("show", { album });
});

app.post("/", async (req, res) => {
    const album = new Album(req.body.album);
    await album.save();
    res.redirect(`/${album._id}`);
});

app.post("/:id", upload.single("music[file]"), async (req, res) => {
    const album = await Album.findById(req.params.id);
    res.redirect(`/${album._id}`);
})

app.delete("/:id", async (req, res) => {
    const album = await Album.findByIdAndDelete(req.params.id);
    res.redirect("/");
});

app.delete("/:id/:music_id", async (req, res) => {
    const album_id = req.params.id;
    const music = await Music.findByIdAndDelete(req.params.music_id);

    try {
        fs.unlinkSync(`public/Albuns/${album_id}/${music.filename}`);
    } catch (error) {
        console.log("Failed to delete the file.", error);
    }

    res.redirect(`/${album_id}`);
});

app.put("/:id", async (req, res) => {
    const album = await Album.findByIdAndUpdate(req.params.id, { ...req.body.album });
    res.redirect(`/${album._id}`);
});

app.put("/:id/:music_id", upload_updater.single("music[file]"), async (req, res) => {
    const album_id = req.params.id;
    const music_id = req.params.music_id;
    res.redirect(`/${album_id}/${music_id}`);
});

app.listen(3000, () => {
    console.log("Serving on port 3000");
});