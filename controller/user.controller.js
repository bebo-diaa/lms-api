import User from "../model/user.model.js";
import { httpStatusText } from "../utils/httpStatusText.js";
import AppError from "../utils/appError.js";
import bcrypt from "bcrypt";
import asyncWrapper from "../middleware/asyncWrapper.js";
import { generateToken } from "../utils/generateToken.js";
import {getPaginationParams} from "../utils/pagination.js";

const getAllUser = asyncWrapper(async (req, res, next) => {
    
const { page, limit, skip } = getPaginationParams(req.query);
  

    const [users, totalUsers] = await Promise.all(
        [
            User.find().skip(skip).limit(limit),
            User.countDocuments()
        ]
    )
    const totalPages = Math.ceil(totalUsers / limit);
  res.json({ status: httpStatusText.SUCCESS, data: { users,
                    pagination: { page, limit, totalPages, totalUsers } }
    
} );

});

const register = asyncWrapper(async (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;

  const oldUser = await User.findOne({ email: email });

  if (oldUser) {
    const error = AppError.create(
      "this user already exists",
      409,
      httpStatusText.ERROR,
    );
    return next(error);
  }

  const hashedPassword = await bcrypt.hash(password, 8);

  const newUser = new User({
    firstName,
    lastName,
    email,
    password: hashedPassword,
  });

  await newUser.save();

  return res
    .status(201)
    .json({
      status: httpStatusText.SUCCESS,
      data: {
        firstName,
        lastName,
        email,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
        role: newUser.role,
      },
    });
});

const login = asyncWrapper(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email }).select("+password");

  if (!user) {
    const error = AppError.create(
      "invalid email or password",
      401,
      httpStatusText.ERROR,
    );
    return next(error);
  }

  const matchedPassword = await bcrypt.compare(password, user.password);

  if (matchedPassword) {
    const token = generateToken({
      email: user.email,
      id: user.id,
      role: user.role,
    });

    res.json({ status: httpStatusText.SUCCESS, data: { token } });
  } else {
    const error = AppError.create(
      "invalid email or password",
      401,
      httpStatusText.ERROR,
    );
    return next(error);
  }
});

const getUserById = asyncWrapper(async (req, res, next) => {
  const userId = req.params.userId;

  const user = await User.findById(userId);

  if (!user) {
    const error = AppError.create("User not exists", 404, httpStatusText.ERROR);
    return next(error);
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      userId: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
  });
});

const getMe = asyncWrapper(async (req, res, next) => {
  const id = req.currentUser.id;

  const user = await User.findById(id);

  if (!user) {
    const error = AppError.create("User not exists", 404, httpStatusText.ERROR);
    return next(error);
  }

  res.json({
    status: httpStatusText.SUCCESS,
    data: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
  });
});

export { getAllUser, register, login, getUserById, getMe };
