import mongoose from "mongoose";
import {courseCategory} from "../utils/category.js";
const courseSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true
    },
    
    description: {
        type: String,
        required: true
    },

    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    price: {
        type: Number,
        required: true
    },

    published: {
        type: Boolean,
        default: false
    },

    category:{
        type: String,
        enum: [courseCategory.PROGRAMMING, courseCategory.DESIGN, courseCategory.MARKETING, courseCategory.BUSINESS, courseCategory.LANGUAGES, courseCategory.PERSONAL_DEVELOPMENT],
        required: true
    }


},
    { timestamps: true }
);


const Course = mongoose.model("Course", courseSchema);

export default Course;

