import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWT_ACCESS_TOKEN_SECRET } from '@/config';
import { CustomError } from '@/utils/custom-error';

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; role: string };
    }
  }
}

export const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new CustomError('Access denied. No token provided', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(
      token!,
      JWT_ACCESS_TOKEN_SECRET as string,
    ) as JwtPayload;

    if (!decoded.user_id || !decoded.role) {
      throw new CustomError('Invalid token payload', 401);
    }

    // ✅ attach user to request in camelCase
    req.user = {
      userId: decoded.user_id as string,
      role: decoded.role as string,
    };

    next();
  } catch (err) {
    throw new CustomError('Invalid or expired token', 401);
  }
};
