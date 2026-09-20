import Favorite from "../model/favorite.model.js";
import { httpStatusText } from "../utils/httpStatusText.js";
import AppError from "../utils/appError.js";
import asyncWrapper from "../middleware/asyncWrapper.js";
import Course from "../model/course.model.js";

const addFavorite = asyncWrapper(async (req, res, next) => {
    
  const userId = req.currentUser.id;
  const courseId = req.params.courseId;

  const course = await Course.findById(courseId);
  if (!course) {
    const error = AppError.create(
      "Course not found",
      404,
      httpStatusText.ERROR,
    );
    return next(error);
  }

  if (!course.published) {
    const error = AppError.create(
      "You cannot favorite an unpublished course",
      403,
      httpStatusText.ERROR,
    );
    return next(error);
  }

  const existingFavorite = await Favorite.findOne({
    user: userId,
    course: courseId,
  });

  if (existingFavorite) {
    const error = AppError.create(
      "Course is already in favorites",
      409,
      httpStatusText.ERROR,
    );
    return next(error);
  }

  const favorite = new Favorite({
    user: userId,
    course: courseId,
  });

  await favorite.save();

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: { favorite },
  });
});

const removeFavorite = asyncWrapper(async (req, res, next) => {
  const userId = req.currentUser.id;
  const courseId = req.params.courseId;

  const favorite = await Favorite.findOneAndDelete({
    user: userId,
    course: courseId,
  });

  if (!favorite) {
    const error = AppError.create(
      "Favorite not found",
      404,
      httpStatusText.ERROR,
    );
    return next(error);
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { favorite },
  });
});

const getMyFavorites = asyncWrapper(


    async(req,res,next) =>{

        const userId = req.currentUser.id;


        const myFavorites = await Favorite.find({ user: userId }).populate('course');

        res.status(200).json({
            status: httpStatusText.SUCCESS,
            data: {
                favorites: myFavorites
            }
        });



    }

);

export { addFavorite, removeFavorite , getMyFavorites};
