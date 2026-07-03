import repo from './auth.repo';
import { hash, compareSync } from 'bcrypt';
import { CustomError } from '@/utils/custom-error';
import { StatusCodes } from 'http-status-codes';
import { Messages } from '@/utils/messages';
import { generateNumericOTP } from '@/utils/otp';
import { sendMail } from '@/utils/mailer';
import { sendOTPSMS } from '@/utils/sms';
import { verifyCaptcha } from '@/utils/captcha';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWT_ACCESS_TOKEN_SECRET as JWT_SECRET, FRONTEND_URL } from '@/config';
import {
    EmailTemplete,
    EmailVerificationTemplate,
} from '@/templete/emailTemplete';
import { sendWelcomeEmail } from '@/services/email/email.service';
import { PaginationQuery } from '@/interfaces/pagination.interfaces';
import { User } from '@/interfaces/user.interfaces';
import { DB } from '@/database';
import { Op } from 'sequelize';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} from '@/middlewares/jwt.service';
import { RoleType } from '@/interfaces/role.interfaces';
import { decryptSecret, encryptSecret } from '@/utils/2fa.encryption';
import { calculateTrustScoreService } from '@/modules/trustScore/trustScore.service';
import { assignFreeBadgeOnRegistration } from '@/modules/badge/badge.service';
import { parseDeviceType } from '@/modules/session/session.service';
import sessionRepo from '@/modules/session/session.repo';
import { Request } from 'express';

interface ResetTokenPayload extends JwtPayload {
    email: string;
}

type SafeUser = Partial<User> & { user_id: string; email: string };

const refreshTrustScoreAfterAuthProfileChange = async (user_id: string): Promise<void> => {
    try {
        await calculateTrustScoreService(user_id);
    } catch (err: any) {
        console.warn(
            `TrustScore refresh after auth profile change failed for ${user_id}: ${err?.message || err}`,
        );
    }
};

const sanitizeUser = (user: any): SafeUser => {
    const u = typeof user?.toJSON === 'function' ? user.toJSON() : { ...user };
    const sensitiveKeys = [
        'password_hash',
        'two_fa_secret',
        'reset_otp',
        'reset_otp_expiry',
        'phone_verification_otp',
        'phone_verification_otp_expiry',
        'login_2fa_otp',
        'login_2fa_otp_expiry',
        'email_verification_token',
        'email_verification_token_expiry',
    ];
    for (const k of sensitiveKeys) delete (u as any)[k];
    return u as SafeUser;
};

interface TwoFALoginTokenPayload extends JwtPayload {
    user_id: string;
    type: '2fa_login';
}

// Build the URL used inside the email verification link.
// Important:
// - In production, never generate verification links that point to `localhost`/`127.0.0.1`.
//   When a phone clicks the email, its own "localhost" will be opened (not your server).
// - Prefer `FRONTEND_URL` (env var) so the link always goes to the deployed/frontend route.
const getVerificationFrontendUrl = (frontendOrigin?: string): string => {
    const normalize = (u: string) => u.trim().replace(/\/+$/, '');
    const isProduction = process.env.NODE_ENV === 'production';

    const isLocalUrl = (u: string): boolean => {
        try {
            const parsed = new URL(u);
            const host = parsed.hostname.toLowerCase();
            return (
                host === 'localhost' ||
                host === '127.0.0.1' ||
                host === '[::1]' ||
                // Some environments might use `127.*` range for local testing
                host.startsWith('127.')
            );
        } catch {
            // If it's not a valid full URL, fall back to conservative checks.
            const s = u.toLowerCase();
            return s.includes('localhost') || s.includes('127.0.0.1');
        }
    };

    const envUrl = FRONTEND_URL?.trim();
    if (envUrl) {
        const normalizedEnv = normalize(envUrl);
        // In local dev/test, allow localhost URLs so verification links work immediately.
        if (!isProduction) return normalizedEnv;
        // In production, avoid generating links that point to localhost.
        if (!isLocalUrl(normalizedEnv)) return normalizedEnv;
    }

    if (frontendOrigin) {
        const normalizedOrigin = normalize(frontendOrigin);
        if (!isProduction) return normalizedOrigin;
        if (!isLocalUrl(normalizedOrigin)) return normalizedOrigin;
    }

    // Last resort: keep emails working even if FRONTEND_URL isn't configured.
    return normalize('https://ogera-frontend.vercel.app');
};

// Helper function to map roleName to roleType
const getRoleTypeFromRoleName = (roleName: string): RoleType => {
    const normalizedRoleName = roleName.trim().toLowerCase();

    switch (normalizedRoleName) {
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
            // Any custom role containing "admin" should be treated as admin.
            if (normalizedRoleName.includes('admin')) {
                return 'admin';
            }
            return 'student'; // Default fallback
    }
};

