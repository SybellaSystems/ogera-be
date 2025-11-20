import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@/middlewares/jwt.service";
import { CustomError } from "@/utils/custom-error";

declare global {
  namespace Express {
    interface Request {
      user?: { user_id: string; role: string };
    }
  }
}

export const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new CustomError("Access denied. No token provided", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyAccessToken(token);

    if (!decoded.user_id || !decoded.role) {
      throw new CustomError("Invalid token payload", 401);
    }

    req.user = {
      user_id: decoded.user_id as string,
      role: decoded.role as string,
    };

    next();
  } catch (err) {
    throw new CustomError("Invalid or expired access token", 401);
  }
};
