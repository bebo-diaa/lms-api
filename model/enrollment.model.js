import mongoose  from "mongoose";   


const enrollmentSchema = new mongoose.Schema(
    {

        student:{
            type : mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        course:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true
        }



    },
    {
        timestamps: true
    }

)


enrollmentSchema.index({student: 1, course: 1 }, {unique: true})


const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

export default Enrollment;
