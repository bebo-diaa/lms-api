EduTrack API

A full-featured backend API for a Learning Management System (LMS), built with Node.js, Express, and MongoDB. EduTrack allows instructors to create and manage courses and lessons, students to enroll and access protected content, and admins to oversee the platform — all secured with JWT authentication, role-based access control, and ownership checks.

Features
Authentication & Authorization
Secure registration and login with hashed passwords (bcrypt)
JWT-based authentication
Role-based access control (student, instructor, admin)
Ownership checks (e.g., only a course's instructor or an admin can update/delete it)
Course Management
Full CRUD for courses
Draft/publish workflow (published flag) — unpublished courses are only visible to their owner or an admin
Instructors can view all of their own courses (published or not)
Lessons
Instructors can add lessons to their own courses
Lessons are automatically ordered
Lesson content is only accessible to enrolled students, the course owner, or an admin
Enrollment
Students can enroll in published courses
Duplicate enrollments are prevented at the database level (unique compound index)
Students can view all courses they are enrolled in
Validation & Error Handling
Request validation using express-validator (email format, password strength, required fields, etc.)
Centralized error handling with consistent response format
Errors are logged to a file with timestamp, route, and status code
Testing
Automated integration tests using Jest and Supertest
Covers authentication, authorization, ownership rules, enrollment logic, and content protection
Tech Stack
Runtime: Node.js
Framework: Express
Database: MongoDB with Mongoose
Authentication: JSON Web Tokens (JWT)
Password Hashing: bcrypt
Validation: express-validator
Testing: Jest, Supertest
Project Structure
eduTrack-api/
├── controller/       # Business logic for each resource
├── middleware/       # Auth, role checks, enrollment checks, validation, error wrapping
├── model/            # Mongoose schemas (User, Course, Lesson, Enrollment)
├── route/            # Express route definitions
├── utils/            # Helpers (AppError, token generation, constants)
├── validators/       # express-validator rule sets per resource
├── __test__/         # Jest + Supertest integration tests
├── app.js            # Express app setup (no server listening — used by tests)
├── index.js          # Entry point that starts the server
└── .env.example      # Template for required environment variables
Getting Started
Prerequisites
Node.js (v18 or higher recommended)
A MongoDB database (local instance or a cloud cluster, e.g., MongoDB Atlas)
Installation
Clone the repository
   git clone https://github.com/bebo-diaa/lms-api.git
   cd lms-api
Install dependencies
   npm install
Create a .env file in the root directory based on .env.example:
   MONGOE_URL=your_mongodb_connection_string_here
   JWT_SECRET_KEY=your_jwt_secret_here
Start the server
   npm start

The API will be available at http://localhost:4000.

Running Tests
npm test

This runs the full integration test suite (authentication, courses, lessons, and enrollment flows) using Jest and Supertest.

API Endpoints
Auth (/api/users)
Method	Endpoint	Description	Access
POST	/register	Register a new user	Public
POST	/login	Log in and receive a JWT	Public
GET	/	Get all users	Admin only
GET	/me	Get the current logged-in user	Authenticated
GET	/:userId	Get a user by ID	Admin only
Courses (/api/courses)
Method	Endpoint	Description	Access
POST	/create	Create a new course	Instructor / Admin
GET	/	Get all published courses	Public
GET	/myCourses	Get the logged-in instructor's own courses	Authenticated
GET	/my-enrollments	Get the logged-in student's enrolled courses	Authenticated
GET	/:courseId	Get a single course by ID	Public (if published) / Owner / Admin
PATCH	/:courseId	Update a course	Course owner / Admin
DELETE	/:courseId	Delete a course	Course owner / Admin
POST	/:courseId/enroll	Enroll the logged-in student in a course	Authenticated
Lessons (/api/courses/:courseId/lessons)
Method	Endpoint	Description	Access
POST	/	Add a lesson to a course	Course owner / Admin
GET	/	Get all lessons of a course	Enrolled student / Owner / Admin
Security Highlights
Sensitive fields (e.g., password) are never returned in API responses (select: false in the schema)
Identity- and role-sensitive fields (instructor, role) are always derived from the authenticated user's JWT — never trusted from the request body
Ownership is verified independently of role checks (an instructor cannot modify another instructor's course)
Duplicate enrollments are prevented at the database level via a compound unique index, not just application logic
License

This project is open source and available for learning and portfolio purposes.