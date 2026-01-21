import express from 'express';
import {
    register,
    addUserController,
    login,
    refreshAccessToken,
    logout,
    setup2FA,
    verify2FA,
    forgotPassword,
    verifyResetOTP,
    resetPassword,
    getAllusers,
   // getAllStudents,
   // getAllEmployers,
    getUserProfile,
    updateProfile,
    verifyEmail,
    resendVerificationEmail,
    sendPhoneVerificationOTP,
    verifyPhone,
    createSubAdminController,
    getAllSubAdmins,
    getSubAdminById,
    updateSubAdmin,
    deleteSubAdmin,
    getUserById,
    updateUserById,
    deleteUser,
} from './auth.controller';

import { loginLimiter } from '@/middlewares/rateLimiter.middleware';
import { validateEmailMiddleware } from '@/middlewares/emailValidator.middleware';
import { authMiddleware } from '@/middlewares/auth.middleware';
import {
    PermissionChecker,
    superadminOnly,
    adminOrSuperadminOnly,
} from '@/middlewares/role.middleware';

const authRouter = express.Router();

// authRouter.post("/register",validateEmailMiddleware, register);
// authRouter.post("/login", loginLimiter, login);

authRouter.post('/register', register);
authRouter.post('/login', login);

authRouter.get('/refresh', refreshAccessToken);
// Optional: Add authMiddleware for secure logout (recommended)
authRouter.post('/logout', authMiddleware, logout);

authRouter.post('/2fa/setup', setup2FA);
authRouter.post('/2fa/verify', verify2FA);

authRouter.get('/me', authMiddleware, async (req, res) => {
    try {
        const { DB } = await import('@/database');
        const roleName = req.user?.role;
        
        console.log('🔍 [AUTH/ME] Request received for user:', req.user?.user_id);
        console.log('🔍 [AUTH/ME] User role:', roleName);
        
        let permissions = null;
        
        // Fetch role permissions if role exists and is not superadmin or exact "admin" roleName
        // Custom admin roles like "admin1", "admin2", "subadmin" etc. will fetch permissions
        if (roleName && 
            roleName.toLowerCase() !== 'superadmin' && 
            roleName !== 'admin') {
            console.log('🔍 [AUTH/ME] Fetching permissions for role:', roleName);
            const role = await DB.Roles.findOne({ where: { roleName } });
            if (role) {
                console.log('🔍 [AUTH/ME] Role found. permission_json type:', typeof role.permission_json);
                console.log('🔍 [AUTH/ME] permission_json raw:', role.permission_json);
                
                // Parse permission_json if it's a string, otherwise use it as-is
                permissions = typeof role.permission_json === 'string'
                    ? JSON.parse(role.permission_json)
                    : role.permission_json || [];
                
                console.log('🔍 [AUTH/ME] Parsed permissions:', JSON.stringify(permissions, null, 2));
            } else {
                console.log('⚠️ [AUTH/ME] Role not found in database for roleName:', roleName);
            }
        } else {
            console.log('🔍 [AUTH/ME] Skipping permission fetch (superadmin or exact "admin" roleName bypass)');
        }
        
        const responseData = {
            ...req.user,
            permissions, // Include permissions in user object
        };
        
        console.log('🔍 [AUTH/ME] Sending response with permissions:', JSON.stringify(responseData.permissions, null, 2));
        
        res.json({
            message: 'Protected API working',
            user: responseData,
        });
    } catch (error: any) {
        console.error('❌ [AUTH/ME] Error:', error);
        res.status(500).json({
            message: 'Error fetching user data',
            error: error.message,
        });
    }
});

authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/verify-otp', verifyResetOTP);
authRouter.post('/reset-password', resetPassword);

// Email verification routes
authRouter.get('/verify-email', verifyEmail);
authRouter.post('/resend-verification-email', resendVerificationEmail);

// Phone verification routes
authRouter.post('/send-phone-verification-otp', authMiddleware, sendPhoneVerificationOTP);
authRouter.post('/verify-phone', authMiddleware, verifyPhone);

authRouter.get('/get-user', getAllusers);
// authRouter.get('/get-students', getAllStudents);
// authRouter.get('/get-employers', getAllEmployers);

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

// Get user by ID - requires admin or superadmin authentication
authRouter.get(
    '/users/:id',
    authMiddleware,
    adminOrSuperadminOnly,
    getUserById,
);

// Update user by ID - requires admin or superadmin authentication
authRouter.put(
    '/users/:id',
    authMiddleware,
    adminOrSuperadminOnly,
    updateUserById,
);

// Delete user - requires admin or superadmin authentication
authRouter.delete(
    '/users/:id',
    authMiddleware,
    adminOrSuperadminOnly,
    deleteUser,
);

// Add user - requires admin or superadmin authentication
authRouter.post(
    '/add-user',
    authMiddleware,
    adminOrSuperadminOnly,
    addUserController,
);

export default authRouter;
