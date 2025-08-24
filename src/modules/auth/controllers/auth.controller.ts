import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { AppError, asyncHandler } from "../../../middlewares/errorHandler.js";
import DB from "../../../database/db.js"; // Initialized models
import { createJWT } from "../utils/token.js";
import { RegisterPayload, LoginPayload } from "../types/auth.types.js";
import { generate2FASecret, verifyOTP, enable2FA } from "../utils/2fa.js";
import { cleanupFile, isValidUploadedFile, UploadError } from "../../../middlewares/multer.js";
import { uploadToCloudinary } from "../../../config/cloudinary.js";
import fs from 'fs/promises';
import { sequelize } from "../../../database/db.js";

const UserModel = DB.User;
const StudentModel = DB.StudentProfile;
const EmployerModel = DB.EmployerProfile

// Hash password
const hash_pwd = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Compare password
const decrypt_pwd = async (
  candidatePassword: string,
  password: string
): Promise<boolean> => {
  return await bcrypt.compare(candidatePassword, password);
};

// Registration controller
export const register = asyncHandler(
  async (req: Request<{}, {}, RegisterPayload>, res: Response): Promise<void> => {
    const {
      first_name,
      last_name,
      email,
      mobile_number,
      password,
      role,
      national_id,
      business_id,
      company_name,
      company_description,
      company_address
    } = req.body;

    if (!email || !mobile_number || !password) {
      throw new AppError(
        "Please fill all required fields.",
        400,
        true,
        "EMPTY_INPUT_FIELD"
      );
    }

    // logic to ask for National ID if user is a student 
    // or if user's 'role' column was not set(it defaults to student)
    const newRole = role || "Student";
    if((role === null || role === "Student") && !national_id) {
      throw new AppError("Please fill in your National ID", 400, true);
    }

    // logic to ask for Business ID if user is an employer
    if(
      role === "Employer" && 
      (!business_id || !company_name || !company_description || !company_address)
    ) {
      throw new AppError("Please fill in business details.", 400, true);
    }

    // Start database transaction
    const transaction = await sequelize.transaction();
    let uploadedFileUrl: string | null = null;
    
    try {
      // Check if email exists within transaction
      const existingUser = await UserModel.findOne({ 
        where: { email },
        transaction 
      });
      
      if (existingUser) {
        await transaction.rollback();
        throw new AppError("Email is already taken.", 400, true, "EXISTING_EMAIL");
      }

      // Handle file upload before database operations (for employers)
      if(newRole === "Employer") {
        if(!req.file) {
          await transaction.rollback();
          throw new AppError(UploadError.NO_FILE, 404, true);
        }
        
        if(!isValidUploadedFile(req.file)) {
          await transaction.rollback();
          throw new AppError(UploadError.UPLOAD_FAILED, 400, true);
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
          throw new AppError(UploadError.UPLOAD_FAILED, 500, true);
        }
      }

      // Hash password
      const hashed_password = await hash_pwd(password);

      // Create user within transaction
      const user = await UserModel.create({
        first_name,
        last_name,
        email,
        mobile_number,
        password_hash: hashed_password,
        role: newRole,
        national_id: national_id,
        business_id: business_id
      }, { transaction });

      const userId = user.get("user_id") as string;

      // Create student profile if user is a student
      if(newRole === "Student" || newRole === null) {
        await StudentModel.create({
          user_id: userId,
          first_name,
          last_name,
          national_id: user.get("national_id") as string,
        }, { transaction });
      }

      // Create employer profile if user is an employer
      if(newRole === "Employer" && uploadedFileUrl) {
        await EmployerModel.create({
          user_id: userId,
          first_name,
          last_name,
          business_id: user.get("business_id") as string,
          company_name,
          company_description,
          business_document_url: uploadedFileUrl,
          company_address
        }, { transaction });
      }

      // Commit transaction - all operations successful
      await transaction.commit();

      // Generate JWT token after successful registration
      const token = createJWT({
        user_id: userId,
        role: user.get("role") as "Student" | "Employer" | "Admin",
      });

      res.status(201).json({
        message: "User created successfully",
        user,
        token,
      });

    } catch (error) {
      // Rollback transaction on any error
      await transaction.rollback();
      
      // Clean up uploaded file if it exists and there was an error after upload
      if (req.file?.path) {
        cleanupFile(req.file.path);
      }
      
      // Re-throw the error to be handled by errorHandler middleware
      throw error;
    }
  }
);

