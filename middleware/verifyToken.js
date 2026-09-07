import jwt from 'jsonwebtoken'
import AppError from "../utils/AppError.js";
import  {httpStatusText} from '../utils/httpStatusText.js';

export const verifyToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader ) {
        const error = AppError.create("token is required ", 401, httpStatusText.FAIL)
        return next(error);
    }

    const token = authHeader.split(" ")[1];

    try {

        const currentUser = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.currentUser = currentUser;
        next();

    } catch (err) {
        const error = AppError.create("invalid token ", 401, httpStatusText.FAIL)
        return next(error);
    }

}  