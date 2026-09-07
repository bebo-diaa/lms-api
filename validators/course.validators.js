import { body } from 'express-validator';


const createCourseValidation = [


    body('title')
        .notEmpty()
        .withMessage("title must be filled"),
    body('description')
        .notEmpty()
        .withMessage("description must be filled"),
    body('price')
        .notEmpty()
        .isFloat()
        .withMessage('price must be exist and numeric')

];

const updateCourseValidation = [


    body('title')
        .optional()
        .notEmpty()
        .withMessage("title must be filled"),

    body('description')
        .optional()
        .notEmpty()
        .withMessage("description must be filled"),
    body('price')
        .optional()
        .notEmpty()
        .isFloat()
        .withMessage('price must be exist and numeric'),

    body('published')
        .optional()
        .isBoolean()


]

export {
    createCourseValidation,
    updateCourseValidation
}