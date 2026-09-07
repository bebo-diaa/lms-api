import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { getAllUser, register, login, getUserById, getMe } from '../controller/user.controller.js';

import {validatorMiddleware} from '../middleware/validatorMiddleware.js';
import {registerValidation,loginValidation } from '../validators/user.validators.js'
import { allowedTo } from '../middleware/allowedTo.js';
import { userRole } from '../utils/userRole.js';


const userRouter = express.Router();


userRouter.route('/')
    .get(verifyToken, allowedTo(userRole.ADMIN) ,getAllUser)


userRouter.route('/register')
    .post(registerValidation,validatorMiddleware ,register)


userRouter.route('/login')
    .post(loginValidation,validatorMiddleware ,login)

userRouter.route('/me')
    .get(verifyToken, getMe)

userRouter.route('/:userId')
    .get(verifyToken,allowedTo(userRole.ADMIN) ,getUserById)

    
export default userRouter;