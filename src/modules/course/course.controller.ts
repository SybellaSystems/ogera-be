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
    enrollCourseService,
    getMyEnrollmentsService,
    getEnrollmentService,
    completeCourseService,
    getStudentCompletedCoursesService,
    getEnrollmentsPendingReviewService,
    updateCertificateStatusService,
    uploadCourseVideoService,
    streamCourseVideoService,
    getCourseChatHistoryService,
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

// ---------- Course content (PDF / image) ----------

export const uploadCourseContent = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const files = (req as any).files as
            | { [fieldname: string]: Express.Multer.File[] }
            | undefined;

        if (!files || (!files.pdf && !files.image)) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'No course content file provided',
            );
            return;
        }

        const pdf = files.pdf?.[0];
        const image = files.image?.[0];

        response.response(
            res,
            true,
            StatusCodes.OK,
            {
                pdf: pdf
                    ? {
                          originalname: pdf.originalname,
                          mimetype: pdf.mimetype,
                          size: pdf.size,
                      }
                    : null,
                image: image
                    ? {
                          originalname: image.originalname,
                          mimetype: image.mimetype,
                          size: image.size,
                      }
                    : null,
            },
            'Course content received',
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
    _req: Request,
    res: Response,
): Promise<void> => {
    response.errorResponse(
        res,
        StatusCodes.NOT_IMPLEMENTED,
        false,
        'Course content download is not implemented yet',
    );
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

// ---------- Enrollments ----------

export const enrollCourse = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = (req as any).user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }
        const { id: course_id } = req.params;
        const enrollment = await enrollCourseService(
            user_id,
            course_id as string,
        );
        response.response(
            res,
            true,
            StatusCodes.CREATED,
            enrollment,
            'Enrolled successfully',
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

export const getMyEnrollments = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = (req as any).user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }
        const enrollments = await getMyEnrollmentsService(user_id);
        response.response(
            res,
            true,
            StatusCodes.OK,
            enrollments,
            'Enrollments fetched',
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

export const getEnrollment = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = (req as any).user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }
        const { id: course_id } = req.params;
        const enrollment = await getEnrollmentService(
            user_id,
            course_id as string,
        );
        if (!enrollment) {
            response.errorResponse(
                res,
                StatusCodes.NOT_FOUND,
                false,
                'Enrollment not found',
            );
            return;
        }
        response.response(
            res,
            true,
            StatusCodes.OK,
            enrollment,
            'Enrollment fetched',
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

export const completeCourse = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = (req as any).user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }
        const { id: course_id } = req.params;
        const enrollment = await completeCourseService(
            user_id,
            course_id as string,
        );
        response.response(
            res,
            true,
            StatusCodes.OK,
            enrollment,
            'Course marked complete; certificate pending review',
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

export const getStudentCompletedCourses = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { user_id } = req.params;
        const courses = await getStudentCompletedCoursesService(user_id as string);
        response.response(
            res,
            true,
            StatusCodes.OK,
            courses,
            'Completed courses fetched',
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

export const getEnrollmentsPendingReview = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const enrollments = await getEnrollmentsPendingReviewService();
        response.response(
            res,
            true,
            StatusCodes.OK,
            enrollments,
            'Pending reviews fetched',
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

// ---------- Video upload & stream ----------

export const uploadCourseVideo = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const file = (req as any).file;
        if (!file) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'No video file provided',
            );
            return;
        }
        const result = await uploadCourseVideoService(file);
        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            'Video uploaded successfully',
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

export const streamCourseVideo = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const path = req.query.path as string;
        if (!path) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'Path parameter required',
            );
            return;
        }
        const result = await streamCourseVideoService(path);
        if (!result) {
            response.errorResponse(
                res,
                StatusCodes.NOT_FOUND,
                false,
                'Video not found',
            );
            return;
        }
        res.setHeader('Content-Type', result.mimeType);
        res.setHeader(
            'Content-Disposition',
            `inline; filename="${result.fileName}"`,
        );
        res.setHeader('Accept-Ranges', 'bytes');
        res.send(result.buffer);
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const updateCertificateStatus = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { enrollment_id } = req.params;
        const { certificate_status, funded } = req.body;
        if (!['pending_review', 'approved'].includes(certificate_status)) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'Invalid certificate_status',
            );
            return;
        }
        const enrollment = await updateCertificateStatusService(
            enrollment_id,
            certificate_status,
            funded,
        );
        response.response(
            res,
            true,
            StatusCodes.OK,
            enrollment,
            'Certificate status updated',
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

export const getCourseChatHistory = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = (req as any).user?.user_id;
        const role = (req as any).user?.role;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }
        const { id: course_id } = req.params;
        const messages = await getCourseChatHistoryService(
            course_id as string,
            user_id,
            role as string,
        );
        response.response(
            res,
            true,
            StatusCodes.OK,
            messages,
            'Chat history fetched',
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