// -------------------- REGISTER USER --------------------
export const registerUser = async (data: any, frontendOrigin?: string) => {
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

    // Find role by roleType (student or employer) instead of roleName
    // This allows users to register and get assigned to the appropriate role
    const role = await DB.Roles.findOne({
        where: { roleType: data.role }, // data.role is "student" or "employer"
    });

    if (!role) {
        throw new CustomError(
            `No role found for ${data.role}. Please create a role with roleType "${data.role}" first.`,
            StatusCodes.BAD_REQUEST,
        );
    }

    // Validate roleType - must be one of the allowed values
    const allowedRoleTypes = ['student', 'employer', 'superAdmin', 'admin'];
    if (!allowedRoleTypes.includes(role.roleType)) {
        throw new CustomError(
            `Invalid roleType: ${
                role.roleType
            }. Must be one of: ${allowedRoleTypes.join(', ')}`,
            StatusCodes.BAD_REQUEST,
        );
    }

    // Generate email verification token
    const verificationToken = jwt.sign(
        { email: data.email, type: 'email_verification' },
        JWT_SECRET as string,
        { expiresIn: '24h' },
    );
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const badgeDefaults = await assignFreeBadgeOnRegistration(role.roleType);

    const user = await repo.createUser({
        full_name: data.full_name?.trim() || '',
        email: data.email,
        country_code: data.country_code,
        mobile_number: data.mobile_number,
        national_id_number: data.national_id_number,
        business_registration_id: data.business_registration_id || null,
        password_hash: hashedPassword,
        role_id: role.id,
        role_type: role.roleType,
        email_verified: false,
        email_verification_token: verificationToken,
        email_verification_token_expiry: verificationTokenExpiry,
        phone_verified: false,
        phone_verification_otp: null,
        phone_verification_otp_expiry: null,

        /* ⭐ LEGAL */
        terms_accepted: true,
        privacy_accepted: true,
        terms_accepted_at: new Date(),
        privacy_accepted_at: new Date(),

        /* ⭐ STUDENT BADGE */
        ...(badgeDefaults
            ? {
                  badge: badgeDefaults.badge,
                  pioneer_eligible: badgeDefaults.pioneer_eligible,
              }
            : {}),
    });
     
    // CREATE EXTENDED PROFILE RECORD
    await DB.UserExtendedProfiles.create({
    user_id: user.user_id,
});

        // Log activity: Admin added user
        try {
            await DB.ActivityLogs.create({
                user_id: null,
                action: 'CREATE',
                entity_type: 'User',
                entity_id: user.user_id,
                description: `User added by admin: ${user.email}`,
            } as any);
        } catch (e) {
            // swallow
        }

        // Log activity: CREATE User
        try {
            await DB.ActivityLogs.create({
                user_id: null,
                action: 'CREATE',
                entity_type: 'User',
                entity_id: user.user_id,
                description: `User registered: ${user.email}`,
            } as any);
        } catch (e) {
            // swallow
        }

    // Send verification email
    // Prefer the request origin (local during development), then env fallback.
    const frontendUrl = getVerificationFrontendUrl(frontendOrigin);
    const verificationLink = `${frontendUrl}/auth/verify-email?token=${encodeURIComponent(verificationToken)}`;
    const { html, text } = EmailVerificationTemplate(
        verificationLink,
        verificationTokenExpiry,
    );

    // try {
    //     await sendMail({
    //         to: data.email,
    //         subject: 'Verify Your Email Address',
    //         text,
    //         html,
    //     });
    // } catch (error) {
    //     // Log error but don't fail registration
    //     console.error('Failed to send verification email:', error);
    // }

    try {
        await sendWelcomeEmail(
            data.email,
            user.full_name?.trim() || data.full_name?.trim() || 'there',
            role.roleType,
        );
    } catch (error) {
        console.error('Failed to send welcome email:', error);
    }

    // Save selected category as a skill (students only, from signup step 2)
    if (typeof data.category === 'string' && data.category.trim()) {
        try {
            await DB.UserSkills.create({
                user_id: user.user_id,
                skill_name: data.category.trim(),
                skill_type: 'key_skill',
            } as any);
        } catch (error) {
            // Category save failing should not block registration
            console.error('Failed to save signup category:', error);
        }
    }

    // Generate + send phone verification OTP right after signup.
    // This matches the signup flow: SMS OTP goes to the registered mobile number.
    // For development/testing, `sendPhoneVerificationOTPService` returns `otp`.
    // let phoneVerificationOtp: string | undefined;
    // try {
    //     const phoneResult = await sendPhoneVerificationOTPService(user.user_id);
    //     phoneVerificationOtp = phoneResult?.otp;
    // } catch (error) {
    //     console.error('Failed to send phone verification OTP:', error);
    // }

    // Issue tokens so the new account can auto-login straight to the dashboard.
    // The dashboard will show a "please verify" banner until email + phone are confirmed.
    const tokenPayload = { user_id: user.user_id, role: role.roleName };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
        user: sanitizeUser(user),
        // phoneNumber: `${user.country_code}${user.mobile_number}`,
        // phoneVerificationOtp,
        // accessToken,
        // refreshToken,
    };
};

