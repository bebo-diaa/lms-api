import express from "express";

import {
  createCourse,
  getAllCourses,
  updateCourse,
  deleteCourse,
  getMyCourses,
  getCourseById,
} from "../controller/course.controller.js";

import {
  enrollInCourse,
  getMyEnrollments,
} from "../controller/enrollment.controller.js";

import verifyToken from "../middleware/verifyToken.js";
import { allowedTo } from "../middleware/allowedTo.js";
import { userRole } from "../utils/userRole.js";

import {
  createLesson,
  getLessonsByCourse,
} from "../controller/lesson.controller.js";

import { isEnroll } from "../middleware/isEnroll.js";

import {
  createCourseValidation,
  updateCourseValidation,
  courseIdValidation,
} from "../validators/course.validators.js";

import { validatorMiddleware } from "../middleware/validatorMiddleware.js";

import {
  createLessonValidation,
  lessonIdValidation,
} from "../validators/lesson.validators.js";

import {
  markLessonComplete,
  getCourseProgress,
} from "../controller/markLessonComplete.controller.js";

import upload from "../middleware/upload.js";

const courseRouter = express.Router();

courseRouter
  .route("/create")
  .post(
    verifyToken,
    allowedTo(userRole.INSTRUCTOR, userRole.ADMIN),
    createCourseValidation,
    validatorMiddleware,
    createCourse,
  );

courseRouter.route("/").get(getAllCourses);

courseRouter.route("/myCourses").get(verifyToken, getMyCourses);

courseRouter.route("/my-enrollments").get(verifyToken, getMyEnrollments);

courseRouter
  .route("/:courseId")
  .get(courseIdValidation, validatorMiddleware, getCourseById)
  .patch(
    verifyToken,
    allowedTo(userRole.ADMIN, userRole.INSTRUCTOR),
    courseIdValidation,
    updateCourseValidation,
    validatorMiddleware,
    updateCourse,
  )
  .delete(
    verifyToken,
    allowedTo(userRole.ADMIN, userRole.INSTRUCTOR),
    courseIdValidation,
    validatorMiddleware,
    deleteCourse,
  );

courseRouter
  .route("/:courseId/enroll")
  .post(verifyToken,allowedTo(userRole.STUDENT) ,courseIdValidation, validatorMiddleware, enrollInCourse);

courseRouter
  .route("/:courseId/lessons")
  .post(
    verifyToken,
    allowedTo(userRole.INSTRUCTOR, userRole.ADMIN),
    upload.single("video"),
    courseIdValidation,
    createLessonValidation,
    validatorMiddleware,
    createLesson,
  )
  .get(
    verifyToken,
    courseIdValidation,
    validatorMiddleware,
    isEnroll,
    getLessonsByCourse,
  );

courseRouter
  .route("/:courseId/lessons/:lessonId/complete")
  .post(
    verifyToken,
    courseIdValidation,
    lessonIdValidation,
    validatorMiddleware,
    isEnroll,
    markLessonComplete,
  );

courseRouter
  .route("/:courseId/progress")
  .get(
    verifyToken,
    courseIdValidation,
    validatorMiddleware,
    isEnroll,
    getCourseProgress,
  );

export default courseRouter;
