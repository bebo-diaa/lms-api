import express from "express";

import  verifyToken  from "../middleware/verifyToken.js";

import {
  getAllUser,
  register,
  login,
  getUserById,
  getMe,
} from "../controller/user.controller.js";

import { validatorMiddleware } from "../middleware/validatorMiddleware.js";

import {
  registerValidation,
  loginValidation,
  userIdValidation,
} from "../validators/user.validators.js";

import { allowedTo } from "../middleware/allowedTo.js";

import { userRole } from "../utils/userRole.js";

import {
  loginLimiter,
  registerLimiter,
} from "../middleware/rateLimit.js";

const userRouter = express.Router();

userRouter
  .route("/")
  .get(
    verifyToken,
    allowedTo(userRole.ADMIN),
    getAllUser
  );

userRouter
  .route("/register")
  .post(
    registerLimiter,
    registerValidation,
    validatorMiddleware,
    register
  );

userRouter
  .route("/login")
  .post(
    loginLimiter,
    loginValidation,
    validatorMiddleware,
    login
  );

userRouter
  .route("/me")
  .get(
    verifyToken,
    getMe
  );

userRouter
  .route("/:userId")
  .get(
    verifyToken,
    allowedTo(userRole.ADMIN),
    userIdValidation,
    validatorMiddleware,
    getUserById
  );

export default userRouter;