import { jest } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const TEST_PASSWORD = "Test123!";

/* =========================
   Mock Stripe
========================= */

jest.unstable_mockModule("../utils/stripe.js", () => ({
  default: {
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },

    webhooks: {
      constructEvent: jest.fn(),
    },
  },
}));

/* =========================
   Dynamic imports
========================= */

const { default: app } = await import("../app.js");

const { default: User } =
  await import("../model/user.model.js");

const { default: Course } =
  await import("../model/course.model.js");

const { default: Enrollment } =
  await import("../model/enrollment.model.js");

const { default: Payment } =
  await import("../model/payment.model.js");

const { default: stripe } =
  await import("../utils/stripe.js");

const { enrollmentStatus } =
  await import("../utils/enrollmentStatus.js");

const { paymentStatus } =
  await import("../utils/paymentStatus.js");

/* =========================
   Helpers
========================= */

const createTestUser = async ({
  firstName,
  lastName,
  email,
  role = "student",
}) => {
  const hashedPassword = await bcrypt.hash(
    TEST_PASSWORD,
    8,
  );

  return User.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    role,
  });
};

const loginTestUser = async (email) => {
  const response = await request(app)
    .post("/api/users/login")
    .send({
      email,
      password: TEST_PASSWORD,
    });

  expect(response.statusCode).toBe(200);
  expect(response.body.data.token).toBeDefined();

  return response.body.data.token;
};

/* =========================================================
   LMS API - Payment Checkout
========================================================= */

