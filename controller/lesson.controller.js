import asyncWrapper from "../middleware/asyncWrapper.js";
import Course from "../model/course.model.js";
import { httpStatusText } from "../utils/httpStatusText.js";
import AppError from "../utils/appError.js";
import { userRole } from "../utils/userRole.js";
import Lesson from "../model/lessons.model.js";

const createLesson = asyncWrapper(


    async (req, res, next) => {

        const courseId = req.params.courseId;

        const course = await Course.findById(courseId);

        if (!course) {
            const error = AppError.create("Course not found", 404, httpStatusText.ERROR);
            return next(error);
        }

        if (course.instructor.toString() !== req.currentUser.id && req.currentUser.role !== userRole.ADMIN) {
            const error = AppError.create("this operation is forbidden ", 403, httpStatusText.ERROR);
            return next(error);
        }

        const { title, videoUrl } = req.body;

        const countLesson = await Lesson.countDocuments({ course: courseId });

        const newOrder = 1 + countLesson;

        const newLesson = new Lesson(
            {
                title,
                videoUrl,
                course: courseId,
                order: newOrder
            }
        )

        await newLesson.save();

        res.json({ status: httpStatusText.SUCCESS, data: newLesson });

    }

)

const getLessonsByCourse = asyncWrapper(

    async (req, res, next) => {


        const courseId = req.params.courseId;

        const lessons = await Lesson.find({course: courseId }).sort({ order: 1 });

        res.json({status: httpStatusText.SUCCESS, data: lessons});




    }



)

export {
    createLesson,
    getLessonsByCourse
}