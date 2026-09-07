import { body } from 'express-validator';

const createLessonValidation = [
    body('title')
        .notEmpty()
        .withMessage("Title must be filled"),
    body('videoUrl')
        .notEmpty()
        .isURL()
        .withMessage("Video URL must be a valid URL")
];

export {
    createLessonValidation
}