describe("LMS API - Payment Checkout", () => {
  let student;
  let instructor;

  let studentToken;
  let instructorToken;

  let publishedCourse;
  let unpublishedCourse;

  beforeAll(async () => {
    /* =========================
       Create student
    ========================= */

    student = await createTestUser({
      firstName: "Payment",
      lastName: "Student",
      email: `payment.student.${Date.now()}@test.com`,
      role: "student",
    });

    studentToken = await loginTestUser(student.email);

    /* =========================
       Create instructor
    ========================= */

    instructor = await createTestUser({
      firstName: "Payment",
      lastName: "Instructor",
      email: `payment.instructor.${Date.now()}@test.com`,
      role: "instructor",
    });

    instructorToken = await loginTestUser(
      instructor.email,
    );

    /* =========================
       Create published course
    ========================= */

    const publishedCourseResponse = await request(app)
      .post("/api/courses/create")
      .set(
        "Authorization",
        `Bearer ${instructorToken}`,
      )
      .send({
        title: "Payment Test Course",
        description: "Course for payment tests",
        price: 200,
        category: "programming",
      });

    expect(
      publishedCourseResponse.statusCode,
    ).toBe(200);

    publishedCourse =
      publishedCourseResponse.body.data;

    /* =========================
       Publish course
    ========================= */

    const publishResponse = await request(app)
      .patch(
        `/api/courses/${publishedCourse._id}`,
      )
      .set(
        "Authorization",
        `Bearer ${instructorToken}`,
      )
      .send({
        published: true,
      });

    expect(publishResponse.statusCode).toBe(200);

    /* =========================
       Create unpublished course
    ========================= */

    const unpublishedCourseResponse =
      await request(app)
        .post("/api/courses/create")
        .set(
          "Authorization",
          `Bearer ${instructorToken}`,
        )
        .send({
          title: "Unpublished Payment Course",
          description:
            "Unpublished course for payment tests",
          price: 150,
          category: "programming",
        });

    expect(
      unpublishedCourseResponse.statusCode,
    ).toBe(200);

    unpublishedCourse =
      unpublishedCourseResponse.body.data;
  }, 30000);

  afterEach(async () => {
    await Payment.deleteMany({
      student: student._id,
    });

    await Enrollment.deleteMany({
      student: student._id,
    });

    jest.clearAllMocks();
  });

  /* =========================
     1. No authentication
  ========================= */

  test(
    "should reject checkout without authentication",
    async () => {
      const response = await request(app).post(
        `/api/payment/${publishedCourse._id}/checkout`,
      );

      expect(response.statusCode).toBe(401);
    },
    20000,
  );

  /* =========================
     2. Invalid course ID
  ========================= */

  test(
    "should reject checkout with invalid course id",
    async () => {
      const response = await request(app)
        .post(
          "/api/payment/invalid-course-id/checkout",
        )
        .set(
          "Authorization",
          `Bearer ${studentToken}`,
        );

      expect(response.statusCode).toBe(400);
    },
    20000,
  );

  /* =========================
     3. Unpublished course
  ========================= */

  test(
    "should reject checkout for unpublished course",
    async () => {
      const response = await request(app)
        .post(
          `/api/payment/${unpublishedCourse._id}/checkout`,
        )
        .set(
          "Authorization",
          `Bearer ${studentToken}`,
        );

      expect(response.statusCode).toBe(404);
    },
    20000,
  );

  /* =========================
     4. Successful checkout
  ========================= */

  test(
    "should create checkout session successfully",
    async () => {
      stripe.checkout.sessions.create.mockResolvedValueOnce(
        {
          id: "cs_test_123",
          url: "https://checkout.stripe.com/test",
        },
      );

      const response = await request(app)
        .post(
          `/api/payment/${publishedCourse._id}/checkout`,
        )
        .set(
          "Authorization",
          `Bearer ${studentToken}`,
        );

      expect(response.statusCode).toBe(201);

      expect(
        response.body.data.checkoutUrl,
      ).toBe(
        "https://checkout.stripe.com/test",
      );

      /* =========================
         Check enrollment
      ========================= */

      const enrollment =
        await Enrollment.findOne({
          student: student._id,
          course: publishedCourse._id,
        });

      expect(enrollment).toBeDefined();

      expect(enrollment.status).toBe(
        enrollmentStatus.PENDING,
      );

      /* =========================
         Check payment
      ========================= */

      const payment = await Payment.findOne({
        student: student._id,
        course: publishedCourse._id,
      });

      expect(payment).toBeDefined();

      expect(payment.stripeSessionId).toBe(
        "cs_test_123",
      );

      expect(payment.amount).toBe(200);

      expect(payment.currency).toBe("usd");

      expect(payment.status).toBe(
        paymentStatus.PENDING,
      );

      /* =========================
         Check Stripe call
      ========================= */

      expect(
        stripe.checkout.sessions.create,
      ).toHaveBeenCalledTimes(1);
    },
    20000,
  );

  /* =========================
     5. Existing pending payment
  ========================= */

  test(
    "should reject checkout when there is already a pending payment",
    async () => {
      stripe.checkout.sessions.create.mockResolvedValueOnce(
        {
          id: "cs_pending_test",
          url: "https://checkout.stripe.com/pending",
        },
      );

      const firstResponse = await request(app)
        .post(
          `/api/payment/${publishedCourse._id}/checkout`,
        )
        .set(
          "Authorization",
          `Bearer ${studentToken}`,
        );

      expect(firstResponse.statusCode).toBe(201);

      const secondResponse = await request(app)
        .post(
          `/api/payment/${publishedCourse._id}/checkout`,
        )
        .set(
          "Authorization",
          `Bearer ${studentToken}`,
        );

      expect(secondResponse.statusCode).toBe(409);

      expect(
        secondResponse.body.message,
      ).toBe(
        "There is already a pending payment for this course",
      );

      expect(
        stripe.checkout.sessions.create,
      ).toHaveBeenCalledTimes(1);
    },
    20000,
  );

  /* =========================
     6. Already enrolled
  ========================= */

  test(
    "should reject checkout when student is already enrolled successfully",
    async () => {
      await Enrollment.create({
        student: student._id,
        course: publishedCourse._id,
        status: enrollmentStatus.SUCCESS,
      });

      const response = await request(app)
        .post(
          `/api/payment/${publishedCourse._id}/checkout`,
        )
        .set(
          "Authorization",
          `Bearer ${studentToken}`,
        );

      expect(response.statusCode).toBe(409);

      expect(response.body.message).toBe(
        "Already enrolled in this course",
      );

      expect(
        stripe.checkout.sessions.create,
      ).not.toHaveBeenCalled();
    },
    20000,
  );

  /* =========================
     7. Stripe checkout failure
  ========================= */

  test(
    "should mark enrollment as failed when Stripe checkout creation fails",
    async () => {
      stripe.checkout.sessions.create.mockRejectedValueOnce(
        new Error("Stripe checkout failed"),
      );

      const response = await request(app)
        .post(
          `/api/payment/${publishedCourse._id}/checkout`,
        )
        .set(
          "Authorization",
          `Bearer ${studentToken}`,
        );

      expect(response.statusCode).toBe(500);

      /* =========================
         Enrollment should be failed
      ========================= */

      const enrollment =
        await Enrollment.findOne({
          student: student._id,
          course: publishedCourse._id,
        });

      expect(enrollment).toBeDefined();

      expect(enrollment.status).toBe(
        enrollmentStatus.FAILED,
      );

      /* =========================
         Payment should not exist
      ========================= */

      const payment = await Payment.findOne({
        student: student._id,
        course: publishedCourse._id,
      });

      expect(payment).toBeNull();
    },
    20000,
  );
});

