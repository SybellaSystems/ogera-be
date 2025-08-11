import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import { AppError } from "./errorHandler.js";
import { JWT_SECRET } from "../config/env.js";
dotenv.config();

declare global {
    namespace Express {
        interface Request {
            user?: { userID: string; role: string };
        }
    }
}

export const authenticationMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new AppError("Access denied. No token provided.", 401, true);
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token!, JWT_SECRET) as JwtPayload;
        req.user = { 
            userID: decoded.userID as string, 
            role: decoded.role as string 
        };
        next();
    } catch (err) {
        throw new AppError("Invalid or expired token.", 401, true);
    }
};
