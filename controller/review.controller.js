import AppError from "../utils/appError.js";
import asyncWrapper from "../middleware/asyncWrapper.js";
import { httpStatusText } from "../utils/httpStatusText.js";
import Course from "../model/course.model.js";
import Review from "../model/review.model.js";
import Enrollment from "../model/enrollment.model.js";

const createReview = asyncWrapper(async (req, res, next) => {
  const userId = req.currentUser.id;

  const { courseId, rating, comment } = req.body;

  const course = await Course.findById(courseId);

  if (!course) {
    const error = AppError.create(
      "Course not found",
      404,
      httpStatusText.ERROR,
    );
    return next(error);
  }

  if (!course.published) {
  const error = AppError.create(
    "You cannot review an unpublished course",
    403,
    httpStatusText.ERROR,
  );

  return next(error);
}
  const enrollment = await Enrollment.findOne({
    student: userId,
    course: courseId,
  });

  if (!enrollment) {
    const error = AppError.create(
      "You must be enrolled in this course to leave a review",
      403,
      httpStatusText.ERROR,
    );
    return next(error);
  }

  const existingReview = await Review.findOne({
    user: userId,
    course: courseId,
  });

  if (existingReview) {
    const error = AppError.create(
      "You have already reviewed this course",
      409,
      httpStatusText.ERROR,
    );
    return next(error);
  }

  const review = await Review.create({
    user: userId,
    course: courseId,
    rating,
    comment,
  });
  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: {
      review,
    },
  });
});

const getCourseReviews = asyncWrapper(

  async (req,res, next) =>{

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
    
      const reviews = await Review.find({ course: courseId }).populate('user', 'firstName lastName');

      res.json({
        status: httpStatusText.SUCCESS,
        data: {
          reviews,
        },
      });


  }


);

const updateReview = asyncWrapper(

  async (req,res,next) =>{

    const reviewId = req.params.reviewId;

    const review = await Review.findById(reviewId);

    if (!review) {
      const error = AppError.create(
        "Review not found",
        404,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    if (review.user.toString() !== req.currentUser.id){
      const error = AppError.create(
        "You are not the owner of this review",
        403,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    const { rating, comment } = req.body;

    const updatedReview = await Review.findByIdAndUpdate(

      reviewId,
      { rating, comment },
      { new: true, runValidators: true }

    );

    res.json({
      status: httpStatusText.SUCCESS,
      data: {
        review: updatedReview,
      },
    });




  }



);


const deleteReview = asyncWrapper(async (req, res, next) => {

    const reviewId = req.params.reviewId;

    const review = await Review.findById(reviewId);

    if (!review) {
      const error = AppError.create(
        "Review not found",
        404,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    if (review.user.toString() !== req.currentUser.id){
      const error = AppError.create(
        "You are not the owner of this review",
        403,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    const deletedReview = await Review.findByIdAndDelete(reviewId);

    res.json({
      status: httpStatusText.SUCCESS,
      data: {
        message: "Review deleted successfully",
        review: deletedReview,
      }})
    



})

export{
  createReview,
  getCourseReviews,
  updateReview, 
  deleteReview
}
