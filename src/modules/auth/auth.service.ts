import repo from './auth.repo';
import { hash, compareSync } from 'bcrypt';
import { CustomError } from '@/utils/custom-error';
import { StatusCodes } from 'http-status-codes';
import { DB } from '@/database';

import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} from '@/middlewares/jwt.service';

import { generate2FASecret, verifyOTP, enable2FA } from '@/utils/2fa';

import { generateNumericOTP } from '@/utils/otp';
import { sendMail } from '@/utils/mailer';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWT_ACCESS_TOKEN_SECRET as JWT_SECRET } from '@/config';
import { EmailTemplete } from '@/templete/emailTemplete';

interface ResetTokenPayload extends JwtPayload {
    email: string;
}

// -------------------- REGISTER USER --------------------
export const registerUser = async (data: any) => {
    // Check if email exists
    const exists = await repo.findUserByEmail(data.email);
    if (exists)
        throw new CustomError('Email already exists', StatusCodes.CONFLICT);

    // Validate terms & privacy
    if (!data.terms || !data.privacy) {
        throw new CustomError(
            'You must accept Terms of Service and Privacy Policy',
            StatusCodes.BAD_REQUEST,
        );
    }

    const hashedPassword = await hash(data.password, 10);

    const role = await DB.Roles.findOne({
        where: { roleName: data.role },
    });

    if (!role) throw new CustomError('Invalid role', StatusCodes.BAD_REQUEST);

    const user = await repo.createUser({
        full_name: data.full_name,
        email: data.email,
        mobile_number: data.mobile_number,
        national_id_number: data.national_id_number,
        business_registration_id: data.business_registration_id || null,
        password_hash: hashedPassword,
        role_id: role.id,

        /* ⭐ LEGAL */
        terms_accepted: true,
        privacy_accepted: true,
        terms_accepted_at: new Date(),
        privacy_accepted_at: new Date(),
    });

    return { user };
};

// -------------------- LOGIN USER --------------------
export const loginUser = async (body: any) => {
    const user = await repo.findUserByEmail(body.email);
    if (!user)
        throw new CustomError('Invalid credentials', StatusCodes.UNAUTHORIZED);

    const validPassword = compareSync(body.password, user.password_hash);
    if (!validPassword)
        throw new CustomError('Invalid credentials', StatusCodes.UNAUTHORIZED);

    const role = await DB.Roles.findOne({ where: { id: user.role_id } });
    if (!role)
        throw new CustomError(
            'User role not found',
            StatusCodes.INTERNAL_SERVER_ERROR,
        );

    const payload = { user_id: user.user_id, role: role.roleName };

    // ---------- 2FA CHECK ----------
    if (user.two_fa_enabled) {
        if (!body.otp) {
            throw new CustomError(
                '2FA OTP Required',
                StatusCodes.PARTIAL_CONTENT,
            );
        }

        const otpValid = await verifyOTP(user.user_id, body.otp);
        if (!otpValid)
            throw new CustomError('Invalid 2FA OTP', StatusCodes.BAD_REQUEST);
    }

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload); // stateless

    return {
        user,
        accessToken,
        refreshToken,
        two_fa_enabled: user.two_fa_enabled,
    };
};

// -------------------- REFRESH TOKEN (STATELESS) --------------------
export const refreshTokenService = async (refreshToken: string) => {
    const decoded = verifyRefreshToken(refreshToken);

    const payload = {
        user_id: decoded.user_id,
        role: decoded.role,
    };

    // Generate new tokens
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload); // rotation

    return {
        newAccessToken,
        newRefreshToken,
    };
};

// -------------------- LOGOUT --------------------
export const logoutUser = async () => {
    // Stateless logout → clear cookie only
    return { message: 'Logged out successfully' };
};

// -------------------- 2FA SETUP --------------------
export const generate2FAUser = async (user_id: string, email: string) => {
    const user = await repo.findUserById(user_id);
    if (!user) throw new CustomError('User not found', StatusCodes.NOT_FOUND);

    const { secret, qrCodeUrl } = await generate2FASecret(user_id, email);
    return { secret, qrCodeUrl };
};

// -------------------- 2FA VERIFY --------------------
export const verify2FAUser = async (user_id: string, token: string) => {
    const valid = await verifyOTP(user_id, token);
    if (!valid) throw new CustomError('Invalid OTP', StatusCodes.BAD_REQUEST);

    await enable2FA(user_id);

    return { success: true };
};

// -------------------- FORGOT PASSWORD --------------------
export const forgotPasswordService = async (email: string) => {
    const user = await repo.findUserByEmail(email);
    if (!user) throw new CustomError('User not found', StatusCodes.NOT_FOUND);

    const otp = generateNumericOTP(4);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await repo.updateUser(user.user_id, {
        reset_otp: otp,
        reset_otp_expiry: otpExpiry,
    });

    const resetToken = jwt.sign({ email }, JWT_SECRET as string, {
        expiresIn: '15m',
    });

    const { html, text } = EmailTemplete(otp, otpExpiry);

    await sendMail(email, 'Password Reset OTP', text, html);

    return { resetToken };
};

// -------------------- VERIFY RESET OTP --------------------
export const verifyResetOTPService = async (
    otp: string,
    resetToken: string,
) => {
    const decoded = jwt.verify(
        resetToken,
        JWT_SECRET as string,
    ) as ResetTokenPayload;

    const user = await repo.findUserByEmail(decoded.email);
    if (!user) throw new CustomError('User not found', StatusCodes.NOT_FOUND);

    if (user.reset_otp !== otp)
        throw new CustomError('Invalid OTP', StatusCodes.BAD_REQUEST);

    if (
        !user.reset_otp_expiry ||
        Date.now() > user.reset_otp_expiry.getTime()
    ) {
        throw new CustomError('OTP expired', StatusCodes.BAD_REQUEST);
    }
};

// -------------------- RESET PASSWORD --------------------
export const resetPasswordService = async (
    newPassword: string,
    resetToken: string,
) => {
    const decoded = jwt.verify(
        resetToken,
        JWT_SECRET as string,
    ) as ResetTokenPayload;

    const user = await repo.findUserByEmail(decoded.email);
    if (!user) throw new CustomError('User not found', StatusCodes.NOT_FOUND);

    const hashedPassword = await hash(newPassword, 10);

    await repo.updateUser(user.user_id, {
        password_hash: hashedPassword,
        reset_otp: null,
        reset_otp_expiry: null,
    });
};
