import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ResponseFormat } from '@/exception/responseFormat';
import {
    clearAuthCookies,
    setIsLoggedInCookie,
    setRefreshTokenCookie,
} from '@/utils/authCookies';
import { Messages } from '@/utils/messages';
import {
    registerUser,
    addUser,
    loginUser,
    setup2FAService,
    verify2FAService,
    disable2FAService,
    verifyLogin2FAService,
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
    getVerificationStatusService,
    resendVerificationEmailService,
    sendPhoneVerificationOTPService,
    verifyPhoneService,
    verifyAccountService,
    createSubAdmin,
    getAllSubAdminsService,
    getSubAdminByIdService,
    updateSubAdminService,
    deleteSubAdminService,
    deleteUserService,
    sendLostAuthenticatorOTPService,
    verifyLostAuthenticatorOTPAndDisable2FAService,
    setup2FAWithTokenService,
    verify2FAWithTokenService,
} from './auth.service';

import repo from './auth.repo';

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

        // Use the frontend origin (where the signup request came from)
        // to build correct verification links (avoid hardcoded localhost).
        const originHeader = req.headers.origin;
        const refererHeader = req.headers.referer;

        let frontendOrigin: string | undefined;
        if (typeof originHeader === 'string' && originHeader) {
            frontendOrigin = originHeader;
        } else if (typeof refererHeader === 'string' && refererHeader) {
            try {
                frontendOrigin = new URL(refererHeader).origin;
            } catch {
                frontendOrigin = undefined;
            }
        }

        const result = await registerUser(req.body, frontendOrigin);

        // Set the refresh token cookie so the browser can silently refresh —
        // mirrors the login flow, enabling auto-login straight after signup.
        // if (result.refreshToken) {
        //     setRefreshTokenCookie(res, result.refreshToken);
        //     setIsLoggedInCookie(res);
        // }

        response.response(
            res,
            true,
            StatusCodes.CREATED,
            result,
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
        const result: any = await loginUser(req.body, req);

        // If 2FA is enabled, require step-2 verification before issuing tokens/cookies
        if (result?.requires2FA) {
            response.response(
                res,
                true,
                StatusCodes.OK,
                {
                    requires2FA: true,
                    twoFactorToken: result.twoFactorToken,
                    user: result.user,
                },
                '2FA verification required',
            );
            return;
        }

        const { user, accessToken, refreshToken } = result;

        setRefreshTokenCookie(res, refreshToken);
        setIsLoggedInCookie(res);

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

// -------------------- 2FA SETUP --------------------
export const setup2FA = async (req: Request, res: Response): Promise<void> => {
    try {
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

        const data = await setup2FAService(userId);
        response.response(res, true, StatusCodes.OK, data, '2FA setup successful');
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

// -------------------- 2FA VERIFY (ENABLE) --------------------
export const verify2FA = async (req: Request, res: Response): Promise<void> => {
    try {
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

        const { token } = req.body;
        if (!token) {
            response.errorResponse(res, StatusCodes.BAD_REQUEST, false, 'Token is required');
            return;
        }

        await verify2FAService(userId, token);
        response.response(res, true, StatusCodes.OK, {}, '2FA enabled successfully');
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

// -------------------- 2FA DISABLE --------------------
export const disable2FA = async (req: Request, res: Response): Promise<void> => {
    try {
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

        const { password, token } = req.body;
        if (!password) {
            response.errorResponse(res, StatusCodes.BAD_REQUEST, false, 'Password is required');
            return;
        }

        await disable2FAService(userId, password, token);
        response.response(res, true, StatusCodes.OK, {}, '2FA disabled successfully');
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

// -------------------- LOST AUTHENTICATOR: SEND EMAIL OTP --------------------
export const sendLostAuthenticatorOTP = async (
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

        const result = await sendLostAuthenticatorOTPService(email);
        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            'OTP sent to your email',
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

// -------------------- LOST AUTHENTICATOR: VERIFY EMAIL OTP AND DISABLE 2FA --------------------
export const verifyLostAuthenticatorOTPAndDisable2FA = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { otp, recoveryToken } = req.body;
        if (!otp) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'OTP is required',
            );
            return;
        }
        if (!recoveryToken) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'Recovery token is required',
            );
            return;
        }

        const result = await verifyLostAuthenticatorOTPAndDisable2FAService(
            otp,
            recoveryToken,
        );
        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            '2FA disabled successfully. Please setup new 2FA.',
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

// -------------------- LOST AUTHENTICATOR: SETUP 2FA WITH TOKEN --------------------
export const setup2FAWithToken = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { setupToken } = req.body;
        if (!setupToken) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'Setup token is required',
            );
            return;
        }

        const result = await setup2FAWithTokenService(setupToken);
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

// -------------------- LOST AUTHENTICATOR: VERIFY 2FA WITH TOKEN --------------------
export const verify2FAWithToken = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { setupToken, token } = req.body;
        if (!setupToken) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'Setup token is required',
            );
            return;
        }
        if (!token) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                '2FA token is required',
            );
            return;
        }

        const result = await verify2FAWithTokenService(setupToken, token);
        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            '2FA verified and enabled successfully',
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

