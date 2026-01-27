"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginLimiter = exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// General API limiter
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per window
    standardHeaders: true, // RateLimit-* headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
    message: {
        status: 429,
        message: "Too many requests, please try again later.",
    },
});
// Stricter limiter for login route
exports.loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // only 5 attempts allowed
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        message: "Too many login attempts, please try again later.",
    },
});
