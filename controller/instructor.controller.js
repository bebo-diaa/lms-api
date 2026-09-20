import asyncWrapper from "../middleware/asyncWrapper.js";
import AppError from "../utils/appError.js";
import { httpStatusText } from "../utils/httpStatusText.js";
import Course from "../model/course.model.js";
import Enrollment from "../model/enrollment.model.js";
import Review from "../model/review.model.js";

const getInstructorDashboard = asyncWrapper(async (req, res, next) => {
  const instructorId = req.currentUser.id;

  const instructorCourses = await Course.find({
    instructor: instructorId,
  });

  const totalCourses = instructorCourses.length;

  const publishedCourses = await Course.find({
    instructor: instructorId,
    published: true,
  });

  const totalCoursesPublished = publishedCourses.length;

  const unpublishedCourses = await Course.find({
    instructor: instructorId,
    published: false,
  });

  const totalCoursesUnPublished = unpublishedCourses.length;

  const coursesIds = instructorCourses.map((course) => course._id);

  const enrollments = await Enrollment.find({
    course: { $in: coursesIds },
  });

  const studentIds = new Set(
    enrollments.map((enrollment) => enrollment.student.toString()),
  );

  const totalStudents = studentIds.size;

  const reviews = await Review.find({
    course: { $in: coursesIds },
  });

  const totalReviews = reviews.length;

  const totalRating = reviews.reduce(
    (sum, review) => sum + review.rating,
    0,
  );

  const averageRating =
    totalReviews > 0
      ? Number((totalRating / totalReviews).toFixed(1))
      : 0;

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      totalCourses,
      totalCoursesPublished,
      totalCoursesUnPublished,
      totalStudents,
      totalReviews,
      averageRating,
    },
  });
});

export { getInstructorDashboard };