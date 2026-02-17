import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ResponseFormat } from '@/exception/responseFormat';
import { Messages } from '@/utils/messages';
import {
    registerUser,
    addUser,
    loginUser,
    refreshTokenService,
    logoutUser,
    forgotPasswordService,
    verifyResetOTPService,
    resetPasswordService,
    getAllUsersService,
    //getAllStudentsService,
    //getAllEmployersService,
    getUserProfileService,
    updateProfileService,
    verifyEmailService,
    resendVerificationEmailService,
    sendPhoneVerificationOTPService,
    verifyPhoneService,
    createSubAdmin,
    getAllSubAdminsService,
    getSubAdminByIdService,
    updateSubAdminService,
    deleteSubAdminService,
    deleteUserService,
} from './auth.service';

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

// -------------------- ADD USER (ADMIN/SUPERADMIN) --------------------
export const addUserController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const result = await addUser(req.body);

        response.response(
            res,
            true,
            StatusCodes.CREATED,
            result.user,
            'User added successfully',
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
        const { user, accessToken, refreshToken } =
            await loginUser(req.body);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            // secure: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        // 2. The Hint Cookie (NOT httpOnly - so JS can read it) ⭐
        res.cookie('isLoggedIn', 'true', {
            httpOnly: false, // Accessible by frontend
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        response.response(
            res,
            true,
            StatusCodes.OK,
            { user, accessToken },
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
            // response.errorResponse(res, 401, false, 'Refresh token missing');
            response.errorResponse(res, StatusCodes.UNAUTHORIZED, false, 'No session found');
            return;
        }

        const { newAccessToken, newRefreshToken } = await refreshTokenService(
            refreshToken,
        );

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            // secure: false,
            secure: process.env.NODE_ENV === 'production', // Only true in production
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
        res.clearCookie('isLoggedIn'); // Clear the hint ⭐

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
        // Accept type as string: "all", "Student", or "Employer"
        const type = req.query.type as string | undefined;

        // Get current user's role to determine if admin roles should be excluded
        // req.user.role is already a string (roleName), not an object
        const currentUserRole = req.user?.role;

        const { data, pagination, counts } = await getAllUsersService(
            { page, limit, type },
            currentUserRole,
        );

        res.status(StatusCodes.OK).json({
            status: StatusCodes.OK,
            message: Messages.User.FETCH_USERS,
            success: true,
            pagination,
            data,
            counts,
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
// export const getAllStudents = async (req: Request, res: Response) => {
//     try {
//         const page = parseInt(req.query.page as string) || 1;
//         const limit = parseInt(req.query.limit as string) || 10;

//         const { data, pagination } = await getAllStudentsService({
//             page,
//             limit,
//         });

//         res.status(StatusCodes.OK).json({
//             status: StatusCodes.OK,
//             message: Messages.User.FETCH_STUDENTS,
//             success: true,
//             pagination,
//             data,
//         }); 
//         console.log('data', data);
//         console.log("hello this is console log");
//     } catch (error: any) {
//         response.errorResponse(
//             res,
//             error.status || StatusCodes.INTERNAL_SERVER_ERROR,
//             false,
//             error.message,
//         );
//     }
// };

// // Get All Employers
// export const getAllEmployers = async (req: Request, res: Response) => {
//     try {
//         const page = parseInt(req.query.page as string) || 1;
//         const limit = parseInt(req.query.limit as string) || 10;

//         const { data, pagination } = await getAllEmployersService({
//             page,
//             limit,
//         });

//         res.status(StatusCodes.OK).json({
//             status: StatusCodes.OK,
//             message: Messages.User.FETCH_EMPLOYERS,
//             success: true,
//             pagination,
//             data,
//         });
//         console.log('data', data);
//         console.log("hello this is console log");
//     } catch (error: any) {
//         console.log(error);
//         response.errorResponse(
//             res,
//             error.status || StatusCodes.INTERNAL_SERVER_ERROR,
//             false,
//             error.message,
//         );
//     }
// };

// -------------------- GET USER PROFILE --------------------
export const getUserProfile = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        // Get user_id from authenticated request (from auth middleware)
        const userId = req.user?.user_id;

        if (!userId) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        const user = await getUserProfileService(userId);

        response.response(
            res,
            true,
            StatusCodes.OK,
            user,
            'User profile retrieved successfully',
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

// -------------------- VERIFY EMAIL --------------------
export const verifyEmail = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { token } = req.query;

        if (!token || typeof token !== 'string') {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'Verification token is required',
            );
            return;
        }

        await verifyEmailService(token);

        response.response(
            res,
            true,
            StatusCodes.OK,
            {},
            'Email verified successfully',
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

// -------------------- RESEND VERIFICATION EMAIL --------------------
export const resendVerificationEmail = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { email } = req.body;

        if (!email) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'Email is required',
            );
            return;
        }

        const result = await resendVerificationEmailService(email);

        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            'Verification email sent successfully',
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

// -------------------- UPDATE USER PROFILE --------------------
export const updateProfile = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        // Get user_id from authenticated request (from auth middleware)
        const userId = req.user?.user_id;

        if (!userId) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        const {
            full_name,
            email,
            mobile_number,
            national_id_number,
            business_registration_id,
            resume_url,
            cover_letter,
            preferred_location,
        } = req.body;

        // Validate that at least one field is provided
        if (
            !full_name &&
            !email &&
            !mobile_number &&
            national_id_number === undefined &&
            business_registration_id === undefined &&
            resume_url === undefined &&
            cover_letter === undefined &&
            preferred_location === undefined
        ) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'At least one field must be provided for update',
            );
            return;
        }

        const updatedUser = await updateProfileService(userId, {
            full_name,
            email,
            mobile_number,
            national_id_number,
            business_registration_id,
            resume_url,
            cover_letter,
            preferred_location,
        });

        response.response(
            res,
            true,
            StatusCodes.OK,
            updatedUser,
            'Profile updated successfully',
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

// -------------------- CREATE SUBADMIN (SUPERADMIN ONLY) --------------------
export const createSubAdminController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { email, password, role, full_name } = req.body;

        // Validate required fields
        if (!email || !password || !role) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'Email, password, and role are required',
            );
            return;
        }

        const currentUserRole = req.user?.role;
        const result = await createSubAdmin(
            {
                email,
                password,
                role,
                full_name,
            },
            currentUserRole,
        );

        const successMessage =
            role === 'subadmin'
                ? 'Subadmin created successfully'
                : 'Admin created successfully';

        response.response(
            res,
            true,
            StatusCodes.CREATED,
            result.user,
            successMessage,
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

// -------------------- GET ALL SUBADMINS (SUPERADMIN ONLY) --------------------
export const getAllSubAdmins = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const { data, pagination } = await getAllSubAdminsService({
            page,
            limit,
        });

        res.status(StatusCodes.OK).json({
            status: StatusCodes.OK,
            message: 'Subadmins retrieved successfully',
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

// -------------------- GET SUBADMIN BY ID (SUPERADMIN ONLY) --------------------
export const getSubAdminById = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { id } = req.params as { id: string };

        if (!id) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'Subadmin ID is required',
            );
            return;
        }

        const subadmin = await getSubAdminByIdService(id);

        response.response(
            res,
            true,
            StatusCodes.OK,
            subadmin,
            'Subadmin retrieved successfully',
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

// -------------------- UPDATE SUBADMIN (SUPERADMIN ONLY) --------------------
export const updateSubAdmin = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { id } = req.params as { id: string };
        const { full_name, email, mobile_number, password, role } = req.body;

        if (!id) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'Subadmin ID is required',
            );
            return;
        }

        // Validate that at least one field is provided
        if (!full_name && !email && !mobile_number && !password && !role) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'At least one field must be provided for update',
            );
            return;
        }

        const currentUserRole = req.user?.role;
        const updatedSubAdmin = await updateSubAdminService(
            id,
            {
                full_name,
                email,
                mobile_number,
                password,
                role,
            },
            currentUserRole,
        );

        response.response(
            res,
            true,
            StatusCodes.OK,
            updatedSubAdmin,
            'Subadmin updated successfully',
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

// -------------------- DELETE SUBADMIN (SUPERADMIN ONLY) --------------------
export const deleteSubAdmin = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { id } = req.params as { id: string };

        if (!id) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'Subadmin ID is required',
            );
            return;
        }

        const result = await deleteSubAdminService(id);

        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            'Subadmin deleted successfully',
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

