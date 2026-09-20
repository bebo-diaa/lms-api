import { body, param } from "express-validator";

export const createReviewValidator = [
  body("courseId").isMongoId().withMessage("Invalid course ID"),
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be an integer between 1 and 5"),
  body("comment")
    .isString()
    .isLength({ min: 1, max: 200 })
    .withMessage("Comment must be between 1 and 200 characters"),
];

export const getCourseReviewsValidator = [
  param("courseId").isMongoId().withMessage("Invalid course ID"),
];

export const updateReviewValidator = [
  param("reviewId").isMongoId().withMessage("Invalid review ID"),

  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be an integer between 1 and 5"),
  body("comment")
    .isString()
    .isLength({ min: 1, max: 200 })
    .withMessage("Comment must be between 1 and 200 characters"),
];

export const deleteReviewValidator = [
  param("reviewId").isMongoId().withMessage("Invalid review ID"),
];
