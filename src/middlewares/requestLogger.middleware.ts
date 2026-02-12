import { Request, Response, NextFunction } from 'express';
import logger from '@/utils/logger';

// Fields to mask in logs for security
const SENSITIVE_FIELDS = ['password', 'token', 'accessToken', 'refreshToken', 'secret', 'apiKey', 'authorization'];

/**
 * Recursively masks sensitive fields in an object
 */
const maskSensitiveData = (obj: any): any => {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => maskSensitiveData(item));
    }

    const masked: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const lowerKey = key.toLowerCase();
            if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
                masked[key] = '***MASKED***';
            } else {
                masked[key] = maskSensitiveData(obj[key]);
            }
        }
    }
    return masked;
};

/**
 * Get client IP address
 */
const getClientIp = (req: Request): string => {
    return (
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        (req.headers['x-real-ip'] as string) ||
        req.socket.remoteAddress ||
        'unknown'
    );
};

/**
 * Calculate response size in bytes
 */
const getResponseSize = (res: Response): number => {
    const contentLength = res.get('content-length');
    if (contentLength) {
        return parseInt(contentLength, 10);
    }
    return 0;
};

/**
 * Comprehensive API Request/Response Logging Middleware
 */
export const requestLoggerMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const startTime = Date.now();
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Store request ID for tracking
    (req as any).requestId = requestId;

    // Extract user ID if available (from auth middleware)
    const userId = (req as any).user?.id || (req as any).user?.userId || undefined;

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

    logger.logApiRequest(requestLog);

    // Capture original response methods
    const originalSend = res.send;
    const originalJson = res.json;
    const originalEnd = res.end;

    let responseBody: any = null;

    // Override res.json to capture response body
    res.json = function (body: any) {
        responseBody = body;
        return originalJson.call(this, body);
    };

    // Override res.send to capture response body
    res.send = function (body: any) {
        if (typeof body === 'string') {
            try {
                responseBody = JSON.parse(body);
            } catch {
                responseBody = body;
            }
        } else {
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
            logger.logApiError({
                method: req.method,
                url: req.originalUrl || req.url,
                error: new Error(`Server Error: ${res.statusCode}`),
                statusCode: res.statusCode,
                duration,
                ip: getClientIp(req),
                userId,
            });
        } else {
            logger.logApiResponse(responseLog);
        }

        // Log response body for errors (4xx, 5xx) in development
        if (process.env.NODE_ENV !== 'production' && res.statusCode >= 400 && responseBody) {
            logger.debug('Response Body', {
                requestId,
                statusCode: res.statusCode,
                response: maskSensitiveData(responseBody),
            });
        }
    });

    // Handle errors
    res.on('error', (error: Error) => {
        const duration = Date.now() - startTime;
        logger.logApiError({
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

