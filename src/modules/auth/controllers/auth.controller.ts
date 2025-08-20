import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { AppError, asyncHandler } from "../../../middlewares/errorHandler.js";
import DB from "../../../database/db.js"; // Initialized models
import { createJWT } from "../utils/token.js";
import { RegisterPayload, LoginPayload } from "../types/auth.types.js";
import { generate2FASecret, verifyOTP, enable2FA } from "../utils/2fa.js";

const UserModel = DB.User;

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
    const { email, mobile_number, password, role } = req.body;

    if (!email || !mobile_number || !password) {
      throw new AppError(
        "Please fill all input fields.",
        400,
        true,
        "EMPTY_INPUT_FIELD"
      );
    }

    const existingUser = await UserModel.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError("Email is already taken.", 400, true, "EXISTING_EMAIL");
    }

    const hashed_password = await hash_pwd(password);

    const user = await UserModel.create({
      email,
      mobile_number,
      password_hash: hashed_password,
      role: role ?? "student",
    });

    const token = createJWT({
      user_id: user.get("user_id") as string,
      role: user.get("role") as "student" | "employer" | "admin",
    });

    res.status(201).json({
      message: "User created successfully",
      user,
      token,
    });
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

    const user = await UserModel.findOne({ where: { email } });
    if (!user) {
      throw new AppError("Email does not exist", 404, true);
    }

    const isPasswordCorrect = await decrypt_pwd(
      password,
      user.get("password_hash") as string
    );
    if (!isPasswordCorrect) {
      throw new AppError("Incorrect email or password", 400, true);
    }

    // Handle 2FA
    if (user.get("two_fa_enabled") as boolean) {
      if (!otp) {
        const temp_token = createJWT({
          user_id: user.get("user_id") as string,
          role: user.get("role") as "student" | "employer" | "admin",
        });
        res.status(206).json({ message: "2FA required", temp_token });
        return;
      }

      const isValid = await verifyOTP(user.get("user_id") as string, otp);
      if (!isValid) {
        throw new AppError("Invalid OTP", 400, true);
      }
    }

    const token = createJWT({
      user_id: user.get("user_id") as string,
      role: user.get("role") as "student" | "employer" | "admin",
    });

    res.status(200).json({
      message: "User logged in successfully",
      token,
      two_fa_enabled: user.get("two_fa_enabled") as boolean,
    });
  }
);

// 2FA setup controller
export const setup2FA = asyncHandler(async (req: Request, res: Response) => {
  const { user_id, email } = req.body;
  const { secret, qrCodeUrl } = await generate2FASecret(user_id, email);

  await UserModel.update({ two_fa_secret: secret }, { where: { user_id } });

  res.json({ qrCodeUrl, secret });
});

// 2FA verification controller
export const verify2FA = asyncHandler(async (req: Request, res: Response) => {
  const { user_id, token } = req.body;
  const isValid = await verifyOTP(user_id, token);

  if (isValid) {
    await enable2FA(user_id);
    res.json({ success: true });
  } else {
    throw new AppError("Invalid OTP", 400, true);
  }
});
