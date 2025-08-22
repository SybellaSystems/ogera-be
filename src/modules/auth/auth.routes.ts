import express from "express";
import { signUpController, signInController, setup2FAController, verify2FAController } from "./auth.controller";

const authRouter = express.Router();

authRouter.post("/register", signUpController);
authRouter.post("/login", signInController);
authRouter.post("/2fa/setup", setup2FAController);
authRouter.post("/2fa/verify", verify2FAController);

export default authRouter;
