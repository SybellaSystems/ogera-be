import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { AppError } from '../middlewares/errorHandler.js';
import fs from 'fs/promises';

// Load environment variables
dotenv.config();

// Validate required environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Check if all required env vars are present
if (!cloudName || !apiKey || !apiSecret) {
  throw new AppError('Missing required Cloudinary environment variables', 400, true);
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName as string,
  api_key: apiKey as string,
  api_secret: apiSecret as string,
  secure: true,
  timeout: 60000 // upload request aborts to early, added this to prolong it
});

// Upload options interface
export interface CloudinaryUploadOptions {
  folder?: string;
  public_id?: string;
  transformation?: any[];
  tags?: string[];
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
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

// Enhanced upload function that works with multer files
export const uploadToCloudinary = async (
  filePath: string,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> => {
  try {
    const defaultOptions: CloudinaryUploadOptions = {
      resource_type: 'auto',
      folder: 'ogera-uploads', // Changed to a more specific folder
      ...options
    };

    const result = await cloudinary.uploader.upload(filePath, defaultOptions);
    return result;
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    throw new AppError(`Failed to upload to Cloudinary: ${error.message}`);
  }
};

// Upload from buffer (alternative approach)
export const uploadBufferToCloudinary = async (
  buffer: Buffer,
  originalname: string,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> => {
  try {
    const defaultOptions: CloudinaryUploadOptions = {
      resource_type: 'auto',
      folder: 'ogera-uploads',
      ...options
    };

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        defaultOptions,
        (error, result) => {
          if (error) reject(error);
          else resolve(result as CloudinaryUploadResult);
        }
      );
      
      uploadStream.end(buffer);
    });
  } catch (error: any) {
    console.error('Cloudinary buffer upload error:', error);
    throw new AppError(`Failed to upload buffer to Cloudinary: ${error.message}`);
  }
};

// Delete from Cloudinary
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result !== 'ok') {
      throw new AppError(`Failed to delete: ${result.result}`);
    }
  } catch (error: any) {
    console.error('Cloudinary delete error:', error);
    throw new AppError(`Failed to delete from Cloudinary: ${error.message}`);
  }
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

export default cloudinary;