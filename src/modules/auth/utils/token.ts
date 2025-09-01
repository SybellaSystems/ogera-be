import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { AppError } from '../../../middlewares/errorHandler';
import { JWTInterface } from '../types/auth.types.js';
dotenv.config();


const jwt_secret = process.env.JWT_SECRET;
if (!jwt_secret) {
    throw new AppError('JWT secret is not available in environment.', 400, true, 'JWT_NOT_FOUND')
}

export const createJWT = (userObj: JWTInterface) => {
    return jwt.sign(
        { userID: userObj.user_id, role: userObj.role },
        jwt_secret,
        { expiresIn: '1h' }
    );
}