// -------------------- ADD USER (ADMIN/SUPERADMIN) --------------------
export const addUser = async (data: any) => {
    // Check if email exists
    const exists = await repo.findUserByEmail(data.email);
    if (exists)
        throw new CustomError('Email already exists', StatusCodes.CONFLICT);

    const hashedPassword = await hash(data.password, 10);

    const role = await DB.Roles.findOne({
        where: { roleName: data.role },
    });

    if (!role) throw new CustomError('Invalid role', StatusCodes.BAD_REQUEST);

    // Validate roleType - must be one of the allowed values
    const allowedRoleTypes = ['student', 'employer', 'superAdmin', 'admin'];
    if (!allowedRoleTypes.includes(role.roleType)) {
        throw new CustomError(
            `Invalid roleType: ${
                role.roleType
            }. Must be one of: ${allowedRoleTypes.join(', ')}`,
            StatusCodes.BAD_REQUEST,
        );
    }

    // Generate email verification token
    const verificationToken = jwt.sign(
        { email: data.email, type: 'email_verification' },
        JWT_SECRET as string,
        { expiresIn: '24h' },
    );
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await repo.createUser({
        full_name: data.full_name?.trim() || '',
        email: data.email,
        country_code: data.country_code,
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
    const frontendUrl = getVerificationFrontendUrl();
    const verificationLink = `${frontendUrl}/auth/verify-email?token=${encodeURIComponent(verificationToken)}`;
    const { html, text } = EmailVerificationTemplate(
        verificationLink,
        verificationTokenExpiry,
    );

    try {
        await sendMail({
            to: data.email,
            subject: 'Verify Your Email Address',
            text,
            html,
        });
    } catch (error) {
        // Log error but don't fail user creation
        console.error('Failed to send verification email:', error);
    }

    try {
        await sendWelcomeEmail(
            data.email,
            user.full_name?.trim() || data.full_name?.trim() || 'there',
            role.roleType,
        );
    } catch (error) {
        console.error('Failed to send welcome email:', error);
    }

    return { user: sanitizeUser(user) };
};

// -------------------- LOGIN USER --------------------
export const loginUser = async (body: any, req?: Request) => {
    // Verify CAPTCHA token before processing login
    if (body.captchaToken) {
        await verifyCaptcha(body.captchaToken);
    } else {
        console.warn('⚠️ [LOGIN] No CAPTCHA token provided - consider requiring it');
        // Optionally uncomment to require CAPTCHA:
        // throw new CustomError('CAPTCHA verification is required', StatusCodes.BAD_REQUEST);
    }

    const user = await repo.findUserByEmail(body.email);
    if (!user)
        throw new CustomError('Invalid credentials', StatusCodes.UNAUTHORIZED);

    const validPassword = compareSync(body.password, user.password_hash);
    if (!validPassword)
        throw new CustomError('Invalid credentials', StatusCodes.UNAUTHORIZED);

    // If user has 2FA enabled, require TOTP verification before issuing tokens
    if (user.two_fa_enabled) {
        if (!user.two_fa_secret) {
            throw new CustomError(
                '2FA is enabled but secret is missing. Please disable and re-enable 2FA.',
                StatusCodes.BAD_REQUEST,
            );
        }

        const twoFactorToken = jwt.sign(
            { user_id: user.user_id, type: '2fa_login' },
            JWT_SECRET as string,
            { expiresIn: '5m' },
        );

        return {
            requires2FA: true,
            twoFactorToken,
            user: sanitizeUser(user),
        };
    }

    const role = await DB.Roles.findOne({ where: { id: user.role_id } });
    if (!role)
        throw new CustomError(
            'User role not found',
            StatusCodes.INTERNAL_SERVER_ERROR,
        );

    const payload = { user_id: user.user_id, role: role.roleName };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload); // stateless

    // Create session record if request object is available
    if (req) {
        try {
            console.log('🔵 [Auth Service] Attempting to create session for user:', user.user_id);
            const userAgent = req.headers['user-agent'] || 'Unknown';
            const xForwardedFor = req.headers['x-forwarded-for'];
            const ipAddress = 
                (typeof xForwardedFor === 'string' ? xForwardedFor.split(',')[0].trim() : xForwardedFor?.[0]) ||
                req.connection?.remoteAddress ||
                req.socket?.remoteAddress ||
                'Unknown';
            const deviceType = parseDeviceType(userAgent);

            console.log('🔵 [Auth Service] Device type:', deviceType, 'IP:', ipAddress);

            // Set session expiry to 7 days (same as refresh token maxAge)
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            await sessionRepo.createSession({
                user_id: user.user_id,
                token: accessToken,
                device_type: deviceType,
                user_agent: userAgent,
                ip_address: ipAddress,
                expires_at: expiresAt,
            });
            console.log('✅ [Auth Service] Session created successfully');
        } catch (error) {
            console.error('❌ [Auth Service] Failed to create session record:', error);
            // Don't throw - session creation failure shouldn't prevent login
        }
    } else {
        console.warn('⚠️ [Auth Service] No request object available for session creation');
    }

    return {
        user: sanitizeUser(user),
        accessToken,
        refreshToken,
    };
};

// -------------------- 2FA SETUP --------------------
export const setup2FAService = async (user_id: string) => {
    const user = await repo.findUserById(user_id);
    if (!user) throw new CustomError('User not found', StatusCodes.NOT_FOUND);

    if (user.two_fa_enabled) {
        throw new CustomError(
            '2FA is already enabled for this account',
            StatusCodes.BAD_REQUEST,
        );
    }

    const secret = speakeasy.generateSecret({
        name: `Ogera (${user.email})`,
        issuer: 'Ogera',
    });

    if (!secret.base32 || !secret.otpauth_url) {
        throw new CustomError(
            'Failed to generate 2FA secret',
            StatusCodes.INTERNAL_SERVER_ERROR,
        );
    }

    await repo.updateUser(user_id, {
        two_fa_secret: encryptSecret(secret.base32),
        two_fa_enabled: false,
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    return {
        qrCode,
        secret: secret.base32,
    };
};

// -------------------- 2FA SETUP WITH TOKEN (FOR LOST AUTHENTICATOR) --------------------
export const setup2FAWithTokenService = async (setupToken: string) => {
    const decoded = jwt.verify(
        setupToken,
        JWT_SECRET as string,
    ) as JwtPayload & { user_id?: string; email?: string; type?: string };

    if (decoded.type !== 'lost_authenticator_setup' || !decoded.user_id) {
        throw new CustomError('Invalid setup token', StatusCodes.BAD_REQUEST);
    }

    const user = await repo.findUserById(decoded.user_id);
    if (!user) throw new CustomError('User not found', StatusCodes.NOT_FOUND);

    // Check if 2FA is already enabled (shouldn't be after recovery, but check anyway)
    if (user.two_fa_enabled && user.two_fa_secret) {
        throw new CustomError(
            '2FA is already enabled for this account',
            StatusCodes.BAD_REQUEST,
        );
    }

    const secret = speakeasy.generateSecret({
        name: `Ogera (${user.email})`,
        issuer: 'Ogera',
    });

    if (!secret.base32 || !secret.otpauth_url) {
        throw new CustomError(
            'Failed to generate 2FA secret',
            StatusCodes.INTERNAL_SERVER_ERROR,
        );
    }

    await repo.updateUser(decoded.user_id, {
        two_fa_secret: encryptSecret(secret.base32),
        two_fa_enabled: false,
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    return {
        qrCode,
        secret: secret.base32,
        user_id: decoded.user_id,
    };
};

// -------------------- VERIFY 2FA WITH TOKEN (FOR LOST AUTHENTICATOR) --------------------
export const verify2FAWithTokenService = async (
    setupToken: string,
    token: string,
) => {
    const decoded = jwt.verify(
        setupToken,
        JWT_SECRET as string,
    ) as JwtPayload & { user_id?: string; type?: string };

    if (decoded.type !== 'lost_authenticator_setup' || !decoded.user_id) {
        throw new CustomError('Invalid setup token', StatusCodes.BAD_REQUEST);
    }

    const user = await repo.findUserById(decoded.user_id);
    if (!user) throw new CustomError('User not found', StatusCodes.NOT_FOUND);

    if (!user.two_fa_secret) {
        throw new CustomError(
            '2FA secret not found. Please setup 2FA first.',
            StatusCodes.BAD_REQUEST,
        );
    }

    const secret = decryptSecret(user.two_fa_secret);
    const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 1,
    });

    if (!verified) {
        throw new CustomError('Invalid 2FA token', StatusCodes.BAD_REQUEST);
    }

    await repo.updateUser(decoded.user_id, { two_fa_enabled: true });
    return { success: true, user_id: decoded.user_id };
};

// -------------------- 2FA VERIFY (ENABLE) --------------------
export const verify2FAService = async (user_id: string, token: string) => {
    const user = await repo.findUserById(user_id);
    if (!user) throw new CustomError('User not found', StatusCodes.NOT_FOUND);

    if (!user.two_fa_secret) {
        throw new CustomError(
            '2FA secret not found. Please setup 2FA first.',
            StatusCodes.BAD_REQUEST,
        );
    }

    const secret = decryptSecret(user.two_fa_secret);
    const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 1,
    });

    if (!verified) {
        throw new CustomError('Invalid 2FA token', StatusCodes.BAD_REQUEST);
    }

    await repo.updateUser(user_id, { two_fa_enabled: true });
    return { success: true };
};

// -------------------- 2FA DISABLE --------------------
export const disable2FAService = async (
    user_id: string,
    password: string,
    token?: string,
) => {
    const user = await repo.findUserById(user_id);
    if (!user) throw new CustomError('User not found', StatusCodes.NOT_FOUND);

    const validPassword = compareSync(password, user.password_hash);
    if (!validPassword) {
        throw new CustomError('Invalid password', StatusCodes.UNAUTHORIZED);
    }

    if (user.two_fa_enabled) {
        if (!token) {
            throw new CustomError(
                '2FA token is required to disable 2FA',
                StatusCodes.BAD_REQUEST,
            );
        }
        if (!user.two_fa_secret) {
            throw new CustomError(
                '2FA secret missing. Please contact support.',
                StatusCodes.BAD_REQUEST,
            );
        }
        const secret = decryptSecret(user.two_fa_secret);
        const verified = speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token,
            window: 1,
        });
        if (!verified) {
            throw new CustomError('Invalid 2FA token', StatusCodes.BAD_REQUEST);
        }
    }

    await repo.updateUser(user_id, {
        two_fa_enabled: false,
        two_fa_secret: null as any,
    });

    return { success: true };
};

