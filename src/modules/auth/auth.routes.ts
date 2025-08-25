import express from "express";
import { 
  register,
  login,
  setup2FA,
  verify2FA,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  getAllusers,
  getAllStudents,
  getAllEmployers
} from "./auth.controller";

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/2fa/setup", setup2FA);
authRouter.post("/2fa/verify", verify2FA);

// Forgot Password Routes
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/verify-otp", verifyResetOTP);
authRouter.post("/reset-password", resetPassword);


authRouter.get("/get-user",getAllusers);
authRouter.get("/get-students", getAllStudents);
authRouter.get("/get-employers", getAllEmployers);

export default authRouter;
