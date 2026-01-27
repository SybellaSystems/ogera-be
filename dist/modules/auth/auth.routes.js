"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("./auth.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const authRouter = express_1.default.Router();
// authRouter.post("/register",validateEmailMiddleware, register);
// authRouter.post("/login", loginLimiter, login);
authRouter.post('/register', auth_controller_1.register);
authRouter.post('/login', auth_controller_1.login);
authRouter.get('/refresh', auth_controller_1.refreshAccessToken);
// Optional: Add authMiddleware for secure logout (recommended)
authRouter.post('/logout', auth_middleware_1.authMiddleware, auth_controller_1.logout);
authRouter.post('/2fa/setup', auth_controller_1.setup2FA);
authRouter.post('/2fa/verify', auth_controller_1.verify2FA);
authRouter.get('/me', auth_middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { DB } = yield Promise.resolve().then(() => __importStar(require('../../database')));
        const roleName = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        console.log('🔍 [AUTH/ME] Request received for user:', (_b = req.user) === null || _b === void 0 ? void 0 : _b.user_id);
        console.log('🔍 [AUTH/ME] User role:', roleName);
        let permissions = null;
        // Fetch role permissions if role exists and is not superadmin or exact "admin" roleName
        // Custom admin roles like "admin1", "admin2", "subadmin" etc. will fetch permissions
        if (roleName &&
            roleName.toLowerCase() !== 'superadmin' &&
            roleName !== 'admin') {
            console.log('🔍 [AUTH/ME] Fetching permissions for role:', roleName);
            const role = yield DB.Roles.findOne({ where: { roleName } });
            if (role) {
                console.log('🔍 [AUTH/ME] Role found. permission_json type:', typeof role.permission_json);
                console.log('🔍 [AUTH/ME] permission_json raw:', role.permission_json);
                // Parse permission_json if it's a string, otherwise use it as-is
                permissions = typeof role.permission_json === 'string'
                    ? JSON.parse(role.permission_json)
                    : role.permission_json || [];
                console.log('🔍 [AUTH/ME] Parsed permissions:', JSON.stringify(permissions, null, 2));
            }
            else {
                console.log('⚠️ [AUTH/ME] Role not found in database for roleName:', roleName);
            }
        }
        else {
            console.log('🔍 [AUTH/ME] Skipping permission fetch (superadmin or exact "admin" roleName bypass)');
        }
        const responseData = Object.assign(Object.assign({}, req.user), { permissions });
        console.log('🔍 [AUTH/ME] Sending response with permissions:', JSON.stringify(responseData.permissions, null, 2));
        res.json({
            message: 'Protected API working',
            user: responseData,
        });
    }
    catch (error) {
        console.error('❌ [AUTH/ME] Error:', error);
        res.status(500).json({
            message: 'Error fetching user data',
            error: error.message,
        });
    }
}));
authRouter.post('/forgot-password', auth_controller_1.forgotPassword);
authRouter.post('/verify-otp', auth_controller_1.verifyResetOTP);
authRouter.post('/reset-password', auth_controller_1.resetPassword);
// Email verification routes
authRouter.get('/verify-email', auth_controller_1.verifyEmail);
authRouter.post('/resend-verification-email', auth_controller_1.resendVerificationEmail);
// Phone verification routes
authRouter.post('/send-phone-verification-otp', auth_middleware_1.authMiddleware, auth_controller_1.sendPhoneVerificationOTP);
authRouter.post('/verify-phone', auth_middleware_1.authMiddleware, auth_controller_1.verifyPhone);
authRouter.get('/get-user', auth_controller_1.getAllusers);
// authRouter.get('/get-students', getAllStudents);
// authRouter.get('/get-employers', getAllEmployers);
// Get user profile - requires authentication
authRouter.get('/profile', auth_middleware_1.authMiddleware, auth_controller_1.getUserProfile);
// Update user profile - requires authentication
authRouter.put('/profile', auth_middleware_1.authMiddleware, auth_controller_1.updateProfile);
// Create subadmin - requires superadmin authentication
authRouter.post('/create-subadmin', auth_middleware_1.authMiddleware, role_middleware_1.superadminOnly, auth_controller_1.createSubAdminController);
// Get all subadmins - requires superadmin authentication
authRouter.get('/subadmins', auth_middleware_1.authMiddleware, role_middleware_1.superadminOnly, auth_controller_1.getAllSubAdmins);
// Get subadmin by ID - requires superadmin authentication
authRouter.get('/subadmins/:id', auth_middleware_1.authMiddleware, role_middleware_1.superadminOnly, auth_controller_1.getSubAdminById);
// Update subadmin - requires superadmin authentication
authRouter.put('/subadmins/:id', auth_middleware_1.authMiddleware, role_middleware_1.superadminOnly, auth_controller_1.updateSubAdmin);
// Delete subadmin - requires superadmin authentication
authRouter.delete('/subadmins/:id', auth_middleware_1.authMiddleware, role_middleware_1.superadminOnly, auth_controller_1.deleteSubAdmin);
// Get user by ID - requires admin or superadmin authentication
authRouter.get('/users/:id', auth_middleware_1.authMiddleware, role_middleware_1.adminOrSuperadminOnly, auth_controller_1.getUserById);
// Update user by ID - requires admin or superadmin authentication
authRouter.put('/users/:id', auth_middleware_1.authMiddleware, role_middleware_1.adminOrSuperadminOnly, auth_controller_1.updateUserById);
// Delete user - requires admin or superadmin authentication
authRouter.delete('/users/:id', auth_middleware_1.authMiddleware, role_middleware_1.adminOrSuperadminOnly, auth_controller_1.deleteUser);
// Add user - requires admin or superadmin authentication
authRouter.post('/add-user', auth_middleware_1.authMiddleware, role_middleware_1.adminOrSuperadminOnly, auth_controller_1.addUserController);
exports.default = authRouter;