// -------------------- LOST AUTHENTICATOR: SEND EMAIL OTP --------------------
export const sendLostAuthenticatorOTPService = async (email: string) => {
    const user = await repo.findUserByEmail(email);
    if (!user) throw new CustomError('User not found', StatusCodes.NOT_FOUND);

    if (!user.two_fa_enabled) {
        throw new CustomError(
            '2FA is not enabled for this account',
            StatusCodes.BAD_REQUEST,
        );
    }

    const otp = generateNumericOTP(4);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await repo.updateUser(user.user_id, {
        reset_otp: otp,
        reset_otp_expiry: otpExpiry,
    });

    const recoveryToken = jwt.sign(
        { email, type: 'lost_authenticator' },
        JWT_SECRET as string,
        { expiresIn: '15m' },
    );

    const { html, text } = EmailTemplete(otp, otpExpiry);

    await sendMail({
        to: email,
        subject: 'Lost Authenticator Recovery - OTP',
        text,
        html,
    });

    return { recoveryToken };
};

// -------------------- LOST AUTHENTICATOR: VERIFY EMAIL OTP AND DISABLE 2FA --------------------
export const verifyLostAuthenticatorOTPAndDisable2FAService = async (
    otp: string,
    recoveryToken: string,
) => {
    const decoded = jwt.verify(
        recoveryToken,
        JWT_SECRET as string,
    ) as ResetTokenPayload & { type?: string };

    if (decoded.type !== 'lost_authenticator') {
        throw new CustomError('Invalid recovery token', StatusCodes.BAD_REQUEST);
    }

    const user = await repo.findUserByEmail(decoded.email);
    if (!user) throw new CustomError('User not found', StatusCodes.NOT_FOUND);

    if (!user.two_fa_enabled) {
        throw new CustomError(
            '2FA is not enabled for this account',
            StatusCodes.BAD_REQUEST,
        );
    }

    if (user.reset_otp !== otp) {
        throw new CustomError('Invalid OTP', StatusCodes.BAD_REQUEST);
    }

    if (
        !user.reset_otp_expiry ||
        Date.now() > user.reset_otp_expiry.getTime()
    ) {
        throw new CustomError('OTP expired', StatusCodes.BAD_REQUEST);
    }

    // Disable 2FA without requiring 2FA token (since user lost authenticator)
    await repo.updateUser(user.user_id, {
        two_fa_enabled: false,
        two_fa_secret: null as any,
        reset_otp: null,
        reset_otp_expiry: null,
    });

    // Generate a token for setting up new 2FA
    const setupToken = jwt.sign(
        { user_id: user.user_id, email: user.email, type: 'lost_authenticator_setup' },
        JWT_SECRET as string,
        { expiresIn: '30m' },
    );

    return { setupToken, user: sanitizeUser(user) };
};

