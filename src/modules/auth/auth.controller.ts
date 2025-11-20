import { Request, Response } from "express";
import {
  registerUser,
  loginUser,
  refreshTokenService,
  logoutUser,
  generate2FAUser,
  verify2FAUser,
  forgotPasswordService,
  verifyResetOTPService,
  resetPasswordService,
} from "./auth.service";

import { StatusCodes } from "http-status-codes";
import { ResponseFormat } from "@/exception/responseFormat";

const response = new ResponseFormat();

// -------------------- REGISTER --------------------
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await registerUser(req.body);

    response.response(
      res,
      true,
      StatusCodes.CREATED,
      result.user,
      "User registered successfully"
    );
  } catch (error: any) {
    response.errorResponse(
      res,
      error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      error.message
    );
  }
};

// -------------------- LOGIN --------------------
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user, accessToken, refreshToken, two_fa_enabled } =
      await loginUser(req.body);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false, 
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    response.response(
      res,
      true,
      StatusCodes.OK,
      { user, accessToken, two_fa_enabled },
      "User logged in successfully"
    );
  } catch (error: any) {
    response.errorResponse(
      res,
      error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      error.message
    );
  }
};

// -------------------- REFRESH ACCESS TOKEN --------------------
export const refreshAccessToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      response.errorResponse(res, 401, false, "Refresh token missing");
      return;
    }

    const { newAccessToken, newRefreshToken } =
      await refreshTokenService(refreshToken);

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    response.response(
      res,
      true,
      StatusCodes.OK,
      { accessToken: newAccessToken },
      "Token refreshed successfully"
    );
  } catch (error: any) {
    response.errorResponse(
      res,
      StatusCodes.UNAUTHORIZED,
      false,
      error.message || "Invalid refresh token"
    );
  }
};

// -------------------- LOGOUT --------------------
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    await logoutUser();

    res.clearCookie("refreshToken");

    response.response(
      res,
      true,
      StatusCodes.OK,
      {},
      "Logged out successfully"
    );
  } catch (error: any) {
    response.errorResponse(
      res,
      error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      error.message
    );
  }
};

// -------------------- 2FA SETUP --------------------
export const setup2FA = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_id, email } = req.body;

    const result = await generate2FAUser(user_id, email);

    response.response(
      res,
      true,
      StatusCodes.OK,
      result,
      "2FA setup successful"
    );
  } catch (error: any) {
    response.errorResponse(
      res,
      error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      error.message
    );
  }
};

// -------------------- 2FA VERIFY --------------------
export const verify2FA = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_id, token } = req.body;

    const result = await verify2FAUser(user_id, token);

    response.response(
      res,
      true,
      StatusCodes.OK,
      result,
      "2FA verified successfully"
    );
  } catch (error: any) {
    response.errorResponse(
      res,
      error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      error.message
    );
  }
};

// -------------------- FORGOT PASSWORD --------------------
export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    const result = await forgotPasswordService(email);

    response.response(
      res,
      true,
      StatusCodes.OK,
      result,
      "OTP sent successfully"
    );
  } catch (error: any) {
    response.errorResponse(
      res,
      error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      error.message
    );
  }
};

// -------------------- VERIFY RESET OTP --------------------
export const verifyResetOTP = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { otp, resetToken } = req.body;

    await verifyResetOTPService(otp, resetToken);

    response.response(
      res,
      true,
      StatusCodes.OK,
      {},
      "OTP verification successful"
    );
  } catch (error: any) {
    response.errorResponse(
      res,
      error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      error.message
    );
  }
};

// -------------------- RESET PASSWORD --------------------
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { newPassword, resetToken } = req.body;

    await resetPasswordService(newPassword, resetToken);

    response.response(
      res,
      true,
      StatusCodes.OK,
      {},
      "Password reset successful"
    );
  } catch (error: any) {
    response.errorResponse(
      res,
      error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      error.message
    );
  }
};