/* =========================================================
   LMS API - Stripe Webhook
========================================================= */

describe("LMS API - Stripe Webhook", () => {
  let student;
  let instructor;
  let course;
  let enrollment;
  let payment;

  /*
    Important:
    stripeSessionId is unique in Payment model.
    Generate a new one for every test run.
  */

const webhookSessionId =
  `cs_webhook_test_${Date.now()}`;

const webhookSuccessEventId =
  `evt_test_success_${Date.now()}`;

const webhookExpiredEventId =
  `evt_test_expired_${Date.now()}`;

const webhookIdempotentEventId =
  `evt_test_idempotent_${Date.now()}`;
  beforeAll(async () => {
    /* =========================
       Create student
    ========================= */

    student = await createTestUser({
      firstName: "Webhook",
      lastName: "Student",
      email: `webhook.student.${Date.now()}@test.com`,
      role: "student",
    });

    /* =========================
       Create instructor
    ========================= */

    instructor = await createTestUser({
      firstName: "Webhook",
      lastName: "Instructor",
      email: `webhook.instructor.${Date.now()}@test.com`,
      role: "instructor",
    });

    /* =========================
       Create course
    ========================= */

    course = await Course.create({
      title: "Webhook Test Course",
      description: "Course for webhook tests",
      price: 200,
      category: "programming",
      published: true,
      instructor: instructor._id,
    });

    /* =========================
       Create enrollment
    ========================= */

    enrollment = await Enrollment.create({
      student: student._id,
      course: course._id,
      status: enrollmentStatus.PENDING,
    });

    /* =========================
       Create payment
    ========================= */

    payment = await Payment.create({
      student: student._id,
      course: course._id,
      enrollment: enrollment._id,
      stripeSessionId: webhookSessionId,
      amount: 200,
      currency: "usd",
      status: paymentStatus.PENDING,
    });
  }, 30000);

  /* =========================
     Reset webhook state
  ========================= */

beforeEach(async () => {
  const currentEnrollment =
    await Enrollment.findById(enrollment._id);

  currentEnrollment.status =
    enrollmentStatus.PENDING;

  await currentEnrollment.save();

  const currentPayment =
    await Payment.findById(payment._id);

  currentPayment.status =
    paymentStatus.PENDING;

  currentPayment.stripeEventId = undefined;

  await currentPayment.save();

  jest.clearAllMocks();
});
  /* =========================
     1. Missing signature
  ========================= */

  test(
    "should reject webhook without Stripe signature",
    async () => {
      const response = await request(app)
        .post("/api/payment/webhook")
        .send({
          type: "checkout.session.completed",
        });

      expect(response.statusCode).toBe(400);

      expect(response.body.message).toBe(
        "Missing Stripe signature",
      );
    },
    20000,
  );

  /* =========================
     2. Invalid signature
  ========================= */

  test(
    "should reject webhook with invalid Stripe signature",
    async () => {
      stripe.webhooks.constructEvent.mockImplementationOnce(
        () => {
          throw new Error("Invalid signature");
        },
      );

      const response = await request(app)
        .post("/api/payment/webhook")
        .set(
          "stripe-signature",
          "invalid-signature",
        )
        .send({
          type: "checkout.session.completed",
        });

      expect(response.statusCode).toBe(400);

      expect(response.body.message).toBe(
        "Invalid Stripe webhook signature",
      );
    },
    20000,
  );

  /* =========================
     3. Successful payment
  ========================= */

  test(
    "should process checkout.session.completed successfully",
    async () => {
      stripe.webhooks.constructEvent.mockReturnValueOnce(
        {
          id: "webhookSuccessEventId",
          type: "checkout.session.completed",
          data: {
            object: {
              id: webhookSessionId,
              payment_status: "paid",
              metadata: {
                enrollmentId:
                  enrollment._id.toString(),
              },
            },
          },
        },
      );

      const response = await request(app)
        .post("/api/payment/webhook")
        .set(
          "stripe-signature",
          "valid-signature",
        )
        .send({
          test: "webhook",
        });

      expect(response.statusCode).toBe(200);

      expect(response.body.received).toBe(true);

      /* =========================
         Check enrollment
      ========================= */

      const updatedEnrollment =
        await Enrollment.findById(
          enrollment._id,
        );

      expect(updatedEnrollment.status).toBe(
        enrollmentStatus.SUCCESS,
      );

      /* =========================
         Check payment
      ========================= */

      const updatedPayment =
        await Payment.findById(payment._id);

      expect(updatedPayment.status).toBe(
        paymentStatus.SUCCESS,
      );

      expect(
        updatedPayment.stripeEventId,
      ).toBe("webhookSuccessEventId");
    },
    20000,
  );

  /* =========================
     4. Payment not paid
  ========================= */

  test(
    "should not process checkout.session.completed when payment is not paid",
    async () => {
      stripe.webhooks.constructEvent.mockReturnValueOnce(
        {
          id: "evt_test_unpaid",
          type: "checkout.session.completed",
          data: {
            object: {
              id: webhookSessionId,
              payment_status: "unpaid",
              metadata: {
                enrollmentId:
                  enrollment._id.toString(),
              },
            },
          },
        },
      );

      const response = await request(app)
        .post("/api/payment/webhook")
        .set(
          "stripe-signature",
          "valid-signature",
        )
        .send({
          test: "webhook",
        });

      expect(response.statusCode).toBe(200);

      expect(response.body.received).toBe(true);

      /* =========================
         Enrollment stays pending
      ========================= */

      const currentEnrollment =
        await Enrollment.findById(
          enrollment._id,
        );

      expect(currentEnrollment.status).toBe(
        enrollmentStatus.PENDING,
      );

      /* =========================
         Payment stays pending
      ========================= */

      const currentPayment =
        await Payment.findById(payment._id);

      expect(currentPayment.status).toBe(
        paymentStatus.PENDING,
      );
    },
    20000,
  );

  /* =========================
     5. Expired checkout
  ========================= */

  test(
    "should handle checkout.session.expired",
    async () => {
      stripe.webhooks.constructEvent.mockReturnValueOnce(
        {
          id: "webhookExpiredEventId",
          type: "checkout.session.expired",
          data: {
            object: {
              id: webhookSessionId,
            },
          },
        },
      );

      const response = await request(app)
        .post("/api/payment/webhook")
        .set(
          "stripe-signature",
          "valid-signature",
        )
        .send({
          test: "webhook",
        });

      expect(response.statusCode).toBe(200);

      expect(response.body.received).toBe(true);

      /* =========================
         Payment canceled
      ========================= */

      const updatedPayment =
        await Payment.findById(payment._id);

      expect(updatedPayment.status).toBe(
        paymentStatus.CANCELED,
      );

      expect(
        updatedPayment.stripeEventId,
      ).toBe("webhookExpiredEventId");

      /* =========================
         Enrollment failed
      ========================= */

      const updatedEnrollment =
        await Enrollment.findById(
          enrollment._id,
        );

      expect(updatedEnrollment.status).toBe(
        enrollmentStatus.FAILED,
      );
    },
    20000,
  );

  /* =========================
     6. Idempotency
  ========================= */

  test(
    "should be idempotent when successful webhook is received twice",
    async () => {
      stripe.webhooks.constructEvent
        .mockReturnValueOnce({
          id: webhookIdempotentEventId,
          type: "checkout.session.completed",
          data: {
            object: {
              id: webhookSessionId,
              payment_status: "paid",
              metadata: {
                enrollmentId:
                  enrollment._id.toString(),
              },
            },
          },
        })
        .mockReturnValueOnce({
          id: webhookIdempotentEventId,
          type: "checkout.session.completed",
          data: {
            object: {
              id: webhookSessionId,
              payment_status: "paid",
              metadata: {
                enrollmentId:
                  enrollment._id.toString(),
              },
            },
          },
        });

      /* =========================
         First webhook
      ========================= */

      const firstResponse = await request(app)
        .post("/api/payment/webhook")
        .set(
          "stripe-signature",
          "valid-signature",
        )
        .send({
          test: "webhook",
        });

      expect(firstResponse.statusCode).toBe(200);

      /* =========================
         Second webhook
      ========================= */

      const secondResponse = await request(app)
        .post("/api/payment/webhook")
        .set(
          "stripe-signature",
          "valid-signature",
        )
        .send({
          test: "webhook",
        });

      expect(secondResponse.statusCode).toBe(200);

      expect(
        secondResponse.body.received,
      ).toBe(true);

      /* =========================
         Final enrollment state
      ========================= */

      const updatedEnrollment =
        await Enrollment.findById(
          enrollment._id,
        );

      expect(updatedEnrollment.status).toBe(
        enrollmentStatus.SUCCESS,
      );

      /* =========================
         Final payment state
      ========================= */

      const updatedPayment =
        await Payment.findById(payment._id);

      expect(updatedPayment.status).toBe(
        paymentStatus.SUCCESS,
      );

      expect(
        updatedPayment.stripeEventId,
      ).toBe(webhookIdempotentEventId);
    },
    20000,
  );
});

/* =========================================================
   Close MongoDB connection
========================================================= */

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});
