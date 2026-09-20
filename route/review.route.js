import express from "express";
import { createReviewValidator, getCourseReviewsValidator, updateReviewValidator, deleteReviewValidator } from "../validators/review.validator.js";
import { validatormiddleware } from "../middleware/validatorMiddleware.js";
import verifyToken from "../middleware/verifyToken.js";
import { createReview, getCourseReviews,  updateReview, deleteReview } from "../controller/review.controller.js";

const reviewRouter = express.Router();

reviewRouter.route("/create")
    .post(verifyToken, createReviewValidator, validatormiddleware, createReview);
reviewRouter.route("/course/:courseId")
    .get(getCourseReviewsValidator, validatormiddleware, getCourseReviews);
reviewRouter.route("/:reviewId")
    .put(verifyToken, updateReviewValidator, validatormiddleware, updateReview)
    .delete(verifyToken, deleteReviewValidator, validatormiddleware, deleteReview);

export default reviewRouter;