"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const academicVerification_controller_1 = require("./academicVerification.controller");
const router = express_1.default.Router();
/* -------------------- Multer Config -------------------- */
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type'));
        }
    },
});
/* -------------------- Routes -------------------- */
/**
 * 1. Upload academic document (Student)
 * Permission: create
 */
router.post('/', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/academic-verifications', 'create'), upload.single('document'), academicVerification_controller_1.uploadAcademicDoc);
/**
 * 2. Get my academic verification (Student)
 * Permission: view
 */
router.get('/my-verification', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/academic-verifications', 'view'), academicVerification_controller_1.getMyAcademicVerification);
/**
 * 3. Re-upload academic document (Student)
 * Permission: edit
 */
router.post('/:id/reupload', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/academic-verifications', 'edit'), upload.single('document'), academicVerification_controller_1.reuploadAcademicDoc);
/**
 * 4. Review academic document (Admin)
 * Permission: edit
 */
router.patch('/:id/review', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/academic-verifications', 'edit'), academicVerification_controller_1.reviewAcademicDoc);
/**
 * 5. Get academic verification by ID
 * Permission: view
 */
router.get('/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/academic-verifications', 'view'), academicVerification_controller_1.getAcademicVerificationById);
/**
 * 6. Get academic verification by user ID
 * Permission: view
 */
router.get('/user/:user_id', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/academic-verifications', 'view'), academicVerification_controller_1.getAcademicVerificationByUserId);
/**
 * 7. Get all academic verifications (Admin)
 * Permission: view
 */
router.get('/', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/academic-verifications', 'view'), academicVerification_controller_1.getAllAcademicVerifications);
/**
 * 8. Get pending academic verifications (Admin)
 * Permission: view
 */
router.get('/pending/list', auth_middleware_1.authMiddleware, (0, role_middleware_1.PermissionChecker)('/academic-verifications', 'view'), academicVerification_controller_1.getPendingAcademicVerifications);
exports.default = router;
