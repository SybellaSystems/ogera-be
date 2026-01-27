"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = __importDefault(require("./logger"));
const errorHandler = (err, req, res, next) => {
    var _a, _b;
    const requestId = req.requestId || 'unknown';
    const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.userId) || undefined;
    // Determine status code from error or response
    const statusCode = err.statusCode ||
        err.status ||
        (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
    // Log error with full context
    logger_1.default.error('Error Handler', {
        type: 'ERROR_HANDLER',
        requestId,
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode,
        userId,
        error: Object.assign({ name: err.name, message: err.message, stack: err.stack }, err.details && { details: err.details }),
        request: {
            query: req.query,
            body: req.body,
            params: req.params,
            ip: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent'],
        },
        timestamp: new Date().toISOString(),
    });
    // Send error response
    res.status(statusCode).json(Object.assign({ status: "error", message: err.message || "Internal Server Error" }, (process.env.NODE_ENV !== 'production' && {
        stack: err.stack,
        requestId,
    })));
};
exports.errorHandler = errorHandler;
