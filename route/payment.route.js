import express from "express";

import verifyToken from "../middleware/verifyToken.js";

import {
  createCheckoutSession,
  handleWebhook,
} from "../controller/payment.controller.js";

const paymentRouter = express.Router();

paymentRouter
  .route("/:courseId/checkout")
  .post(verifyToken, createCheckoutSession);

paymentRouter.post("/webhook", handleWebhook);
export default paymentRouter;