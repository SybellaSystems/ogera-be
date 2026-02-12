"use strict";
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SMS_CONFIG = exports.PESAPAL_CONFIG = exports.EMAIL_CONFIG = exports.STORAGE_CONFIG = exports.AWS_S3_BUCKET_NAME = exports.AWS_REGION = exports.AWS_SECRET_ACCESS_KEY = exports.AWS_ACCESS_KEY_ID = exports.USE_LOCAL_STORAGE = exports.DB_DIALECT = exports.DB_HOST = exports.DB_NAME = exports.DB_PASSWORD = exports.DB_USERNAME = exports.DB_PORT = exports.JWT_REFRESH_TOKEN_SECRET = exports.JWT_ACCESS_TOKEN_SECRET = exports.FRONTEND_URL = exports.BASE_URL = exports.NODE_ENV = exports.PORT = void 0;
const dotenv_1 = require("dotenv");
const envFile = `.env`;
(0, dotenv_1.config)({ path: envFile });
_a = process.env, exports.PORT = _a.PORT, exports.NODE_ENV = _a.NODE_ENV, exports.BASE_URL = _a.BASE_URL, exports.FRONTEND_URL = _a.FRONTEND_URL, exports.JWT_ACCESS_TOKEN_SECRET = _a.JWT_ACCESS_TOKEN_SECRET, exports.JWT_REFRESH_TOKEN_SECRET = _a.JWT_REFRESH_TOKEN_SECRET;
_b = process.env, exports.DB_PORT = _b.DB_PORT, exports.DB_USERNAME = _b.DB_USERNAME, exports.DB_PASSWORD = _b.DB_PASSWORD, exports.DB_NAME = _b.DB_NAME, exports.DB_HOST = _b.DB_HOST, exports.DB_DIALECT = _b.DB_DIALECT;
_c = process.env, exports.USE_LOCAL_STORAGE = _c.USE_LOCAL_STORAGE, exports.AWS_ACCESS_KEY_ID = _c.AWS_ACCESS_KEY_ID, exports.AWS_SECRET_ACCESS_KEY = _c.AWS_SECRET_ACCESS_KEY, exports.AWS_REGION = _c.AWS_REGION, exports.AWS_S3_BUCKET_NAME = _c.AWS_S3_BUCKET_NAME;
// Storage configuration
exports.STORAGE_CONFIG = {
    useLocalStorage: exports.USE_LOCAL_STORAGE === 'true',
    localStoragePath: process.env.LOCAL_STORAGE_PATH || './uploads',
    s3: {
        accessKeyId: exports.AWS_ACCESS_KEY_ID,
        secretAccessKey: exports.AWS_SECRET_ACCESS_KEY,
        region: exports.AWS_REGION || 'us-east-1',
        bucketName: exports.AWS_S3_BUCKET_NAME,
    },
};
// SMTP/Email configuration
exports.EMAIL_CONFIG = {
    // SMTP Configuration
    smtp: {
        host: process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true' || process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER || process.env.EMAIL_USER || '',
            pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || '',
        },
        // Optional: Service name (gmail, outlook, etc.) - if provided, nodemailer will use default settings
        service: process.env.SMTP_SERVICE || process.env.EMAIL_SERVICE || undefined,
    },
    // Email sender information
    from: {
        name: process.env.EMAIL_FROM_NAME || 'Ogera Support',
        email: process.env.EMAIL_FROM || process.env.EMAIL_USER || '',
    },
    // Frontend URL for email links
    frontendUrl: exports.FRONTEND_URL || 'http://localhost:5173',
};
// Pesapal Payment Configuration
exports.PESAPAL_CONFIG = {
    consumerKey: process.env.PESAPAL_CONSUMER_KEY || '',
    consumerSecret: process.env.PESAPAL_CONSUMER_SECRET || '',
    isSandbox: process.env.PESAPAL_SANDBOX !== 'false', // Default to sandbox for safety
    baseUrl: process.env.BASE_URL || 'http://localhost:5000',
};
// SMS Configuration
exports.SMS_CONFIG = {
    provider: (process.env.SMS_PROVIDER || 'console'),
    twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID || '',
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        fromNumber: process.env.TWILIO_FROM_NUMBER || '',
    },
};
