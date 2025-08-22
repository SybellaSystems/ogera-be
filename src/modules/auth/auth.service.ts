import repo from './auth.repo';
import { hash, compareSync } from 'bcrypt';
import { generateJWT } from '@/middlewares/jwt.service';
import { CustomError } from '@/utils/custom-error';
import { StatusCodes } from 'http-status-codes';
import { Messages } from '@/utils/messages';
import { generate2FASecret, verifyOTP, enable2FA } from "@/utils/2fa";


export const signUpService = async (userData: any) => {
    try {
        const findUser = await repo.findUserByEmail(userData.email);
        if (findUser) {
            throw new CustomError(
                Messages.Auth.EMAIL_ALREADY_EXISTS,
                StatusCodes.CONFLICT,
            );
        }

        const hashedPassword = await hash(userData.password, 10);

        const newUserData = await repo.createUser({
            ...userData,
            password_hash: hashedPassword,
        });

        return { user: newUserData };
    } catch (error: any) {
        if (error instanceof CustomError) throw error;
        throw new CustomError(
            error.message || 'Error creating user',
            StatusCodes.INTERNAL_SERVER_ERROR,
        );
    }
};

// SIGN IN
export const signInService = async (userData: any) => {
    try {
        const user = await repo.findUserByEmail(userData.email);
        if (!user)
            throw new CustomError(
                Messages.Auth.INVALID_CREDENTIALS,
                StatusCodes.UNAUTHORIZED,
            );

        const validPassword = compareSync(
            userData.password,
            user.password_hash,
        );
        if (!validPassword)
            throw new CustomError(
                Messages.Auth.INVALID_CREDENTIALS,
                StatusCodes.UNAUTHORIZED,
            );

        // 2FA
        if (user.two_fa_enabled) {
            if (!userData.otp) {
                const tempToken = await generateJWT({
                    user_id: user.user_id,
                    role: user.role,
                });
                throw new CustomError(
                    `2FA required. Use temp_token: ${tempToken}`,
                    StatusCodes.PARTIAL_CONTENT,
                );
            }

            const isValid = await verifyOTP(user.user_id, userData.otp);
            if (!isValid)
                throw new CustomError(
                    Messages.User.INVALID_OTP,
                    StatusCodes.BAD_REQUEST,
                );
        }

        const accessToken = await generateJWT({
            user_id: user.user_id,
            role: user.role,
        });

        return { user, accessToken, two_fa_enabled: user.two_fa_enabled };
    } catch (error: any) {
        if (error instanceof CustomError) throw error;
        throw new CustomError(
            error.message || 'Error signing in',
            StatusCodes.INTERNAL_SERVER_ERROR,
        );
    }
};

export const generate2FAService = async (user_id: string, email: string) => {
  const user = await repo.findUserById(user_id);
  if (!user) throw new CustomError(Messages.User.USER_NOT_FOUND, StatusCodes.NOT_FOUND);

  const { secret, qrCodeUrl } = await generate2FASecret(user_id, email);

  return { secret, qrCodeUrl };
};

// 2FA Verify Service
export const verify2FAService = async (user_id: string, token: string) => {
  const isValid = await verifyOTP(user_id, token);
  if (!isValid) throw new CustomError(Messages.User.INVALID_OTP, StatusCodes.BAD_REQUEST);

  await enable2FA(user_id);

  return { success: true };
};