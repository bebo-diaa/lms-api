import { body, param } from "express-validator";

import { courseCategory } from "../utils/category.js";

const validCategories = Object.values(courseCategory);

const courseIdValidation = [
  param("courseId")
    .isMongoId()
    .withMessage("Invalid course ID"),
];

const createCourseValidation = [
  body("title")
    .notEmpty()
    .withMessage("title must be filled"),

  body("description")
    .notEmpty()
    .withMessage("description must be filled"),

  body("price")
    .notEmpty()
    .isFloat()
    .withMessage("price must be exist and numeric"),

  body("category")
    .notEmpty()
    .isIn(validCategories)
    .withMessage(
      `category must be one of the following: ${validCategories.join(", ")}`
    ),
];

const updateCourseValidation = [
  body("title")
    .optional()
    .notEmpty()
    .withMessage("title must be filled"),

  body("description")
    .optional()
    .notEmpty()
    .withMessage("description must be filled"),

  body("price")
    .optional()
    .notEmpty()
    .isFloat()
    .withMessage("price must be exist and numeric"),

  body("published")
    .optional()
    .isBoolean(),

  body("category")
    .optional()
    .isIn(validCategories)
    .withMessage(
      `category must be one of the following: ${validCategories.join(", ")}`
    ),
];

export {
  courseIdValidation,
  createCourseValidation,
  updateCourseValidation,
};