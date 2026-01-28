import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ResponseFormat } from '@/exception/responseFormat';
import { Messages } from '@/utils/messages';
import {
    createCourseService,
    getAllCoursesService,
    getCourseByIdService,
    updateCourseService,
    deleteCourseService,
    uploadCourseContentService,
    downloadCourseContentService,
} from './course.service';

const response = new ResponseFormat();

export const createCourse = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        if (!req.user) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }
        const course = await createCourseService(req.body);
        response.response(
            res,
            true,
            StatusCodes.CREATED,
            course,
            Messages.Course.CREATE_COURSE,
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const getAllCourses = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const courses = await getAllCoursesService();
        response.response(
            res,
            true,
            StatusCodes.OK,
            courses,
            Messages.Course.GET_ALL_COURSES,
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const getCourseById = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { id } = req.params;
        const course = await getCourseByIdService(id as string);
        response.response(
            res,
            true,
            StatusCodes.OK,
            course,
            Messages.Course.GET_COURSE_BY_ID,
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const updateCourse = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { id } = req.params;
        const course = await updateCourseService(id as string, req.body);
        response.response(
            res,
            true,
            StatusCodes.OK,
            course,
            Messages.Course.UPDATE_COURSE,
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const deleteCourse = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await deleteCourseService(id as string);
        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            Messages.Course.DELETE_COURSE,
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const uploadCourseContent = async (
    req: any,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        if (!req.user) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const pdfFile = files?.pdf?.[0];
        const imageFile = files?.image?.[0];
        const file = pdfFile || imageFile;

        if (!file) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'PDF or image file is required',
            );
            return;
        }

        const result = await uploadCourseContentService(file);
        response.response(
            res,
            true,
            StatusCodes.CREATED,
            result,
            'Course content uploaded successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const downloadCourseContent = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        if (!req.user) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        const { path: filePath } = req.query;

        if (!filePath || typeof filePath !== 'string') {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'File path is required',
            );
            return;
        }

        const fileData = await downloadCourseContentService(filePath);

        // Set appropriate headers for file viewing/downloading
        const decodedPath = decodeURIComponent(filePath);
        const fileName = decodedPath.split('/').pop() || 'course-content.pdf';
        res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
        res.setHeader('Content-Type', fileData.contentType);

        // Send file
        res.send(fileData.buffer);
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};
