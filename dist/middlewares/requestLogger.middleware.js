"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLoggerMiddleware = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
// Fields to mask in logs for security
const SENSITIVE_FIELDS = ['password', 'token', 'accessToken', 'refreshToken', 'secret', 'apiKey', 'authorization'];
/**
 * Recursively masks sensitive fields in an object
 */
const maskSensitiveData = (obj) => {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => maskSensitiveData(item));
    }
    const masked = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const lowerKey = key.toLowerCase();
            if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
                masked[key] = '***MASKED***';
            }
            else {
                masked[key] = maskSensitiveData(obj[key]);
            }
        }
    }
    return masked;
};
/**
 * Get client IP address
 */
const getClientIp = (req) => {
    var _a, _b;
    return (((_b = (_a = req.headers['x-forwarded-for']) === null || _a === void 0 ? void 0 : _a.split(',')[0]) === null || _b === void 0 ? void 0 : _b.trim()) ||
        req.headers['x-real-ip'] ||
        req.socket.remoteAddress ||
        'unknown');
};
/**
 * Calculate response size in bytes
 */
const getResponseSize = (res) => {
    const contentLength = res.get('content-length');
    if (contentLength) {
        return parseInt(contentLength, 10);
    }
    return 0;
};
/**
 * Comprehensive API Request/Response Logging Middleware
 */
const requestLoggerMiddleware = (req, res, next) => {
    var _a, _b;
    const startTime = Date.now();
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    // Store request ID for tracking
    req.requestId = requestId;
    // Extract user ID if available (from auth middleware)
    const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.userId) || undefined;
    // Log incoming request
    const requestLog = {
        requestId,
        method: req.method,
        url: req.originalUrl || req.url,
        path: req.path,
        ip: getClientIp(req),
        userAgent: req.headers['user-agent'],
        query: req.query && Object.keys(req.query).length > 0 ? maskSensitiveData(req.query) : undefined,
        body: req.body && Object.keys(req.body).length > 0 ? maskSensitiveData(req.body) : undefined,
        headers: {
            'content-type': req.headers['content-type'],
            'content-length': req.headers['content-length'],
            'accept': req.headers['accept'],
            'origin': req.headers['origin'],
            'referer': req.headers['referer'],
        },
        userId,
        timestamp: new Date().toISOString(),
    };
    logger_1.default.logApiRequest(requestLog);
    // Capture original response methods
    const originalSend = res.send;
    const originalJson = res.json;
    const originalEnd = res.end;
    let responseBody = null;
    // Override res.json to capture response body
    res.json = function (body) {
        responseBody = body;
        return originalJson.call(this, body);
    };
    // Override res.send to capture response body
    res.send = function (body) {
        if (typeof body === 'string') {
            try {
                responseBody = JSON.parse(body);
            }
            catch (_a) {
                responseBody = body;
            }
        }
        else {
            responseBody = body;
        }
        return originalSend.call(this, body);
    };
    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const responseSize = getResponseSize(res);
        const responseLog = {
            requestId,
            method: req.method,
            url: req.originalUrl || req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            durationMs: duration,
            responseSize,
            ip: getClientIp(req),
            userId,
            timestamp: new Date().toISOString(),
        };
        // Log response based on status code
        if (res.statusCode >= 500) {
            logger_1.default.logApiError({
                method: req.method,
                url: req.originalUrl || req.url,
                error: new Error(`Server Error: ${res.statusCode}`),
                statusCode: res.statusCode,
                duration,
                ip: getClientIp(req),
                userId,
            });
        }
        else {
            logger_1.default.logApiResponse(responseLog);
        }
        // Log response body for errors (4xx, 5xx) in development
        if (process.env.NODE_ENV !== 'production' && res.statusCode >= 400 && responseBody) {
            logger_1.default.debug('Response Body', {
                requestId,
                statusCode: res.statusCode,
                response: maskSensitiveData(responseBody),
            });
        }
    });
    // Handle errors
    res.on('error', (error) => {
        const duration = Date.now() - startTime;
        logger_1.default.logApiError({
            method: req.method,
            url: req.originalUrl || req.url,
            error,
            statusCode: res.statusCode || 500,
            duration,
            ip: getClientIp(req),
            userId,
        });
    });
    next();
};
exports.requestLoggerMiddleware = requestLoggerMiddleware;