// Login controller
export const login = asyncHandler(
  async (req: Request<{}, {}, LoginPayload>, res: Response): Promise<void> => {
    const { email, password, otp } = req.body;

    if (!email || !password) {
      throw new AppError(
        "Please fill in your email and password.",
        400,
        true,
        "EMPTY_INPUT_FIELD"
      );
    }

    // Start transaction for login operations
    const transaction = await sequelize.transaction();
    
    try {
      // Find user within transaction to ensure data consistency
      const user = await UserModel.findOne({ 
        where: { email },
        transaction 
      });
      
      if (!user) {
        await transaction.rollback();
        throw new AppError("Email does not exist", 404, true);
      }

      const isPasswordCorrect = await decrypt_pwd(
        password,
        user.get("password_hash") as string
      );
      
      if (!isPasswordCorrect) {
        await transaction.rollback();
        throw new AppError("Incorrect email or password", 400, true);
      }

      // Handle 2FA
      if (user.get("two_fa_enabled") as boolean) {
        if (!otp) {
          await transaction.rollback();
          const temp_token = createJWT({
            user_id: user.get("user_id") as string,
            role: user.get("role") as "student" | "employer" | "admin",
          });
          res.status(206).json({ message: "2FA required", temp_token });
          return;
        }

        const isValid = await verifyOTP(user.get("user_id") as string, otp);
        if (!isValid) {
          await transaction.rollback();
          throw new AppError("Invalid OTP", 400, true);
        }
      };

      // Commit transaction - login successful
      await transaction.commit();

      const token = createJWT({
        user_id: user.get("user_id") as string,
        role: user.get("role") as "Student" | "Employer" | "Admin",
      });

      res.status(200).json({
        message: "User logged in successfully",
        token,
        two_fa_enabled: user.get("two_fa_enabled") as boolean,
      });

    } catch (error) {
      // Rollback transaction on any error
      await transaction.rollback();
      throw error;
    }
  }
);

// 2FA setup controller
export const setup2FA = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { user_id, email } = req.body;

    if (!user_id || !email) {
      throw new AppError("User ID and email are required", 400, true);
    }

    // Start transaction for 2FA setup
    const transaction = await sequelize.transaction();
    
    try {
      // Verify user exists within transaction
      const user = await UserModel.findOne({ 
        where: { user_id },
        transaction 
      });
      
      if (!user) {
        await transaction.rollback();
        throw new AppError("User not found", 404, true);
      }

      // Check if 2FA is already enabled
      if (user.get("two_fa_enabled") as boolean) {
        await transaction.rollback();
        throw new AppError("2FA is already enabled for this user", 400, true);
      }

      // Generate 2FA secret
      const { secret, qrCodeUrl } = await generate2FASecret(user_id, email);

      // Update user with 2FA secret within transaction
      await UserModel.update(
        { two_fa_secret: secret },
        { where: { user_id }, transaction }
      );

      // Commit transaction
      await transaction.commit();

      res.status(200).json({ 
        message: "2FA setup initiated successfully",
        qrCodeUrl, 
        secret 
      });

    } catch (error) {
      // Rollback transaction on any error
      await transaction.rollback();
      throw error;
    }
  }
);

// 2FA verification controller
export const verify2FA = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { user_id, token } = req.body;

    if (!user_id || !token) {
      throw new AppError("User ID and OTP token are required", 400, true);
    }

    // Start transaction for 2FA verification
    const transaction = await sequelize.transaction();
    
    try {
      // Verify user exists and has 2FA secret
      const user = await UserModel.findOne({ 
        where: { user_id },
        transaction 
      });
      
      if (!user) {
        await transaction.rollback();
        throw new AppError("User not found", 404, true);
      }

      if (!user.get("two_fa_secret")) {
        await transaction.rollback();
        throw new AppError("2FA is not set up for this user", 400, true);
      }

      // Verify the OTP token
      const isValid = await verifyOTP(user_id, token);

      if (!isValid) {
        await transaction.rollback();
        throw new AppError("Invalid OTP token", 400, true);
      }

      // Enable 2FA for the user within transaction
      await UserModel.update(
        { two_fa_enabled: true },
        { where: { user_id }, transaction }
      );

      // Commit transaction
      await transaction.commit();

      res.status(200).json({ 
        success: true,
        message: "2FA verification successful and enabled"
      });

    } catch (error) {
      // Rollback transaction on any error
      await transaction.rollback();
      throw error;
    }
  }
);