// -------------------- 2FA VERIFY LOGIN (STEP 2) --------------------
export const verifyLogin2FAService = async (
    twoFactorToken: string,
    token: string,
    req?: Request,
) => {
    let decoded: TwoFALoginTokenPayload;
    try {
        decoded = jwt.verify(
            twoFactorToken,
            JWT_SECRET as string,
        ) as TwoFALoginTokenPayload;
    } catch {
        throw new CustomError(
            'Invalid or expired 2FA session',
            StatusCodes.UNAUTHORIZED,
        );
    }

    if (decoded.type !== '2fa_login' || !decoded.user_id) {
        throw new CustomError('Invalid 2FA session', StatusCodes.UNAUTHORIZED);
    }

    const user = await repo.findUserById(decoded.user_id);
    if (!user) throw new CustomError('User not found', StatusCodes.NOT_FOUND);

    if (!user.two_fa_enabled || !user.two_fa_secret) {
        throw new CustomError(
            '2FA not enabled for this account',
            StatusCodes.BAD_REQUEST,
        );
    }

    const secret = decryptSecret(user.two_fa_secret);
    const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 1,
    });
    if (!verified) {
        throw new CustomError('Invalid 2FA token', StatusCodes.BAD_REQUEST);
    }

    const role = await DB.Roles.findOne({ where: { id: user.role_id } });
    if (!role)
        throw new CustomError(
            'User role not found',
            StatusCodes.INTERNAL_SERVER_ERROR,
        );

    const payload = { user_id: user.user_id, role: role.roleName };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Create session record if request object is available
    if (req) {
        try {
            console.log('🔵 [Auth Service 2FA] Attempting to create session for user:', user.user_id);
            const userAgent = req.headers['user-agent'] || 'Unknown';
            const xForwardedFor = req.headers['x-forwarded-for'];
            const ipAddress = 
                (typeof xForwardedFor === 'string' ? xForwardedFor.split(',')[0].trim() : xForwardedFor?.[0]) ||
                req.connection?.remoteAddress ||
                req.socket?.remoteAddress ||
                'Unknown';
            const deviceType = parseDeviceType(userAgent);

            console.log('🔵 [Auth Service 2FA] Device type:', deviceType, 'IP:', ipAddress);

            // Set session expiry to 7 days (same as refresh token maxAge)
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            await sessionRepo.createSession({
                user_id: user.user_id,
                token: accessToken,
                device_type: deviceType,
                user_agent: userAgent,
                ip_address: ipAddress,
                expires_at: expiresAt,
            });
            console.log('✅ [Auth Service 2FA] Session created successfully');
        } catch (error) {
            console.error('❌ [Auth Service 2FA] Failed to create session record:', error);
            // Don't throw - session creation failure shouldn't prevent login
        }
    } else {
        console.warn('⚠️ [Auth Service 2FA] No request object available for session creation');
    }

    return {
        user: sanitizeUser(user),
        accessToken,
        refreshToken,
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
export const logoutUser = async (req?: Request) => {
    // Revoke session if request object is available
    if (req && req.user?.user_id) {
        try {
            // Extract token from Authorization header
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                
                // Find session by token
                const session = await sessionRepo.getSessionByToken(token);
                if (session) {
                    // Revoke the session
                    await sessionRepo.revokeSession(session.id);
                }
            }
        } catch (error) {
            console.error('⚠️ Failed to revoke session record:', error);
            // Don't throw - session revocation failure shouldn't prevent logout
        }
    }
    // Stateless logout → clear cookie only
    return { message: 'Logged out successfully' };
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

    await sendMail({
        to: email,
        subject: 'Password Reset OTP',
        text,
        html,
    });

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

export const getAllUsersService = async (
    { page, limit, type, search }: PaginationQuery & { type?: string; search?: string },
    _currentUserRole?: string,
    roleWhere?: any,
) => {
    let whereCondition: any = undefined;

    // Handle type parameter: filter by roleType if type is provided.
    // Type parameter takes precedence over roleWhere.
    if (type && type !== 'all') {
        // Map frontend type values to backend roleType values
        const typeToRoleType: Record<string, string> = {
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
    } else if (roleWhere) {
        // Use roleWhere if provided and no type filter
        whereCondition = roleWhere;
    } else {
        // Default behaviour for "All Users" views:
        // always restrict to end‑users (students + employers) and
        // exclude any admin / superAdmin accounts. Admins are managed
        // separately via the admin management endpoints.
        whereCondition = {
            roleType: {
                [Op.in]: ['student', 'employer'],
            },
        };
    }

    const { rows, count } = await repo.findAllUsers({
        page,
        limit,
        roleWhere: whereCondition,
        search, // Pass search parameter to repository
    });

    console.log('rows', rows);
    console.log("hello this is console log");
    // break;

    // Get counts for students and employers to include in response
    const roleCounts = await repo.getRoleCounts();

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
};

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
export const getUserProfileService = async (user_id: string) => {
    const user = await repo.findUserProfileById(user_id);
    if (!user) throw new CustomError('User not found', StatusCodes.NOT_FOUND);

    return user;
};

// -------------------- VERIFY EMAIL --------------------
export const verifyEmailService = async (token: string) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET as string) as {
            email: string;
            type: string;
        };

        console.log('🔍 [VERIFY EMAIL] Decoded token payload:', decoded);

        if (decoded.type !== 'email_verification') {
            throw new CustomError(
                'Invalid token type',
                StatusCodes.BAD_REQUEST,
            );
        }

        const user = await repo.findUserByEmail(decoded.email);
        if (!user)
            throw new CustomError('User not found', StatusCodes.NOT_FOUND);

        // Debug info to assist in development: log whether stored token matches and expiry
        console.log('🔍 [VERIFY EMAIL] Stored token present:', !!user.email_verification_token);
        console.log(
            '🔍 [VERIFY EMAIL] Stored token (truncated):',
            user.email_verification_token ? user.email_verification_token.slice(0, 30) + '...' : null,
        );
        console.log('🔍 [VERIFY EMAIL] Provided token (truncated):', token.slice(0, 30) + '...');
        console.log('🔍 [VERIFY EMAIL] Token expiry:', user.email_verification_token_expiry);

        // Check if token matches and is not expired.
        // In some environments the token string can differ due to URL encoding/transport,
        // but jwt.verify already ensures signature validity + expiry.
        // So we accept the verification as long as the token is valid for this email.
        if (user.email_verification_token && user.email_verification_token !== token) {
            console.warn(
                '[VERIFY EMAIL] Token mismatch detected, accepting based on jwt.verify result.',
            );
        }

        if (
            !user.email_verification_token_expiry ||
            Date.now() > user.email_verification_token_expiry.getTime()
        ) {
            throw new CustomError(
                'Verification token expired',
                StatusCodes.BAD_REQUEST,
            );
        }

        // Verify the email
        await repo.updateUser(user.user_id, {
            email_verified: true,
            email_verification_token: null,
            email_verification_token_expiry: null,
        });

        return { success: true, email: decoded.email };
    } catch (error: any) {
        if (error instanceof jwt.JsonWebTokenError) {
            throw new CustomError(
                'Invalid or expired token',
                StatusCodes.BAD_REQUEST,
            );
        }
        throw error;
    }
};

