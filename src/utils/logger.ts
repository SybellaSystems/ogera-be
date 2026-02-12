import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';

// Folder paths for logs
const logDir = path.join(__dirname, '../logs');

const logFormatter = winston.format.printf(info => {
    const { timestamp, level, stack, message } = info;
    const errorMessage = stack || message;

    const symbols = Object.getOwnPropertySymbols(info);
    if (info[symbols[0]] !== 'error') {
        return `[${timestamp}] - ${level}: ${message}`;
    }

    return `[${timestamp}] ${level}: ${errorMessage}`;
});

// Daily Rotate File for debug logs
const debugTransport = new winston.transports.DailyRotateFile({
    filename: `${logDir}/debug/debug-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    level: 'debug',
    maxFiles: '14d', // Keep logs for 14 days
});

// Daily Rotate File for error logs
const errorTransport = new winston.transports.DailyRotateFile({
    filename: `${logDir}/error/error-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxFiles: '30d', // Keep error logs for 30 days
});

// Daily Rotate File for API request/response logs
const apiTransport = new winston.transports.DailyRotateFile({
    filename: `${logDir}/api/api-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    level: 'info',
    maxFiles: '30d', // Keep API logs for 30 days
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
    ),
});

// Console transport for development
const consoleTransport = new winston.transports.Console({
    format: winston.format.combine(winston.format.colorize(), logFormatter),
});

// Winston Logger Configuration
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        }),
    ),
    transports: [consoleTransport, debugTransport, errorTransport, apiTransport],
});

// Extended logger interface for API logging
interface ApiLogger extends winston.Logger {
    logApiRequest: (data: {
        requestId?: string;
        method: string;
        url: string;
        path?: string;
        ip: string;
        userAgent?: string;
        query?: any;
        body?: any;
        headers?: any;
        userId?: string | number;
        timestamp?: string;
    }) => void;
    logApiResponse: (data: {
        requestId?: string;
        method: string;
        url: string;
        statusCode: number;
        duration: string | number;
        durationMs?: number;
        responseSize?: number;
        ip: string;
        userId?: string | number;
        timestamp?: string;
    }) => void;
    logApiError: (data: {
        method: string;
        url: string;
        error: Error;
        statusCode: number;
        duration: number;
        ip: string;
        userId?: string | number;
        stack?: string;
    }) => void;
}

// Helper method for structured API logging
(logger as ApiLogger).logApiRequest = (data: {
    requestId?: string;
    method: string;
    url: string;
    path?: string;
    ip: string;
    userAgent?: string;
    query?: any;
    body?: any;
    headers?: any;
    userId?: string | number;
    timestamp?: string;
}) => {
    logger.info('API Request', {
        type: 'REQUEST',
        ...data,
    });
};

(logger as ApiLogger).logApiResponse = (data: {
    requestId?: string;
    method: string;
    url: string;
    statusCode: number;
    duration: string | number;
    durationMs?: number;
    responseSize?: number;
    ip: string;
    userId?: string | number;
    timestamp?: string;
}) => {
    const logLevel = data.statusCode >= 500 ? 'error' : data.statusCode >= 400 ? 'warn' : 'info';
    logger[logLevel]('API Response', {
        type: 'RESPONSE',
        ...data,
    });
};

(logger as ApiLogger).logApiError = (data: {
    method: string;
    url: string;
    error: Error;
    statusCode: number;
    duration: number;
    ip: string;
    userId?: string | number;
    stack?: string;
}) => {
    logger.error('API Error', {
        type: 'ERROR',
        method: data.method,
        url: data.url,
        statusCode: data.statusCode,
        duration: data.duration,
        ip: data.ip,
        userId: data.userId,
        error: {
            name: data.error.name,
            message: data.error.message,
            stack: data.stack || data.error.stack,
        },
    });
};

export default logger as ApiLogger;