// -------------------- 2FA VERIFY LOGIN (STEP 2) --------------------
export const verifyLogin2FA = async (req: Request, res: Response): Promise<void> => {
    try {
        const { twoFactorToken, token } = req.body;
        if (!twoFactorToken) {
            response.errorResponse(res, StatusCodes.BAD_REQUEST, false, 'twoFactorToken is required');
            return;
        }
        if (!token) {
            response.errorResponse(res, StatusCodes.BAD_REQUEST, false, 'Token is required');
            return;
        }

        const { user, accessToken, refreshToken } = await verifyLogin2FAService(
            twoFactorToken,
            token,
            req,
        );

        setRefreshTokenCookie(res, refreshToken);
        setIsLoggedInCookie(res);

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

        setRefreshTokenCookie(res, newRefreshToken);

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
        await logoutUser(req);

        clearAuthCookies(res);

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
        // Express can provide query params as string|string[]
        const tokenParam = req.query.token;
        const token = Array.isArray(tokenParam)
            ? tokenParam[0]
            : tokenParam;

        if (!token || typeof token !== 'string' || !token.trim()) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'Verification token is required',
            );
            return;
        }

        const result = await verifyEmailService(token.trim());

        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
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

        const originHeader = req.headers.origin;
        const refererHeader = req.headers.referer;

        let frontendOrigin: string | undefined;
        if (typeof originHeader === 'string' && originHeader) {
            frontendOrigin = originHeader;
        } else if (typeof refererHeader === 'string' && refererHeader) {
            try {
                frontendOrigin = new URL(refererHeader).origin;
            } catch {
                frontendOrigin = undefined;
            }
        }

        const result = await resendVerificationEmailService(email, frontendOrigin);

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
            country_code,
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
            !country_code &&
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
            country_code,
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
        const search = (req.query.search as string) || undefined;

        const { data, pagination } = await getAllSubAdminsService({
            page,
            limit,
            search,
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
        // This endpoint can be called before login (after signup),
        // so we identify the user via `email` in the request body.
        // If an auth header is present and middleware populates req.user, we can also use req.user.
        const user_id = req.user?.user_id;
        const { email } = req.body as { email?: string };

        let targetUserId = user_id;
        if (!targetUserId) {
            if (!email || typeof email !== 'string' || !email.trim()) {
                response.errorResponse(
                    res,
                    StatusCodes.BAD_REQUEST,
                    false,
                    'Email is required to send phone verification OTP',
                );
                return;
            }

            const user = await repo.findUserByEmail(email.trim());
            if (!user) {
                response.errorResponse(
                    res,
                    StatusCodes.NOT_FOUND,
                    false,
                    'User not found for provided email',
                );
                return;
            }

            targetUserId = user.user_id;
        }

        const result = await sendPhoneVerificationOTPService(targetUserId);

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

// -------------------- GET VERIFICATION STATUS --------------------
export const getVerificationStatus = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const emailParam = req.query.email;
        const email = Array.isArray(emailParam) ? emailParam[0] : emailParam;

        if (!email || typeof email !== 'string' || !email.trim()) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'Email is required',
            );
            return;
        }

        const result = await getVerificationStatusService(email);

        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            'Verification status fetched successfully',
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

// -------------------- VERIFY ACCOUNT (SMS OTP + email verification) --------------------
export const verifyAccount = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, otp } = req.body;

        if (!email || typeof email !== 'string') {
            response.errorResponse(res, StatusCodes.BAD_REQUEST, false, 'Email is required');
            return;
        }

        if (!otp || typeof otp !== 'string') {
            response.errorResponse(res, StatusCodes.BAD_REQUEST, false, 'OTP is required');
            return;
        }

        const result = await verifyAccountService(email.trim(), otp.trim());

        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            'Phone number verified successfully'
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

