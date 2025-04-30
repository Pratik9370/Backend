const express = require('express')
const router = express.Router()
const { body, validationResult } = require('express-validator');
const fs = require('fs');

const fetchUser = require('../middleware/fetchUser')

const Notes = require('../models/Notes')
const User = require('../models/User')
const upload = require('../config/Multer')

router.get("/readNotes", fetchUser, async (req, res) => {
    const userid = req.user.id
    const notes = await Notes.find({ user: userid })
    res.json(notes)
})

router.post("/addNote", fetchUser, upload.single('file'), [body('title', 'Title should not be empty').exists(), body('description', 'Description should not be empty').exists()], async (req, res) => {
    // Validate the inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    try {
        let { title, description, tag } = req.body
        const userid = req.user.id
        let newNote = await Notes.create({ user: userid, title, description, tag })
        req.file && (
            await newNote.push({image:"/images/uploads/"+req.file.filename}),
            await newNote.save()
        )
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

router.put("/editNote/:id", fetchUser, async(req,res)=>{
    try {
        let {title, description, tag}=req.body
        let noteId=req.params.id
        let Note=await Notes.findOne({_id:noteId})
        if(!Note){
            return res.status(404).json({error:"Note not found"})
        }
        if(Note.user.toString()!=req.user.id){
            return res.status(401).json({error:"You cant edit others note"})
        }
        let editedNote=await Notes.findByIdAndUpdate(noteId, {title, description, tag}, {new:true})
        res.json(editedNote)
    } catch (error) {
        console.log(error.message)
        res.status(500).send("Internal Server error")
    }
})

router.delete("/deleteNote/:id", fetchUser, async(req,res)=>{
    try {
        let noteId=req.params.id
        let Note=await Notes.findOne({_id:noteId})
        if(!Note){
            return res.status(404).json({error:"Note not found"})
        }
        if(Note.user.toString()!=req.user.id){
            return res.status(401).json({error:"You cant delete others note"})
        }
        fs.unlink("C:/Users/HP/OneDrive/Desktop/React/iNotebook/backend/public"+Note.image, (err) => {
            if (err) {
              console.error('Error deleting file:', err);
              return;
            }
            console.log('File deleted successfully');
          });
        await Notes.findByIdAndDelete(noteId)
        let user=await User.findOne({_id:req.user.id})
        user.notes.pull(noteId)
        user.save()
        res.json({success:"Note deleted successfully"})
    } catch (error) {
        console.log(error.message)
        res.status(500).send("Internal Server error")
    }
})

module.exports = router