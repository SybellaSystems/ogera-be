import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { ResponseFormat } from "@/exception/responseFormat";
import { Messages } from "@/utils/messages";
import { 
  registerUser, 
  loginUser, 
  generate2FAUser,
  refreshTokenService,
  logoutUser, 
  verify2FAUser,
  forgotPasswordService,
  verifyResetOTPService,
  resetPasswordService,
  getAllUsersService,
  getAllStudentsService,
  getAllEmployersService,
  getUserProfileService
} from "./auth.service";

const response = new ResponseFormat();

// -------------------- REGISTER --------------------
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        // Backend check
        if (!req.body.terms || !req.body.privacy) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'You must accept Terms of Service and Privacy Policy',
            );
            return;
        }

        const result = await registerUser(req.body);

        response.response(
            res,
            true,
            StatusCodes.CREATED,
            result.user,
            'User registered successfully',
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

// -------------------- LOGIN --------------------
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { user, accessToken, refreshToken, two_fa_enabled } =
            await loginUser(req.body);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        response.response(
            res,
            true,
            StatusCodes.OK,
            { user, accessToken, two_fa_enabled },
            'User logged in successfully',
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

// -------------------- REFRESH ACCESS TOKEN --------------------
export const refreshAccessToken = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            response.errorResponse(res, 401, false, 'Refresh token missing');
            return;
        }

        const { newAccessToken, newRefreshToken } = await refreshTokenService(
            refreshToken,
        );

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        response.response(
            res,
            true,
            StatusCodes.OK,
            { accessToken: newAccessToken },
            'Token refreshed successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            StatusCodes.UNAUTHORIZED,
            false,
            error.message || 'Invalid refresh token',
        );
    }
};

// -------------------- LOGOUT --------------------
export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        await logoutUser();

        res.clearCookie('refreshToken');

        response.response(
            res,
            true,
            StatusCodes.OK,
            {},
            'Logged out successfully',
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

// -------------------- 2FA SETUP --------------------
export const setup2FA = async (req: Request, res: Response): Promise<void> => {
    try {
        const { user_id, email } = req.body;

        const result = await generate2FAUser(user_id, email);

        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            '2FA setup successful',
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

// -------------------- 2FA VERIFY --------------------
export const verify2FA = async (req: Request, res: Response): Promise<void> => {
    try {
        const { user_id, token } = req.body;

        const result = await verify2FAUser(user_id, token);

        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            '2FA verified successfully',
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

// -------------------- FORGOT PASSWORD --------------------
export const forgotPassword = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { email } = req.body;

        const result = await forgotPasswordService(email);

        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            'OTP sent successfully',
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

// -------------------- VERIFY RESET OTP --------------------
export const verifyResetOTP = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { otp, resetToken } = req.body;

        await verifyResetOTPService(otp, resetToken);

        response.response(
            res,
            true,
            StatusCodes.OK,
            {},
            'OTP verification successful',
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

// -------------------- RESET PASSWORD --------------------
export const resetPassword = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { newPassword, resetToken } = req.body;

        await resetPasswordService(newPassword, resetToken);

        response.response(
            res,
            true,
            StatusCodes.OK,
            {},
            'Password reset successful',
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

// Get All Users
export const getAllusers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const { data, pagination } = await getAllUsersService({ page, limit });

    res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: Messages.User.FETCH_USERS,
      success: true,
      pagination,
      data
    });
  } catch (error: any) {
    response.errorResponse(res, error.status || StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
  }
};

// Get All Students
export const getAllStudents = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const { data, pagination } = await getAllStudentsService({ page, limit });

    res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: Messages.User.FETCH_STUDENTS,
      success: true,
      pagination,
      data
    });
  } catch (error: any) {
    response.errorResponse(res, error.status || StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
  }
};

// Get All Employers
export const getAllEmployers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const { data, pagination } = await getAllEmployersService({ page, limit });

    res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: Messages.User.FETCH_EMPLOYERS,
      success: true,
      pagination,
      data
    });
  } catch (error: any) {
    response.errorResponse(res, error.status || StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
  }
};

// -------------------- GET USER PROFILE --------------------
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get user_id from authenticated request (from auth middleware)
    const userId = req.user?.user_id;

    if (!userId) {
      response.errorResponse(
        res,
        StatusCodes.UNAUTHORIZED,
        false,
        'User not authenticated'
      );
      return;
    }

    const user = await getUserProfileService(userId);

    response.response(
      res,
      true,
      StatusCodes.OK,
      user,
      'User profile retrieved successfully'
    );
  } catch (error: any) {
    response.errorResponse(
      res,
      error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      error.message
    );
  }
};
