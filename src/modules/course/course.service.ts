import repo from './course.repo';
import { CustomError } from '@/utils/custom-error';
import { StatusCodes } from 'http-status-codes';
import { Messages } from '@/utils/messages';
import { Course } from '@/interfaces/course.interfaces';
import { saveFile, getFileUrl, getLocalFile } from '@/utils/storage.service';
import * as path from 'path';
import { STORAGE_CONFIG } from '@/config';

export const createCourseService = async (
    courseData: Partial<Course> & { steps?: any[] },
) => {
    // Validate required fields
    if (!courseData.course_name) {
        throw new CustomError('Course name is required', StatusCodes.BAD_REQUEST);
    }
    if (!courseData.type) {
        throw new CustomError('Course type is required', StatusCodes.BAD_REQUEST);
    }
    if (!courseData.tag) {
        throw new CustomError('Tag is required', StatusCodes.BAD_REQUEST);
    }

    const { steps, ...coursePayloadData } = courseData;
    
    const coursePayload = {
        ...coursePayloadData,
    };

    const course = await repo.createCourse(coursePayload);

    // Create steps if provided
    if (steps && Array.isArray(steps) && steps.length > 0) {
        await repo.createCourseSteps(course.course_id, steps);
    }

    // Return course with steps
    const createdCourse = await repo.findCourseById(course.course_id);
    if (!createdCourse) {
        throw new CustomError(
            'Failed to retrieve created course',
            StatusCodes.INTERNAL_SERVER_ERROR,
        );
    }

    return createdCourse;
};

export const getAllCoursesService = async () => {
    return await repo.findAllCourses();
};

export const getCourseByIdService = async (course_id: string) => {
    const course = await repo.findCourseById(course_id);
    if (!course) {
        throw new CustomError('Course not found', StatusCodes.NOT_FOUND);
    }
    return course;
};

export const updateCourseService = async (
    course_id: string,
    updates: Partial<Course> & { steps?: any[] },
) => {
    const course = await repo.findCourseById(course_id);
    if (!course) {
        throw new CustomError('Course not found', StatusCodes.NOT_FOUND);
    }

    const { steps, ...courseUpdates } = updates;

    // Update course fields
    if (Object.keys(courseUpdates).length > 0) {
        await repo.updateCourse(course_id, courseUpdates);
    }

    // Update steps if provided
    if (steps !== undefined) {
        // Delete existing steps
        await repo.deleteCourseSteps(course_id);
        
        // Create new steps if provided
        if (Array.isArray(steps) && steps.length > 0) {
            await repo.createCourseSteps(course_id, steps);
        }
    }

    // Return updated course
    const updatedCourse = await repo.findCourseById(course_id);
    if (!updatedCourse) {
        throw new CustomError(
            'Failed to retrieve updated course',
            StatusCodes.INTERNAL_SERVER_ERROR,
        );
    }

    return updatedCourse;
};

export const deleteCourseService = async (course_id: string) => {
    const course = await repo.findCourseById(course_id);
    if (!course) {
        throw new CustomError('Course not found', StatusCodes.NOT_FOUND);
    }

    await repo.deleteCourse(course_id);
    return { message: 'Course deleted successfully' };
};

export const uploadCourseContentService = async (
    file: Express.Multer.File,
) => {
    if (!file) {
        throw new CustomError('File is required', StatusCodes.BAD_REQUEST);
    }

    // Determine folder based on file type
    const isPDF = file.mimetype === 'application/pdf';
    const folder = isPDF ? 'course-content/pdfs' : 'course-content/images';

    // Save file to storage (local or S3 based on .env)
    const { path, storageType } = await saveFile(file, folder);

    // Get file URL
    let fileUrl: string;
    if (storageType === 's3') {
        fileUrl = await getFileUrl(path, storageType);
    } else {
        // For local storage, return the file path
        // The frontend will need to construct the full URL or use a static file server
        fileUrl = path;
    }

    return {
        file_url: fileUrl,
        path,
        storageType,
    };
};

export const downloadCourseContentService = async (
    filePath: string,
): Promise<{ buffer: Buffer; contentType: string }> => {
    // Decode the file path in case it's URL encoded
    const decodedPath = decodeURIComponent(filePath);

    // If it's an HTTP/HTTPS URL (S3), we can't serve it directly
    if (
        decodedPath.startsWith('http://') ||
        decodedPath.startsWith('https://')
    ) {
        throw new CustomError(
            'This file is stored in S3. Please use the provided URL to access it.',
            StatusCodes.BAD_REQUEST,
        );
    }

    // Get file from local storage
    // Try multiple path variations
    const pathVariations = [decodedPath, filePath];

    // Add variations with storage path prepended if not already there
    if (STORAGE_CONFIG.localStoragePath) {
        for (const pathVar of [decodedPath, filePath]) {
            if (
                pathVar &&
                !pathVar.startsWith(STORAGE_CONFIG.localStoragePath)
            ) {
                // Check if it's a relative path from storage
                const relativePath = pathVar.replace(/^\/+/, ''); // Remove leading slashes
                pathVariations.push(
                    path.join(STORAGE_CONFIG.localStoragePath, relativePath),
                );
                pathVariations.push(
                    path.join(STORAGE_CONFIG.localStoragePath, pathVar),
                );
            }
        }
    }

    let fileBuffer: Buffer | null = null;
    let finalPath = '';

    for (const pathVar of pathVariations) {
        if (!pathVar) continue;
        fileBuffer = getLocalFile(pathVar);
        if (fileBuffer) {
            finalPath = pathVar;
            break;
        }
    }

    if (!fileBuffer) {
        throw new CustomError(
            'Course content file not found on server',
            StatusCodes.NOT_FOUND,
        );
    }

    // Determine content type based on file extension
    const extension = finalPath.split('.').pop()?.toLowerCase() || 'pdf';
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
};


