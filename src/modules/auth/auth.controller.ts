import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ResponseFormat } from '@/exception/responseFormat';
import { Messages } from '@/utils/messages';
import {
    registerUser,
    loginUser,
    generate2FAUser,
    verify2FAUser,
    forgotPasswordService,
    verifyResetOTPService,
    resetPasswordService,
} from './auth.service';

const response = new ResponseFormat();

export const register = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const result = await registerUser(req.body);
        response.response(
            res,
            true,
            StatusCodes.CREATED,
            result.user,
            Messages.User.CREATE_USER,
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

export const login = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const result = await loginUser(req.body);
        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            Messages.User.LOGGED_IN,
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

export const setup2FA = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { user_id, email } = req.body;
        const result = await generate2FAUser(user_id, email);
        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            Messages.User.TWO_FA_ENABLED,
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

export const verify2FA = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { user_id, token } = req.body;
        const result = await verify2FAUser(user_id, token);
        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            Messages.User.TWO_FA_ENABLED,
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

// Forgot Password
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const result = await forgotPasswordService(email);
        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            Messages.User.OTP_SUCCESS,
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

// Verify Reset OTP
export const verifyResetOTP = async (req: Request, res: Response) => {
    try {
        const { otp, resetToken } = req.body;
        await verifyResetOTPService(otp, resetToken);
        response.response(
            res,
            true,
            StatusCodes.OK,
            {},
            Messages.User.OTP_VERIFICATION_SUCCESS,
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

// Reset Password
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { newPassword, resetToken } = req.body;
        await resetPasswordService(newPassword, resetToken);
        response.response(
            res,
            true,
            StatusCodes.OK,
            {},
            Messages.User.PASSWORD_RESET_SUCCESS,
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
