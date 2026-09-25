# EduTrack API

A production-style **RESTful LMS backend API** built with **Node.js, Express.js, MongoDB, and Mongoose**.

EduTrack provides a complete backend for managing **users, courses, lessons, enrollments, payments, progress, reviews, favorites, and instructor analytics**, with authentication, authorization, validation, security, testing, and API documentation.

---

## 🚀 Features

* JWT Authentication
* Role-Based Access Control — Student / Instructor / Admin
* Course & Lesson Management
* Course Publishing Workflow
* Search, Filtering, Sorting & Pagination
* Secure Video Uploads with Cloudinary
* Stripe Checkout & Webhooks
* Payment-Based Course Enrollment
* Lesson Completion & Course Progress
* Course Reviews & Ratings
* Course Favorites
* Instructor Dashboard & Analytics
* Request Validation
* Centralized Error Handling
* API Rate Limiting
* Swagger / OpenAPI Documentation
* Jest + Supertest Integration Tests

---

## 🛠️ Tech Stack

| Technology         | Purpose               |
| ------------------ | --------------------- |
| Node.js            | Runtime               |
| Express.js         | REST API              |
| MongoDB            | Database              |
| Mongoose           | ODM                   |
| JWT                | Authentication        |
| bcrypt             | Password Hashing      |
| express-validator  | Validation            |
| Multer             | File Uploads          |
| Cloudinary         | Video Storage         |
| Stripe             | Payments              |
| Helmet             | Security Headers      |
| CORS               | Cross-Origin Requests |
| express-rate-limit | Rate Limiting         |
| Jest + Supertest   | Testing               |
| Swagger / OpenAPI  | Documentation         |

---

## 🏗️ Architecture

EduTrack follows an **MVC-style layered architecture** with clear separation of responsibilities.

```text
Client
  │
  ▼
Routes
  │
  ▼
Middleware
  │
  ├── Authentication
  ├── Authorization
  ├── Validation
  └── Resource Access
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

External services:

```text
Stripe     → Payments & Webhooks
Cloudinary → Video Storage
```

---

## 📁 Project Structure

```text
lms-api/
├── controller/       # Business logic
├── middleware/       # Auth, validation, uploads, security
├── model/            # Mongoose schemas & indexes
├── route/            # API routes
├── validators/       # Request validation
├── utils/            # Helpers & constants
├── docs/             # OpenAPI specification
├── __test__/         # Integration tests
├── app.js            # Express application
├── index.js          # Server & database startup
├── .env.example
├── package.json
└── README.md
```

---

## 💳 Payment & Enrollment Flow

All courses are paid. Enrollment is activated only after successful payment.

```text
Student
   │
   ▼
Create Checkout Session
   │
   ▼
Stripe Checkout
   │
   ▼
Payment Completed
   │
   ▼
Verified Stripe Webhook
   │
   ▼
Payment → SUCCESS
   │
   ▼
Enrollment → SUCCESS
   │
   ▼
Course Access
```

The server uses **Stripe webhook signature verification**, server-side payment confirmation, and **idempotent processing** to prevent duplicate enrollment activation.

---

## 🔐 Security

The API implements multiple security layers:

* JWT-based authentication
* Role-based authorization
* Resource ownership checks
* bcrypt password hashing
* Helmet security headers
* CORS
* Rate limiting
* Request validation
* ObjectId validation
* Database-level unique indexes
* Stripe webhook signature verification
* Server-side payment verification
* Centralized error handling

---

## 🧪 Testing

The project uses **Jest and Supertest** for integration testing.

Current suite:

**64 passing tests**

Coverage includes:

* Authentication & authorization
* Users
* Courses & lessons
* Enrollment
* Payments & webhooks
* Progress tracking
* Reviews
* Favorites
* Pagination
* Search & sorting
* Validation & error handling
* Duplicate prevention
* Webhook idempotency

Run tests:

```bash
npm test
```

---

## 📖 API Documentation

Interactive API documentation is available through Swagger:

```text
http://localhost:4000/api-docs
```

Swagger provides endpoint definitions, request/response schemas, authentication requirements, and API testing.

---

## ⚙️ Getting Started

### Requirements

* Node.js 18+
* MongoDB
* Cloudinary account
* Stripe account

### Installation

```bash
git clone https://github.com/bebo-diaa/lms-api.git
cd lms-api
npm install
```

Create `.env` from `.env.example` and configure:

```env
MONGOOSE_URL=
JWT_SECRET_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

STRIPE_SUCCESS_URL=
STRIPE_CANCEL_URL=
```

Start the server:

```bash
npm start
```

API:

```text
http://localhost:4000
```

---

## 🧠 Key Backend Concepts

This project demonstrates practical backend development concepts such as:

**REST API Design · MVC Architecture · Middleware · JWT · RBAC · Mongoose Relationships · Indexing · Pagination · Validation · File Uploads · Cloud Storage · Webhooks · Payment State Management · Idempotency · Error Handling · Integration Testing**

---

## 📌 Project Highlights

EduTrack was built as a practical backend project focusing on **real-world API architecture and business logic**, rather than simple CRUD operations.

Important design decisions include:

* Authentication and authorization are handled through reusable middleware.
* Access to course content depends on successful enrollment.
* Payment status and enrollment status are managed separately.
* Database indexes enforce important uniqueness constraints.
* Stripe webhooks are verified and processed idempotently.
* Controllers remain focused on business logic.
* API validation and error handling are centralized.

---

## 📄 License

This project is built for **learning and portfolio purposes**.

---

## 👨‍💻 Author

**Bahaa Diaa**

Backend Developer focused on **Node.js, Express.js, MongoDB, and RESTful API development**.

GitHub:
https://github.com/bebo-diaa
