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