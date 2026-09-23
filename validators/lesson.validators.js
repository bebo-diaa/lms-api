import { body, param } from "express-validator";

const createLessonValidation = [
  body("title")
    .notEmpty()
    .withMessage("Title must be filled"),
      body("videoUrl")
    .optional()
    .isURL()
    .withMessage("Video URL must be a valid URL"),
    
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