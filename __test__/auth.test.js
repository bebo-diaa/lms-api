import request from "supertest";
import app from "../app.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../model/user.model.js";

const TEST_PASSWORD = "Test123!";

const createTestUser = async ({
  firstName,
  lastName,
  email,
  role = "student",
}) => {
  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 8);

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
   AUTH API
========================================================= */

describe("Auth API", () => {
  test(
    "should register a new user successfully",
    async () => {
      const email = `test${Date.now()}@test.com`;

      const response = await request(app)
        .post("/api/users/register")
        .send({
          firstName: "Test",
          lastName: "User",
          email,
          password: TEST_PASSWORD,
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.status).toBe("success");
    },
    20000
  );

  test(
    "should reject duplicate email registration",
    async () => {
      const duplicateEmail = `duplicate${Date.now()}@test.com`;

      await request(app)
        .post("/api/users/register")
        .send({
          firstName: "Test",
          lastName: "User",
          email: duplicateEmail,
          password: TEST_PASSWORD,
        });

      const response = await request(app)
        .post("/api/users/register")
        .send({
          firstName: "Test",
          lastName: "User",
          email: duplicateEmail,
          password: TEST_PASSWORD,
        });

      expect(response.statusCode).toBe(409);
    },
    20000
  );

  test(
    "should reject invalid email during registration",
    async () => {
      const response = await request(app)
        .post("/api/users/register")
        .send({
          firstName: "Test",
          lastName: "User",
          email: "wrong-email",
          password: TEST_PASSWORD,
        });

      expect(response.statusCode).toBe(400);
    },
    20000
  );

  test(
    "should reject weak password during registration",
    async () => {
      const response = await request(app)
        .post("/api/users/register")
        .send({
          firstName: "Test",
          lastName: "User",
          email: `weak${Date.now()}@test.com`,
          password: "123",
        });

      expect(response.statusCode).toBe(400);
    },
    20000
  );

  test(
    "should login successfully with correct credentials",
    async () => {
      const email = `login${Date.now()}@test.com`;

      await request(app)
        .post("/api/users/register")
        .send({
          firstName: "Test",
          lastName: "User",
          email,
          password: TEST_PASSWORD,
        });

      const response = await request(app)
        .post("/api/users/login")
        .send({
          email,
          password: TEST_PASSWORD,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.token).toBeDefined();
    },
    20000
  );

  test(
    "should reject login with wrong password",
    async () => {
      const email = `wrongpass${Date.now()}@test.com`;

      await request(app)
        .post("/api/users/register")
        .send({
          firstName: "Test",
          lastName: "User",
          email,
          password: TEST_PASSWORD,
        });

      const response = await request(app)
        .post("/api/users/login")
        .send({
          email,
          password: "Wrong123!",
        });

      expect(response.statusCode).toBe(401);
    },
    20000
  );

  test(
    "should reject login with wrong email",
    async () => {
      const response = await request(app)
        .post("/api/users/login")
        .send({
          email: `notfound${Date.now()}@test.com`,
          password: TEST_PASSWORD,
        });

      expect(response.statusCode).toBe(401);
    },
    20000
  );

  test(
    "should reject access to users without token",
    async () => {
      const response = await request(app).get("/api/users/");

      expect(response.statusCode).toBe(401);
    },
    20000
  );

  test(
    "should reject invalid authorization format",
    async () => {
      const response = await request(app)
        .get("/api/users/")
        .set("Authorization", "Basic fake-token");

      expect(response.statusCode).toBe(401);
    },
    20000
  );

  test(
    "should reject malformed token",
    async () => {
      const response = await request(app)
        .get("/api/users/")
        .set("Authorization", "Bearer invalid-token");

      expect(response.statusCode).toBe(401);
    },
    20000
  );

  test(
    "should reject Bearer without token",
    async () => {
      const response = await request(app)
        .get("/api/users/")
        .set("Authorization", "Bearer");

      expect(response.statusCode).toBe(401);
    },
    20000
  );

  test(
    "should reject access to user by id without admin role",
    async () => {
      const email = `student${Date.now()}@test.com`;

      await createTestUser({
        firstName: "Test",
        lastName: "User",
        email,
      });

      const token = await loginTestUser(email);

      const response = await request(app)
        .get("/api/users/123")
        .set("Authorization", `Bearer ${token}`);

      expect(response.statusCode).toBe(403);
    },
    20000
  );

  test(
    "should get current user with valid token",
    async () => {
      const email = `me${Date.now()}@test.com`;

      await createTestUser({
        firstName: "Test",
        lastName: "User",
        email,
      });

      const token = await loginTestUser(email);

      const response = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.email).toBe(email);
    },
    20000
  );
});

/* =========================================================
   USER PAGINATION & AUTHORIZATION
========================================================= */

describe("User Pagination & Authorization", () => {
  let adminToken;

  beforeAll(async () => {
    const adminEmail = `admin${Date.now()}@test.com`;

    await createTestUser({
      firstName: "Admin",
      lastName: "Test",
      email: adminEmail,
      role: "admin",
    });

    adminToken = await loginTestUser(adminEmail);
  }, 20000);

  test(
    "should return paginated users with default page and limit",
    async () => {
      const response = await request(app)
        .get("/api/users/")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body.data.users)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    },
    20000
  );

  test(
    "should respect custom page and limit",
    async () => {
      const response = await request(app)
        .get("/api/users/?page=1&limit=2")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.users.length).toBeLessThanOrEqual(2);
      expect(response.body.data.pagination.limit).toBe(2);
    },
    20000
  );

  test(
    "should reject invalid page parameter",
    async () => {
      const response = await request(app)
        .get("/api/users/?page=abc")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(400);
    },
    20000
  );

  test(
    "should reject out-of-range limit parameter",
    async () => {
      const response = await request(app)
        .get("/api/users/?limit=999")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(400);
    },
    20000
  );

  test(
    "should reject invalid user id",
    async () => {
      const response = await request(app)
        .get("/api/users/not-valid-id")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(400);
    },
    20000
  );

  test(
    "should return 404 for non-existing user",
    async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/users/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(404);
    },
    20000
  );
});

