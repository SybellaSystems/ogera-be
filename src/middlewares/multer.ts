import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import path from 'path';
import fs from 'fs';
import { fileTypeFromFile } from 'file-type';

// Supported file types
const ALLOWED_IMAGE_TYPES = ['.jpg', '.jpeg', '.png'] as const;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const UPLOAD_DIR = './uploads/';

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Custom error messages
export enum UploadError {
  INVALID_FILE_TYPE = 'File type not supported. Allowed types: jpg, jpeg, png',
  FILE_TOO_LARGE = 'File too large. Maximum size is 5MB',
  NO_FILE = 'No file provided',
  UPLOAD_FAILED = 'File upload failed',
  FILE_SIGNATURE_INVALID = 'File signature does not match the file extension'
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

const isJpeg = (ext: string) => ['.jpg', '.jpeg'].includes(ext);

// Function to validate file signature using magic numbers
const validateFileSignature = async (filePath: string, expectedExt: string): Promise<boolean> => {
  try {
    const fileType = await fileTypeFromFile(filePath);
    
    if (!fileType) {
      return false; // Could not determine file type
    }

    const detectedExt = `.${fileType.ext}`;
    const detectedMime = fileType.mime;

    // Map file extensions to expected MIME types
    const expectedMimeTypes: Record<string, string[]> = {
      '.jpg': ['image/jpeg'],
      '.jpeg': ['image/jpeg'],
      '.png': ['image/png'],
    };

    // Check if detected extension and MIME type match expected ones
    const allowedMimes = expectedMimeTypes[expectedExt.toLowerCase()];
    if (!allowedMimes) return false;

    // Special handling: jpg/jpeg are equivalent
    if (isJpeg(expectedExt) && isJpeg(detectedExt)) {
      return allowedMimes.includes(detectedMime);
    }

    return allowedMimes.includes(detectedMime) && detectedExt === expectedExt.toLowerCase();
  } catch (error) {
    console.error('Error validating file signature:', error);
    return false;
  }
};

// Enhanced file filter with signature validation
const fileFilter = async (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): Promise<void> => {
  try {
    // Check file extension first
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (!ALLOWED_IMAGE_TYPES.includes(ext as typeof ALLOWED_IMAGE_TYPES[number])) {
      return cb(new Error(UploadError.INVALID_FILE_TYPE));
    }

    // Store file info for later signature validation
    (req as any).pendingFileValidation = { ext };

    // Allow the file to be uploaded temporarily for signature validation
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

// Middleware to validate file signature after upload
export const validateUploadedFileSignature = async (req: Request, res: any, next: any): Promise<void> => {
  if (!req.file) {
    return next();
  }

  try {
    const pendingValidation = (req as any).pendingFileValidation;
    
    if (!pendingValidation) {
      cleanupFile(req.file.path);
      return res.status(400).json({ error: UploadError.UPLOAD_FAILED });
    }

    // Validate the actual file signature
    const isValid = await validateFileSignature(req.file.path, pendingValidation.ext);
    
    if (!isValid) {
      cleanupFile(req.file.path);
      return res.status(400).json({ error: UploadError.FILE_SIGNATURE_INVALID });
    }

    // Remove temporary validation data
    delete (req as any).pendingFileValidation;
    next();
  } catch (error) {
    cleanupFile(req.file.path);
    res.status(500).json({ error: UploadError.UPLOAD_FAILED });
  }
};

// Export different upload types
export const uploadSingle = (fieldName: string = 'file') => [
  upload.single(fieldName),
  validateUploadedFileSignature
];

export const uploadMultiple = (fieldName: string = 'images', maxCount: number = 5) => [
  upload.array(fieldName, maxCount),
  async (req: Request, res: any, next: any) => {
    // Implementation for multiple files validation
    next();
  }
];

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