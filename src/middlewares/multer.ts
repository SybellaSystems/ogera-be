// utils/multer.ts
import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import path from 'path';
import fs from 'fs';

// Supported file types
const ALLOWED_IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.gif', '.webp'] as const;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const UPLOAD_DIR = './uploads/';

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Custom error messages
export enum UploadError {
  INVALID_FILE_TYPE = 'File type not supported. Allowed types: jpg, jpeg, png, gif, webp',
  FILE_TOO_LARGE = 'File too large. Maximum size is 5MB',
  NO_FILE = 'No file provided',
  UPLOAD_FAILED = 'File upload failed'
}

// Interface for multer file with additional type safety
export interface UploadedFile extends Express.Multer.File {
  path: string;
  filename: string;
  mimetype: string;
  size: number;
}

// Type guard to check if file is properly uploaded
export const isValidUploadedFile = (file: Express.Multer.File | undefined): file is UploadedFile => {
  return file !== undefined && 
         file.path !== undefined && 
         file.filename !== undefined &&
         file.mimetype !== undefined &&
         file.size !== undefined;
};

// File filter with validation
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  try {
    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (!ALLOWED_IMAGE_TYPES.includes(ext as typeof ALLOWED_IMAGE_TYPES[number])) {
      return cb(new Error(UploadError.INVALID_FILE_TYPE));
    }

    // Check MIME type as additional security
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error(UploadError.INVALID_FILE_TYPE));
    }

    // File is valid
    cb(null, true);
  } catch (error) {
    cb(new Error(UploadError.UPLOAD_FAILED));
  }
};

// Storage configuration with naming
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Generate unique filename: timestamp-originalname
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  }
});

// Main multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, // Only allow one file at a time
  }
});

// Export different upload types
export const uploadSingle = (fieldName: string = 'image') => upload.single(fieldName);
export const uploadMultiple = (fieldName: string = 'images', maxCount: number = 5) => 
  upload.array(fieldName, maxCount);
export const uploadFields = upload.fields;

// Utility function to clean up uploaded file on error
export const cleanupFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error cleaning up file:', error);
  }
};

// Middleware wrapper with better error handling
export const handleUploadError = (
  error: any,
  req: Request,
  res: any,
  next: any
): void => {
  // Clean up any uploaded files if there was an error
  if (req.file) {
    cleanupFile(req.file.path);
  }
  
  if (req.files) {
    if (Array.isArray(req.files)) {
      req.files.forEach(file => cleanupFile(file.path));
    } else {
      Object.values(req.files).flat().forEach(file => cleanupFile(file.path));
    }
  }

  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({ error: UploadError.FILE_TOO_LARGE });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({ error: 'Too many files uploaded' });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({ error: 'Unexpected field name' });
      default:
        return res.status(400).json({ error: error.message });
    }
  }

  if (error.message && Object.values(UploadError).includes(error.message)) {
    return res.status(400).json({ error: error.message });
  }

  res.status(500).json({ error: 'Upload failed' });
};

export default upload;