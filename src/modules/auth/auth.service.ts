import { employerRepo, studentRepo, userRepo } from "./auth.repo";
import { hash, compareSync } from "bcryptjs";
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
import { sequelize } from "@/database/index";
import { cleanupFile, isValidUploadedFile, UploadError } from "@/middlewares/multer";
import { uploadToCloudinary } from "@/config/cloudinary";
import fs from 'fs/promises';
import { UserCreationAttributes } from "@/database/models/user.model";

// Strongly type reset token payload
interface ResetTokenPayload extends JwtPayload {
  email: string;
}

// -------------------- Register --------------------
export const registerUser = async (req: any, userData: any) => {
  const transaction = await sequelize.transaction();
  let uploadedFileUrl: string | null = null;

  // logic to ask for National ID if user is a student 
  // or if user's 'role' column was not set(it defaults to student)
  const newRole = userData.role || "Student";
  if((userData.role === null || userData.role === "Student") && !userData.national_id) {
    throw new CustomError(Messages.Auth.MISSING_NATIONAL_ID, StatusCodes.BAD_REQUEST);
  }

  // logic to ask for Business ID if user is an employer
  if(
    userData.role === "Employer" && 
    (!userData.business_id || !userData.company_name || !userData.company_description || !userData.company_address)
  ) {
    throw new CustomError(Messages.Auth.MISSING_BUSINESS_ID, 400);
  }
  try {
    const existingUser = await userRepo.findUserByEmail(userData.email, transaction);
    if (existingUser) {
      await transaction.rollback();
      throw new CustomError(Messages.Auth.EMAIL_ALREADY_EXISTS, StatusCodes.CONFLICT);
    }

    // Handle file upload before database operations (for employers)
    if(newRole === "Employer") {
      if(!req.file) {
        await transaction.rollback();
        throw new CustomError(UploadError.NO_FILE, 404);
      }
      
      if(!isValidUploadedFile(req.file)) {
        await transaction.rollback();
        throw new CustomError(UploadError.UPLOAD_FAILED, 400);
      }

      try {
        const result = await uploadToCloudinary(req.file.path, {
          folder: `employers/temp-${Date.now()}/business-document` // Use temp folder first
        });
        uploadedFileUrl = result.secure_url;
        console.log('File uploaded successfully:', result);
        
        // Clean up local file after successful upload
        await fs.unlink(req.file.path);
      } catch (uploadError) {
        await transaction.rollback();
        if(req.file?.path) {
          cleanupFile(req.file.path);
        }
        console.log('Upload error:', uploadError);
        throw new CustomError(UploadError.UPLOAD_FAILED, 500);
      }
    }

    const hashedPassword = await hash(userData.password, 10);
    const userCreationData: UserCreationAttributes = {
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      mobile_number: userData.mobile_number,
      password_hash: hashedPassword,
      role: newRole,
      ...(userData.national_id && { national_id: userData.national_id }),
      ...(userData.business_id && { business_id: userData.business_id })
    };
    
    const user = await userRepo.createUser(userCreationData, transaction);

    const userId = user.user_id;

    // Create student profile if user is a student
    if(newRole === "Student") {
      await studentRepo.createStudent({
        user_id: userId,
        first_name: userData.first_name,
        last_name: userData.last_name,
        national_id: userData.national_id as string,
      }, transaction);
    }

    // Create employer profile if user is an employer
    if(newRole === "Employer" && uploadedFileUrl) {
      await employerRepo.createEmployer({
        user_id: userId,
        first_name: userData.first_name,
        last_name: userData.last_name,
        business_id: userData.business_id as string,
        company_name: userData.company_name,
        company_description: userData.company_description,
        business_document_url: uploadedFileUrl,
        company_address: userData.company_address
      }, transaction);
    }

    // Commit transaction, all operations successful
    await transaction.commit();

    // Generate JWT token after successful registration
    const accessToken = generateJWT({
      userId: userId,
      role: user.role,
    });

    return { user, accessToken };
  } catch(error) {
    if (!(transaction as any).finished) { // only rollback if still active
      await transaction.rollback();
    }
      
    // Clean up uploaded file if it exists and there was an error after upload
    if (req.file?.path) {
      cleanupFile(req.file.path);
    }
    
    // Re-throw the error to be handled by errorHandler middleware
    throw error;
  }
};

// -------------------- Login --------------------
export const loginUser = async (userData: any) => {
  const transaction = await sequelize.transaction();

  try {
    const user = await userRepo.findUserByEmail(userData.email, transaction);
    if (!user) {
      await transaction.rollback();
      throw new CustomError(Messages.Auth.INVALID_CREDENTIALS, StatusCodes.UNAUTHORIZED);
    }

    const validPassword = compareSync(userData.password, user.password_hash);
    if (!validPassword) {
      await transaction.rollback();
      throw new CustomError(Messages.Auth.INVALID_CREDENTIALS, StatusCodes.UNAUTHORIZED);
    }

    if (user.two_fa_enabled) {
      if (!userData.otp) {
        await transaction.rollback();
        const tempToken = await generateJWT({ userId: user.user_id, role: user.role });
        throw new CustomError(`2FA required. Use temp_token: ${tempToken}`, StatusCodes.PARTIAL_CONTENT);
      }
      const validOTP = await verifyOTP(user.user_id, userData.otp);
      if (!validOTP) {
        await transaction.rollback();
        throw new CustomError(Messages.User.INVALID_OTP, StatusCodes.BAD_REQUEST);
      }
    }

    // Commit transaction - login successful
    await transaction.commit();

    const accessToken = await generateJWT({ userId: user.user_id, role: user.role });
    return { user, accessToken, two_fa_enabled: user.two_fa_enabled };

  } catch(error) {
    await transaction.rollback();
    throw error;
  }
};

