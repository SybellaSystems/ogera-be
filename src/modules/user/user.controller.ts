import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ResponseFormat } from '@/exception/responseFormat';
import { Messages } from '@/utils/messages';
import {
    getAllUsersService,
    getAllStudentsService,
    getAllEmployersService,
} from '@/modules/auth/auth.service';

const response = new ResponseFormat();

// Get All Users
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        // Get current user's role to determine if admin roles should be excluded
        const currentUserRole = req.user?.role;

        const { data, pagination } = await getAllUsersService(
            { page, limit },
            currentUserRole,
        );

        res.status(StatusCodes.OK).json({
            status: StatusCodes.OK,
            message: Messages.User.FETCH_USERS,
            success: true,
            pagination,
            data,
        });
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

// Get All Students
export const getAllStudents = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const { data, pagination } = await getAllStudentsService({
            page,
            limit,
        });

        res.status(StatusCodes.OK).json({
            status: StatusCodes.OK,
            message: Messages.User.FETCH_STUDENTS,
            success: true,
            pagination,
            data,
        });
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

// Get All Employers
export const getAllEmployers = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const { data, pagination } = await getAllEmployersService({
            page,
            limit,
        });

        res.status(StatusCodes.OK).json({
            status: StatusCodes.OK,
            message: Messages.User.FETCH_EMPLOYERS,
            success: true,
            pagination,
            data,
        });
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

