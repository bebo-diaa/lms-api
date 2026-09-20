import AppError from "../utils/appError.js";
import { httpStatusText } from "../utils/httpStatusText.js";

const allowedTo = (...roles) => {
  return (req, res, next) => {
    if (!req.currentUser) {
      const error = AppError.create(
        "Authentication required",
        401,
        httpStatusText.FAIL
      );

      return next(error);
    }

    if (!roles.includes(req.currentUser.role)) {
      const error = AppError.create(
        "You are not allowed to perform this action",
        403,
        httpStatusText.FAIL
      );

      return next(error);
    }

    next();
  };
};

export {
  allowedTo,
};