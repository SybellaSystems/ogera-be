import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';
import { STORAGE_CONFIG } from '@/config';
import logger from './logger';

const s3Client =
    STORAGE_CONFIG.s3.accessKeyId && STORAGE_CONFIG.s3.secretAccessKey
        ? new S3Client({
              region: STORAGE_CONFIG.s3.region,
              credentials: {
                  accessKeyId: STORAGE_CONFIG.s3.accessKeyId,
                  secretAccessKey: STORAGE_CONFIG.s3.secretAccessKey,
              },
          })
        : null;

/**
 * Ensure local storage directory exists
 */
const ensureLocalStorageDir = (): void => {
    if (!fs.existsSync(STORAGE_CONFIG.localStoragePath)) {
        fs.mkdirSync(STORAGE_CONFIG.localStoragePath, { recursive: true });
        logger.info(
            `Created local storage directory: ${STORAGE_CONFIG.localStoragePath}`,
        );
    }
};

/**
 * Save file to local storage
 */
const saveToLocalStorage = async (
    file: Express.Multer.File,
    folder: string = 'academic-proofs',
): Promise<{ path: string; storageType: string }> => {
    ensureLocalStorageDir();

    const folderPath = path.join(STORAGE_CONFIG.localStoragePath, folder);
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }

    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(folderPath, fileName);

    fs.writeFileSync(filePath, file.buffer);

    logger.info(`File saved to local storage: ${filePath}`);

    return {
        path: filePath,
        storageType: 'local',
    };
};

/**
 * Save file to S3
 */
const saveToS3 = async (
    file: Express.Multer.File,
    folder: string = 'academic-proofs',
): Promise<{ path: string; storageType: string }> => {
    if (!s3Client) {
        throw new Error(
            'S3 client is not configured. Please check your AWS credentials.',
        );
    }

    if (!STORAGE_CONFIG.s3.bucketName) {
        throw new Error('S3 bucket name is not configured.');
    }

    const fileName = `${Date.now()}-${file.originalname}`;
    const key = `${folder}/${fileName}`;

    const command = new PutObjectCommand({
        Bucket: STORAGE_CONFIG.s3.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
    });

    await s3Client.send(command);

    logger.info(`File saved to S3: ${key}`);

    return {
        path: key,
        storageType: 's3',
    };
};

/**
 * Get file URL from S3
 */
const getS3FileUrl = async (key: string): Promise<string> => {
    if (!s3Client || !STORAGE_CONFIG.s3.bucketName) {
        throw new Error('S3 is not configured.');
    }

    const command = new GetObjectCommand({
        Bucket: STORAGE_CONFIG.s3.bucketName,
        Key: key,
    });

    // Generate a presigned URL that expires in 1 hour
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return url;
};

/**
 * Get file from local storage
 */
export const getLocalFile = (filePath: string): Buffer | null => {
    if (!fs.existsSync(filePath)) {
        return null;
    }
    return fs.readFileSync(filePath);
};

/**
 * Main function to save file based on storage configuration
 */
export const saveFile = async (
    file: Express.Multer.File,
    folder: string = 'academic-proofs',
): Promise<{ path: string; storageType: string }> => {
    if (STORAGE_CONFIG.useLocalStorage) {
        return await saveToLocalStorage(file, folder);
    } else {
        return await saveToS3(file, folder);
    }
};

/**
 * Get file URL or path based on storage type
 */
export const getFileUrl = async (
    filePath: string,
    storageType: string,
): Promise<string> => {
    if (storageType === 's3') {
        return await getS3FileUrl(filePath);
    } else {
        // For local storage, return the relative path or construct a URL
        return filePath;
    }
};

/**
 * Delete file from storage
 */
export const deleteFile = async (
    filePath: string,
    storageType: string,
): Promise<void> => {
    if (storageType === 's3') {
        if (!s3Client || !STORAGE_CONFIG.s3.bucketName) {
            throw new Error('S3 is not configured.');
        }
        // S3 delete implementation can be added if needed
        logger.info(`File deletion from S3 requested: ${filePath}`);
    } else {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            logger.info(`File deleted from local storage: ${filePath}`);
        }
    }
};

