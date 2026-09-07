import request from 'supertest';
import app from '../app.js';
import mongoose from 'mongoose';
import User from '../model/user.model.js';

describe('Auth API', () => {

    test('should register a new user successfully', async () => {
        const response = await request(app)
            .post('/api/users/register')
            .send({
                firstName: 'Test',
                lastName: 'User',
                email: `test${Date.now()}@test.com`,
                password: 'Test123!'
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.status).toBe('success');
    }, 20000);


    test('should reject duplicate email registration', async () => {
        const duplicateEmail = `duplicate${Date.now()}@test.com`;

        await request(app)
            .post('/api/users/register')
            .send({
                firstName: 'Test',
                lastName: 'User',
                email: duplicateEmail,
                password: 'Test123!'
            });

        const response = await request(app)
            .post('/api/users/register')
            .send({
                firstName: 'Test',
                lastName: 'User',
                email: duplicateEmail,
                password: 'Test123!'
            });

        expect(response.statusCode).toBe(409);
    }, 20000);


    test('should reject invalid email during registration', async () => {
        const response = await request(app)
            .post('/api/users/register')
            .send({
                firstName: 'Test',
                lastName: 'User',
                email: 'wrong-email',
                password: 'Test123!'
            });

        expect(response.statusCode).toBe(400);
    }, 20000);


    test('should reject weak password during registration', async () => {
        const response = await request(app)
            .post('/api/users/register')
            .send({
                firstName: 'Test',
                lastName: 'User',
                email: `weak${Date.now()}@test.com`,
                password: '123'
            });

        expect(response.statusCode).toBe(400);
    }, 20000);


    test('should login successfully with correct credentials', async () => {
        const email = `login${Date.now()}@test.com`;
        const password = 'Test123!';

        await request(app)
            .post('/api/users/register')
            .send({
                firstName: 'Test',
                lastName: 'User',
                email,
                password
            });

        const response = await request(app)
            .post('/api/users/login')
            .send({ email, password });

        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe('success');
        expect(response.body.data.token).toBeDefined();
    }, 20000);


    test('should reject login with wrong password', async () => {
        const email = `wrongpass${Date.now()}@test.com`;

        await request(app)
            .post('/api/users/register')
            .send({
                firstName: 'Test',
                lastName: 'User',
                email,
                password: 'Test123!'
            });

        const response = await request(app)
            .post('/api/users/login')
            .send({ email, password: 'Wrong123!' });

        expect(response.statusCode).toBe(401);
    }, 20000);


    test('should reject login with wrong email', async () => {
        const response = await request(app)
            .post('/api/users/login')
            .send({
                email: `notfound${Date.now()}@test.com`,
                password: 'Test123!'
            });

        expect(response.statusCode).toBe(401);
    }, 20000);


    test('should reject access to users without token', async () => {
        const response = await request(app)
            .get('/api/users/');

        expect(response.statusCode).toBe(401);
    }, 20000);


    test('should reject access to user by id without admin role', async () => {
        const email = `student${Date.now()}@test.com`;
        const password = 'Test123!';

        await request(app)
            .post('/api/users/register')
            .send({
                firstName: 'Test',
                lastName: 'User',
                email,
                password
            });

        const loginResponse = await request(app)
            .post('/api/users/login')
            .send({ email, password });

        const token = loginResponse.body.data.token;

        const response = await request(app)
            .get('/api/users/123')
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(403);
    }, 20000);


    test('should get current user with valid token', async () => {
        const email = `me${Date.now()}@test.com`;
        const password = 'Test123!';

        await request(app)
            .post('/api/users/register')
            .send({
                firstName: 'Test',
                lastName: 'User',
                email,
                password
            });

        const loginResponse = await request(app)
            .post('/api/users/login')
            .send({ email, password });

        const token = loginResponse.body.data.token;

        const response = await request(app)
            .get('/api/users/me')
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe('success');
    }, 20000);

});


describe('Course, Lesson & Enrollment API', () => {

    let instructorToken;
    let studentToken;
    let courseId;
    let unpublishedCourseId;

    beforeAll(async () => {
        const instructorEmail = `instructor${Date.now()}@test.com`;
        await request(app)
            .post('/api/users/register')
            .send({
                firstName: 'Instructor',
                lastName: 'Test',
                email: instructorEmail,
                password: 'Test123!'
            });

        await User.findOneAndUpdate(
            { email: instructorEmail },
            { role: 'instructor' }
        );

        const instructorLogin = await request(app)
            .post('/api/users/login')
            .send({ email: instructorEmail, password: 'Test123!' });

        instructorToken = instructorLogin.body.data.token;

        const studentEmail = `student${Date.now()}@test.com`;
        await request(app)
            .post('/api/users/register')
            .send({
                firstName: 'Student',
                lastName: 'Test',
                email: studentEmail,
                password: 'Test123!'
            });

        const studentLogin = await request(app)
            .post('/api/users/login')
            .send({ email: studentEmail, password: 'Test123!' });

        studentToken = studentLogin.body.data.token;
    }, 30000);


    test('should reject course creation without instructor/admin role', async () => {
        const response = await request(app)
            .post('/api/courses/create')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({
                title: 'Should Fail',
                description: 'Student cannot create this',
                price: 100
            });

        expect(response.statusCode).toBe(403);
    }, 20000);


    test('should create a course successfully as instructor', async () => {
        const response = await request(app)
            .post('/api/courses/create')
            .set('Authorization', `Bearer ${instructorToken}`)
            .send({
                title: 'Node.js Basics',
                description: 'Learn Node.js from scratch',
                price: 199
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.data.published).toBe(false);

        courseId = response.body.data._id;
        unpublishedCourseId = response.body.data._id;
    }, 20000);


    test('should reject course creation with missing title', async () => {
        const response = await request(app)
            .post('/api/courses/create')
            .set('Authorization', `Bearer ${instructorToken}`)
            .send({
                description: 'Missing title here',
                price: 100
            });

        expect(response.statusCode).toBe(400);
    }, 20000);


    test('should not show unpublished course in getAllCourses', async () => {
        const response = await request(app)
            .get('/api/courses/');

        const found = response.body.data.courses.find(c => c._id === unpublishedCourseId);
        expect(found).toBeUndefined();
    }, 20000);


    test('should allow owner to update their own course', async () => {
        const response = await request(app)
            .patch(`/api/courses/${courseId}`)
            .set('Authorization', `Bearer ${instructorToken}`)
            .send({ published: true });

        expect(response.statusCode).toBe(200);
        expect(response.body.data.published).toBe(true);
    }, 20000);


    test('should reject update from a non-owner instructor', async () => {
        const response = await request(app)
            .patch(`/api/courses/${courseId}`)
            .set('Authorization', `Bearer ${studentToken}`)
            .send({ title: 'Hacked title' });

        expect(response.statusCode).toBe(403);
    }, 20000);


    test('should reject lesson access before enrollment', async () => {
        const response = await request(app)
            .get(`/api/courses/${courseId}/lessons`)
            .set('Authorization', `Bearer ${studentToken}`);

        expect(response.statusCode).toBe(403);
    }, 20000);


    test('should enroll student in a published course', async () => {
        const response = await request(app)
            .post(`/api/courses/${courseId}/enroll`)
            .set('Authorization', `Bearer ${studentToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.data.course).toBe(courseId);
    }, 20000);


    test('should reject duplicate enrollment', async () => {
        const response = await request(app)
            .post(`/api/courses/${courseId}/enroll`)
            .set('Authorization', `Bearer ${studentToken}`);

        expect(response.statusCode).toBe(409);
    }, 20000);


    test('should allow lesson access after enrollment', async () => {
        const response = await request(app)
            .get(`/api/courses/${courseId}/lessons`)
            .set('Authorization', `Bearer ${studentToken}`);

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
    }, 20000);


    test('should allow instructor to create a lesson for their own course', async () => {
        const response = await request(app)
            .post(`/api/courses/${courseId}/lessons`)
            .set('Authorization', `Bearer ${instructorToken}`)
            .send({
                title: 'Introduction',
                videoUrl: 'https://example.com/video1.mp4'
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.data.order).toBe(1);
    }, 20000);


    test('should reject lesson creation with invalid videoUrl', async () => {
        const response = await request(app)
            .post(`/api/courses/${courseId}/lessons`)
            .set('Authorization', `Bearer ${instructorToken}`)
            .send({
                title: 'Bad Lesson',
                videoUrl: 'not-a-valid-url'
            });

        expect(response.statusCode).toBe(400);
    }, 20000);


    test('should show enrolled course in getMyEnrollments', async () => {
        const response = await request(app)
            .get('/api/courses/my-enrollments')
            .set('Authorization', `Bearer ${studentToken}`);

        expect(response.statusCode).toBe(200);
        const found = response.body.data.find(e => e.course._id === courseId);
        expect(found).toBeDefined();
    }, 20000);


    test('should reject deleting a course by a non-owner', async () => {
        const response = await request(app)
            .delete(`/api/courses/${courseId}`)
            .set('Authorization', `Bearer ${studentToken}`);

        expect(response.statusCode).toBe(403);
    }, 20000);


    test('should allow owner to delete their own course', async () => {
        const response = await request(app)
            .delete(`/api/courses/${courseId}`)
            .set('Authorization', `Bearer ${instructorToken}`);

        expect(response.statusCode).toBe(200);
    }, 20000);

});


afterAll(async () => {
    await mongoose.connection.close();
});