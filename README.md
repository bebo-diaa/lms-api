# EduTrack API

A production-style RESTful backend API for a **Learning Management System (LMS)** built with **Node.js, Express.js, MongoDB, and Mongoose**.

EduTrack provides a complete backend for managing users, courses, lessons, enrollments, progress tracking, reviews, favorites, and instructor analytics.

The API is secured with **JWT authentication**, **role-based authorization**, **ownership checks**, request validation, centralized error handling, and database-level constraints.

---

## 🚀 Features

### 🔐 Authentication & Authorization

* User registration and login
* Secure password hashing using **bcrypt**
* JWT-based authentication
* Role-based access control:

  * `student`
  * `instructor`
  * `admin`
* Protected routes using authentication middleware
* Ownership-based authorization
* Users cannot modify resources they do not own
* Sensitive fields such as passwords are never returned in API responses

---

### 📚 Course Management

* Create, read, update, and delete courses
* Instructor/admin course creation
* Course ownership verification
* Draft and published course workflow
* Published courses are publicly discoverable
* Unpublished courses are restricted to their owner and admins
* Course categories:

  * `programming`
  * `design`
  * `marketing`
  * `business`
  * `languages`
  * `personal-development`
* Search courses by title
* Sort courses using allowed fields
* Ascending/descending sorting
* Pagination with validated `page` and `limit` parameters
* Instructor-specific course listing
* Instructor information populated in course responses

---

### 🎥 Lessons & Video Content

* Create lessons inside courses
* Automatic lesson ordering
* Video upload support using **Multer**
* Video storage through **Cloudinary**
* Protected lesson access
* Only enrolled students, course owners, and admins can access course lessons
* Lesson ownership and course relationships are validated

---

### 📝 Enrollment

* Students can enroll in published courses
* Prevents duplicate enrollments
* Database-level unique compound index for enrollment protection
* Students can retrieve their enrolled courses
* Paginated enrollment listing

---

### 📈 Progress Tracking

* Mark individual lessons as completed
* Prevent duplicate lesson completions
* Verify that the lesson belongs to the specified course
* Course completion percentage calculated dynamically
* Progress access is protected according to user role and enrollment

---

### ⭐ Reviews & Ratings

* Enrolled students can review courses
* Rating from `1` to `5`
* Optional review comments
* One review per student per course
* Duplicate reviews prevented at the database level
* Public course review listing
* Review ownership verification
* Review update and deletion by the review owner only

---

### ❤️ Favorites

* Add published courses to favorites
* Remove courses from favorites
* Retrieve the logged-in user's favorite courses
* Duplicate favorites prevented at the database level

---

### 📊 Instructor Dashboard

Instructors can access aggregated teaching statistics including:

* Total courses
* Published courses
* Unpublished courses
* Total enrolled students
* Total reviews
* Average course rating

---

### 🛡️ Validation & Error Handling

* Request validation using **express-validator**
* Email format validation
* Password strength validation
* Required field validation
* MongoDB ObjectId validation
* Centralized error handling
* Consistent API error response format
* HTTP status code handling
* Asynchronous error handling
* Server-side error logging with timestamp, route, and status code

---

### 🧪 Testing

The project includes an automated integration test suite using:

* **Jest**
* **Supertest**

The test suite contains **60+ integration tests** covering:

* Authentication
* JWT authorization
* Role-based access control
* Ownership rules
* Course management
* Course visibility
* Enrollment
* Duplicate prevention
* Lesson access protection
* Progress tracking
* Search
* Sorting
* Pagination
* Reviews
* Favorites

Run the complete test suite with:

```bash
npm test
```

---

## 🧰 Tech Stack

| Technology            | Purpose                  |
| --------------------- | ------------------------ |
| **Node.js**           | JavaScript runtime       |
| **Express.js**        | REST API framework       |
| **MongoDB**           | Database                 |
| **Mongoose**          | MongoDB ODM              |
| **JWT**               | Authentication           |
| **bcrypt**            | Password hashing         |
| **express-validator** | Request validation       |
| **Multer**            | File upload handling     |
| **Cloudinary**        | Video/file storage       |
| **Jest**              | Testing framework        |
| **Supertest**         | HTTP integration testing |
| **Swagger / OpenAPI** | API documentation        |

---

## 🏗️ Architecture

The project follows a layered Express architecture that separates routing, business logic, data access, validation, and middleware responsibilities.

```text
Client
  │
  ▼
Routes
  │
  ├── Validation Middleware
  │
  ├── Authentication Middleware
  │
  ├── Authorization / Ownership Checks
  │
  ▼
Controllers
  │
  ▼
Mongoose Models
  │
  ▼
MongoDB
```