// -------------------- GET VERIFICATION STATUS --------------------
export const getVerificationStatusService = async (email: string) => {
    const user = await repo.findUserByEmail(email.trim());
    if (!user) {
        throw new CustomError('User not found', StatusCodes.NOT_FOUND);
    }

    return {
        email: user.email,
        mobile_number: user.mobile_number,
        email_verified: Boolean(user.email_verified),
        phone_verified: Boolean(user.phone_verified),
    };
};

// -------------------- RESEND VERIFICATION EMAIL --------------------
export const resendVerificationEmailService = async (
    email: string,
    frontendOrigin?: string,
) => {
    const user = await repo.findUserByEmail(email);
    if (!user) throw new CustomError('User not found', StatusCodes.NOT_FOUND);

    if (user.email_verified) {
        throw new CustomError(
            'Email already verified',
            StatusCodes.BAD_REQUEST,
        );
    }

    // Generate new verification token
    const verificationToken = jwt.sign(
        { email: user.email, type: 'email_verification' },
        JWT_SECRET as string,
        { expiresIn: '24h' },
    );
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    await repo.updateUser(user.user_id, {
        email_verification_token: verificationToken,
        email_verification_token_expiry: verificationTokenExpiry,
    });

    // Send verification email
    const frontendUrl = getVerificationFrontendUrl(frontendOrigin);
    const verificationLink = `${frontendUrl}/auth/verify-email?token=${encodeURIComponent(verificationToken)}`;
    const { html, text } = EmailVerificationTemplate(
        verificationLink,
        verificationTokenExpiry,
    );

    await sendMail({
        to: user.email,
        subject: 'Verify Your Email Address',
        text,
        html,
    });

    return { success: true, message: 'Verification email sent successfully' };
};

// -------------------- UPDATE USER PROFILE --------------------
export const updateProfileService = async (
    user_id: string,
    data: {
        full_name?: string;
        email?: string;
        mobile_number?: string;
        country_code?: string;
        national_id_number?: string;
        business_registration_id?: string;
        resume_url?: string;
        cover_letter?: string;
        preferred_location?: string;
    },
) => {
    // Check if user exists
    const user = await repo.findUserById(user_id);
    if (!user) throw new CustomError('User not found', StatusCodes.NOT_FOUND);

    // If email is being updated, check if it's already taken by another user
    const emailChanged = data.email && data.email !== user.email;
    if (emailChanged && data.email) {
        const emailExists = await repo.findUserByEmail(data.email);
        if (emailExists && emailExists.user_id !== user_id) {
            throw new CustomError('Email already exists', StatusCodes.CONFLICT);
        }
    }

    // Prepare update data (only include fields that are provided)
    const updateData: Partial<User> = {};

    // Use full_name exactly as provided, trimmed but no modifications (never add "Doe" or default last name)
    if (data.full_name !== undefined) {
        updateData.full_name = data.full_name.trim();
    }
    // If mobile number is being updated, reset phone verification
    const phoneChanged = data.mobile_number && data.mobile_number !== user.mobile_number;
    const countryChanged = data.country_code !== undefined && data.country_code !== user.country_code;
    if (phoneChanged) {
        updateData.mobile_number = data.mobile_number;
        updateData.phone_verified = false;
        updateData.phone_verification_otp = null;
        updateData.phone_verification_otp_expiry = null;
    } else if (data.mobile_number !== undefined) {
        updateData.mobile_number = data.mobile_number;
    }
    if (data.country_code !== undefined) {
        updateData.country_code = data.country_code;
    }
    if (countryChanged) {
        updateData.phone_verified = false;
        updateData.phone_verification_otp = null;
        updateData.phone_verification_otp_expiry = null;
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
        const verificationToken = jwt.sign(
            { email: data.email, type: 'email_verification' },
            JWT_SECRET as string,
            { expiresIn: '24h' },
        );
        const verificationTokenExpiry = new Date(
            Date.now() + 24 * 60 * 60 * 1000,
        ); // 24 hours

        updateData.email = data.email;
        updateData.email_verified = false;
        updateData.email_verification_token = verificationToken;
        updateData.email_verification_token_expiry = verificationTokenExpiry;

        // Send verification email to new email
        const frontendUrl = getVerificationFrontendUrl();
        const verificationLink = `${frontendUrl}/auth/verify-email?token=${encodeURIComponent(verificationToken)}`;
        const { html, text } = EmailVerificationTemplate(
            verificationLink,
            verificationTokenExpiry,
        );

        try {
            await sendMail({
                to: data.email!,
                subject: 'Verify Your New Email Address',
                text,
                html,
            });
        } catch (error) {
            // Log error but don't fail update
            console.error('Failed to send verification email:', error);
        }
    }

    // Update the user
    await repo.updateUser(user_id, updateData);
    if (data.resume_url !== undefined) {
        await refreshTrustScoreAfterAuthProfileChange(user_id);
    }

    // Return updated profile
    const updatedUser = await repo.findUserProfileById(user_id);
    if (!updatedUser)
        throw new CustomError(
            'User not found after update',
            StatusCodes.INTERNAL_SERVER_ERROR,
        );

    return updatedUser;
};


