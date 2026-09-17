import asyncWrapper from "../middleware/asyncWrapper.js";
import Course from "../model/course.model.js";
import Enrollment from "../model/enrollment.model.js";
import { httpStatusText } from "../utils/httpStatusText.js";
import AppError from "../utils/appError.js";
import {getPaginationParams} from "../utils/pagination.js";


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

    async (req, res, next) => {

        const { page, limit, skip } = getPaginationParams(req.query);
        const user = req.currentUser.id;

    const [myCourses, totalEnrollments] = await Promise.all(
        [
            Enrollment.find({student: user}).populate('course').skip(skip).limit(limit),
            Enrollment.countDocuments({student: user})
        ]
    );

    const totalPages = Math.ceil(totalEnrollments / limit);

res.json({
    status: httpStatusText.SUCCESS,
    data: {
        enrollments: myCourses,
        pagination: { page, limit, totalEnrollments, totalPages }
    }
});



    }


)

export{
    enrollInCourse,
    getMyEnrollments
}