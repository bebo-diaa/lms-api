import mongoose from "mongoose";
import validator from 'validator';
import { userRole } from "../utils/userRole.js";







const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        validate: [validator.isEmail, "someThinge error make sure form email"]
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    role: {
        type: String,
        enum: [userRole.ADMIN, userRole.INSTRUCTOR, userRole.STUDENT],
        default: userRole.STUDENT
    },
    avatar: {
        type: String,
    },

}, {
    timestamps: true
}

)


const User = mongoose.model('User', userSchema);

export default User;

