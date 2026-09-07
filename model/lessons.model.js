import mongoose from "mongoose";


const lessonSchema = new mongoose.Schema(

{
    title: {
        type: String,
        required: true    
    },
    videoUrl:{
        type: String,
        required: true
    },
    course:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    order:{
        type: Number,
        required: true,
    }


},

{
    timestamps: true
}

);

lessonSchema.index({course: 1, order: 1}, {unique: true})


const Lesson = mongoose.model('Lesson', lessonSchema);

export default Lesson;