// -------------------- DELETE USER (ADMIN/SUPERADMIN ONLY) --------------------
// Get user by ID - requires admin or superadmin authentication
export const getUserById = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { id } = req.params as { id: string };

        if (!id) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'User ID is required',
            );
            return;
        }

        const user = await getUserProfileService(id);

        response.response(
            res,
            true,
            StatusCodes.OK,
            user,
            'User retrieved successfully',
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

// Update user by ID - requires admin or superadmin authentication
export const updateUserById = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { id } = req.params as { id: string };

        if (!id) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'User ID is required',
            );
            return;
        }

        const {
            full_name,
            email,
            mobile_number,
            national_id_number,
            business_registration_id,
            resume_url,
            cover_letter,
            preferred_location,
        } = req.body;

        const updatedUser = await updateProfileService(id, {
            full_name,
            email,
            mobile_number,
            national_id_number,
            business_registration_id,
            resume_url,
            cover_letter,
            preferred_location,
        });

        response.response(
            res,
            true,
            StatusCodes.OK,
            updatedUser,
            'User updated successfully',
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

export const deleteUser = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { id } = req.params as { id: string };

        if (!id) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'User ID is required',
            );
            return;
        }

        const result = await deleteUserService(id);

        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            'User deleted successfully',
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

// -------------------- SEND PHONE VERIFICATION OTP --------------------
export const sendPhoneVerificationOTP = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        const result = await sendPhoneVerificationOTPService(user_id);

        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            'Phone verification OTP sent successfully',
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

// -------------------- VERIFY PHONE NUMBER --------------------
export const verifyPhone = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        const { otp } = req.body;

        if (!otp) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'OTP is required',
            );
            return;
        }

        const result = await verifyPhoneService(user_id, otp);

        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            'Phone number verified successfully',
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

