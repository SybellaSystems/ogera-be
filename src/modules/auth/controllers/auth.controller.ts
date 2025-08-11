import type { Request, Response } from "express";
import pool from "../../../config/db.js";
import bcrypt from "bcryptjs";
import { AppError, asyncHandler } from "../../../middlewares/errorHandler.js";
import { createUserService } from "../../../models/users.model.js";
import { createJWT } from "../utils/token.js";
import { RegisterPayload, LoginPayload } from "../types/auth.types.js";
import { generate2FASecret, verifyOTP, enable2FA } from "../utils/2fa.js";

const hash_pwd = async(password:string):Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

const decrypt_pwd = async(candidatePassword: string, password: string): Promise<boolean> => {
    return await bcrypt.compare(candidatePassword, password);
}

// Registration controller
export const register = asyncHandler(async(req: Request<{}, {}, RegisterPayload>, res:Response):Promise<void> => {
    const { email, mobile_number, password, role } = req.body;
    if (!email || !mobile_number || !password) {
        throw new AppError('Please fill all input fields.', 400, true, 'EMPTY_INPUT_FIELD');
    }

    const existingEmail = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingEmail.rows.length > 0) {
        throw new AppError('Email is already taken.', 400, true, 'EXISTING_EMAIL');
    }

    const hashed_password = await hash_pwd(password);
    const user = await createUserService(email, mobile_number, hashed_password, role ?? 'student');

    const jwtPayload = {
        user_id: user.user_id,
        role: user.role
    };
    const token = createJWT(jwtPayload);
    res.status(201).json({
        message: "User created successfully",
        user,
        token
    });
});


// Login controller
export const login = asyncHandler(async(
    req: Request<{}, {}, LoginPayload>, res: Response
): Promise<void> => {
    const { email, password, otp } = req.body;

    if (!email || !password) {
        throw new AppError('Please fill in your email and password.', 400, true, 'EMPTY_INPUT_FIELD');
    }

    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if(user.rows.length === 0) {
        throw new AppError('Email does not exist', 404, true);
    }

    const isPasswordCorrect = await decrypt_pwd(password, user.rows[0].password_hash);
    if (!isPasswordCorrect) {
        throw new AppError('Incorrect email or password', 400, true);   
    }

    // Check if 2FA is enabled
    if (user.rows[0].two_fa_enabled) {
        if (!otp) {
            // Return special response indicating 2FA is required
            res.status(206).json({
                message: '2FA required',
                temp_token: createJWT({ // Temporary token for 2FA verification
                    user_id: user.rows[0].user_id,
                    role: user.rows[0].role
                })
            });
            return;
        }

        // Verify the OTP
        const isValid = await verifyOTP(user.rows[0].user_id, otp);
        if (!isValid) {
            throw new AppError('Invalid OTP', 400, true);
        }
    }

    // Final successful login
    const jwtPayload = {
        user_id: user.rows[0].user_id,
        role: user.rows[0].role
    };
    const token = createJWT(jwtPayload);
    res.status(200).json({
        message: 'User logged in successfully',
        token,
        two_fa_enabled: user.rows[0].two_fa_enabled
    });
});


// 2FA setup controller
export const setup2FA = asyncHandler(async(req: Request, res: Response) => {
    const { user_id, email } = req.body;
    const { secret, qrCodeUrl } = await generate2FASecret(user_id, email);
    res.json({ qrCodeUrl, secret });
});


// 2FA verification controller
export const verify2FA = asyncHandler(async(req: Request, res: Response) => {
    const { user_id, token } = req.body;
    const isValid = await verifyOTP(user_id, token);

    if (isValid) {
        await enable2FA(user_id);
        res.json({ success: true });
    } else {
        throw new AppError('Invalid OTP', 400, true);
    }
});