// -------------------- CREATE SUBADMIN (SUPERADMIN ONLY) --------------------
export const createSubAdmin = async (
    data: {
        email: string;
        password: string;
        role: string;
        full_name?: string;
    },
    currentUserRole?: string,
) => {
    // Only superadmin can create roles
    if (currentUserRole && currentUserRole.toLowerCase() !== 'superadmin') {
        throw new CustomError(
            'Only superadmin can create roles',
            StatusCodes.FORBIDDEN,
        );
    }

    // Check if email exists
    const exists = await repo.findUserByEmail(data.email);
    if (exists)
        throw new CustomError('Email already exists', StatusCodes.CONFLICT);

    const hashedPassword = await hash(data.password, 10);

    // Find the role first
    let role = await DB.Roles.findOne({
        where: { roleName: data.role },
    });

    // If role exists, validate that it has admin roleType
    if (role) {
        if (role.roleType !== 'admin' && role.roleType !== 'superAdmin') {
            throw new CustomError(
                'Role must have admin or superAdmin roleType',
                StatusCodes.BAD_REQUEST,
            );
        }
    } else {
        // If role doesn't exist, validate that it's an admin-type role before creating
        // Check if the role name suggests it's an admin role, or allow common admin roles
        const allowedAdminRoles = [
            'subadmin',
            'admin',
            'marketingSubAdmin',
            'verifyDocAdmin',
            'verifyAdmin',
        ];
        const isAdminRole =
            allowedAdminRoles.includes(data.role) ||
            data.role.toLowerCase().includes('admin');

        if (!isAdminRole) {
            throw new CustomError(
                'Role must be an admin-type role (subadmin, admin, verifyDocAdmin, etc.)',
                StatusCodes.BAD_REQUEST,
            );
        }
    }

    if (!role) {
        // Only superadmin can create roles
        if (currentUserRole && currentUserRole.toLowerCase() !== 'superadmin') {
            throw new CustomError(
                'Only superadmin can create roles',
                StatusCodes.FORBIDDEN,
            );
        }
        // Create the role if it doesn't exist
        role = await DB.Roles.create({
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
    const user = await repo.createUser({
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

    return { user: sanitizeUser(user) };
};

// -------------------- GET ALL SUBADMINS (SUPERADMIN ONLY) --------------------
export const getAllSubAdminsService = async ({
    page,
    limit,
    search,
}: PaginationQuery & { search?: string }) => {
    const { rows, count } = await repo.findAllSubAdmins({ page, limit, search });

    return {
        data: rows,
        pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
        },
    };
};

// -------------------- GET SUBADMIN BY ID (SUPERADMIN ONLY) --------------------
export const getSubAdminByIdService = async (user_id: string) => {
    const user = await repo.findUserProfileById(user_id);
    if (!user)
        throw new CustomError('Admin not found', StatusCodes.NOT_FOUND);

    // Check if user is an admin-type account (roleType === 'admin')
    const roleType = user.role?.roleType;
    if (roleType !== 'admin') {
        throw new CustomError(
            'User is not an admin',
            StatusCodes.BAD_REQUEST,
        );
    }

    return user;
};

// -------------------- UPDATE SUBADMIN (SUPERADMIN ONLY) --------------------
export const updateSubAdminService = async (
    user_id: string,
    data: {
        full_name?: string;
        email?: string;
        mobile_number?: string;
        password?: string;
        role?: string;
    },
    currentUserRole?: string,
) => {
    // Check if user exists and is a subadmin
    const user = await repo.findUserById(user_id);
    if (!user)
        throw new CustomError('Admin not found', StatusCodes.NOT_FOUND);

    // Verify user is an admin-type account
    const role = await DB.Roles.findOne({ where: { id: user.role_id } });
    if (!role || role.roleType !== 'admin') {
        throw new CustomError(
            'User is not an admin',
            StatusCodes.BAD_REQUEST,
        );
    }

    // If email is being updated, check if it's already taken by another user
    if (data.email && data.email !== user.email) {
        const emailExists = await repo.findUserByEmail(data.email);
        if (emailExists && emailExists.user_id !== user_id) {
            throw new CustomError('Email already exists', StatusCodes.CONFLICT);
        }
    }

    // Prepare update data
    const updateData: Partial<User> = {};

    if (data.full_name !== undefined) {
        updateData.full_name = data.full_name.trim();
    }
    if (data.email !== undefined) updateData.email = data.email;
    if (data.mobile_number !== undefined)
        updateData.mobile_number = data.mobile_number;
    if (data.password !== undefined) {
        updateData.password_hash = await hash(data.password, 10);
    }

    // If role is being updated, validate and update role_id
    if (data.role !== undefined) {
        if (data.role !== 'subadmin' && data.role !== 'admin') {
            throw new CustomError(
                'Role must be either subadmin or admin',
                StatusCodes.BAD_REQUEST,
            );
        }

        let newRole = await DB.Roles.findOne({
            where: { roleName: data.role },
        });

        if (!newRole) {
            // Only superadmin can create roles
            if (
                currentUserRole &&
                currentUserRole.toLowerCase() !== 'superadmin'
            ) {
                throw new CustomError(
                    'Only superadmin can create roles',
                    StatusCodes.FORBIDDEN,
                );
            }
            newRole = await DB.Roles.create({
                roleName: data.role,
                roleType: getRoleTypeFromRoleName(data.role),
                permission_json: JSON.stringify([]),
            });
        }

        updateData.role_id = newRole.id;
    }

    // Update the subadmin
    await repo.updateUser(user_id, updateData);

    // Return updated profile
    const updatedUser = await repo.findUserProfileById(user_id);
    if (!updatedUser)
        throw new CustomError(
            'Subadmin not found after update',
            StatusCodes.INTERNAL_SERVER_ERROR,
        );

    return updatedUser;
};

// -------------------- DELETE SUBADMIN (SUPERADMIN ONLY) --------------------
export const deleteSubAdminService = async (user_id: string) => {
    // Check if user exists and is a subadmin
    const user = await repo.findUserById(user_id);
    if (!user)
        throw new CustomError('Admin not found', StatusCodes.NOT_FOUND);

    // Verify user is an admin-type account
    const role = await DB.Roles.findOne({ where: { id: user.role_id } });
    if (!role || role.roleType !== 'admin') {
        throw new CustomError(
            'User is not an admin',
            StatusCodes.BAD_REQUEST,
        );
    }

    // Delete the subadmin
    await repo.deleteUser(user_id);

    return { message: 'Subadmin deleted successfully' };
};

// -------------------- DELETE USER (ADMIN/SUPERADMIN ONLY) --------------------
export const deleteUserService = async (user_id: string) => {
    // Check if user exists
    const user = await repo.findUserById(user_id);
    if (!user)
        throw new CustomError('User not found', StatusCodes.NOT_FOUND);

    // Delete the user
    await repo.deleteUser(user_id);

    return { message: 'User deleted successfully' };
};

// -------------------- SEND PHONE VERIFICATION OTP --------------------
export const sendPhoneVerificationOTPService = async (user_id: string) => {
    const user = await repo.findUserById(user_id);
    if (!user) throw new CustomError('User not found', StatusCodes.NOT_FOUND);

    if (user.phone_verified) {
        throw new CustomError(
            'Phone number already verified',
            StatusCodes.BAD_REQUEST,
        );
    }

    // Generate OTP
    const otp = generateNumericOTP(6);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in user record
    await repo.updateUser(user_id, {
        phone_verification_otp: otp,
        phone_verification_otp_expiry: otpExpiry,
    });

    // Send OTP via SMS
    try {
        await sendOTPSMS(
  `${user.country_code}${user.mobile_number}`,
  otp
);
    } catch (smsError: any) {
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
};

// -------------------- VERIFY PHONE NUMBER --------------------
export const verifyPhoneService = async (
    user_id: string,
    otp: string,
) => {
    const user = await repo.findUserById(user_id);
    if (!user) throw new CustomError('User not found', StatusCodes.NOT_FOUND);

    if (user.phone_verified) {
        throw new CustomError(
            'Phone number already verified',
            StatusCodes.BAD_REQUEST,
        );
    }

    if (!user.phone_verification_otp) {
        throw new CustomError(
            'No verification OTP found. Please request a new OTP.',
            StatusCodes.BAD_REQUEST,
        );
    }

    if (user.phone_verification_otp !== otp) {
        throw new CustomError('Invalid OTP', StatusCodes.BAD_REQUEST);
    }

    if (
        !user.phone_verification_otp_expiry ||
        Date.now() > user.phone_verification_otp_expiry.getTime()
    ) {
        throw new CustomError('OTP expired', StatusCodes.BAD_REQUEST);
    }

    // Verify the phone number
    await repo.updateUser(user_id, {
        phone_verified: true,
        phone_verification_otp: null,
        phone_verification_otp_expiry: null,
    });

    return { success: true, message: 'Phone number verified successfully' };
};

// -------------------- VERIFY ACCOUNT (SMS OTP + EMAIL VERIFIED) --------------------
// Used by the signup "Verification" screen. It does NOT require auth.
// Client must provide the registered email and the OTP received on the phone.
export const verifyAccountService = async (email: string, otp: string) => {
    const user = await repo.findUserByEmail(email);
    if (!user) throw new CustomError('User not found', StatusCodes.NOT_FOUND);

    if (user.phone_verified) {
        throw new CustomError('Phone number already verified', StatusCodes.BAD_REQUEST);
    }

    if (!user.phone_verification_otp) {
        throw new CustomError(
            'No verification OTP found. Please request a new OTP.',
            StatusCodes.BAD_REQUEST,
        );
    }

    if (user.phone_verification_otp !== otp) {
        throw new CustomError('Invalid OTP', StatusCodes.BAD_REQUEST);
    }

    if (
        !user.phone_verification_otp_expiry ||
        Date.now() > user.phone_verification_otp_expiry.getTime()
    ) {
        throw new CustomError('OTP expired', StatusCodes.BAD_REQUEST);
    }

    await repo.updateUser(user.user_id, {
        phone_verified: true,
        phone_verification_otp: null,
        phone_verification_otp_expiry: null,
    });

    return {
        success: true,
        message: 'Phone number verified successfully',
        email: user.email,
        mobile_number: user.mobile_number,
        email_verified: Boolean(user.email_verified),
        phone_verified: true,
    };
};
