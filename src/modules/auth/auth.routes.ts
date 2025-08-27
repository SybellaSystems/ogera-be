import express from "express";
import {
  register,
  login,
  setup2FA,
  verify2FA,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
} from "./auth.controller";

import { loginLimiter } from "@/middlewares/rateLimiter.middleware";
import { arcjetEmailValidator  } from "@/middlewares/arcjet.middleware";

const authRouter = express.Router();

authRouter.post("/register",arcjetEmailValidator, register);

authRouter.post("/login", loginLimiter, login);

authRouter.post("/2fa/setup", setup2FA);
authRouter.post("/2fa/verify", verify2FA);

// Forgot Password Routes
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/verify-otp", verifyResetOTP);
authRouter.post("/reset-password", resetPassword);

export default authRouter;
