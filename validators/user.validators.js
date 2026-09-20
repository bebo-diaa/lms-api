import { body, param } from "express-validator";

const registerValidation = [
  body("password")
    .isStrongPassword({
      minLength: 8,
      minLowercase: 0,
      minUppercase: 0,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage(
      "Password must be at least 8 characters and include a number and a special character"
    ),

  body("firstName")
    .notEmpty()
    .withMessage("must be filled"),

  body("lastName")
    .notEmpty()
    .withMessage("must be filled"),

  body("email")
    .isEmail()
    .withMessage("make sure from format of email"),
];

const loginValidation = [
  body("email")
    .notEmpty()
    .isEmail()
    .withMessage("make sure from format of email"),

  body("password")
    .notEmpty()
    .withMessage("password must be filled"),
];

const userIdValidation = [
  param("userId")
    .isMongoId()
    .withMessage("Invalid user ID"),
];

export {
  registerValidation,
  loginValidation,
  userIdValidation,
};