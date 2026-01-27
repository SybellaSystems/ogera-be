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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPhoneService = exports.sendPhoneVerificationOTPService = exports.deleteUserService = exports.deleteSubAdminService = exports.updateSubAdminService = exports.getSubAdminByIdService = exports.getAllSubAdminsService = exports.createSubAdmin = exports.updateProfileService = exports.resendVerificationEmailService = exports.verifyEmailService = exports.getUserProfileService = exports.getAllUsersService = exports.resetPasswordService = exports.verifyResetOTPService = exports.forgotPasswordService = exports.verify2FAUser = exports.generate2FAUser = exports.logoutUser = exports.refreshTokenService = exports.loginUser = exports.addUser = exports.registerUser = void 0;
const auth_repo_1 = __importDefault(require("./auth.repo"));
const bcrypt_1 = require("bcrypt");
const custom_error_1 = require("../../utils/custom-error");
const http_status_codes_1 = require("http-status-codes");
const _2fa_1 = require("../../utils/2fa");
const otp_1 = require("../../utils/otp");
const mailer_1 = require("../../utils/mailer");
const sms_1 = require("../../utils/sms");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../../config");
const emailTemplete_1 = require("../../templete/emailTemplete");
const database_1 = require("../../database");
const sequelize_1 = require("sequelize");
const jwt_service_1 = require("../../middlewares/jwt.service");
// Helper function to map roleName to roleType
const getRoleTypeFromRoleName = (roleName) => {
    switch (roleName) {
        case 'student':
            return 'student';
        case 'employer':
            return 'employer';
        case 'superadmin':
            return 'superAdmin';
        case 'admin':
        case 'subadmin':
            return 'admin';
        default:
            return 'student'; // Default fallback
    }
};
// -------------------- REGISTER USER --------------------
const registerUser = (data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Check if email exists
    const exists = yield auth_repo_1.default.findUserByEmail(data.email);
    if (exists)
        throw new custom_error_1.CustomError('Email already exists', http_status_codes_1.StatusCodes.CONFLICT);
    // Validate terms & privacy
    if (!data.terms || !data.privacy) {
        throw new custom_error_1.CustomError('You must accept Terms of Service and Privacy Policy', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    const hashedPassword = yield (0, bcrypt_1.hash)(data.password, 10);
    // Find role by roleType (student or employer) instead of roleName
    // This allows users to register and get assigned to the appropriate role
    const role = yield database_1.DB.Roles.findOne({
        where: { roleType: data.role }, // data.role is "student" or "employer"
    });
    if (!role) {
        throw new custom_error_1.CustomError(`No role found for ${data.role}. Please create a role with roleType "${data.role}" first.`, http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    // Validate roleType - must be one of the allowed values
    const allowedRoleTypes = ['student', 'employer', 'superAdmin', 'admin'];
    if (!allowedRoleTypes.includes(role.roleType)) {
        throw new custom_error_1.CustomError(`Invalid roleType: ${role.roleType}. Must be one of: ${allowedRoleTypes.join(', ')}`, http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    // Generate email verification token
    const verificationToken = jsonwebtoken_1.default.sign({ email: data.email, type: 'email_verification' }, config_1.JWT_ACCESS_TOKEN_SECRET, { expiresIn: '24h' });
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const user = yield auth_repo_1.default.createUser({
        full_name: ((_a = data.full_name) === null || _a === void 0 ? void 0 : _a.trim()) || '',
        email: data.email,
        mobile_number: data.mobile_number,
        national_id_number: data.national_id_number,
        business_registration_id: data.business_registration_id || null,
        password_hash: hashedPassword,
        role_id: role.id,
        role_type: role.roleType,
        email_verified: false,
        email_verification_token: verificationToken,
        email_verification_token_expiry: verificationTokenExpiry,
        /* ⭐ LEGAL */
        terms_accepted: true,
        privacy_accepted: true,
        terms_accepted_at: new Date(),
        privacy_accepted_at: new Date(),
    });
    // Send verification email
    const frontendUrl = config_1.FRONTEND_URL || 'http://localhost:5173';
    const verificationLink = `${frontendUrl}/auth/verify-email?token=${verificationToken}`;
    const { html, text } = (0, emailTemplete_1.EmailVerificationTemplate)(verificationLink, verificationTokenExpiry);
    try {
        yield (0, mailer_1.sendMail)({
            to: data.email,
            subject: 'Verify Your Email Address',
            text,
            html,
        });
    }
    catch (error) {
        // Log error but don't fail registration
        console.error('Failed to send verification email:', error);
    }
    return { user };
});
exports.registerUser = registerUser;
// -------------------- ADD USER (ADMIN/SUPERADMIN) --------------------
const addUser = (data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Check if email exists
    const exists = yield auth_repo_1.default.findUserByEmail(data.email);
    if (exists)
        throw new custom_error_1.CustomError('Email already exists', http_status_codes_1.StatusCodes.CONFLICT);
    const hashedPassword = yield (0, bcrypt_1.hash)(data.password, 10);
    const role = yield database_1.DB.Roles.findOne({
        where: { roleName: data.role },
    });
    if (!role)
        throw new custom_error_1.CustomError('Invalid role', http_status_codes_1.StatusCodes.BAD_REQUEST);
    // Validate roleType - must be one of the allowed values
    const allowedRoleTypes = ['student', 'employer', 'superAdmin', 'admin'];
    if (!allowedRoleTypes.includes(role.roleType)) {
        throw new custom_error_1.CustomError(`Invalid roleType: ${role.roleType}. Must be one of: ${allowedRoleTypes.join(', ')}`, http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    // Generate email verification token
    const verificationToken = jsonwebtoken_1.default.sign({ email: data.email, type: 'email_verification' }, config_1.JWT_ACCESS_TOKEN_SECRET, { expiresIn: '24h' });
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const user = yield auth_repo_1.default.createUser({
        full_name: ((_a = data.full_name) === null || _a === void 0 ? void 0 : _a.trim()) || '',
        email: data.email,
        mobile_number: data.mobile_number,
        national_id_number: data.national_id_number,
        business_registration_id: data.business_registration_id || null,
        password_hash: hashedPassword,
        role_id: role.id,
        role_type: role.roleType,
        email_verified: false,
        email_verification_token: verificationToken,
        email_verification_token_expiry: verificationTokenExpiry,
        /* ⭐ LEGAL - auto-accept when admin adds user */
        terms_accepted: true,
        privacy_accepted: true,
        terms_accepted_at: new Date(),
        privacy_accepted_at: new Date(),
    });
    // Send verification email
    const frontendUrl = config_1.FRONTEND_URL || 'http://localhost:5173';
    const verificationLink = `${frontendUrl}/auth/verify-email?token=${verificationToken}`;
    const { html, text } = (0, emailTemplete_1.EmailVerificationTemplate)(verificationLink, verificationTokenExpiry);
    try {
        yield (0, mailer_1.sendMail)({
            to: data.email,
            subject: 'Verify Your Email Address',
            text,
            html,
        });
    }
    catch (error) {
        // Log error but don't fail user creation
        console.error('Failed to send verification email:', error);
    }
    return { user };
});
exports.addUser = addUser;
// -------------------- LOGIN USER --------------------
const loginUser = (body) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_repo_1.default.findUserByEmail(body.email);
    if (!user)
        throw new custom_error_1.CustomError('Invalid credentials', http_status_codes_1.StatusCodes.UNAUTHORIZED);
    const validPassword = (0, bcrypt_1.compareSync)(body.password, user.password_hash);
    if (!validPassword)
        throw new custom_error_1.CustomError('Invalid credentials', http_status_codes_1.StatusCodes.UNAUTHORIZED);
    const role = yield database_1.DB.Roles.findOne({ where: { id: user.role_id } });
    if (!role)
        throw new custom_error_1.CustomError('User role not found', http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
    const payload = { user_id: user.user_id, role: role.roleName };
    // ---------- 2FA CHECK ----------
    if (user.two_fa_enabled) {
        if (!body.otp) {
            throw new custom_error_1.CustomError('2FA OTP Required', http_status_codes_1.StatusCodes.PARTIAL_CONTENT);
        }
        const otpValid = yield (0, _2fa_1.verifyOTP)(user.user_id, body.otp);
        if (!otpValid)
            throw new custom_error_1.CustomError('Invalid 2FA OTP', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    const accessToken = (0, jwt_service_1.generateAccessToken)(payload);
    const refreshToken = (0, jwt_service_1.generateRefreshToken)(payload); // stateless
    return {
        user,
        accessToken,
        refreshToken,
        two_fa_enabled: user.two_fa_enabled,
    };
});
exports.loginUser = loginUser;
// -------------------- REFRESH TOKEN (STATELESS) --------------------
const refreshTokenService = (refreshToken) => __awaiter(void 0, void 0, void 0, function* () {
    const decoded = (0, jwt_service_1.verifyRefreshToken)(refreshToken);
    const payload = {
        user_id: decoded.user_id,
        role: decoded.role,
    };
    // Generate new tokens
    const newAccessToken = (0, jwt_service_1.generateAccessToken)(payload);
    const newRefreshToken = (0, jwt_service_1.generateRefreshToken)(payload); // rotation
    return {
        newAccessToken,
        newRefreshToken,
    };
});
exports.refreshTokenService = refreshTokenService;
// -------------------- LOGOUT --------------------
const logoutUser = () => __awaiter(void 0, void 0, void 0, function* () {
    // Stateless logout → clear cookie only
    return { message: 'Logged out successfully' };
});
exports.logoutUser = logoutUser;
// -------------------- 2FA SETUP --------------------
const generate2FAUser = (user_id, email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_repo_1.default.findUserById(user_id);
    if (!user)
        throw new custom_error_1.CustomError('User not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    const { secret, qrCodeUrl } = yield (0, _2fa_1.generate2FASecret)(user_id, email);
    return { secret, qrCodeUrl };
});
exports.generate2FAUser = generate2FAUser;
// -------------------- 2FA VERIFY --------------------
const verify2FAUser = (user_id, token) => __awaiter(void 0, void 0, void 0, function* () {
    const valid = yield (0, _2fa_1.verifyOTP)(user_id, token);
    if (!valid)
        throw new custom_error_1.CustomError('Invalid OTP', http_status_codes_1.StatusCodes.BAD_REQUEST);
    yield (0, _2fa_1.enable2FA)(user_id);
    return { success: true };
});
exports.verify2FAUser = verify2FAUser;
// -------------------- FORGOT PASSWORD --------------------
const forgotPasswordService = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_repo_1.default.findUserByEmail(email);
    if (!user)
        throw new custom_error_1.CustomError('User not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    const otp = (0, otp_1.generateNumericOTP)(4);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    yield auth_repo_1.default.updateUser(user.user_id, {
        reset_otp: otp,
        reset_otp_expiry: otpExpiry,
    });
    const resetToken = jsonwebtoken_1.default.sign({ email }, config_1.JWT_ACCESS_TOKEN_SECRET, {
        expiresIn: '15m',
    });
    const { html, text } = (0, emailTemplete_1.EmailTemplete)(otp, otpExpiry);
    yield (0, mailer_1.sendMail)({
        to: email,
        subject: 'Password Reset OTP',
        text,
        html,
    });
    return { resetToken };
});
exports.forgotPasswordService = forgotPasswordService;
// -------------------- VERIFY RESET OTP --------------------
const verifyResetOTPService = (otp, resetToken) => __awaiter(void 0, void 0, void 0, function* () {
    const decoded = jsonwebtoken_1.default.verify(resetToken, config_1.JWT_ACCESS_TOKEN_SECRET);
    const user = yield auth_repo_1.default.findUserByEmail(decoded.email);
    if (!user)
        throw new custom_error_1.CustomError('User not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    if (user.reset_otp !== otp)
        throw new custom_error_1.CustomError('Invalid OTP', http_status_codes_1.StatusCodes.BAD_REQUEST);
    if (!user.reset_otp_expiry ||
        Date.now() > user.reset_otp_expiry.getTime()) {
        throw new custom_error_1.CustomError('OTP expired', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
});
exports.verifyResetOTPService = verifyResetOTPService;
// -------------------- RESET PASSWORD --------------------
const resetPasswordService = (newPassword, resetToken) => __awaiter(void 0, void 0, void 0, function* () {
    const decoded = jsonwebtoken_1.default.verify(resetToken, config_1.JWT_ACCESS_TOKEN_SECRET);
    const user = yield auth_repo_1.default.findUserByEmail(decoded.email);
    if (!user)
        throw new custom_error_1.CustomError('User not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    const hashedPassword = yield (0, bcrypt_1.hash)(newPassword, 10);
    yield auth_repo_1.default.updateUser(user.user_id, {
        password_hash: hashedPassword,
        reset_otp: null,
        reset_otp_expiry: null,
    });
});
exports.resetPasswordService = resetPasswordService;
const getAllUsersService = (_a, _currentUserRole_1, roleWhere_1) => __awaiter(void 0, [_a, _currentUserRole_1, roleWhere_1], void 0, function* ({ page, limit, type }, _currentUserRole, roleWhere) {
    let whereCondition = undefined;
    // Handle type parameter: filter by roleType if type is provided.
    // Type parameter takes precedence over roleWhere.
    if (type && type !== 'all') {
        // Map frontend type values to backend roleType values
        const typeToRoleType = {
            Student: 'student',
            Employer: 'employer',
            student: 'student',
            employer: 'employer',
        };
        const roleType = typeToRoleType[type];
        if (roleType) {
            // Set the whereCondition to filter by the specific roleType
            whereCondition = {
                roleType,
            };
        }
    }
    else if (roleWhere) {
        // Use roleWhere if provided and no type filter
        whereCondition = roleWhere;
    }
    else {
        // Default behaviour for "All Users" views:
        // always restrict to end‑users (students + employers) and
        // exclude any admin / superAdmin accounts. Admins are managed
        // separately via the admin management endpoints.
        whereCondition = {
            roleType: {
                [sequelize_1.Op.in]: ['student', 'employer'],
            },
        };
    }
    const { rows, count } = yield auth_repo_1.default.findAllUsers({
        page,
        limit,
        roleWhere: whereCondition,
    });
    console.log('rows', rows);
    console.log("hello this is console log");
    // break;
    // Get counts for students and employers to include in response
    const roleCounts = yield auth_repo_1.default.getRoleCounts();
    return {
        data: rows,
        pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
        },
        counts: {
            students: roleCounts.studentCount,
            employers: roleCounts.employerCount,
        },
    };
});
exports.getAllUsersService = getAllUsersService;
// export const getAllStudentsService = async (
//     { page, limit, type }: PaginationQuery & { type?: number },
//     roleWhere?: any,
// ) => {
//     const { rows, count } = await repo.findAllUsers({
//         page,
//         limit,
//         roleWhere: roleWhere || { roleType: 'student' },
//         type: 'student' as 'student',
//     });
//     return {
//         data: rows,
//         pagination: {
//             total: count,
//             page,
//             limit,
//             totalPages: Math.ceil(count / limit),
//         },
//     };
// };
// export const getAllEmployersService = async (
//     { page, limit, type }: PaginationQuery & { type?: number },
//     roleWhere?: any,
// ) => {
//     const { rows, count } = await repo.findAllUsers({
//         page,
//         limit,
//         roleWhere: roleWhere || { roleType: 'employer' },
//         type: 'employer' as 'employer',
//     });
//     return {
//         data: rows,
//         pagination: {
//             total: count,
//             page,
//             limit,
//             totalPages: Math.ceil(count / limit),
//         },
//     };
// };
// -------------------- GET USER PROFILE --------------------
const getUserProfileService = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_repo_1.default.findUserProfileById(user_id);
    if (!user)
        throw new custom_error_1.CustomError('User not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    return user;
});
exports.getUserProfileService = getUserProfileService;
// -------------------- VERIFY EMAIL --------------------
const verifyEmailService = (token) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.JWT_ACCESS_TOKEN_SECRET);
        if (decoded.type !== 'email_verification') {
            throw new custom_error_1.CustomError('Invalid token type', http_status_codes_1.StatusCodes.BAD_REQUEST);
        }
        const user = yield auth_repo_1.default.findUserByEmail(decoded.email);
        if (!user)
            throw new custom_error_1.CustomError('User not found', http_status_codes_1.StatusCodes.NOT_FOUND);
        // Check if token matches and is not expired
        if (user.email_verification_token !== token) {
            throw new custom_error_1.CustomError('Invalid verification token', http_status_codes_1.StatusCodes.BAD_REQUEST);
        }
        if (!user.email_verification_token_expiry ||
            Date.now() > user.email_verification_token_expiry.getTime()) {
            throw new custom_error_1.CustomError('Verification token expired', http_status_codes_1.StatusCodes.BAD_REQUEST);
        }
        // Verify the email
        yield auth_repo_1.default.updateUser(user.user_id, {
            email_verified: true,
            email_verification_token: null,
            email_verification_token_expiry: null,
        });
        return { success: true };
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new custom_error_1.CustomError('Invalid or expired token', http_status_codes_1.StatusCodes.BAD_REQUEST);
        }
        throw error;
    }
});
exports.verifyEmailService = verifyEmailService;
// -------------------- RESEND VERIFICATION EMAIL --------------------
const resendVerificationEmailService = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_repo_1.default.findUserByEmail(email);
    if (!user)
        throw new custom_error_1.CustomError('User not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    if (user.email_verified) {
        throw new custom_error_1.CustomError('Email already verified', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    // Generate new verification token
    const verificationToken = jsonwebtoken_1.default.sign({ email: user.email, type: 'email_verification' }, config_1.JWT_ACCESS_TOKEN_SECRET, { expiresIn: '24h' });
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    // Update user with new token
    yield auth_repo_1.default.updateUser(user.user_id, {
        email_verification_token: verificationToken,
        email_verification_token_expiry: verificationTokenExpiry,
    });
    // Send verification email
    const frontendUrl = config_1.FRONTEND_URL || 'http://localhost:5173';
    const verificationLink = `${frontendUrl}/auth/verify-email?token=${verificationToken}`;
    const { html, text } = (0, emailTemplete_1.EmailVerificationTemplate)(verificationLink, verificationTokenExpiry);
    yield (0, mailer_1.sendMail)({
        to: user.email,
        subject: 'Verify Your Email Address',
        text,
        html,
    });
    return { success: true, message: 'Verification email sent successfully' };
});
exports.resendVerificationEmailService = resendVerificationEmailService;
// -------------------- UPDATE USER PROFILE --------------------
const updateProfileService = (user_id, data) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user exists
    const user = yield auth_repo_1.default.findUserById(user_id);
    if (!user)
        throw new custom_error_1.CustomError('User not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    // If email is being updated, check if it's already taken by another user
    const emailChanged = data.email && data.email !== user.email;
    if (emailChanged && data.email) {
        const emailExists = yield auth_repo_1.default.findUserByEmail(data.email);
        if (emailExists && emailExists.user_id !== user_id) {
            throw new custom_error_1.CustomError('Email already exists', http_status_codes_1.StatusCodes.CONFLICT);
        }
    }
    // Prepare update data (only include fields that are provided)
    const updateData = {};
    // Use full_name exactly as provided, trimmed but no modifications (never add "Doe" or default last name)
    if (data.full_name !== undefined) {
        updateData.full_name = data.full_name.trim();
    }
    // If mobile number is being updated, reset phone verification
    const phoneChanged = data.mobile_number && data.mobile_number !== user.mobile_number;
    if (phoneChanged) {
        updateData.mobile_number = data.mobile_number;
        updateData.phone_verified = false;
        updateData.phone_verification_otp = null;
        updateData.phone_verification_otp_expiry = null;
    }
    else if (data.mobile_number !== undefined) {
        updateData.mobile_number = data.mobile_number;
    }
    if (data.national_id_number !== undefined)
        updateData.national_id_number = data.national_id_number;
    if (data.business_registration_id !== undefined)
        updateData.business_registration_id = data.business_registration_id;
    if (data.resume_url !== undefined)
        updateData.resume_url = data.resume_url;
    if (data.cover_letter !== undefined)
        updateData.cover_letter = data.cover_letter;
    if (data.preferred_location !== undefined)
        updateData.preferred_location = data.preferred_location;
    // If email is being changed, generate verification token and mark as unverified
    if (emailChanged && data.email) {
        const verificationToken = jsonwebtoken_1.default.sign({ email: data.email, type: 'email_verification' }, config_1.JWT_ACCESS_TOKEN_SECRET, { expiresIn: '24h' });
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        updateData.email = data.email;
        updateData.email_verified = false;
        updateData.email_verification_token = verificationToken;
        updateData.email_verification_token_expiry = verificationTokenExpiry;
        // Send verification email to new email
        const frontendUrl = config_1.FRONTEND_URL || 'http://localhost:5173';
        const verificationLink = `${frontendUrl}/auth/verify-email?token=${verificationToken}`;
        const { html, text } = (0, emailTemplete_1.EmailVerificationTemplate)(verificationLink, verificationTokenExpiry);
        try {
            yield (0, mailer_1.sendMail)({
                to: data.email,
                subject: 'Verify Your New Email Address',
                text,
                html,
            });
        }
        catch (error) {
            // Log error but don't fail update
            console.error('Failed to send verification email:', error);
        }
    }
    // Update the user
    yield auth_repo_1.default.updateUser(user_id, updateData);
    // Return updated profile
    const updatedUser = yield auth_repo_1.default.findUserProfileById(user_id);
    if (!updatedUser)
        throw new custom_error_1.CustomError('User not found after update', http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
    return updatedUser;
});
exports.updateProfileService = updateProfileService;
// -------------------- CREATE SUBADMIN (SUPERADMIN ONLY) --------------------
const createSubAdmin = (data, currentUserRole) => __awaiter(void 0, void 0, void 0, function* () {
    // Only superadmin can create roles
    if (currentUserRole && currentUserRole.toLowerCase() !== 'superadmin') {
        throw new custom_error_1.CustomError('Only superadmin can create roles', http_status_codes_1.StatusCodes.FORBIDDEN);
    }
    // Check if email exists
    const exists = yield auth_repo_1.default.findUserByEmail(data.email);
    if (exists)
        throw new custom_error_1.CustomError('Email already exists', http_status_codes_1.StatusCodes.CONFLICT);
    const hashedPassword = yield (0, bcrypt_1.hash)(data.password, 10);
    // Find the role first
    let role = yield database_1.DB.Roles.findOne({
        where: { roleName: data.role },
    });
    // If role exists, validate that it has admin roleType
    if (role) {
        if (role.roleType !== 'admin' && role.roleType !== 'superAdmin') {
            throw new custom_error_1.CustomError('Role must have admin or superAdmin roleType', http_status_codes_1.StatusCodes.BAD_REQUEST);
        }
    }
    else {
        // If role doesn't exist, validate that it's an admin-type role before creating
        // Check if the role name suggests it's an admin role, or allow common admin roles
        const allowedAdminRoles = [
            'subadmin',
            'admin',
            'marketingSubAdmin',
            'verifyDocAdmin',
            'verifyAdmin',
        ];
        const isAdminRole = allowedAdminRoles.includes(data.role) ||
            data.role.toLowerCase().includes('admin');
        if (!isAdminRole) {
            throw new custom_error_1.CustomError('Role must be an admin-type role (subadmin, admin, verifyDocAdmin, etc.)', http_status_codes_1.StatusCodes.BAD_REQUEST);
        }
    }
    if (!role) {
        // Only superadmin can create roles
        if (currentUserRole && currentUserRole.toLowerCase() !== 'superadmin') {
            throw new custom_error_1.CustomError('Only superadmin can create roles', http_status_codes_1.StatusCodes.FORBIDDEN);
        }
        // Create the role if it doesn't exist
        role = yield database_1.DB.Roles.create({
            roleName: data.role,
            roleType: getRoleTypeFromRoleName(data.role),
            permission_json: JSON.stringify([]),
        });
    }
    // Use provided full_name, or email prefix if not provided (never add "Doe" or default last name)
    const fullName = data.full_name
        ? data.full_name.trim() // Use provided name as-is, no modifications
        : data.email.split('@')[0]; // Use email prefix only if no name provided
    // Create subadmin user with default values for required fields
    const user = yield auth_repo_1.default.createUser({
        email: data.email,
        password_hash: hashedPassword,
        role_id: role.id,
        role_type: role.roleType, // Save role_type from the role's roleType
        full_name: fullName, // Use provided name or email prefix, never add "Doe"
        mobile_number: '0000000000', // Placeholder for required field
        terms_accepted: true,
        privacy_accepted: true,
        terms_accepted_at: new Date(),
        privacy_accepted_at: new Date(),
    });
    return { user };
});
exports.createSubAdmin = createSubAdmin;
// -------------------- GET ALL SUBADMINS (SUPERADMIN ONLY) --------------------
const getAllSubAdminsService = (_a) => __awaiter(void 0, [_a], void 0, function* ({ page, limit, }) {
    const { rows, count } = yield auth_repo_1.default.findAllSubAdmins({ page, limit });
    if (!rows.length)
        throw new custom_error_1.CustomError('No subadmins found', http_status_codes_1.StatusCodes.NOT_FOUND);
    return {
        data: rows,
        pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
        },
    };
});
exports.getAllSubAdminsService = getAllSubAdminsService;
// -------------------- GET SUBADMIN BY ID (SUPERADMIN ONLY) --------------------
const getSubAdminByIdService = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = yield auth_repo_1.default.findUserProfileById(user_id);
    if (!user)
        throw new custom_error_1.CustomError('Admin not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    // Check if user is an admin-type account (roleType === 'admin')
    const roleType = (_a = user.role) === null || _a === void 0 ? void 0 : _a.roleType;
    if (roleType !== 'admin') {
        throw new custom_error_1.CustomError('User is not an admin', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    return user;
});
exports.getSubAdminByIdService = getSubAdminByIdService;
// -------------------- UPDATE SUBADMIN (SUPERADMIN ONLY) --------------------
const updateSubAdminService = (user_id, data, currentUserRole) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user exists and is a subadmin
    const user = yield auth_repo_1.default.findUserById(user_id);
    if (!user)
        throw new custom_error_1.CustomError('Admin not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    // Verify user is an admin-type account
    const role = yield database_1.DB.Roles.findOne({ where: { id: user.role_id } });
    if (!role || role.roleType !== 'admin') {
        throw new custom_error_1.CustomError('User is not an admin', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    // If email is being updated, check if it's already taken by another user
    if (data.email && data.email !== user.email) {
        const emailExists = yield auth_repo_1.default.findUserByEmail(data.email);
        if (emailExists && emailExists.user_id !== user_id) {
            throw new custom_error_1.CustomError('Email already exists', http_status_codes_1.StatusCodes.CONFLICT);
        }
    }
    // Prepare update data
    const updateData = {};
    if (data.full_name !== undefined) {
        updateData.full_name = data.full_name.trim();
    }
    if (data.email !== undefined)
        updateData.email = data.email;
    if (data.mobile_number !== undefined)
        updateData.mobile_number = data.mobile_number;
    if (data.password !== undefined) {
        updateData.password_hash = yield (0, bcrypt_1.hash)(data.password, 10);
    }
    // If role is being updated, validate and update role_id
    if (data.role !== undefined) {
        if (data.role !== 'subadmin' && data.role !== 'admin') {
            throw new custom_error_1.CustomError('Role must be either subadmin or admin', http_status_codes_1.StatusCodes.BAD_REQUEST);
        }
        let newRole = yield database_1.DB.Roles.findOne({
            where: { roleName: data.role },
        });
        if (!newRole) {
            // Only superadmin can create roles
            if (currentUserRole &&
                currentUserRole.toLowerCase() !== 'superadmin') {
                throw new custom_error_1.CustomError('Only superadmin can create roles', http_status_codes_1.StatusCodes.FORBIDDEN);
            }
            newRole = yield database_1.DB.Roles.create({
                roleName: data.role,
                roleType: getRoleTypeFromRoleName(data.role),
                permission_json: JSON.stringify([]),
            });
        }
        updateData.role_id = newRole.id;
    }
    // Update the subadmin
    yield auth_repo_1.default.updateUser(user_id, updateData);
    // Return updated profile
    const updatedUser = yield auth_repo_1.default.findUserProfileById(user_id);
    if (!updatedUser)
        throw new custom_error_1.CustomError('Subadmin not found after update', http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
    return updatedUser;
});
exports.updateSubAdminService = updateSubAdminService;
// -------------------- DELETE SUBADMIN (SUPERADMIN ONLY) --------------------
const deleteSubAdminService = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user exists and is a subadmin
    const user = yield auth_repo_1.default.findUserById(user_id);
    if (!user)
        throw new custom_error_1.CustomError('Admin not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    // Verify user is an admin-type account
    const role = yield database_1.DB.Roles.findOne({ where: { id: user.role_id } });
    if (!role || role.roleType !== 'admin') {
        throw new custom_error_1.CustomError('User is not an admin', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    // Delete the subadmin
    yield auth_repo_1.default.deleteUser(user_id);
    return { message: 'Subadmin deleted successfully' };
});
exports.deleteSubAdminService = deleteSubAdminService;
// -------------------- DELETE USER (ADMIN/SUPERADMIN ONLY) --------------------
const deleteUserService = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user exists
    const user = yield auth_repo_1.default.findUserById(user_id);
    if (!user)
        throw new custom_error_1.CustomError('User not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    // Delete the user
    yield auth_repo_1.default.deleteUser(user_id);
    return { message: 'User deleted successfully' };
});
exports.deleteUserService = deleteUserService;
// -------------------- SEND PHONE VERIFICATION OTP --------------------
const sendPhoneVerificationOTPService = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_repo_1.default.findUserById(user_id);
    if (!user)
        throw new custom_error_1.CustomError('User not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    if (user.phone_verified) {
        throw new custom_error_1.CustomError('Phone number already verified', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    // Generate OTP
    const otp = (0, otp_1.generateNumericOTP)(6);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    // Store OTP in user record
    yield auth_repo_1.default.updateUser(user_id, {
        phone_verification_otp: otp,
        phone_verification_otp_expiry: otpExpiry,
    });
    // Send OTP via SMS
    try {
        yield (0, sms_1.sendOTPSMS)(user.mobile_number, otp);
    }
    catch (smsError) {
        // Log error but don't fail the request - OTP is still stored
        console.error('Failed to send SMS:', smsError.message);
        // In development, return OTP in response if SMS fails
        if (process.env.NODE_ENV === 'development') {
            return {
                success: true,
                message: 'Verification OTP generated successfully (SMS send failed - check console)',
                otp: otp,
            };
        }
        // In production, still return success but don't expose OTP
        // The OTP is stored and user can request a new one if SMS fails
    }
    return {
        success: true,
        message: 'Verification OTP sent to your phone number successfully',
        // Only return OTP in development mode for testing
        otp: process.env.NODE_ENV === 'development' ? otp : undefined,
    };
});
exports.sendPhoneVerificationOTPService = sendPhoneVerificationOTPService;
// -------------------- VERIFY PHONE NUMBER --------------------
const verifyPhoneService = (user_id, otp) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_repo_1.default.findUserById(user_id);
    if (!user)
        throw new custom_error_1.CustomError('User not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    if (user.phone_verified) {
        throw new custom_error_1.CustomError('Phone number already verified', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    if (!user.phone_verification_otp) {
        throw new custom_error_1.CustomError('No verification OTP found. Please request a new OTP.', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    if (user.phone_verification_otp !== otp) {
        throw new custom_error_1.CustomError('Invalid OTP', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    if (!user.phone_verification_otp_expiry ||
        Date.now() > user.phone_verification_otp_expiry.getTime()) {
        throw new custom_error_1.CustomError('OTP expired', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    // Verify the phone number
    yield auth_repo_1.default.updateUser(user_id, {
        phone_verified: true,
        phone_verification_otp: null,
        phone_verification_otp_expiry: null,
    });
    return { success: true, message: 'Phone number verified successfully' };
});
exports.verifyPhoneService = verifyPhoneService;
