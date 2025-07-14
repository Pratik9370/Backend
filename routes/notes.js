const express = require('express')
require('dotenv').config()
const router = express.Router()
const { body, validationResult } = require('express-validator');
const fs = require('fs');

const fetchUser = require('../middleware/fetchUser')

const Notes = require('../models/Notes')
const User = require('../models/User')
const upload = require('../config/Multer')

const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.get("/readNotes", fetchUser, async (req, res) => {
    const userid = req.user.id
    const notes = await Notes.find({ user: userid })
    res.json(notes)
})

router.post("/addNote", fetchUser, upload.single('image'), [body('title', 'Title should not be empty').exists(), body('description', 'Description should not be empty').exists()], async (req, res) => {
    // Validate the inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    try {
        let { title, description, tag } = req.body
        const userid = req.user.id

        let newNote = await Notes.create({ user: userid, title, description, tag })

        if (req.file) {
            newNote.image = req.file.path; // Cloudinary URL
            newNote.imagePublicId = req.file.filename; // Public ID
            await newNote.save();
        }

        let user = await User.findOne({ _id: userid })
        await user.notes.push(newNote._id)
        await user.save()
        console.log(req.file)
        res.json(newNote)
    } catch (error) {
        console.log(error.message)
        res.status(500).send("Internal Server error")
    }
})

router.patch("/editNote/:id", fetchUser, async (req, res) => {
    try {
        let { title, description, tag } = req.body
        let noteId = req.params.id
        let Note = await Notes.findOne({ _id: noteId })
        if (!Note) {
            return res.status(404).json({ error: "Note not found" })
        }
        if (Note.user.toString() != req.user.id) {
            return res.status(401).json({ error: "You cant edit others note" })
        }
        let editedNote = await Notes.findByIdAndUpdate(noteId, { title, description, tag }, { new: true })
        console.log(editedNote)
        res.json(editedNote)
    } catch (error) {
        console.log(error.message)
        res.status(500).send("Internal Server error")
    }
})

router.delete("/deleteNote/:id", fetchUser, async (req, res) => {
    try {
        let noteId = req.params.id
        let Note = await Notes.findOne({ _id: noteId })
        if (!Note) {
            return res.status(404).json({ error: "Note not found" })
        }
        if (Note.user.toString() != req.user.id) {
            return res.status(401).json({ error: "You cant delete others note" })
        }


        if (Note.imagePublicId) {
            await cloudinary.uploader.destroy(Note.imagePublicId);
        }

        await Notes.findByIdAndDelete(noteId)
        let user = await User.findOne({ _id: req.user.id })
        user.notes.pull(noteId)
        user.save()
        res.json({ success: "Note deleted successfully" })
    } catch (error) {
        console.log(error.message)
        res.status(500).send("Internal Server error")
    }
})

module.exports = router