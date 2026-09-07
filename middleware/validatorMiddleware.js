import { validationResult } from "express-validator";
import AppError from "../utils/AppError.js";
import { httpStatusText } from "../utils/httpStatusText.js";

const validatorMiddleware = (req, res, next) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg).join(', ');
        const error = AppError.create(errorMessages, 400, httpStatusText.ERROR);
        return next(error)
    }

    next();



}


export{
    validatorMiddleware
}