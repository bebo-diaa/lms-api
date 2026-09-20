import express from "express";
import { getInstructorDashboard } from "../controller/instructor.controller.js";
import verifyToken from "../middleware/verifyToken.js";
import {allowedTo} from "../middleware/allowedTo.js";
import { userRole } from "../utils/userRole.js";

const instructorRouter = express.Router();

instructorRouter.get(
  "/dashboard",
  verifyToken,
  allowedTo(userRole.INSTRUCTOR),
  getInstructorDashboard
);

export default instructorRouter;