import asyncWrapper from "../middleware/asyncWrapper.js";
import Course from "../model/course.model.js";
import Enrollment from "../model/enrollment.model.js";
import { httpStatusText } from "../utils/httpStatusText.js";
import AppError from "../utils/AppError.js";




const enrollInCourse = asyncWrapper(

    async (req, res, next) => {

        const courseId = req.params.courseId;

        const course = await Course.findById(courseId);

        if (!course) {
            const error = AppError.create("Course not found", 404, httpStatusText.ERROR);
            return next(error);
        }

        if (course.published !== true) {
            const error = AppError.create("Course not available", 403, httpStatusText.ERROR);
            return next(error);
        }
        try {

            const enrolledCourse = new Enrollment(
                {
                    student: req.currentUser.id,
                    course: courseId

                }
            )

            await enrolledCourse.save();
            res.json({ status: httpStatusText.SUCCESS, data: enrolledCourse })

        }
        catch (err) {
            if (err.code == 11000) {
                const error = AppError.create("duplicated enrollment ", 409, httpStatusText.ERROR);
                return next(error);

            }else{
                return next(err);
            }
        }


    }

)


const getMyEnrollments = asyncWrapper(

    async (req, res, next)=>{


        const user = req.currentUser.id;

        const myCourses = await Enrollment.find({student: user}).populate('course');


        res.json({status: httpStatusText.SUCCESS, data: myCourses});


    }


)

export{
    enrollInCourse,
    getMyEnrollments
}