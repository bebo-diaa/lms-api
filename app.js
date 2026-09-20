import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRouter from './route/user.route.js';
import { httpStatusText } from "./utils/httpStatusText.js";
import courseRouter from './route/course.route.js';
import fs from 'node:fs';
import reviewRouter from './route/review.route.js';
dotenv.config();
const url = process.env.MONGOE_URL;

const main = async () => {

    await mongoose.connect(url).then(() => {
        console.log("Database connected successfuly");
    })

}

main();

const app = express();
app.use(express.json());

app.use('/api/users', userRouter);
app.use('/api/courses', courseRouter);
app.use('/api/reviews', reviewRouter);

app.use((error, req, res, next) => {
    
    const logMessage = `${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${error.statusCode || 500} - ${error.message}\n`;
    fs.appendFileSync('error.log', logMessage);
    
    res.status(error.statusCode || 500).json({ status: error.statusText || httpStatusText.ERROR, message: error.message });
})

export default app;