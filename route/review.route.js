import express from "express";
import { createReviewValidator, getCourseReviewsValidator, updateReviewValidator, deleteReviewValidator } from "../validators/review.validator.js";
import { validatorMiddleware } from "../middleware/validatorMiddleware.js";
import verifyToken from "../middleware/verifyToken.js";
import { createReview, getCourseReviews,  updateReview, deleteReview } from "../controller/review.controller.js";

const reviewRouter = express.Router();

reviewRouter.route("/create")
    .post(verifyToken, createReviewValidator, validatorMiddleware, createReview);
reviewRouter.route("/course/:courseId")
    .get(getCourseReviewsValidator, validatorMiddleware, getCourseReviews);
reviewRouter.route("/:reviewId")
    .put(verifyToken, updateReviewValidator, validatorMiddleware, updateReview)
    .delete(verifyToken, deleteReviewValidator, validatorMiddleware, deleteReview);

export default reviewRouter;