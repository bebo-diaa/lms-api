# EduTrack API

A full-featured backend API for a Learning Management System (LMS), built with Node.js, Express, and MongoDB. EduTrack allows instructors to create and manage courses and lessons, students to enroll, track their progress, and review courses, and admins to oversee the platform — all secured with JWT authentication, role-based access control, and ownership checks.

## Features

### Authentication & Authorization
- Secure registration and login with hashed passwords (bcrypt)
- JWT-based authentication
- Role-based access control (`student`, `instructor`, `admin`)
- Ownership checks (e.g., only a course's instructor or an admin can update/delete it)

### Course Management
- Full CRUD for courses
- Draft/publish workflow (`published` flag) — unpublished courses are only visible to their owner or an admin
- Course categories (`programming`, `design`, `marketing`, `business`, `languages`, `personal-development`)
- Search courses by title
- Sort courses by allowed fields (e.g. price) in ascending or descending order
- Pagination on course, user, and enrollment listings, with request-level validation on `page`/`limit`
- Instructors can view all of their own courses (published or not)

### Lessons & Content
- Instructors can add lessons to their own courses, with real video file uploads (via Multer + Cloudinary)
- Lessons are automatically ordered
- Lesson content is only accessible to enrolled students, the course owner, or an admin

### Enrollment
- Students can enroll in published courses
- Duplicate enrollments are prevented at the database level (unique compound index)
- Students can view all courses they are enrolled in

### Progress Tracking
- Students can mark individual lessons as complete
- A lesson can only be marked complete if it actually belongs to the specified course
- Duplicate completions are prevented at the database level
- Course-level progress percentage is calculated on demand

### Reviews & Ratings
- Enrolled students can leave a rating (1-5) and comment on a published course
- One review per student per course
- Anyone can view a course's reviews; only the review's author can update or delete it

### Favorites
- Students can add or remove published courses from a personal favorites list
- Duplicate favorites are prevented

### Instructor Dashboard
- Instructors get a summary view of their teaching activity: total courses, published vs. unpublished counts, total enrolled students, total reviews received, and average rating

### Validation & Error Handling
- Request validation using `express-validator` (email format, password strength, required fields, valid MongoDB IDs, etc.)
- Centralized error handling with a consistent response format
- Errors are logged to a file with timestamp, route, and status code

### Testing
- Automated integration tests using Jest and Supertest
- 60+ tests covering authentication, authorization, ownership rules, enrollment logic, content protection, search/sort/pagination, progress tracking, reviews, and favorites

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Database:** MongoDB with Mongoose
- **Authentication:** JSON Web Tokens (JWT)
- **Password Hashing:** bcrypt
- **Validation:** express-validator
- **File Storage:** Multer + Cloudinary
- **Testing:** Jest, Supertest

## Project Structure

```
lms-api/
├── controller/       # Business logic for each resource
├── middleware/       # Auth, role checks, enrollment checks, validation, upload, error wrapping
├── model/            # Mongoose schemas (User, Course, Lesson, Enrollment, Progress, Review, Favorite)
├── route/            # Express route definitions
├── utils/            # Helpers (AppError, token generation, constants, pagination, Cloudinary config)
├── validators/       # express-validator rule sets per resource
├── __test__/         # Jest + Supertest integration tests
├── app.js            # Express app setup (no server listening - used by tests)
├── index.js          # Entry point that starts the server
└── .env.example      # Template for required environment variables
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- A MongoDB database (local instance or a cloud cluster, e.g., MongoDB Atlas)
- A free [Cloudinary](https://cloudinary.com) account (for video uploads)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/bebo-diaa/lms-api.git
   cd lms-api
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file in the root directory based on `.env.example`:
   ```
   MONGOE_URL=your_mongodb_connection_string_here
   JWT_SECRET_KEY=your_jwt_secret_here
   CLOUDINARY_CLOUD_NAME=your_cloud_name_here
   CLOUDINARY_API_KEY=your_api_key_here
   CLOUDINARY_API_SECRET=your_api_secret_here
   ```

4. Start the server
   ```
   npm start
   ```

   The API will be available at `http://localhost:4000`.

### Running Tests

```
npm test
```

This runs the full integration test suite using Jest and Supertest.

## API Endpoints

### Auth (`/api/users`)

| Method | Endpoint    | Description                     | Access        |
|--------|-------------|----------------------------------|---------------|
| POST   | `/register` | Register a new user              | Public        |
| POST   | `/login`    | Log in and receive a JWT         | Public        |
| GET    | `/`         | Get all users (paginated)        | Admin only    |
| GET    | `/me`       | Get the current logged-in user   | Authenticated |
| GET    | `/:userId`  | Get a user by ID                 | Admin only    |

### Courses (`/api/courses`)

| Method | Endpoint            | Description                                                                 | Access                                 |
|--------|---------------------|------------------------------------------------------------------------------|----------------------------------------|
| POST   | `/create`           | Create a new course (title, description, price, category)                   | Instructor / Admin                     |
| GET    | `/`                 | Get all published courses - supports `page`, `limit`, `category`, `search`, `sort`, `order` | Public                    |
| GET    | `/myCourses`        | Get the logged-in instructor's own courses                                   | Authenticated                          |
| GET    | `/my-enrollments`   | Get the logged-in student's enrolled courses (paginated)                     | Authenticated                          |
| GET    | `/:courseId`        | Get a single course's details and its lessons                                | Public (if published) / Owner / Admin  |
| PATCH  | `/:courseId`        | Update a course                                                               | Course owner / Admin                   |
| DELETE | `/:courseId`        | Delete a course                                                               | Course owner / Admin                   |
| POST   | `/:courseId/enroll` | Enroll the logged-in student in a course                                     | Authenticated                          |
| GET    | `/:courseId/progress` | Get the logged-in student's completion percentage for a course             | Enrolled student / Owner / Admin       |

### Lessons (`/api/courses/:courseId/lessons`)

| Method | Endpoint      | Description                                              | Access                            |
|--------|---------------|-----------------------------------------------------------|-----------------------------------|
| POST   | `/`           | Add a lesson to a course (multipart form: `title`, `video`) | Course owner / Admin           |
| GET    | `/`           | Get all lessons of a course                                | Enrolled student / Owner / Admin |
| POST   | `/:lessonId/complete` | Mark a lesson as complete                          | Enrolled student / Owner / Admin |

### Reviews (`/api/reviews`)

| Method | Endpoint             | Description                          | Access                    |
|--------|----------------------|----------------------------------------|---------------------------|
| POST   | `/create`            | Leave a review for an enrolled course  | Enrolled student          |
| GET    | `/course/:courseId`  | Get all reviews for a course           | Public                    |
| PUT    | `/:reviewId`         | Update your own review                 | Review owner               |
| DELETE | `/:reviewId`         | Delete your own review                 | Review owner               |

### Favorites (`/api/favorites`)

| Method | Endpoint       | Description                          | Access        |
|--------|----------------|----------------------------------------|---------------|
| POST   | `/:courseId`   | Add a course to favorites              | Authenticated |
| DELETE | `/:courseId`   | Remove a course from favorites         | Authenticated |
| GET    | `/`            | Get the logged-in user's favorites     | Authenticated |

### Instructor Dashboard (`/api/instructor`)

| Method | Endpoint     | Description                                     | Access     |
|--------|--------------|---------------------------------------------------|------------|
| GET    | `/dashboard` | Get a summary of the instructor's teaching stats  | Instructor |

## Security Highlights

- Sensitive fields (e.g., `password`) are never returned in API responses (`select: false` in the schema)
- Identity- and role-sensitive fields (`instructor`, `role`) are always derived from the authenticated user's JWT - never trusted from the request body
- Ownership is verified independently of role checks (an instructor cannot modify another instructor's course, or complete a lesson from a course they don't own/aren't enrolled in)
- Duplicate enrollments, favorites, reviews, and lesson completions are all prevented at the database level via unique indexes, not just application logic
- Route parameters (course/user/lesson/review IDs) are validated as proper MongoDB ObjectIds before hitting any database query

## License

This project is open source and available for learning and portfolio purposes.