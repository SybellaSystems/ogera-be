import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { AppError } from '../middlewares/errorHandler.js';
import fs from 'fs/promises';

dotenv.config();

// Validate required environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Check if all required env vars are present
if (!cloudName || !apiKey || !apiSecret) {
  throw new AppError('Missing required Cloudinary environment variables', 500, true);
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName as string,
  api_key: apiKey as string,
  api_secret: apiSecret as string,
  secure: true,
  timeout: 120000 // 2 minutes for better reliability
});

// Upload options interface
export interface CloudinaryUploadOptions {
  folder?: string;
  public_id?: string;
  transformation?: any[];
  tags?: string[];
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  chunk_size?: number;
  timeout?: number;
}

// Upload response interface
export interface CloudinaryUploadResult {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  access_mode: string;
  original_filename: string;
  [key: string]: any;
}

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2
};

// Calculate delay with exponential backoff and jitter
const calculateDelay = (attempt: number, config: RetryConfig): number => {
  const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelay);
  // Add jitter
  const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);
  return Math.max(cappedDelay + jitter, config.baseDelay);
};

// Sleep utility
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// Check if error is retryable
const isRetryableError = (error: any): boolean => {
  if (!error) return false;
  
  const retryableErrors = [
    'TimeoutError',
    'ETIMEDOUT',
    'ECONNRESET',
    'ECONNREFUSED',
    'ENOTFOUND',
    'EAI_AGAIN'
  ];
  
  const retryableHttpCodes = [408, 429, 499, 500, 502, 503, 504];
  
  return (
    retryableErrors.some(errType => error.name === errType || error.code === errType) ||
    retryableHttpCodes.includes(error.http_code) ||
    (error.message && error.message.toLowerCase().includes('timeout')) ||
    (error.message && error.message.toLowerCase().includes('network'))
  );
};

// Enhanced upload function with retry logic and better error handling
export const uploadToCloudinary = async (
  filePath: string,
  options: CloudinaryUploadOptions = {},
  retryConfig: Partial<RetryConfig> = {}
): Promise<CloudinaryUploadResult> => {
  const config = { ...defaultRetryConfig, ...retryConfig };
  
  const defaultOptions: CloudinaryUploadOptions = {
    resource_type: 'auto',
    folder: 'ogera-uploads',
    timeout: 120000, // 2 minutes timeout
    chunk_size: 6000000, // 6MB chunks for large files
    ...options
  };

  let lastError: any;
  
  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      console.log(`Cloudinary upload attempt ${attempt}/${config.maxRetries} for file: ${filePath}`);
      
      // Check if file exists before attempting upload
      try {
        await fs.access(filePath);
      } catch (fileError) {
        throw new AppError(`File not found: ${filePath}`, 404, true);
      }
      
      const result = await cloudinary.uploader.upload(filePath, defaultOptions);
      
      console.log(`Upload successful on attempt ${attempt}:`, {
        public_id: result.public_id,
        secure_url: result.secure_url,
        bytes: result.bytes
      });
      
      return result;
      
    } catch (error: any) {
      lastError = error;
      console.error(`Upload attempt ${attempt} failed:`, {
        error: error.message,
        name: error.name,
        code: error.code,
        http_code: error.http_code
      });
      
      // If it's the last attempt or error is not retryable, throw immediately
      if (attempt === config.maxRetries || !isRetryableError(error)) {
        break;
      }
      
      // Calculate delay and wait before retrying
      const delay = calculateDelay(attempt, config);
      console.log(`Waiting ${Math.round(delay)}ms before retry...`);
      await sleep(delay);
    }
  }
  
  // All retries exhausted
  console.error('All upload attempts failed. Last error:', lastError);
  throw new AppError(
    `Failed to upload to Cloudinary after ${config.maxRetries} attempts: ${lastError?.message || 'Unknown error'}`,
    500,
    true
  );
};

// Upload from buffer with retry logic
export const uploadBufferToCloudinary = async (
  buffer: Buffer,
  originalname: string,
  options: CloudinaryUploadOptions = {},
  retryConfig: Partial<RetryConfig> = {}
): Promise<CloudinaryUploadResult> => {
  const config = { ...defaultRetryConfig, ...retryConfig };
  
  const defaultOptions: CloudinaryUploadOptions = {
    resource_type: 'auto',
    folder: 'ogera-uploads',
    timeout: 120000,
    ...options
  };

  let lastError: any;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      console.log(`Cloudinary buffer upload attempt ${attempt}/${config.maxRetries} for: ${originalname}`);
      
      const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          defaultOptions,
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result as CloudinaryUploadResult);
            }
          }
        );
        
        uploadStream.end(buffer);
      });
      
      console.log(`Buffer upload successful on attempt ${attempt}:`, {
        public_id: result.public_id,
        secure_url: result.secure_url,
        bytes: result.bytes
      });
      
      return result;
      
    } catch (error: any) {
      lastError = error;
      console.error(`Buffer upload attempt ${attempt} failed:`, {
        error: error.message,
        name: error.name,
        code: error.code
      });
      
      if (attempt === config.maxRetries || !isRetryableError(error)) {
        break;
      }
      
      const delay = calculateDelay(attempt, config);
      console.log(`Waiting ${Math.round(delay)}ms before retry...`);
      await sleep(delay);
    }
  }
  
  throw new AppError(
    `Failed to upload buffer to Cloudinary after ${config.maxRetries} attempts: ${lastError?.message || 'Unknown error'}`,
    500,
    true
  );
};

// Delete from Cloudinary with retry logic
export const deleteFromCloudinary = async (
  publicId: string,
  retryConfig: Partial<RetryConfig> = {}
): Promise<void> => {
  const config = { ...defaultRetryConfig, ...retryConfig };
  let lastError: any;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      if (result.result !== 'ok' && result.result !== 'not found') {
        throw new AppError(`Failed to delete: ${result.result}`, 500, true);
      }
      return;
      
    } catch (error: any) {
      lastError = error;
      
      if (attempt === config.maxRetries || !isRetryableError(error)) {
        break;
      }
      
      const delay = calculateDelay(attempt, config);
      await sleep(delay);
    }
  }
  
  throw new AppError(
    `Failed to delete from Cloudinary after ${config.maxRetries} attempts: ${lastError?.message || 'Unknown error'}`,
    500,
    true
  );
};

// Get optimized URL with transformations
export const getOptimizedUrl = (
  publicId: string,
  transformations: any[] = []
): string => {
  return cloudinary.url(publicId, {
    transformation: [
      { quality: 'auto', fetch_format: 'auto' },
      ...transformations
    ]
  });
};

// Health check function
export const testCloudinaryConnection = async (): Promise<boolean> => {
  try {
    await cloudinary.api.ping();
    return true;
  } catch (error) {
    console.error('Cloudinary connection test failed:', error);
    return false;
  }
};

export default cloudinary;