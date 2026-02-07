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
    getEnrollmentsPendingReviewService,
    updateCertificateStatusService,
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
) => {
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