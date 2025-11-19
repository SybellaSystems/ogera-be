import express from "express";
import { 
  register,
  login,
  setup2FA,
  verify2FA,
  forgotPassword,
  verifyResetOTP,
  resetPassword
} from "./auth.controller";

import { authMiddleware } from "@/middlewares/auth.middleware";
import { PermissionChecker } from "@/middlewares/role.middleware";

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);

authRouter.post(
  "/2fa/setup",
  authMiddleware,
  PermissionChecker("/2fa", "update"),
  setup2FA
);

authRouter.post(
  "/2fa/verify",
  authMiddleware,
  PermissionChecker("/2fa", "update"),
  verify2FA
);

authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/verify-otp", verifyResetOTP);
authRouter.post("/reset-password", resetPassword);

export default authRouter;
