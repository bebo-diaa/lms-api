import { body, param } from "express-validator";

const createLessonValidation = [
  body("title")
    .notEmpty()
    .withMessage("Title must be filled"),
    
];

const lessonIdValidation = [
  param("lessonId")
    .isMongoId()
    .withMessage("Invalid lesson ID"),
];

export {
  createLessonValidation,
  lessonIdValidation,
};