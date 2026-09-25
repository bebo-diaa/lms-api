import mongoose from "mongoose";

import asyncWrapper from "../middleware/asyncWrapper.js";

import Course from "../model/course.model.js";
import Enrollment from "../model/enrollment.model.js";
import Payment from "../model/payment.model.js";

import AppError from "../utils/appError.js";
import { httpStatusText } from "../utils/httpStatusText.js";
import { enrollmentStatus } from "../utils/enrollmentStatus.js";
import { paymentStatus } from "../utils/paymentStatus.js";
import stripe from "../utils/stripe.js";

const createCheckoutSession = asyncWrapper(async (req, res, next) => {
  const { courseId } = req.params;
  const studentId = req.currentUser.id;

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    const error = AppError.create(
      "Invalid course ID",
      400,
      httpStatusText.ERROR,
    );
    return next(error);
  }

  const course = await Course.findById(courseId);

  if (!course || !course.published) {
    const error = AppError.create(
      "Course not found",
      404,
      httpStatusText.ERROR,
    );
    return next(error);
  }

  const existingEnrollment = await Enrollment.findOne({
    student: studentId,
    course: courseId,
  });

  if (existingEnrollment?.status === enrollmentStatus.SUCCESS) {
    const error = AppError.create(
      "Already enrolled in this course",
      409,
      httpStatusText.ERROR,
    );
    return next(error);
  }

  if (existingEnrollment?.status === enrollmentStatus.PENDING) {
    const existingPayment = await Payment.findOne({
      enrollment: existingEnrollment._id,
      status: paymentStatus.PENDING,
    });

    if (existingPayment) {
      const error = AppError.create(
        "There is already a pending payment for this course",
        409,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    existingEnrollment.status = enrollmentStatus.FAILED;
    await existingEnrollment.save();
  }

  const enrollment = await Enrollment.create({
    student: studentId,
    course: courseId,
    status: enrollmentStatus.PENDING,
  });

  let checkoutSession;

  try {
    checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: course.title,
            },
            unit_amount: Math.round(course.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: process.env.STRIPE_SUCCESS_URL,
      cancel_url: process.env.STRIPE_CANCEL_URL,
      metadata: {
        enrollmentId: enrollment._id.toString(),
      },
    });
  } catch (error) {
    enrollment.status = enrollmentStatus.FAILED;
    await enrollment.save();
    throw error;
  }

  try {
    await Payment.create({
      student: studentId,
      course: courseId,
      enrollment: enrollment._id,
      stripeSessionId: checkoutSession.id,
      amount: course.price,
      currency: "usd",
      status: paymentStatus.PENDING,
    });
  } catch (error) {
    enrollment.status = enrollmentStatus.FAILED;
    await enrollment.save();
    throw error;
  }

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: {
      checkoutUrl: checkoutSession.url,
    },
  });
});

const handleWebhook = async (req, res) => {
  const signature = req.headers["stripe-signature"];

  if (!signature) {
    return res.status(400).json({
      status: httpStatusText.ERROR,
      message: "Missing Stripe signature",
    });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
    console.log("EVENT VERIFIED:", event.type);
  } catch (error) {
    console.log("Webhook signature error:", error.message);
    return res.status(400).json({
      status: httpStatusText.ERROR,
      message: "Invalid Stripe webhook signature",
    });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      console.log("WEBHOOK RECEIVED");
      console.log("Session metadata:", session.metadata);

      if (session.payment_status !== "paid") {
        return res.status(200).json({ received: true });
      }

      const enrollmentId = session.metadata?.enrollmentId;

      if (!enrollmentId) {
        return res.status(400).json({
          status: httpStatusText.ERROR,
          message: "Missing enrollment ID",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
        return res.status(400).json({
          status: httpStatusText.ERROR,
          message: "Invalid enrollment ID",
        });
      }

      const payment = await Payment.findOne({
        stripeSessionId: session.id,
      });

      if (!payment) {
        return res.status(404).json({
          status: httpStatusText.ERROR,
          message: "Payment not found",
        });
      }


      if (payment.status === paymentStatus.SUCCESS) {
        return res.status(200).json({ received: true });
      }

      if (payment.enrollment.toString() !== enrollmentId) {
        return res.status(400).json({
          status: httpStatusText.ERROR,
          message: "Enrollment does not match payment",
        });
      }

      const enrollment = await Enrollment.findById(enrollmentId);

      if (!enrollment) {
        return res.status(404).json({
          status: httpStatusText.ERROR,
          message: "Enrollment not found",
        });
      }

      if (enrollment.status !== enrollmentStatus.PENDING) {
        return res.status(200).json({ received: true });
      }

      enrollment.status = enrollmentStatus.SUCCESS;
      payment.status = paymentStatus.SUCCESS;
      payment.stripeEventId = event.id;

      await enrollment.save();
      await payment.save();
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object;

      const payment = await Payment.findOne({
        stripeSessionId: session.id,
      });

      if (payment && payment.status === paymentStatus.PENDING) {
        payment.status = paymentStatus.CANCELED;
        payment.stripeEventId = event.id;
        await payment.save();

        const enrollment = await Enrollment.findById(payment.enrollment);

        if (enrollment && enrollment.status === enrollmentStatus.PENDING) {
          enrollment.status = enrollmentStatus.FAILED;
          await enrollment.save();
        }
      }
    }

    console.log(`Stripe event: ${event.type}`);

    return res.status(200).json({ received: true });
  } catch (error) {
    console.log("Webhook processing error:", error.message);
    return res.status(500).json({
      status: httpStatusText.ERROR,
      message: "Webhook processing failed",
    });
  }
};

export { createCheckoutSession, handleWebhook };