Additional services such as Cloudinary are used for media storage.

---

## 📁 Project Structure

```text
lms-api/
│
├── controller/
│   └── Business logic for application resources
│
├── middleware/
│   └── Authentication, authorization, validation,
│       upload handling, async/error middleware
│
├── model/
│   └── Mongoose schemas
│
├── route/
│   └── Express route definitions
│
├── utils/
│   └── AppError, JWT utilities, constants,
│       pagination helpers, Cloudinary configuration
│
├── validators/
│   └── express-validator rule sets
│
├── __test__/
│   └── Jest + Supertest integration tests
│
├── app.js
│   └── Express application configuration
│
├── index.js
│   └── Application entry point and server startup
│
├── .env.example
│   └── Environment variable template
│
├── package.json
└── README.md
```

---

# 🔑 API Documentation

The API is documented using **Swagger / OpenAPI**.

After starting the server, open:

```text
http://localhost:4000/api-docs
```

Swagger provides an interactive interface where you can:

* Browse all API endpoints
* View request parameters
* View request body schemas
* View response schemas
* Authenticate using JWT
* Execute API requests directly
* Inspect HTTP responses

### Authentication in Swagger

1. Register or log in.
2. Copy the JWT token returned by the login endpoint.
3. Click **Authorize**.
4. Enter:

```text
Bearer <your-token>
```

5. Execute protected endpoints.

---

# 📌 API Endpoints

## Authentication

Base URL:

```text
/api/users
```

| Method | Endpoint    | Description                    | Access        |
| ------ | ----------- | ------------------------------ | ------------- |
| POST   | `/register` | Register a new user            | Public        |
| POST   | `/login`    | Login and receive JWT          | Public        |
| GET    | `/me`       | Get current authenticated user | Authenticated |
| GET    | `/`         | Get all users with pagination  | Admin         |
| GET    | `/:userId`  | Get user by ID                 | Admin         |

---

## Courses

Base URL:

```text
/api/courses
```

| Method | Endpoint              | Description               | Access                 |
| ------ | --------------------- | ------------------------- | ---------------------- |
| POST   | `/create`             | Create a course           | Instructor / Admin     |
| GET    | `/`                   | Get published courses     | Public                 |
| GET    | `/myCourses`          | Get instructor's courses  | Authenticated          |
| GET    | `/my-enrollments`     | Get student's enrollments | Authenticated          |
| GET    | `/:courseId`          | Get course details        | Public / Owner / Admin |
| PATCH  | `/:courseId`          | Update a course           | Owner / Admin          |
| DELETE | `/:courseId`          | Delete a course           | Owner / Admin          |
| POST   | `/:courseId/enroll`   | Enroll in a course        | Student                |
| GET    | `/:courseId/progress` | Get course progress       | Authorized user        |

### Course Listing

The course listing endpoint supports:

```text
?page=1
&limit=10
&category=programming
&search=node
&sort=createdAt
&order=desc
```

---

## Lessons

Base URL:

```text
/api/courses/:courseId/lessons
```

| Method | Endpoint              | Description                       | Access                           |
| ------ | --------------------- | --------------------------------- | -------------------------------- |
| POST   | `/`                   | Create a lesson with video upload | Course Owner / Admin             |
| GET    | `/`                   | Get course lessons                | Enrolled Student / Owner / Admin |
| POST   | `/:lessonId/complete` | Mark lesson as completed          | Authorized user                  |

Lesson creation supports multipart form data and video uploads through **Multer + Cloudinary**.

---

## Reviews

Base URL:

```text
/api/reviews
```

| Method | Endpoint            | Description            | Access           |
| ------ | ------------------- | ---------------------- | ---------------- |
| POST   | `/create`           | Create a course review | Enrolled Student |
| GET    | `/course/:courseId` | Get course reviews     | Public           |
| PUT    | `/:reviewId`        | Update own review      | Review Owner     |
| DELETE | `/:reviewId`        | Delete own review      | Review Owner     |

---

## Favorites

Base URL:

```text
/api/favorites
```

| Method | Endpoint     | Description             | Access        |
| ------ | ------------ | ----------------------- | ------------- |
| POST   | `/:courseId` | Add course to favorites | Authenticated |
| DELETE | `/:courseId` | Remove favorite         | Authenticated |
| GET    | `/`          | Get user's favorites    | Authenticated |

---

## Instructor Dashboard

Base URL:

```text
/api/instructor
```

| Method | Endpoint     | Description               | Access     |
| ------ | ------------ | ------------------------- | ---------- |
| GET    | `/dashboard` | Get instructor statistics | Instructor |

