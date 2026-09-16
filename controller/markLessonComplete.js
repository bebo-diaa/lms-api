import Progress from "../model/progress.model.js";
import Lesson from "../model/lessons.model.js";
import AppError from "../utils/appError.js";
import { httpStatusText } from "../utils/httpStatusText.js";
import asyncWrapper from "../middleware/asyncWrapper.js";

const markLessonComplete = asyncWrapper(async (req, res, next) => {
  const studentId = req.currentUser.id;
  const lessonId = req.params.lessonId;
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    const error = AppError.create(
      "Lesson not found",
      404,
      httpStatusText.ERROR,
    );
    return next(error);
  }

  if (lesson.course.toString() !== req.params.courseId) {
    const error = AppError.create(
      "Lesson does not belong to the specified course",
      400,
      httpStatusText.ERROR,
    );
    return next(error);
  }

  try {
    const progress = new Progress({
      student: studentId,
      lesson: lessonId,
      completed: true,
    });

    await progress.save();
    res.json({ status: httpStatusText.SUCCESS, data: progress });
  } catch (err) {
    if (err.code == 11000) {
      const error = AppError.create(
        "This lesson is already marked as complete",
        409,
        httpStatusText.ERROR,
      );
      return next(error);
    } else {
      return next(err);
    }
  }
});

const getCourseProgress = asyncWrapper(async (req, res, next) => {
    
  const courseId = req.params.courseId;

  const lessons = await Lesson.find({ course: courseId });
  const numberOfLessons = lessons.length;
  const completedLessons = await Progress.find({
    student: req.currentUser.id,
    lesson: { $in: lessons.map((lesson) => lesson._id) },
    completed: true,
  }).countDocuments();

  if (numberOfLessons === 0) {
    const error = AppError.create(
      "No lessons found for this course",
      404,
      httpStatusText.ERROR,
    );
    return next(error);
  }

  const progressPercentage = (completedLessons / numberOfLessons) * 100;

  res.json({ status: httpStatusText.SUCCESS, data: { progressPercentage } });
});

export { markLessonComplete, getCourseProgress };
