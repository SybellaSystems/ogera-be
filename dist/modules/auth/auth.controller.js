"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPhone = exports.sendPhoneVerificationOTP = exports.deleteUser = exports.updateUserById = exports.getUserById = exports.deleteSubAdmin = exports.updateSubAdmin = exports.getSubAdminById = exports.getAllSubAdmins = exports.createSubAdminController = exports.updateProfile = exports.resendVerificationEmail = exports.verifyEmail = exports.getUserProfile = exports.getAllusers = exports.resetPassword = exports.verifyResetOTP = exports.forgotPassword = exports.verify2FA = exports.setup2FA = exports.logout = exports.refreshAccessToken = exports.login = exports.addUserController = exports.register = void 0;
const http_status_codes_1 = require("http-status-codes");
const responseFormat_1 = require("../../exception/responseFormat");
const messages_1 = require("../../utils/messages");
const auth_service_1 = require("./auth.service");
const response = new responseFormat_1.ResponseFormat();
// -------------------- REGISTER --------------------
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Backend check
        if (!req.body.terms || !req.body.privacy) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.BAD_REQUEST, false, 'You must accept Terms of Service and Privacy Policy');
            return;
        }
        const result = yield (0, auth_service_1.registerUser)(req.body);
        response.response(res, true, http_status_codes_1.StatusCodes.CREATED, result.user, 'User registered successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.register = register;
// -------------------- ADD USER (ADMIN/SUPERADMIN) --------------------
const addUserController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, auth_service_1.addUser)(req.body);
        response.response(res, true, http_status_codes_1.StatusCodes.CREATED, result.user, 'User added successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.addUserController = addUserController;
// -------------------- LOGIN --------------------
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user, accessToken, refreshToken, two_fa_enabled } = yield (0, auth_service_1.loginUser)(req.body);
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        response.response(res, true, http_status_codes_1.StatusCodes.OK, { user, accessToken, two_fa_enabled }, 'User logged in successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.login = login;
// -------------------- REFRESH ACCESS TOKEN --------------------
const refreshAccessToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            response.errorResponse(res, 401, false, 'Refresh token missing');
            return;
        }
        const { newAccessToken, newRefreshToken } = yield (0, auth_service_1.refreshTokenService)(refreshToken);
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        response.response(res, true, http_status_codes_1.StatusCodes.OK, { accessToken: newAccessToken }, 'Token refreshed successfully');
    }
    catch (error) {
        response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, error.message || 'Invalid refresh token');
    }
});
exports.refreshAccessToken = refreshAccessToken;
// -------------------- LOGOUT --------------------
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, auth_service_1.logoutUser)();
        res.clearCookie('refreshToken');
        response.response(res, true, http_status_codes_1.StatusCodes.OK, {}, 'Logged out successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.logout = logout;
// -------------------- 2FA SETUP --------------------
const setup2FA = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user_id, email } = req.body;
        const result = yield (0, auth_service_1.generate2FAUser)(user_id, email);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, result, '2FA setup successful');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.setup2FA = setup2FA;
// -------------------- 2FA VERIFY --------------------
const verify2FA = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user_id, token } = req.body;
        const result = yield (0, auth_service_1.verify2FAUser)(user_id, token);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, result, '2FA verified successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.verify2FA = verify2FA;
// -------------------- FORGOT PASSWORD --------------------
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        const result = yield (0, auth_service_1.forgotPasswordService)(email);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, result, 'OTP sent successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.forgotPassword = forgotPassword;
// -------------------- VERIFY RESET OTP --------------------
const verifyResetOTP = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { otp, resetToken } = req.body;
        yield (0, auth_service_1.verifyResetOTPService)(otp, resetToken);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, {}, 'OTP verification successful');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.verifyResetOTP = verifyResetOTP;
// -------------------- RESET PASSWORD --------------------
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { newPassword, resetToken } = req.body;
        yield (0, auth_service_1.resetPasswordService)(newPassword, resetToken);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, {}, 'Password reset successful');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.resetPassword = resetPassword;
// Get All Users
const getAllusers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        // Accept type as string: "all", "Student", or "Employer"
        const type = req.query.type;
        // Get current user's role to determine if admin roles should be excluded
        // req.user.role is already a string (roleName), not an object
        const currentUserRole = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        const { data, pagination, counts } = yield (0, auth_service_1.getAllUsersService)({ page, limit, type }, currentUserRole);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            status: http_status_codes_1.StatusCodes.OK,
            message: messages_1.Messages.User.FETCH_USERS,
            success: true,
            pagination,
            data,
            counts,
        });
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getAllusers = getAllusers;
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
const getUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Get user_id from authenticated request (from auth middleware)
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!userId) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const user = yield (0, auth_service_1.getUserProfileService)(userId);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, user, 'User profile retrieved successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getUserProfile = getUserProfile;
// -------------------- VERIFY EMAIL --------------------
const verifyEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.query;
        if (!token || typeof token !== 'string') {
            response.errorResponse(res, http_status_codes_1.StatusCodes.BAD_REQUEST, false, 'Verification token is required');
            return;
        }
        yield (0, auth_service_1.verifyEmailService)(token);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, {}, 'Email verified successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.verifyEmail = verifyEmail;
// -------------------- RESEND VERIFICATION EMAIL --------------------
const resendVerificationEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.BAD_REQUEST, false, 'Email is required');
            return;
        }
        const result = yield (0, auth_service_1.resendVerificationEmailService)(email);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, result, 'Verification email sent successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.resendVerificationEmail = resendVerificationEmail;