---

# 🔒 Security

Security was considered at both the application and database levels.

### Password Protection

Passwords are hashed using bcrypt before being stored.

Passwords are excluded from normal user queries and are never returned in API responses.

### JWT Authentication

Authenticated requests use JSON Web Tokens to identify the current user.

The authenticated user's:

* ID
* Email
* Role

are derived from the verified JWT rather than being trusted from client-provided request data.

### Role-Based Authorization

Different resources are protected according to user roles:

```text
student
instructor
admin
```

### Ownership Protection

Having an `instructor` role alone does not grant access to every course.

For example:

```text
Instructor A
    │
    └── Course A

Instructor B
    │
    └── Course B
```

Instructor A cannot modify Course B unless explicitly authorized.

### Database-Level Constraints

Important duplicate operations are protected using unique database indexes, including:

* Enrollment
* Favorites
* Reviews
* Lesson completion

This prevents duplicate records even if application-level checks are bypassed or concurrent requests occur.

### ObjectId Validation

MongoDB ObjectIds are validated before database queries are executed, reducing invalid database operations and providing clearer API errors.

---

# ⚙️ Getting Started

## Prerequisites

Make sure you have:

* Node.js `v18+`
* MongoDB database
* Cloudinary account for video uploads
* Git

---

## Installation

Clone the repository:

```bash
git clone https://github.com/bebo-diaa/lms-api.git
```

Navigate to the project:

```bash
cd lms-api
```

Install dependencies:

```bash
npm install
```

---

## Environment Variables

Create a `.env` file in the project root based on `.env.example`.

```env
MONGOOSE_URL=your_mongodb_connection_string
JWT_SECRET_KEY=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> Never commit your actual `.env` file or expose your JWT secret, MongoDB credentials, or Cloudinary credentials.

---

## ▶️ Running the Application

Start the development server:

```bash
npm start
```

The API will be available at:

```text
http://localhost:4000
```

Swagger documentation:

```text
http://localhost:4000/api-docs
```

---

# 🧪 Running Tests

Run the complete integration test suite:

```bash
npm test
```

The tests use **Jest + Supertest** and exercise the API through HTTP requests rather than testing controllers in isolation.

---

# 🔄 Example Authentication Flow

A typical student workflow looks like this:

```text
Register
   │
   ▼
Login
   │
   ▼
Receive JWT
   │
   ▼
Authenticate Request
   │
   ▼
Browse Published Courses
   │
   ▼
Enroll
   │
   ▼
Access Lessons
   │
   ▼
Complete Lessons
   │
   ▼
Track Course Progress
   │
   ▼
Leave Review
   │
   ▼
Add Course to Favorites
```

---

# 👥 User Roles

### Student

Students can:

* Browse published courses
* Enroll in courses
* Access enrolled course content
* Track lesson completion
* View course progress
* Review enrolled courses
* Manage favorites

### Instructor

Instructors can:

* Create courses
* Manage their own courses
* Publish/manage course content
* Add lessons
* Upload lesson videos
* View their courses
* Access instructor dashboard statistics

### Admin

Admins have elevated access for platform management, including:

* User management
* Course management
* Access to protected resources
* Administrative ownership overrides

---

# 📊 API Response Format

Successful responses generally follow a consistent structure:

```json
{
  "status": "success",
  "data": {}
}
```

Errors follow a consistent structure:

```json
{
  "status": "fail",
  "message": "Error message"
}
```

This provides a predictable interface for API consumers.

---

# 🧠 Key Backend Concepts Demonstrated

This project was built to practice and demonstrate real backend development concepts, including:

* RESTful API design
* MVC-style project organization
* Middleware architecture
* JWT authentication
* Role-based authorization
* Resource ownership
* Password hashing
* MongoDB data modeling
* Mongoose relationships and population
* Database indexes
* Pagination
* Search and sorting
* File uploads
* Cloud media storage
* Request validation
* Centralized error handling
* Async error handling
* Integration testing
* API documentation with OpenAPI / Swagger
* Environment-based configuration

---

# 📈 Future Improvements

Potential future improvements include:

* Refresh token mechanism
* Email verification
* Password reset workflow
* Rate limiting improvements
* More advanced course filtering
* Structured production logging
* Automated API deployment
* CI/CD pipeline
* Docker support
* More comprehensive test coverage
* Production monitoring

---

# 📄 License

This project is open source and available for **learning and portfolio purposes**.

---

## 👨‍💻 Author

**Bahaa Diaa**

Backend Developer focused on building RESTful APIs with Node.js, Express, and MongoDB.

GitHub:

https://github.com/bebo-diaa
