import express from "express";
const router = express.Router();
import { 
    login, 
    register, 
    setup2FA, 
    verify2FA 
} from "../controllers/auth.controller.js";
import { uploadSingle } from "../../../middlewares/multer.js";

router.route('/register').post(uploadSingle("file"), register);
router.route('/login').post(login);
router.route('/2fa/setup').post(setup2FA);
router.route('/2fa/verify').post(verify2FA);

export default router;