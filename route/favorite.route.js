import express from "express";
import { favoriteValidator } from "../validators/favorite.validators.js";
import { validatorMiddleware } from "../middleware/validatorMiddleware.js";
import  verifyToken  from "../middleware/verifyToken.js";
import {
  getMyFavorites,
  removeFavorite,
  addFavorite,
} from "../controller/favorite.controller.js";
import { allowedTo } from "../middleware/allowedTo.js";
import { userRole } from "../utils/userRole.js";

const favoriteRouter = express.Router();

favoriteRouter
  .route("/:courseId")
  .post(verifyToken,allowedTo(userRole.STUDENT) ,favoriteValidator, validatorMiddleware, addFavorite)
  .delete(verifyToken, allowedTo(userRole.STUDENT),favoriteValidator, validatorMiddleware, removeFavorite);



favoriteRouter.route("/").get(verifyToken,allowedTo(userRole.STUDENT) ,getMyFavorites);


export default favoriteRouter;
