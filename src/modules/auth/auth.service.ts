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
import { DB } from "@/database";

interface ResetTokenPayload extends JwtPayload {
  email: string;
}

// -------------------- REGISTER --------------------
export const registerUser = async (userData: any) => {
  const existingUser = await repo.findUserByEmail(userData.email);
  if (existingUser) {
    throw new CustomError(Messages.Auth.EMAIL_ALREADY_EXISTS, StatusCodes.CONFLICT);
  }

  // ⭐ Fetch role_id using roleName
  const role = await DB.Roles.findOne({
    where: { roleName: userData.role }
  });

  if (!role) throw new CustomError("Invalid role provided", 400);

  const hashedPassword = await hash(userData.password, 10);

  const user = await repo.createUser({
    full_name: userData.full_name,
    email: userData.email,
    mobile_number: userData.mobile_number,
    national_id_number: userData.national_id_number,
    business_registration_id: userData.business_registration_id || null,
    password_hash: hashedPassword,
    role_id: role.id, // save UUID
  });

  return { user };
};

// -------------------- LOGIN (FULL FIX) --------------------
export const loginUser = async (userData: any) => {
  const user = await repo.findUserByEmail(userData.email);
  if (!user) {
    throw new CustomError(Messages.Auth.INVALID_CREDENTIALS, StatusCodes.UNAUTHORIZED);
  }

  const validPassword = compareSync(userData.password, user.password_hash);
  if (!validPassword) {
    throw new CustomError(Messages.Auth.INVALID_CREDENTIALS, StatusCodes.UNAUTHORIZED);
  }

  // ⭐ Fetch roleName using role_id
  const role = await DB.Roles.findOne({ where: { id: user.role_id } });
  if (!role) throw new CustomError("Role not found for this user", 500);

  // ------------ 2FA ------------
  if (user.two_fa_enabled) {
    if (!userData.otp) {
      const tempToken = await generateJWT({
        user_id: user.user_id,
        role: role.roleName // ⭐ FIXED
      });
      throw new CustomError(
        `2FA required. Use temp_token: ${tempToken}`,
        StatusCodes.PARTIAL_CONTENT
      );
    }

    const validOTP = await verifyOTP(user.user_id, userData.otp);
    if (!validOTP) throw new CustomError(Messages.User.INVALID_OTP, 400);
  }

  // ⭐ Fix — store roleName in JWT, NOT role_id
  const accessToken = await generateJWT({
    user_id: user.user_id,
    role: role.roleName
  });

  return { user, accessToken, two_fa_enabled: user.two_fa_enabled };
};

// -------------------- 2FA --------------------
export const generate2FAUser = async (user_id: string, email: string) => {
  const user = await repo.findUserById(user_id);
  if (!user) throw new CustomError(Messages.User.USER_NOT_FOUND, 404);

  const { secret, qrCodeUrl } = await generate2FASecret(user_id, email);
  return { secret, qrCodeUrl };
};

export const verify2FAUser = async (user_id: string, token: string) => {
  const valid = await verifyOTP(user_id, token);
  if (!valid) throw new CustomError(Messages.User.INVALID_OTP, 400);

  await enable2FA(user_id);
  return { success: true };
};

// -------------------- Forgot Password --------------------
export const forgotPasswordService = async (email: string) => {
  const user = await repo.findUserByEmail(email);
  if (!user) throw new CustomError(Messages.User.USER_NOT_FOUND, 404);

  const otp = generateNumericOTP(4);
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

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
    throw new CustomError(Messages.User.INVALID_OTP, 400);
  }

  const user = await repo.findUserByEmail(decoded.email);
  if (!user) throw new CustomError(Messages.User.USER_NOT_FOUND, 404);

  if (user.reset_otp !== otp) throw new CustomError(Messages.User.INVALID_OTP, 400);

  if (!user.reset_otp_expiry || Date.now() > user.reset_otp_expiry.getTime()) {
    throw new CustomError(Messages.User.OTP_EXPIRE, 400);
  }
};

// -------------------- Reset Password --------------------
export const resetPasswordService = async (newPassword: string, resetToken: string) => {
  const decoded = jwt.verify(resetToken, JWT_SECRET as string) as ResetTokenPayload;
  if (!decoded || !decoded.email) {
    throw new CustomError(Messages.User.INVALID_OTP, 400);
  }

  const user = await repo.findUserByEmail(decoded.email);
  if (!user) throw new CustomError(Messages.User.USER_NOT_FOUND, 404);

  const hashedPassword = await hash(newPassword, 10);

  await repo.updateUser(user.user_id, {
    password_hash: hashedPassword,
    reset_otp: null,
    reset_otp_expiry: null,
  });
};
