"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jwt_service_1 = require("../middlewares/jwt.service");
const custom_error_1 = require("../utils/custom-error");
const authMiddleware = (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new custom_error_1.CustomError("Access denied. No token provided", 401);
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = (0, jwt_service_1.verifyAccessToken)(token);
        if (!decoded.user_id || !decoded.role) {
            throw new custom_error_1.CustomError("Invalid token payload", 401);
        }
        req.user = {
            user_id: decoded.user_id,
            role: decoded.role,
        };
        next();
    }
    catch (err) {
        throw new custom_error_1.CustomError("Invalid or expired access token", 401);
    }
};
exports.authMiddleware = authMiddleware;
