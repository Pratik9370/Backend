const mongoose=require('mongoose')

const noteSchema={
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user'
    },
    title:{
        type: String,
        required:true
    },
    description:{
        type: String,
        required:true
    },
    tag:{
        type: String,
        default: "General"
    },
    date:{
        type: Date,
        default: Date.now
    },
    image:{
        type:String
    },
    imagePublicId:{
        type:String
    }
}

module.exports=mongoose.model('note',noteSchema)
