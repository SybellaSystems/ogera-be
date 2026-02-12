"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.getFileUrl = exports.saveFile = exports.getLocalFile = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const config_1 = require("../config");
const logger_1 = __importDefault(require("./logger"));
const s3Client = config_1.STORAGE_CONFIG.s3.accessKeyId && config_1.STORAGE_CONFIG.s3.secretAccessKey
    ? new client_s3_1.S3Client({
        region: config_1.STORAGE_CONFIG.s3.region,
        credentials: {
            accessKeyId: config_1.STORAGE_CONFIG.s3.accessKeyId,
            secretAccessKey: config_1.STORAGE_CONFIG.s3.secretAccessKey,
        },
    })
    : null;
/**
 * Ensure local storage directory exists
 */
const ensureLocalStorageDir = () => {
    const absPath = path.resolve(config_1.STORAGE_CONFIG.localStoragePath);
    if (!fs.existsSync(absPath)) {
        fs.mkdirSync(absPath, { recursive: true });
        logger_1.default.info(`Created local storage directory: ${absPath}`);
    }
};
/**
 * Save file to local storage
 */
const saveToLocalStorage = (file_1, ...args_1) => __awaiter(void 0, [file_1, ...args_1], void 0, function* (file, folder = 'academic-proofs') {
    ensureLocalStorageDir();
    const absDirPath = path.resolve(config_1.STORAGE_CONFIG.localStoragePath);
    const folderPath = path.join(absDirPath, folder);
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.resolve(folderPath, fileName);
    fs.writeFileSync(filePath, file.buffer);
    logger_1.default.info(`File saved to local storage: ${filePath}`);
    return {
        path: filePath,
        storageType: 'local',
    };
});
/**
 * Save file to S3
 */
const saveToS3 = (file_1, ...args_1) => __awaiter(void 0, [file_1, ...args_1], void 0, function* (file, folder = 'academic-proofs') {
    if (!s3Client) {
        throw new Error('S3 client is not configured. Please check your AWS credentials.');
    }
    if (!config_1.STORAGE_CONFIG.s3.bucketName) {
        throw new Error('S3 bucket name is not configured.');
    }
    const fileName = `${Date.now()}-${file.originalname}`;
    const key = `${folder}/${fileName}`;
    const command = new client_s3_1.PutObjectCommand({
        Bucket: config_1.STORAGE_CONFIG.s3.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
    });
    yield s3Client.send(command);
    logger_1.default.info(`File saved to S3: ${key}`);
    return {
        path: key,
        storageType: 's3',
    };
});
/**
 * Get file URL from S3
 */
const getS3FileUrl = (key) => __awaiter(void 0, void 0, void 0, function* () {
    if (!s3Client || !config_1.STORAGE_CONFIG.s3.bucketName) {
        throw new Error('S3 is not configured.');
    }
    const command = new client_s3_1.GetObjectCommand({
        Bucket: config_1.STORAGE_CONFIG.s3.bucketName,
        Key: key,
    });
    // Generate a presigned URL that expires in 1 hour
    const url = yield (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, { expiresIn: 3600 });
    return url;
});
/**
 * Resolve file path - converts relative to absolute if needed
 */
const resolveFilePath = (filePath) => {
    const isAbsolute = path.isAbsolute(filePath);
    console.log(`[STORAGE] resolveFilePath input: ${filePath}, isAbsolute: ${isAbsolute}`);
    if (isAbsolute) {
        console.log(`[STORAGE] Path is already absolute, returning as-is`);
        return filePath;
    }
    // If relative, resolve against project root
    const resolved = path.resolve(process.cwd(), filePath);
    console.log(`[STORAGE] Resolved relative path. CWD: ${process.cwd()}, Result: ${resolved}`);
    return resolved;
};
/**
 * Get file from local storage
 */
const getLocalFile = (filePath) => {
    const resolvedPath = resolveFilePath(filePath);
    console.log(`[STORAGE] getLocalFile: checking ${resolvedPath}`);
    const exists = fs.existsSync(resolvedPath);
    console.log(`[STORAGE] File exists at ${resolvedPath}: ${exists}`);
    if (!exists) {
        logger_1.default.warn(`File not found at: ${resolvedPath} (original: ${filePath})`);
        console.error(`[STORAGE] ERROR: File does not exist at ${resolvedPath}`);
        return null;
    }
    try {
        const buffer = fs.readFileSync(resolvedPath);
        console.log(`[STORAGE] Successfully read file. Size: ${buffer.length} bytes`);
        return buffer;
    }
    catch (err) {
        console.error(`[STORAGE] Error reading file: ${err.message}`);
        logger_1.default.error(`Error reading file at ${resolvedPath}: ${err.message}`);
        return null;
    }
};
exports.getLocalFile = getLocalFile;
/**
 * Main function to save file based on storage configuration
 */
const saveFile = (file_1, ...args_1) => __awaiter(void 0, [file_1, ...args_1], void 0, function* (file, folder = 'academic-proofs') {
    if (config_1.STORAGE_CONFIG.useLocalStorage) {
        return yield saveToLocalStorage(file, folder);
    }
    else {
        return yield saveToS3(file, folder);
    }
});
exports.saveFile = saveFile;
/**
 * Get file URL or path based on storage type
 */
const getFileUrl = (filePath, storageType) => __awaiter(void 0, void 0, void 0, function* () {
    if (storageType === 's3') {
        return yield getS3FileUrl(filePath);
    }
    else {
        // For local storage, return the relative path or construct a URL
        return filePath;
    }
});
exports.getFileUrl = getFileUrl;
/**
 * Delete file from storage
 */
const deleteFile = (filePath, storageType) => __awaiter(void 0, void 0, void 0, function* () {
    if (storageType === 's3') {
        if (!s3Client || !config_1.STORAGE_CONFIG.s3.bucketName) {
            throw new Error('S3 is not configured.');
        }
        // S3 delete implementation can be added if needed
        logger_1.default.info(`File deletion from S3 requested: ${filePath}`);
    }
    else {
        const resolvedPath = resolveFilePath(filePath);
        if (fs.existsSync(resolvedPath)) {
            fs.unlinkSync(resolvedPath);
            logger_1.default.info(`File deleted from local storage: ${resolvedPath}`);
        }
    }
});
exports.deleteFile = deleteFile;