/* =========================================================
   COURSE, LESSON & ENROLLMENT API
========================================================= */

describe("Course, Lesson & Enrollment API", () => {
  let instructorToken;
  let studentToken;
  let outsiderToken;
  let courseId;
  let unpublishedCourseId;
  let lessonId;

  beforeAll(async () => {
    const instructorEmail = `instructor${Date.now()}@test.com`;

    await createTestUser({
      firstName: "Instructor",
      lastName: "Test",
      email: instructorEmail,
      role: "instructor",
    });

    instructorToken = await loginTestUser(instructorEmail);

    const studentEmail = `student${Date.now()}@test.com`;

    await createTestUser({
      firstName: "Student",
      lastName: "Test",
      email: studentEmail,
      role: "student",
    });

    studentToken = await loginTestUser(studentEmail);

    const outsiderEmail = `outsider${Date.now()}@test.com`;

    await createTestUser({
      firstName: "Outsider",
      lastName: "Test",
      email: outsiderEmail,
      role: "student",
    });

    outsiderToken = await loginTestUser(outsiderEmail);
  }, 30000);

  test(
    "should reject course creation without instructor/admin role",
    async () => {
      const response = await request(app)
        .post("/api/courses/create")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          title: "Should Fail",
          description: "Student cannot create this",
          price: 100,
          category: "programming",
        });

      expect(response.statusCode).toBe(403);
    },
    20000
  );

  test(
    "should create a course successfully as instructor",
    async () => {
      const response = await request(app)
        .post("/api/courses/create")
        .set("Authorization", `Bearer ${instructorToken}`)
        .send({
          title: "Node.js Basics",
          description: "Learn Node.js from scratch",
          price: 199,
          category: "programming",
        });


      expect(response.statusCode).toBe(200);
      expect(response.body.data.published).toBe(false);

      courseId = response.body.data._id;
      unpublishedCourseId = response.body.data._id;
    },
    20000
  );

  test(
    "should reject course creation with missing title",
    async () => {
      const response = await request(app)
        .post("/api/courses/create")
        .set("Authorization", `Bearer ${instructorToken}`)
        .send({
          description: "Missing title here",
          price: 100,
          category: "programming",
        });

      expect(response.statusCode).toBe(400);
    },
    20000
  );

  test(
    "should reject invalid course category",
    async () => {
      const response = await request(app)
        .post("/api/courses/create")
        .set("Authorization", `Bearer ${instructorToken}`)
        .send({
          title: "Invalid Category",
          description: "Testing invalid category",
          price: 100,
          category: "not-real-category",
        });

      expect(response.statusCode).toBe(400);
    },
    20000
  );

  test(
    "should reject invalid course price",
    async () => {
      const response = await request(app)
        .post("/api/courses/create")
        .set("Authorization", `Bearer ${instructorToken}`)
        .send({
          title: "Invalid Price",
          description: "Testing invalid price",
          price: "abc",
          category: "programming",
        });

      expect(response.statusCode).toBe(400);
    },
    20000
  );

  test(
    "should not show unpublished course in getAllCourses",
    async () => {
      const response = await request(app).get("/api/courses/");

      expect(response.statusCode).toBe(201);

      const found = response.body.data.courses.find(
        (course) => course._id === unpublishedCourseId
      );

      expect(found).toBeUndefined();
    },
    20000
  );

  test(
    "should return pagination metadata in getAllCourses",
    async () => {
      const response = await request(app).get(
        "/api/courses/?page=1&limit=5"
      );

      expect(response.statusCode).toBe(201);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.limit).toBe(5);
      expect(response.body.data.pagination.totalPages).toBeDefined();
    },
    20000
  );

  test(
    "should filter courses by category",
    async () => {
      const response = await request(app).get(
        "/api/courses/?category=programming"
      );

      expect(response.statusCode).toBe(201);

      for (const course of response.body.data.courses) {
        expect(course.category).toBe("programming");
      }
    },
    20000
  );

  test(
    "should search courses by title",
    async () => {
      const response = await request(app).get(
        "/api/courses/?search=Node"
      );

      expect(response.statusCode).toBe(201);

      for (const course of response.body.data.courses) {
        expect(course.title.toLowerCase()).toContain("node");
      }
    },
    20000
  );

  test(
    "should reject invalid sort field",
    async () => {
      const response = await request(app).get(
        "/api/courses/?sort=password&order=asc"
      );

      expect(response.statusCode).toBe(400);
    },
    20000
  );

  test(
    "should reject invalid sort order",
    async () => {
      const response = await request(app).get(
        "/api/courses/?sort=price&order=random"
      );

      expect(response.statusCode).toBe(400);
    },
    20000
  );

  test(
    "should allow valid course sorting",
    async () => {
      const response = await request(app).get(
        "/api/courses/?sort=price&order=asc"
      );

      expect(response.statusCode).toBe(201);

      const courses = response.body.data.courses;

      for (let i = 1; i < courses.length; i++) {
        expect(courses[i].price).toBeGreaterThanOrEqual(
          courses[i - 1].price
        );
      }
    },
    20000
  );

  test(
    "should allow owner to update their own course",
    async () => {
      const response = await request(app)
        .patch(`/api/courses/${courseId}`)
        .set("Authorization", `Bearer ${instructorToken}`)
        .send({
          published: true,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.data.published).toBe(true);
    },
    20000
  );

  test(
    "should reject update from non-owner student",
    async () => {
      const response = await request(app)
        .patch(`/api/courses/${courseId}`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          title: "Hacked title",
        });

      expect(response.statusCode).toBe(403);
    },
    20000
  );

  test(
    "should reject lesson access before enrollment",
    async () => {
      const response = await request(app)
        .get(`/api/courses/${courseId}/lessons`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.statusCode).toBe(403);
    },
    20000
  );

  test(
    "should enroll student in a published course",
    async () => {
      const response = await request(app)
        .post(`/api/courses/${courseId}/enroll`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.statusCode).toBe(201);
      expect(response.body.data.course).toBe(courseId);
    },
    20000
  );

  test(
    "should reject duplicate enrollment",
    async () => {
      const response = await request(app)
        .post(`/api/courses/${courseId}/enroll`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.statusCode).toBe(409);
    },
    20000
  );

  test(
    "should allow lesson access after enrollment",
    async () => {
      const response = await request(app)
        .get(`/api/courses/${courseId}/lessons`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    },
    20000
  );

  test(
    "should allow instructor to create a lesson",
    async () => {
      const response = await request(app)
        .post(`/api/courses/${courseId}/lessons`)
        .set("Authorization", `Bearer ${instructorToken}`)
        .send({
          title: "Introduction",
          videoUrl: "https://example.com/video1.mp4",
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.data.order).toBe(1);

      lessonId = response.body.data._id;
    },
    20000
  );

  test(
    "should reject lesson creation with invalid videoUrl",
    async () => {
      const response = await request(app)
        .post(`/api/courses/${courseId}/lessons`)
        .set("Authorization", `Bearer ${instructorToken}`)
        .send({
          title: "Bad Lesson",
          videoUrl: "not-a-valid-url",
        });

      expect(response.statusCode).toBe(400);
    },
    20000
  );

  test(
    "should show enrolled course in getMyEnrollments",
    async () => {
      const response = await request(app)
        .get("/api/courses/my-enrollments")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.statusCode).toBe(200);
      expect(
        Array.isArray(response.body.data.enrollments)
      ).toBe(true);

      expect(response.body.data.pagination).toBeDefined();

      const found = response.body.data.enrollments.find(
        (enrollment) => enrollment.course._id === courseId
      );

      expect(found).toBeDefined();
    },
    20000
  );

  test(
    "should get course details",
    async () => {
      const response = await request(app)
        .get(`/api/courses/${courseId}`)
        .set("Authorization", `Bearer ${instructorToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.course._id).toBe(courseId);   


    },
    20000
  );

  test(
    "should reject invalid course id",
    async () => {
      const response = await request(app).get(
        "/api/courses/not-valid-id"
      );

      expect(response.statusCode).toBe(400);
    },
    20000
  );

  /* =========================================================
     PROGRESS TRACKING
  ========================================================= */

  describe("Progress Tracking", () => {
    test(
      "should allow instructor owner to mark lesson complete",
      async () => {
        const response = await request(app)
          .post(
            `/api/courses/${courseId}/lessons/${lessonId}/complete`
          )
          .set("Authorization", `Bearer ${instructorToken}`);

        expect(response.statusCode).toBe(200);
      },
      20000
    );

    test(
      "should allow enrolled student to mark lesson complete",
      async () => {
        const response = await request(app)
          .post(
            `/api/courses/${courseId}/lessons/${lessonId}/complete`
          )
          .set("Authorization", `Bearer ${studentToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.data.completed).toBe(true);
      },
      20000
    );

    test(
      "should reject marking same lesson complete twice",
      async () => {
        const response = await request(app)
          .post(
            `/api/courses/${courseId}/lessons/${lessonId}/complete`
          )
          .set("Authorization", `Bearer ${studentToken}`);

        expect(response.statusCode).toBe(409);
      },
      20000
    );

    test(
      "should reject completing lesson from another course",
      async () => {
        const secondCourse = await request(app)
          .post("/api/courses/create")
          .set("Authorization", `Bearer ${instructorToken}`)
          .send({
            title: "React Basics",
            description: "A second course",
            price: 99,
            category: "programming",
          });

        expect(secondCourse.statusCode).toBe(200);

        const secondCourseId = secondCourse.body.data._id;

        const secondLesson = await request(app)
          .post(`/api/courses/${secondCourseId}/lessons`)
          .set("Authorization", `Bearer ${instructorToken}`)
          .send({
            title: "React Intro",
            videoUrl: "https://example.com/video2.mp4",
          });

        expect(secondLesson.statusCode).toBe(201);

        const secondLessonId = secondLesson.body.data._id;

        const response = await request(app)
          .post(
            `/api/courses/${courseId}/lessons/${secondLessonId}/complete`
          )
          .set("Authorization", `Bearer ${instructorToken}`);

        expect(response.statusCode).toBe(400);
      },
      20000
    );

    test(
      "should return correct progress percentage",
      async () => {
        const response = await request(app)
          .get(`/api/courses/${courseId}/progress`)
          .set("Authorization", `Bearer ${studentToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.data.progressPercentage).toBe(100);
      },
      20000
    );

    test(
      "should reject progress access from non-enrolled user",
      async () => {
        const response = await request(app)
          .get(`/api/courses/${courseId}/progress`)
          .set("Authorization", `Bearer ${outsiderToken}`);

        expect(response.statusCode).toBe(403);
      },
      20000
    );
  });

  test(
    "should reject deleting a course by non-owner",
    async () => {
      const response = await request(app)
        .delete(`/api/courses/${courseId}`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.statusCode).toBe(403);
    },
    20000
  );

  test(
    "should allow owner to delete their own course",
    async () => {
      const response = await request(app)
        .delete(`/api/courses/${courseId}`)
        .set("Authorization", `Bearer ${instructorToken}`);

      expect(response.statusCode).toBe(200);
    },
    20000
  );
});

/* =========================================================
   REVIEWS API
========================================================= */

describe("Reviews API", () => {
  let instructorToken;
  let studentToken;
  let courseId;

  beforeAll(async () => {
    const instructorEmail = `reviewinstructor${Date.now()}@test.com`;

    await createTestUser({
      firstName: "Review",
      lastName: "Instructor",
      email: instructorEmail,
      role: "instructor",
    });

    instructorToken = await loginTestUser(instructorEmail);

    const studentEmail = `reviewstudent${Date.now()}@test.com`;

    await createTestUser({
      firstName: "Review",
      lastName: "Student",
      email: studentEmail,
      role: "student",
    });

    studentToken = await loginTestUser(studentEmail);

    const courseResponse = await request(app)
      .post("/api/courses/create")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({
        title: "Review Course",
        description: "Course for review tests",
        price: 100,
        category: "programming",
      });

    expect(courseResponse.statusCode).toBe(200);

    courseId = courseResponse.body.data._id;

    const publishResponse = await request(app)
      .patch(`/api/courses/${courseId}`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({
        published: true,
      });

    expect(publishResponse.statusCode).toBe(200);

    const enrollResponse = await request(app)
      .post(`/api/courses/${courseId}/enroll`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(enrollResponse.statusCode).toBe(201);
  }, 30000);

  test(
    "should create a review for enrolled student",
    async () => {
      const response = await request(app)
        .post("/api/reviews/create")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          courseId: courseId,
          rating: 5,
          comment: "Excellent course",
        });

      expect(response.statusCode).toBe(201);
    },
    20000
  );

  test(
    "should reject duplicate review",
    async () => {
      const response = await request(app)
        .post("/api/reviews/create")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          courseId: courseId,
          rating: 4,
          comment: "Another review",
        });

      expect(response.statusCode).toBe(409);
    },
    20000
  );

  test(
    "should get course reviews publicly",
    async () => {
      const response = await request(app).get(
        `/api/reviews/course/${courseId}`
      );

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body.data.reviews)).toBe(true);   


    },
    20000
  );

  test(
    "should reject invalid review rating",
    async () => {
      const newStudentEmail = `ratingstudent${Date.now()}@test.com`;

      await createTestUser({
        firstName: "Rating",
        lastName: "Student",
        email: newStudentEmail,
        role: "student",
      });

      const token = await loginTestUser(newStudentEmail);

      const response = await request(app)
        .post("/api/reviews/create")
        .set("Authorization", `Bearer ${token}`)
        .send({
          course: courseId,
          rating: 6,
          comment: "Invalid rating",
        });

      expect(response.statusCode).toBe(400);
    },
    20000
  );
});

/* =========================================================
   FAVORITES API
========================================================= */

describe("Favorites API", () => {
  let studentToken;
  let courseId;

  beforeAll(async () => {
    const studentEmail = `favorite${Date.now()}@test.com`;

    await createTestUser({
      firstName: "Favorite",
      lastName: "Student",
      email: studentEmail,
      role: "student",
    });

    studentToken = await loginTestUser(studentEmail);

    const instructorEmail = `favoriteinstructor${Date.now()}@test.com`;

    await createTestUser({
      firstName: "Favorite",
      lastName: "Instructor",
      email: instructorEmail,
      role: "instructor",
    });

    const instructorToken = await loginTestUser(instructorEmail);

    const courseResponse = await request(app)
      .post("/api/courses/create")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({
        title: "Favorite Course",
        description: "Course for favorites",
        price: 150,
        category: "programming",
      });

    expect(courseResponse.statusCode).toBe(200);

    courseId = courseResponse.body.data._id;

    const publishResponse = await request(app)
      .patch(`/api/courses/${courseId}`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({
        published: true,
      });

    expect(publishResponse.statusCode).toBe(200);
  }, 30000);

  test(
    "should add course to favorites",
    async () => {
      const response = await request(app)
        .post(`/api/favorites/${courseId}`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.statusCode).toBe(201);
    },
    20000
  );

  test(
    "should reject duplicate favorite",
    async () => {
      const response = await request(app)
        .post(`/api/favorites/${courseId}`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.statusCode).toBe(409);
    },
    20000
  );

  test(
    "should get my favorites",
    async () => {
      const response = await request(app)
        .get("/api/favorites/")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body.data.favorites)).toBe(true);
    },
    20000
  );

  test(
    "should remove course from favorites",
    async () => {
      const response = await request(app)
        .delete(`/api/favorites/${courseId}`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.statusCode).toBe(200);
    },
    20000
  );

  test(
    "should return 404 when removing non-existing favorite",
    async () => {
      const response = await request(app)
        .delete(`/api/favorites/${courseId}`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.statusCode).toBe(404);
    },
    20000
  );
});

/* =========================================================
   INSTRUCTOR DASHBOARD API
========================================================= */

describe("Instructor Dashboard API", () => {
  let instructorToken;

  beforeAll(async () => {
    const instructorEmail = `dashboard${Date.now()}@test.com`;

    await createTestUser({
      firstName: "Dashboard",
      lastName: "Instructor",
      email: instructorEmail,
      role: "instructor",
    });

    instructorToken = await loginTestUser(instructorEmail);
  }, 20000);

  test(
    "should return instructor dashboard",
    async () => {
      const response = await request(app)
        .get("/api/instructor/dashboard")
        .set("Authorization", `Bearer ${instructorToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe("success");

      expect(response.body.data).toHaveProperty("totalCourses");
      expect(response.body.data).toHaveProperty(
        "totalCoursesPublished"
      );
      expect(response.body.data).toHaveProperty(
        "totalCoursesUnPublished"
      );
      expect(response.body.data).toHaveProperty("totalStudents");
      expect(response.body.data).toHaveProperty("totalReviews");
      expect(response.body.data).toHaveProperty("averageRating");
    },
    20000
  );

  test(
    "should reject dashboard access for student",
    async () => {
      const studentEmail = `dashboardstudent${Date.now()}@test.com`;

      await createTestUser({
        firstName: "Dashboard",
        lastName: "Student",
        email: studentEmail,
        role: "student",
      });

      const token = await loginTestUser(studentEmail);

      const response = await request(app)
        .get("/api/instructor/dashboard")
        .set("Authorization", `Bearer ${token}`);

      expect(response.statusCode).toBe(403);
    },
    20000
  );

  test(
    "should reject dashboard access without token",
    async () => {
      const response = await request(app).get(
        "/api/instructor/dashboard"
      );

      expect(response.statusCode).toBe(401);
    },
    20000
  );
});

/* =========================================================
   GLOBAL ERROR HANDLING
========================================================= */

describe("Global Error Handling", () => {
  test(
    "should return 404 for unknown route",
    async () => {
      const response = await request(app).get(
        "/api/this-route-does-not-exist"
      );

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe("Route not found");
    },
    20000
  );

  test(
    "should reject invalid course id",
    async () => {
      const response = await request(app).get(
        "/api/courses/invalid-id"
      );

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe("Invalid course ID");
    },
    20000
  );
});

/* =========================================================
   CLOSE DATABASE
========================================================= */

afterAll(async () => {
  await mongoose.connection.close();
});