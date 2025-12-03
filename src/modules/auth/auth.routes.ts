import express from 'express';
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
    getUserProfile,
    createSuperAdminController,
    updateProfile,
    verifyEmail,
    resendVerificationEmail,
    createSubAdminController,
    getAllSubAdmins,
    getSubAdminById,
    updateSubAdmin,
    deleteSubAdmin,
} from './auth.controller';

import { loginLimiter } from '@/middlewares/rateLimiter.middleware';
import { validateEmailMiddleware } from '@/middlewares/emailValidator.middleware';
import { authMiddleware } from '@/middlewares/auth.middleware';
import {
    PermissionChecker,
    superadminOnly,
} from '@/middlewares/role.middleware';

const authRouter = express.Router();

// authRouter.post("/register",validateEmailMiddleware, register);
// authRouter.post("/login", loginLimiter, login);

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/create-superadmin', createSuperAdminController);

authRouter.get('/refresh', refreshAccessToken);
// Optional: Add authMiddleware for secure logout (recommended)
authRouter.post('/logout', authMiddleware, logout);

authRouter.post('/2fa/setup', setup2FA);
authRouter.post('/2fa/verify', verify2FA);

authRouter.get('/me', authMiddleware, (req, res) => {
    res.json({
        message: 'Protected API working',
        user: req.user,
    });
});

authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/verify-otp', verifyResetOTP);
authRouter.post('/reset-password', resetPassword);

// Email verification routes
authRouter.get('/verify-email', verifyEmail);
authRouter.post('/resend-verification-email', resendVerificationEmail);

authRouter.get('/get-user', getAllusers);
authRouter.get('/get-students', getAllStudents);
authRouter.get('/get-employers', getAllEmployers);

// Get user profile - requires authentication
authRouter.get('/profile', authMiddleware, getUserProfile);

// Update user profile - requires authentication
authRouter.put('/profile', authMiddleware, updateProfile);

// Create subadmin - requires superadmin authentication
authRouter.post(
    '/create-subadmin',
    authMiddleware,
    superadminOnly,
    createSubAdminController,
);

// Get all subadmins - requires superadmin authentication
authRouter.get('/subadmins', authMiddleware, superadminOnly, getAllSubAdmins);

// Get subadmin by ID - requires superadmin authentication
authRouter.get(
    '/subadmins/:id',
    authMiddleware,
    superadminOnly,
    getSubAdminById,
);

// Update subadmin - requires superadmin authentication
authRouter.put(
    '/subadmins/:id',
    authMiddleware,
    superadminOnly,
    updateSubAdmin,
);

// Delete subadmin - requires superadmin authentication
authRouter.delete(
    '/subadmins/:id',
    authMiddleware,
    superadminOnly,
    deleteSubAdmin,
);

export default authRouter;
