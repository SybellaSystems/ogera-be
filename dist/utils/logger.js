"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
require("winston-daily-rotate-file");
const path_1 = __importDefault(require("path"));
// Folder paths for logs
const logDir = path_1.default.join(__dirname, '../logs');
const logFormatter = winston_1.default.format.printf(info => {
    const { timestamp, level, stack, message } = info;
    const errorMessage = stack || message;
    const symbols = Object.getOwnPropertySymbols(info);
    if (info[symbols[0]] !== 'error') {
        return `[${timestamp}] - ${level}: ${message}`;
    }
    return `[${timestamp}] ${level}: ${errorMessage}`;
});
// Daily Rotate File for debug logs
const debugTransport = new winston_1.default.transports.DailyRotateFile({
    filename: `${logDir}/debug/debug-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    level: 'debug',
    maxFiles: '14d', // Keep logs for 14 days
});
// Daily Rotate File for error logs
const errorTransport = new winston_1.default.transports.DailyRotateFile({
    filename: `${logDir}/error/error-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxFiles: '30d', // Keep error logs for 30 days
});
// Daily Rotate File for API request/response logs
const apiTransport = new winston_1.default.transports.DailyRotateFile({
    filename: `${logDir}/api/api-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    level: 'info',
    maxFiles: '30d', // Keep API logs for 30 days
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
});
// Console transport for development
const consoleTransport = new winston_1.default.transports.Console({
    format: winston_1.default.format.combine(winston_1.default.format.colorize(), logFormatter),
});
// Winston Logger Configuration
const logger = winston_1.default.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.printf(({ timestamp, level, message }) => {
        return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })),
    transports: [consoleTransport, debugTransport, errorTransport, apiTransport],
});
// Helper method for structured API logging
logger.logApiRequest = (data) => {
    logger.info('API Request', Object.assign({ type: 'REQUEST' }, data));
};
logger.logApiResponse = (data) => {
    const logLevel = data.statusCode >= 500 ? 'error' : data.statusCode >= 400 ? 'warn' : 'info';
    logger[logLevel]('API Response', Object.assign({ type: 'RESPONSE' }, data));
};
logger.logApiError = (data) => {
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
exports.default = logger;
