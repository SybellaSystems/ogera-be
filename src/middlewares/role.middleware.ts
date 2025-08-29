import { Response, NextFunction } from "express";
import { CustomError } from "@/utils/custom-error";

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: any, _res: Response, next: NextFunction) => {
    if (!req.user) throw new CustomError("Unauthorized", 401);

    if (!allowedRoles.includes(req.user.role)) {
      throw new CustomError("Forbidden: Insufficient role", 403);
    }

    next();
  };
};
