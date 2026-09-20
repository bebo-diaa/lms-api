import asyncWrapper from "../middleware/asyncWrapper.js";
import Course from "../model/course.model.js";
import AppError from "../utils/appError.js";
import { httpStatusText } from "../utils/httpStatusText.js";
import { userRole } from "../utils/userRole.js";
import { getPaginationParams } from "../utils/pagination.js";
import { allowedSortFields, allowedSortOrders } from "../utils/sort.js";
import Lesson from "../model/lessons.model.js";
import { escapeRegex } from "../utils/escapeRegex.js";

const createCourse = asyncWrapper(async (req, res) => {
  const { title, description, price, category } = req.body;

  const instructor = req.currentUser.id;

  const newCourse = new Course({
    title,
    description,
    price,
    category,
    instructor,
  });

  await newCourse.save();

  res.json({ status: httpStatusText.SUCCESS, data: newCourse });
});

const getAllCourses = asyncWrapper(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);

  const filter = {
    published: true,
  };

  if (req.query.category) {
    filter.category = req.query.category;
  }

if (req.query.search) {
  filter.title = {
    $regex: escapeRegex(req.query.search),
    $options: "i",
  };
}
  const { sort: sortField, order } = req.query;

  let sort = {};

  if (sortField) {
    if (!allowedSortFields.includes(sortField)) {
      return res.status(400).json({
        status: httpStatusText.FAIL,
        message: `Invalid sort field. Allowed fields: ${allowedSortFields.join(", ")}`,
      });
    }

    if (!order || !allowedSortOrders.includes(order)) {
      return res.status(400).json({
        status: httpStatusText.FAIL,
        message: "Invalid sort order. Allowed orders: asc, desc",
      });
    }

    sort[sortField] = order === "asc" ? 1 : -1;
  }

  const [courses, totalCourses] = await Promise.all([
    Course.find(filter)
      .populate("instructor", "firstName lastName")
      .sort(sort)
      .skip(skip)
      .limit(limit),

    Course.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCourses / limit);

  res.json({
    status: httpStatusText.SUCCESS,
    data: {
      courses,
      pagination: {
        totalCourses,
        page,
        limit,
        totalPages,
      },
      filters: {
        category: req.query.category,
        search: req.query.search,
        sort: sortField,
        order,
      },
    },
  });
});

const updateCourse = asyncWrapper(async (req, res, next) => {
  const courseId = req.params.courseId;

  const course = await Course.findById(courseId);

  if (!course) {
    const error = AppError.create(
      "Course not found",
      404,
      httpStatusText.ERROR,
    );
    return next(error);
  }

  if (
    course.instructor.toString() !== req.currentUser.id &&
    req.currentUser.role !== userRole.ADMIN
  ) {
    const error = AppError.create(
      "this operation is forbidden ",
      403,
      httpStatusText.ERROR,
    );
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
        published,
      },
    },
    { new: true },
  );

  res.json({ status: httpStatusText.SUCCESS, data: updatedCourse });
});

const deleteCourse = asyncWrapper(async (req, res, next) => {
  const courseId = req.params.courseId;

  const course = await Course.findById(courseId);

  if (!course) {
    const error = AppError.create(
      "Course not found",
      404,
      httpStatusText.ERROR,
    );
    return next(error);
  }

  if (
    course.instructor.toString() !== req.currentUser.id &&
    req.currentUser.role !== userRole.ADMIN
  ) {
    const error = AppError.create(
      "this operation is forbidden ",
      403,
      httpStatusText.ERROR,
    );
    return next(error);
  }

  const deletedCourse = await Course.findByIdAndDelete(courseId);

  res.json({ status: httpStatusText.SUCCESS, data: { course: deletedCourse } });
});

const getMyCourses = asyncWrapper(async (req, res) => {
  const courses = await Course.find({
    instructor: req.currentUser.id,
  }).populate("instructor", "firstName lastName");

  res.json({ status: httpStatusText.SUCCESS, data: { courses } });
});

const getCourseById = asyncWrapper(async (req, res, next) => {
  const courseId = req.params.courseId;

  const course = await Course.findById(courseId).populate("instructor", "firstName lastName");

  if (!course) {
    const error = AppError.create(
      "Course not found",
      404,
      httpStatusText.ERROR,
    );
    return next(error);
  }

  if (course.published) {
    const lessons = await Lesson.find({ course: courseId }).select("title order").sort({ order: 1 });

    return res.json({
      status: httpStatusText.SUCCESS,
      data: {
        course,
        lessons,
        lessonsCount: lessons.length,
      },
    });
  }

  const isAdmin = req.currentUser && req.currentUser.role === userRole.ADMIN;
const isOwner =
  req.currentUser &&
  course.instructor._id.toString() === req.currentUser.id;

  if (isAdmin || isOwner) {
    return res.json({
      status: httpStatusText.SUCCESS,
      data: {
        course,
        lessons: [],
        lessonsCount: 0,
      },
    });
  }

  const error = AppError.create(
    "This course is not available",
    403,
    httpStatusText.ERROR,
  );
  return next(error);
});

export {
  createCourse,
  getAllCourses,
  updateCourse,
  deleteCourse,
  getMyCourses,
  getCourseById,
};
