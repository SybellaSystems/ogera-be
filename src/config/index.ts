import { config } from 'dotenv';

const envFile = `.env`;
config({ path: envFile });

export const {
    PORT,
    NODE_ENV,
    BASE_URL,
    FRONTEND_URL,
    JWT_ACCESS_TOKEN_SECRET,
    JWT_REFRESH_TOKEN_SECRET,
} = process.env;

export const {
    DB_PORT,
    DB_USERNAME,
    DB_PASSWORD,
    DB_NAME,
    DB_HOST,
    DB_DIALECT,
} = process.env;

export const {
    USE_LOCAL_STORAGE,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_REGION,
    AWS_S3_BUCKET_NAME,
} = process.env;

// Storage configuration
export const STORAGE_CONFIG = {
    useLocalStorage: USE_LOCAL_STORAGE === 'true',
    localStoragePath: process.env.LOCAL_STORAGE_PATH || './uploads',
    s3: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
        region: AWS_REGION || 'us-east-1',
        bucketName: AWS_S3_BUCKET_NAME,
    },
};

// SMTP/Email configuration
export const EMAIL_CONFIG = {
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
    frontendUrl: FRONTEND_URL || 'http://localhost:5173',
};

// Pesapal Payment Configuration
export const PESAPAL_CONFIG = {
    consumerKey: process.env.PESAPAL_CONSUMER_KEY || '',
    consumerSecret: process.env.PESAPAL_CONSUMER_SECRET || '',
    isSandbox: process.env.PESAPAL_SANDBOX !== 'false', // Default to sandbox for safety
    baseUrl: process.env.BASE_URL || 'http://localhost:5000',
};

// MTN MoMo API Configuration (Ogera_Get_Paid / Collection)
export const MOMO_CONFIG = {
    baseUrl: process.env.MOMO_BASE_URL || 'https://sandbox.momodeveloper.mtn.com',
    subscriptionKey: process.env.MOMO_SUBSCRIPTION_KEY || '',
    apiUserId: process.env.MOMO_USER_ID || '',
    apiKey: process.env.MOMO_API_KEY || '',
    targetEnvironment: process.env.MOMO_TARGET_ENV || 'sandbox',
    // Service fee for job funding: percentage (e.g. 5 = 5%) or 0
    serviceFeePercent: parseFloat(process.env.MOMO_SERVICE_FEE_PERCENT || '0'),
    currency: process.env.MOMO_CURRENCY || 'EUR',
};

// SMS Configuration
export const SMS_CONFIG = {
    provider: (process.env.SMS_PROVIDER || 'console') as 'twilio' | 'console' | 'none',
    twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID || '',
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        fromNumber: process.env.TWILIO_FROM_NUMBER || '',
    },
};