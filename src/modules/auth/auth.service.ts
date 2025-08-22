import repo from "./auth.repo";
import { hash, compareSync } from "bcrypt";
import { generateJWT } from "@/middlewares/jwt.service";
import { CustomError } from "@/utils/custom-error";
import { StatusCodes } from "http-status-codes";
import { Messages } from "@/utils/messages";
import { generate2FASecret, verifyOTP, enable2FA } from "@/utils/2fa";
import { generateNumericOTP } from "@/utils/otp";
import { sendMail } from "@/utils/mailer";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_ACCESS_TOKEN_SECRET as JWT_SECRET } from "@/config";
import { EmailTemplete } from "@/templete/emailTemplete";

// Strongly type reset token payload
interface ResetTokenPayload extends JwtPayload {
  email: string;
}

// -------------------- Register --------------------
export const registerUser = async (userData: any) => {
  const existingUser = await repo.findUserByEmail(userData.email);
  if (existingUser) {
    throw new CustomError(Messages.Auth.EMAIL_ALREADY_EXISTS, StatusCodes.CONFLICT);
  }

  const hashedPassword = await hash(userData.password, 10);
  const user = await repo.createUser({ ...userData, password_hash: hashedPassword });

  return { user };
};

// -------------------- Login --------------------
export const loginUser = async (userData: any) => {
  const user = await repo.findUserByEmail(userData.email);
  if (!user) {
    throw new CustomError(Messages.Auth.INVALID_CREDENTIALS, StatusCodes.UNAUTHORIZED);
  }

  const validPassword = compareSync(userData.password, user.password_hash);
  if (!validPassword) {
    throw new CustomError(Messages.Auth.INVALID_CREDENTIALS, StatusCodes.UNAUTHORIZED);
  }

  if (user.two_fa_enabled) {
    if (!userData.otp) {
      const tempToken = await generateJWT({ user_id: user.user_id, role: user.role });
      throw new CustomError(`2FA required. Use temp_token: ${tempToken}`, StatusCodes.PARTIAL_CONTENT);
    }
    const validOTP = await verifyOTP(user.user_id, userData.otp);
    if (!validOTP) {
      throw new CustomError(Messages.User.INVALID_OTP, StatusCodes.BAD_REQUEST);
    }
  }

  const accessToken = await generateJWT({ user_id: user.user_id, role: user.role });
  return { user, accessToken, two_fa_enabled: user.two_fa_enabled };
};

// -------------------- 2FA --------------------
export const generate2FAUser = async (user_id: string, email: string) => {
  const user = await repo.findUserById(user_id);
  if (!user) {
    throw new CustomError(Messages.User.USER_NOT_FOUND, StatusCodes.NOT_FOUND);
  }

  const { secret, qrCodeUrl } = await generate2FASecret(user_id, email);
  return { secret, qrCodeUrl };
};

export const verify2FAUser = async (user_id: string, token: string) => {
  const valid = await verifyOTP(user_id, token);
  if (!valid) {
    throw new CustomError(Messages.User.INVALID_OTP, StatusCodes.BAD_REQUEST);
  }

  await enable2FA(user_id);
  return { success: true };
};

// -------------------- Forgot Password --------------------
export const forgotPasswordService = async (email: string) => {
  const user = await repo.findUserByEmail(email);
  if (!user) {
    throw new CustomError(Messages.User.USER_NOT_FOUND, StatusCodes.NOT_FOUND);
  }

  const otp = generateNumericOTP(6);
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
  

  await repo.updateUser(user.user_id, { reset_otp: otp, reset_otp_expiry: otpExpiry });

  const resetToken = jwt.sign({ email }, JWT_SECRET as string, { expiresIn: "15m" });

  const { html, text } = EmailTemplete(otp, otpExpiry);

  await sendMail(email, "Password Reset OTP", text, html);

  return { resetToken };
};

// -------------------- Verify Reset OTP --------------------
export const verifyResetOTPService = async (otp: string, resetToken: string) => {
  const decoded = jwt.verify(resetToken, JWT_SECRET as string) as ResetTokenPayload;

  if (!decoded || !decoded.email) {
    throw new CustomError(Messages.User.INVALID_OTP, StatusCodes.BAD_REQUEST);
  }

  const user = await repo.findUserByEmail(decoded.email);
  if (!user) {
    throw new CustomError(Messages.User.USER_NOT_FOUND, StatusCodes.NOT_FOUND);
  }

  if (user.reset_otp !== otp) {
    throw new CustomError(Messages.User.INVALID_OTP, StatusCodes.BAD_REQUEST);
  }

  // type-safe check against null/undefined
  if (!user.reset_otp_expiry || Date.now() > user.reset_otp_expiry.getTime()) {
    throw new CustomError(Messages.User.OTP_EXPIRE, StatusCodes.BAD_REQUEST);
  }
};

// -------------------- Reset Password --------------------
export const resetPasswordService = async (newPassword: string, resetToken: string) => {
  const decoded = jwt.verify(resetToken, JWT_SECRET as string) as ResetTokenPayload;

  if (!decoded || !decoded.email) {
    throw new CustomError(Messages.User.INVALID_OTP, StatusCodes.BAD_REQUEST);
  }

  const user = await repo.findUserByEmail(decoded.email);
  if (!user) {
    throw new CustomError(Messages.User.USER_NOT_FOUND, StatusCodes.NOT_FOUND);
  }

  const hashedPassword = await hash(newPassword, 10);

  await repo.updateUser(user.user_id, {
    password_hash: hashedPassword,
    reset_otp: null,
    reset_otp_expiry: null,
  });
};