// -------------------- UPDATE USER PROFILE --------------------
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Get user_id from authenticated request (from auth middleware)
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!userId) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const { full_name, email, mobile_number, national_id_number, business_registration_id, resume_url, cover_letter, preferred_location, } = req.body;
        // Validate that at least one field is provided
        if (!full_name &&
            !email &&
            !mobile_number &&
            national_id_number === undefined &&
            business_registration_id === undefined &&
            resume_url === undefined &&
            cover_letter === undefined &&
            preferred_location === undefined) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.BAD_REQUEST, false, 'At least one field must be provided for update');
            return;
        }
        const updatedUser = yield (0, auth_service_1.updateProfileService)(userId, {
            full_name,
            email,
            mobile_number,
            national_id_number,
            business_registration_id,
            resume_url,
            cover_letter,
            preferred_location,
        });
        response.response(res, true, http_status_codes_1.StatusCodes.OK, updatedUser, 'Profile updated successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.updateProfile = updateProfile;
// -------------------- CREATE SUBADMIN (SUPERADMIN ONLY) --------------------
const createSubAdminController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { email, password, role, full_name } = req.body;
        // Validate required fields
        if (!email || !password || !role) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.BAD_REQUEST, false, 'Email, password, and role are required');
            return;
        }
        const currentUserRole = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        const result = yield (0, auth_service_1.createSubAdmin)({
            email,
            password,
            role,
            full_name,
        }, currentUserRole);
        const successMessage = role === 'subadmin'
            ? 'Subadmin created successfully'
            : 'Admin created successfully';
        response.response(res, true, http_status_codes_1.StatusCodes.CREATED, result.user, successMessage);
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.createSubAdminController = createSubAdminController;
// -------------------- GET ALL SUBADMINS (SUPERADMIN ONLY) --------------------
const getAllSubAdmins = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { data, pagination } = yield (0, auth_service_1.getAllSubAdminsService)({
            page,
            limit,
        });
        res.status(http_status_codes_1.StatusCodes.OK).json({
            status: http_status_codes_1.StatusCodes.OK,
            message: 'Subadmins retrieved successfully',
            success: true,
            pagination,
            data,
        });
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getAllSubAdmins = getAllSubAdmins;
// -------------------- GET SUBADMIN BY ID (SUPERADMIN ONLY) --------------------
const getSubAdminById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.BAD_REQUEST, false, 'Subadmin ID is required');
            return;
        }
        const subadmin = yield (0, auth_service_1.getSubAdminByIdService)(id);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, subadmin, 'Subadmin retrieved successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getSubAdminById = getSubAdminById;
// -------------------- UPDATE SUBADMIN (SUPERADMIN ONLY) --------------------
const updateSubAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { full_name, email, mobile_number, password, role } = req.body;
        if (!id) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.BAD_REQUEST, false, 'Subadmin ID is required');
            return;
        }
        // Validate that at least one field is provided
        if (!full_name && !email && !mobile_number && !password && !role) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.BAD_REQUEST, false, 'At least one field must be provided for update');
            return;
        }
        const currentUserRole = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        const updatedSubAdmin = yield (0, auth_service_1.updateSubAdminService)(id, {
            full_name,
            email,
            mobile_number,
            password,
            role,
        }, currentUserRole);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, updatedSubAdmin, 'Subadmin updated successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.updateSubAdmin = updateSubAdmin;
// -------------------- DELETE SUBADMIN (SUPERADMIN ONLY) --------------------
const deleteSubAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.BAD_REQUEST, false, 'Subadmin ID is required');
            return;
        }
        const result = yield (0, auth_service_1.deleteSubAdminService)(id);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, result, 'Subadmin deleted successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.deleteSubAdmin = deleteSubAdmin;
// -------------------- DELETE USER (ADMIN/SUPERADMIN ONLY) --------------------
// Get user by ID - requires admin or superadmin authentication
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.BAD_REQUEST, false, 'User ID is required');
            return;
        }
        const user = yield (0, auth_service_1.getUserProfileService)(id);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, user, 'User retrieved successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getUserById = getUserById;
// Update user by ID - requires admin or superadmin authentication
const updateUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.BAD_REQUEST, false, 'User ID is required');
            return;
        }
        const { full_name, email, mobile_number, national_id_number, business_registration_id, resume_url, cover_letter, preferred_location, } = req.body;
        const updatedUser = yield (0, auth_service_1.updateProfileService)(id, {
            full_name,
            email,
            mobile_number,
            national_id_number,
            business_registration_id,
            resume_url,
            cover_letter,
            preferred_location,
        });
        response.response(res, true, http_status_codes_1.StatusCodes.OK, updatedUser, 'User updated successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.updateUserById = updateUserById;
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.BAD_REQUEST, false, 'User ID is required');
            return;
        }
        const result = yield (0, auth_service_1.deleteUserService)(id);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, result, 'User deleted successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.deleteUser = deleteUser;
// -------------------- SEND PHONE VERIFICATION OTP --------------------
const sendPhoneVerificationOTP = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!user_id) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const result = yield (0, auth_service_1.sendPhoneVerificationOTPService)(user_id);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, result, 'Phone verification OTP sent successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.sendPhoneVerificationOTP = sendPhoneVerificationOTP;
// -------------------- VERIFY PHONE NUMBER --------------------
const verifyPhone = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!user_id) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const { otp } = req.body;
        if (!otp) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.BAD_REQUEST, false, 'OTP is required');
            return;
        }
        const result = yield (0, auth_service_1.verifyPhoneService)(user_id, otp);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, result, 'Phone number verified successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.verifyPhone = verifyPhone;
