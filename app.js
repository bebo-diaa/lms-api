
import express from "express";

import mongoose from "mongoose";

import dotenv from "dotenv";

import userRouter from "./route/user.route.js";

import { httpStatusText } from "./utils/httpStatusText.js";

import AppError from "./utils/appError.js";

import courseRouter from "./route/course.route.js";

import fs from "node:fs";

import reviewRouter from "./route/review.route.js";

import favoriteRouter from "./route/favorite.route.js";

import instructorRouter from "./route/instructor.route.js";

import helmet from "helmet";

import cors from "cors";

import { apiLimiter } from "./middleware/rateLimit.js";

import paymentRouter from "./route/payment.route.js";

import swaggerUi from "swagger-ui-express";

import YAML from "yaml";

dotenv.config();

const swaggerDocument = YAML.parse(
  fs.readFileSync(new URL("./docs/openapi.yaml", import.meta.url), "utf8")
);

const url = process.env.MONGOOSE_URL;

const main = async () => {
  await mongoose.connect(url).then(() => {
    console.log("Database connected successfuly");
  });
};

main();

const app = express();

app.use(helmet());

app.use(cors());

app.use(
  "/api/payment/webhook",
  express.raw({ type: "application/json" })
);

app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(apiLimiter);

app.use("/api/users", userRouter);

app.use("/api/courses", courseRouter);

app.use("/api/reviews", reviewRouter);

app.use("/api/favorites", favoriteRouter);

app.use("/api/instructor", instructorRouter);

app.use("/api/payment", paymentRouter);

app.use((req, res, next) => {
  const error = AppError.create(
    "Route not found",
    404,
    httpStatusText.ERROR
  );

  next(error);
});

app.use((error, req, res, next) => {
  if (error.name === "CastError") {
    error.statusCode = 400;
    error.message = "Invalid ID";
    error.statusText = httpStatusText.FAIL;
  }

  if (error.code === 11000) {
    error.statusCode = 409;
    error.message = "Duplicate value";
    error.statusText = httpStatusText.FAIL;
  }

  const logMessage = `${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${error.statusCode || 500} - ${error.message}\n`;

  fs.appendFileSync("error.log", logMessage);

  res
    .status(error.statusCode || 500)
    .json({
      status: error.statusText || httpStatusText.ERROR,
      message: error.message,
    });
});

export default app;
