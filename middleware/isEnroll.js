import Course from "../model/course.model.js";
import { httpStatusText } from "../utils/httpStatusText.js";
import AppError from "../utils/appError.js";
import { userRole } from "../utils/userRole.js";
import Enrollment from "../model/enrollment.model.js";

const isEnroll = async (req, res, next) => {
  const courseId = req.params.courseId;
  const student = req.currentUser.id;

  const course = await Course.findById(courseId);

  if (!course) {
    const error = AppError.create(
      "Course not found",
      404,
      httpStatusText.ERROR
    );

    return next(error);
  }

  const isOwner =
    course.instructor.toString() === req.currentUser.id;

  const isAdmin =
    req.currentUser.role === userRole.ADMIN;

  if (isAdmin || isOwner) {
    return next();
  }

  const enrollment = await Enrollment.findOne({
    student,
    course: courseId,
  });

  if (enrollment) {
    return next();
  }

  const error = AppError.create(
    "You must enroll in this course to access its content",
    403,
    httpStatusText.ERROR
  );

  return next(error);
};

export {
  isEnroll,
};