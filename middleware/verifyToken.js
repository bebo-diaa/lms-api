import jwt from "jsonwebtoken";
import AppError from "../utils/appError.js";
import { httpStatusText } from "../utils/httpStatusText.js";

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    const error = AppError.create(
      "Token is required",
      401,
      httpStatusText.FAIL
    );

    return next(error);
  }

  const [scheme, token] = authHeader.trim().split(/\s+/);

  if (scheme !== "Bearer" || !token) {
    const error = AppError.create(
      "Invalid authorization format",
      401,
      httpStatusText.FAIL
    );

    return next(error);
  }

  try {
    const currentUser = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY
    );

    req.currentUser = currentUser;

    next();
  } catch (err) {
    const error = AppError.create(
      "Invalid token",
      401,
      httpStatusText.FAIL
    );

    return next(error);
  }
};

export default verifyToken;