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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadCourseContentService = exports.uploadCourseContentService = exports.deleteCourseService = exports.updateCourseService = exports.getCourseByIdService = exports.getAllCoursesService = exports.createCourseService = void 0;
const course_repo_1 = __importDefault(require("./course.repo"));
const custom_error_1 = require("../../utils/custom-error");
const http_status_codes_1 = require("http-status-codes");
const storage_service_1 = require("../../utils/storage.service");
const path = __importStar(require("path"));
const config_1 = require("../../config");
const createCourseService = (courseData) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate required fields
    if (!courseData.course_name) {
        throw new custom_error_1.CustomError('Course name is required', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    if (!courseData.type) {
        throw new custom_error_1.CustomError('Course type is required', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    if (!courseData.tag) {
        throw new custom_error_1.CustomError('Tag is required', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    const { steps } = courseData, coursePayloadData = __rest(courseData, ["steps"]);
    const coursePayload = Object.assign({}, coursePayloadData);
    const course = yield course_repo_1.default.createCourse(coursePayload);
    // Create steps if provided
    if (steps && Array.isArray(steps) && steps.length > 0) {
        yield course_repo_1.default.createCourseSteps(course.course_id, steps);
    }
    // Return course with steps
    const createdCourse = yield course_repo_1.default.findCourseById(course.course_id);
    if (!createdCourse) {
        throw new custom_error_1.CustomError('Failed to retrieve created course', http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
    }
    return createdCourse;
});
exports.createCourseService = createCourseService;
const getAllCoursesService = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield course_repo_1.default.findAllCourses();
});
exports.getAllCoursesService = getAllCoursesService;
const getCourseByIdService = (course_id) => __awaiter(void 0, void 0, void 0, function* () {
    const course = yield course_repo_1.default.findCourseById(course_id);
    if (!course) {
        throw new custom_error_1.CustomError('Course not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    return course;
});
exports.getCourseByIdService = getCourseByIdService;
const updateCourseService = (course_id, updates) => __awaiter(void 0, void 0, void 0, function* () {
    const course = yield course_repo_1.default.findCourseById(course_id);
    if (!course) {
        throw new custom_error_1.CustomError('Course not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    const { steps } = updates, courseUpdates = __rest(updates, ["steps"]);
    // Update course fields
    if (Object.keys(courseUpdates).length > 0) {
        yield course_repo_1.default.updateCourse(course_id, courseUpdates);
    }
    // Update steps if provided
    if (steps !== undefined) {
        // Delete existing steps
        yield course_repo_1.default.deleteCourseSteps(course_id);
        // Create new steps if provided
        if (Array.isArray(steps) && steps.length > 0) {
            yield course_repo_1.default.createCourseSteps(course_id, steps);
        }
    }
    // Return updated course
    const updatedCourse = yield course_repo_1.default.findCourseById(course_id);
    if (!updatedCourse) {
        throw new custom_error_1.CustomError('Failed to retrieve updated course', http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
    }
    return updatedCourse;
});
exports.updateCourseService = updateCourseService;
const deleteCourseService = (course_id) => __awaiter(void 0, void 0, void 0, function* () {
    const course = yield course_repo_1.default.findCourseById(course_id);
    if (!course) {
        throw new custom_error_1.CustomError('Course not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    yield course_repo_1.default.deleteCourse(course_id);
    return { message: 'Course deleted successfully' };
});
exports.deleteCourseService = deleteCourseService;
const uploadCourseContentService = (file) => __awaiter(void 0, void 0, void 0, function* () {
    if (!file) {
        throw new custom_error_1.CustomError('File is required', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    // Determine folder based on file type
    const isPDF = file.mimetype === 'application/pdf';
    const folder = isPDF ? 'course-content/pdfs' : 'course-content/images';
    // Save file to storage (local or S3 based on .env)
    const { path, storageType } = yield (0, storage_service_1.saveFile)(file, folder);
    // Get file URL
    let fileUrl;
    if (storageType === 's3') {
        fileUrl = yield (0, storage_service_1.getFileUrl)(path, storageType);
    }
    else {
        // For local storage, return the file path
        // The frontend will need to construct the full URL or use a static file server
        fileUrl = path;
    }
    return {
        file_url: fileUrl,
        path,
        storageType,
    };
});
exports.uploadCourseContentService = uploadCourseContentService;
const downloadCourseContentService = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Decode the file path in case it's URL encoded
    const decodedPath = decodeURIComponent(filePath);
    // If it's an HTTP/HTTPS URL (S3), we can't serve it directly
    if (decodedPath.startsWith('http://') ||
        decodedPath.startsWith('https://')) {
        throw new custom_error_1.CustomError('This file is stored in S3. Please use the provided URL to access it.', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    // Get file from local storage
    // Try multiple path variations
    const pathVariations = [decodedPath, filePath];
    // Add variations with storage path prepended if not already there
    if (config_1.STORAGE_CONFIG.localStoragePath) {
        for (const pathVar of [decodedPath, filePath]) {
            if (pathVar &&
                !pathVar.startsWith(config_1.STORAGE_CONFIG.localStoragePath)) {
                // Check if it's a relative path from storage
                const relativePath = pathVar.replace(/^\/+/, ''); // Remove leading slashes
                pathVariations.push(path.join(config_1.STORAGE_CONFIG.localStoragePath, relativePath));
                pathVariations.push(path.join(config_1.STORAGE_CONFIG.localStoragePath, pathVar));
            }
        }
    }
    let fileBuffer = null;
    let finalPath = '';
    for (const pathVar of pathVariations) {
        if (!pathVar)
            continue;
        fileBuffer = (0, storage_service_1.getLocalFile)(pathVar);
        if (fileBuffer) {
            finalPath = pathVar;
            break;
        }
    }
    if (!fileBuffer) {
        throw new custom_error_1.CustomError('Course content file not found on server', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    // Determine content type based on file extension
    const extension = ((_a = finalPath.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || 'pdf';
    let contentType = 'application/pdf';
    switch (extension) {
        case 'jpg':
        case 'jpeg':
            contentType = 'image/jpeg';
            break;
        case 'png':
            contentType = 'image/png';
            break;
        case 'gif':
            contentType = 'image/gif';
            break;
        case 'webp':
            contentType = 'image/webp';
            break;
        case 'pdf':
        default:
            contentType = 'application/pdf';
            break;
    }
    return {
        buffer: fileBuffer,
        contentType,
    };
});
exports.downloadCourseContentService = downloadCourseContentService;