// -------------------- 2FA --------------------
// Generate 2FA for user
export const generate2FAUser = async (user_id: string, email: string) => {
  const transaction = await sequelize.transaction();

  try {
    // Check if user exists
    const user = await userRepo.findUserById(user_id, transaction);
    if (!user) {
      await transaction.rollback();
      throw new CustomError(Messages.User.USER_NOT_FOUND, StatusCodes.NOT_FOUND);
    }

    // Check if already enabled
    if (user.two_fa_enabled as boolean) {
      await transaction.rollback();
      throw new CustomError(
        Messages.User.TWO_FA_ALREADY_ENABLED,
        StatusCodes.BAD_REQUEST
      );
    }

    // Generate secret + QR
    const { secret, qrCodeUrl } = await generate2FASecret(user_id, email);

    // Store secret in DB
    await userRepo.updateUser(
      user.user_id,
      { two_fa_secret: secret },
      { transaction }
    );

    await transaction.commit();

    return { secret, qrCodeUrl };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// Verify 2FA for user
export const verify2FAUser = async (user_id: string, token: string) => {
  const transaction = await sequelize.transaction();

  try {
    const user = await userRepo.findUserById(user_id, transaction);
    if (!user) {
      await transaction.rollback();
      throw new CustomError(Messages.User.USER_NOT_FOUND, StatusCodes.NOT_FOUND);
    }

    if (!user.two_fa_secret) {
      await transaction.rollback();
      throw new CustomError(
        Messages.User.TWO_FA_NOT_FOUND,
        StatusCodes.BAD_REQUEST
      );
    }

    const valid = await verifyOTP(user_id, token);
    if (!valid) {
      await transaction.rollback();
      throw new CustomError(Messages.User.INVALID_OTP, StatusCodes.BAD_REQUEST);
    }

    // Enable 2FA
    await userRepo.updateUser(
      user.user_id,
      { two_fa_enabled: true },
      { transaction }
    );

    await transaction.commit();

    return { success: true };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// -------------------- Forgot Password --------------------
export const forgotPasswordService = async (email: string) => {
  const transaction = await sequelize.transaction();
  try {
    const user = await userRepo.findUserByEmail(email, transaction);
    if (!user) {
      await transaction.rollback();
      throw new CustomError(Messages.User.USER_NOT_FOUND, StatusCodes.NOT_FOUND);
    }

    const otp = generateNumericOTP(6);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await userRepo.updateUser(user.user_id, { reset_otp: otp, reset_otp_expiry: otpExpiry }, { transaction });

    const resetToken = jwt.sign({ email }, JWT_SECRET as string, { expiresIn: "15m" });

    const { html, text } = EmailTemplete(otp, otpExpiry);

    await sendMail(email, "Password Reset OTP", text, html);

    await transaction.commit();

    return { resetToken };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// -------------------- Verify Reset OTP --------------------
export const verifyResetOTPService = async (otp: string, resetToken: string) => {
  const transaction = await sequelize.transaction();
  try {
    const decoded = jwt.verify(resetToken, JWT_SECRET as string) as ResetTokenPayload;

    if (!decoded || !decoded.email) {
      await transaction.rollback();
      throw new CustomError(Messages.User.INVALID_OTP, StatusCodes.BAD_REQUEST);
    }

    const user = await userRepo.findUserByEmail(decoded.email, transaction);
    if (!user) {
      await transaction.rollback();
      throw new CustomError(Messages.User.USER_NOT_FOUND, StatusCodes.NOT_FOUND);
    }

    if (user.reset_otp !== otp) {
      await transaction.rollback();
      throw new CustomError(Messages.User.INVALID_OTP, StatusCodes.BAD_REQUEST);
    }

    if (!user.reset_otp_expiry || Date.now() > user.reset_otp_expiry.getTime()) {
      await transaction.rollback();
      throw new CustomError(Messages.User.OTP_EXPIRE, StatusCodes.BAD_REQUEST);
    }

    await transaction.commit();
    return { success: true };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// -------------------- Reset Password --------------------
export const resetPasswordService = async (newPassword: string, resetToken: string) => {
  const transaction = await sequelize.transaction();
  try {
    const decoded = jwt.verify(resetToken, JWT_SECRET as string) as ResetTokenPayload;

    if (!decoded || !decoded.email) {
      await transaction.rollback();
      throw new CustomError(Messages.User.INVALID_OTP, StatusCodes.BAD_REQUEST);
    }

    const user = await userRepo.findUserByEmail(decoded.email, transaction);
    if (!user) {
      await transaction.rollback();
      throw new CustomError(Messages.User.USER_NOT_FOUND, StatusCodes.NOT_FOUND);
    }

    const hashedPassword = await hash(newPassword, 10);

    await userRepo.updateUser(
      user.user_id,
      {
        password_hash: hashedPassword,
        reset_otp: null,
        reset_otp_expiry: null,
      },
      { transaction }
    );

    await transaction.commit();
    return { success: true };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
