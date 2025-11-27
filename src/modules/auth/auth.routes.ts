import express from "express";
import {
  register,
  login,
  refreshAccessToken,
  logout,
  setup2FA,
  verify2FA,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  getAllusers,
  getAllStudents,
  getAllEmployers,
  getUserProfile
} from "./auth.controller";

import { loginLimiter } from "@/middlewares/rateLimiter.middleware";
import {validateEmailMiddleware} from "@/middlewares/emailValidator.middleware";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { PermissionChecker } from "@/middlewares/role.middleware";

const authRouter = express.Router();

// authRouter.post("/register",validateEmailMiddleware, register);
// authRouter.post("/login", loginLimiter, login);

authRouter.post("/register", register);
authRouter.post("/login", login);

authRouter.get("/refresh", refreshAccessToken);
// Optional: Add authMiddleware for secure logout (recommended)
authRouter.post("/logout", authMiddleware, logout);

authRouter.post("/2fa/setup", setup2FA);
authRouter.post("/2fa/verify",verify2FA);

authRouter.get("/me", authMiddleware, (req, res) => {
  res.json({
    message: "Protected API working",
    user: req.user
  });
});

authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/verify-otp", verifyResetOTP);
authRouter.post("/reset-password", resetPassword);


authRouter.get("/get-user",getAllusers);
authRouter.get("/get-students", getAllStudents);
authRouter.get("/get-employers", getAllEmployers);

// Get user profile - requires authentication
authRouter.get("/profile", authMiddleware, getUserProfile);

export default authRouter;
