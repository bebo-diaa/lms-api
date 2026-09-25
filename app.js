import express from "express";
import dotenv from "dotenv";
import fs from "node:fs";

import userRouter from "./route/user.route.js";
import courseRouter from "./route/course.route.js";
import reviewRouter from "./route/review.route.js";
import favoriteRouter from "./route/favorite.route.js";
import instructorRouter from "./route/instructor.route.js";
import paymentRouter from "./route/payment.route.js";

import { httpStatusText } from "./utils/httpStatusText.js";
import AppError from "./utils/appError.js";

import helmet from "helmet";
import cors from "cors";
import { apiLimiter } from "./middleware/rateLimit.js";

import swaggerUi from "swagger-ui-express";
import YAML from "yaml";

dotenv.config();

const swaggerDocument = YAML.parse(
fs.readFileSync(
new URL("./docs/openapi.yaml", import.meta.url),
"utf8",
),
);

const app = express();

app.use(helmet());
app.use(cors());

/**

* Stripe webhook must receive the raw request body
* for signature verification.
  */
  app.use(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  );

app.use(express.json());

app.use(
"/api-docs",
swaggerUi.serve,
swaggerUi.setup(swaggerDocument),
);

/**

* Apply the general API rate limiter to all API routes
* except the Stripe webhook.
  */
  app.use("/api", (req, res, next) => {
  if (req.path === "/payment/webhook") {
  return next();
  }

return apiLimiter(req, res, next);
});

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
httpStatusText.ERROR,
);

next(error);
});

app.use((error, req, res, next) => {
if (res.headersSent) {
return next(error);
}

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

const statusCode = error.statusCode || 500;
const statusText = error.statusText || httpStatusText.ERROR;
const message = error.message || "Internal server error";

const logMessage =
`${new Date().toISOString()} - ` +
`${req.method} ${req.originalUrl} - ` +
`${statusCode} - ${message}\n`;

fs.appendFileSync("error.log", logMessage);

return res.status(statusCode).json({
status: statusText,
message,
});
});

export default app;
