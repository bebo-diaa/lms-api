import express from "express";
import { favoriteValidator } from "../validators/favorite.validators.js";
import { validatorMiddleware } from "../middleware/validatorMiddleware.js";
import  verifyToken  from "../middleware/verifyToken.js";
import {
  getMyFavorites,
  removeFavorite,
  addFavorite,
} from "../controller/favorite.controller.js";

const favoriteRouter = express.Router();

favoriteRouter
  .route("/:courseId")
  .post(verifyToken, favoriteValidator, validatorMiddleware, addFavorite)
  .delete(verifyToken, favoriteValidator, validatorMiddleware, removeFavorite);



favoriteRouter.route("/").get(verifyToken, getMyFavorites);


export default favoriteRouter;
