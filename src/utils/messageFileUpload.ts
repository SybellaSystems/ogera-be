import multer, { StorageEngine, FileFilterCallback } from 'multer';
import path from 'path';
import { Request } from 'express';

// File upload constraints
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed',
];

const ALLOWED_EXTENSIONS = [
    '.pdf',
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.txt',
    '.zip',
];

// Configure storage
const storage: StorageEngine = multer.diskStorage({
    destination: (
        _req: Request,
        _file: Express.Multer.File,
        cb: (error: Error | null, destination: string) => void,
    ) => {
        cb(null, 'uploads/messages/');
    },
    filename: (
        _req: Request,
        file: Express.Multer.File,
        cb: (error: Error | null, filename: string) => void,
    ) => {
        // Generate unique filename: timestamp-uuid.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    },
});

// File filter
const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
) => {
    const ext = path.extname(file.originalname).toLowerCase();

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new Error(`Invalid file type: ${file.mimetype}`));
    }

    // Check extension
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return cb(new Error(`Invalid file extension: ${ext}`));
    }

    cb(null, true);
};

// Create multer instance for message file uploads
export const messageFileUpload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1,
    },
});

// Helper function to get file download URL
export const getFileDownloadUrl = (fileName: string): string => {
    return `/api/messages/files/download/${fileName}`;
};

// Helper function to get file preview URL
export const getFilePreviewUrl = (fileName: string): string => {
    return `/api/messages/files/preview/${fileName}`;
};

// Helper function to check if file is image
export const isImageFile = (mimeType: string | undefined): boolean => {
    if (!mimeType) return false;
    return mimeType.startsWith('image/');
};

// Helper function to check if file is PDF
export const isPdfFile = (mimeType: string | undefined): boolean => {
    return mimeType === 'application/pdf';
};

// Helper function to get file type category
export const getFileCategory = (
    mimeType: string | undefined,
): 'image' | 'pdf' | 'document' | 'archive' | 'other' => {
    if (!mimeType) return 'other';

    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (
        mimeType.includes('word') ||
        mimeType.includes('document') ||
        mimeType.includes('text')
    )
        return 'document';
    if (mimeType.includes('zip') || mimeType.includes('compressed'))
        return 'archive';

    return 'other';
};
