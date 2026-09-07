import asyncWrapper from "../middleware/asyncWrapper.js";
import Course from "../model/course.model.js";
import AppError from "../utils/AppError.js";
import { httpStatusText } from "../utils/httpStatusText.js";
import { userRole } from "../utils/userRole.js";

const createCourse = asyncWrapper(
    async (req, res) => {

        const { title, description, price } = req.body;

        const instructor = req.currentUser.id;

        const newCourse = new Course({
            title,
            description,
            price,
            instructor
        });

        await newCourse.save();

        res.json({ status: httpStatusText.SUCCESS, data: newCourse })
    }

);

const getAllCourses = asyncWrapper(
    async (req, res) => {

        const courses = await Course.find({ published: true }).populate('instructor');


        res.json({ status: httpStatusText.SUCCESS, data: { courses } })

    }
);

const updateCourse = asyncWrapper(
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

        const { title, description, price, published } = req.body;

        const updatedCourse = await Course.findByIdAndUpdate(
            courseId,
            {
                $set: {
                    title,
                    description,
                    price,
                    published
                }
            },
            { new: true }
        );

        res.json({ status: httpStatusText.SUCCESS, data: updatedCourse });

    }

);

const deleteCourse = asyncWrapper(

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

        const deletedCourse = await Course.findByIdAndDelete(courseId);


        res.json({ status: httpStatusText.SUCCESS, data: { course: deletedCourse } });



    }

);

const getMyCourses = asyncWrapper(
    async (req, res) => {

        const courses = await Course.find({ instructor: req.currentUser.id }).populate('instructor');

        res.json({ status: httpStatusText.SUCCESS, data: { courses } });

    }
);

const getCourseById = asyncWrapper(

    async (req, res, next) => {

        const courseId = req.params.courseId;

        const course = await Course.findById(courseId);

        if (!course) {
            const error = AppError.create("Course not found", 404, httpStatusText.ERROR);
            return next(error);
        };

        if (course.published) {

            return res.json({ status: httpStatusText.SUCCESS, data: course });
        }

        const isAdmin = req.currentUser && req.currentUser.role === userRole.ADMIN;
        const isOwner = req.currentUser && course.instructor.toString() === req.currentUser.id;

        if (isAdmin || isOwner) {
            return res.json({ status: httpStatusText.SUCCESS, data: course });
        }

        const error = AppError.create("This course is not available", 403, httpStatusText.ERROR);
        return next(error);

    }

);


export {
    createCourse,
    getAllCourses,
    updateCourse,
    deleteCourse,
    getMyCourses,
    getCourseById
}