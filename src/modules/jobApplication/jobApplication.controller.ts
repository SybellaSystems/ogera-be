import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ResponseFormat } from '@/exception/responseFormat';
import {
    applyForJobService,
    getJobApplicationsService,
    getEmployerApplicationsService,
    getStudentApplicationsService,
    updateApplicationStatusService,
    getApplicationByIdService,
    uploadResumeService,
    downloadResumeService,
    checkStudentApplicationService,
} from './jobApplication.service';

const response = new ResponseFormat();

// Apply for a job (student only)
export const applyForJob = async (
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
        const application = await applyForJobService(
            req.params.job_id as string,
            req.user.user_id,
            req.body,
        );
        if (!application) {
            response.errorResponse(
                res,
                StatusCodes.INTERNAL_SERVER_ERROR,
                false,
                'Failed to create application',
            );
            return;
        }
        response.response(
            res,
            true,
            StatusCodes.CREATED,
            application,
            'Application submitted successfully',
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

// Get all applications for a specific job (employer/superadmin only)
export const getJobApplications = async (
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
        const applications = await getJobApplicationsService(
            req.params.job_id as string,
            req.user.user_id,
            req.user.role,
        );
        response.response(
            res,
            true,
            StatusCodes.OK,
            applications,
            'Applications retrieved successfully',
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

// Get all applications for an employer (employer/superadmin only)
export const getEmployerApplications = async (
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
        const applications = await getEmployerApplicationsService(
            req.user.user_id,
            req.user.role,
        );
        response.response(
            res,
            true,
            StatusCodes.OK,
            applications,
            'Applications retrieved successfully',
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

// Get student's own applications
export const getStudentApplications = async (
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
        const applications = await getStudentApplicationsService(
            req.user.user_id,
        );
        response.response(
            res,
            true,
            StatusCodes.OK,
            applications,
            'Applications retrieved successfully',
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

// Accept or reject application (employer/superadmin only)
export const updateApplicationStatus = async (
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
        const { status } = req.body;
        if (status !== 'Accepted' && status !== 'Rejected') {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                "Status must be either 'Accepted' or 'Rejected'",
            );
            return;
        }
        const application = await updateApplicationStatusService(
            req.params.application_id as string,
            status,
            req.user.user_id,
            req.user.role,
        );
        response.response(
            res,
            true,
            StatusCodes.OK,
            application,
            `Application ${status.toLowerCase()} successfully`,
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

// Get application by ID
export const getApplicationById = async (
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
        const application = await getApplicationByIdService(
            req.params.application_id as string,
            req.user.user_id,
            req.user.role,
        );
        response.response(
            res,
            true,
            StatusCodes.OK,
            application,
            'Application retrieved successfully',
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

// Upload resume for job application (student only)
export const uploadResume = async (
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

        const file = req.file;
        if (!file) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'Resume file is required',
            );
            return;
        }

        const result = await uploadResumeService(req.user.user_id, file);
        response.response(
            res,
            true,
            StatusCodes.CREATED,
            result,
            'Resume uploaded successfully',
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

// Check if student has applied to a job
export const checkStudentApplication = async (
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
        const result = await checkStudentApplicationService(
            req.params.job_id as string,
            req.user.user_id,
        );
        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            'Application status checked successfully',
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

// Download resume file (employer/superadmin only)
export const downloadResume = async (
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

        const decodedPath = decodeURIComponent(filePath);
        const fileData = await downloadResumeService(
            decodedPath,
            req.user.user_id,
            req.user.role,
        );

        // Set appropriate headers for file download
        const fileName = decodedPath.split('/').pop() || 'resume.pdf';
        res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
        res.setHeader(
            'Content-Type',
            fileData.contentType || 'application/pdf',
        );

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
