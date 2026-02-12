import express from 'express';
import multer from 'multer';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { PermissionChecker } from '@/middlewares/role.middleware';

import {
  uploadAcademicDoc,
  reuploadAcademicDoc,
  reviewAcademicDoc,
  getAcademicVerificationById,
  getAcademicVerificationByUserId,
  getMyAcademicVerification,
  getAllAcademicVerifications,
  getPendingAcademicVerifications,
  getAcademicVerificationDocument,
} from './academicVerification.controller';

const router = express.Router();

/* -------------------- Multer Config -------------------- */
const upload = multer({
  storage: multer.memoryStorage(),
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
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

/* -------------------- Routes -------------------- */

/**
 * 1. Upload academic document (Student)
 * Permission: create
 */
router.post(
  '/',
  authMiddleware,
  PermissionChecker('/academic-verifications', 'create'),
  upload.single('document'),
  uploadAcademicDoc
);

/**
 * 2. Get my academic verification (Student)
 * Permission: view
 */
router.get(
  '/my-verification',
  authMiddleware,
  PermissionChecker('/academic-verifications', 'view'),
  getMyAcademicVerification
);

/**
 * 3. Re-upload academic document (Student)
 * Permission: edit
 */
router.post(
  '/:id/reupload',
  authMiddleware,
  PermissionChecker('/academic-verifications', 'edit'),
  upload.single('document'),
  reuploadAcademicDoc
);

/**
 * 4. Review academic document (Admin)
 * Permission: edit
 */
router.patch(
  '/:id/review',
  authMiddleware,
  PermissionChecker('/academic-verifications', 'edit'),
  reviewAcademicDoc
);

/**
 * 9. Download / View academic document (MUST be BEFORE /:id route)
 * Permission: view
 */
router.get(
  '/:id/document',
  authMiddleware,
  PermissionChecker('/academic-verifications', 'view'),
  getAcademicVerificationDocument
);

/**
 * 5. Get academic verification by ID
 * Permission: view
 */
router.get(
  '/:id',
  authMiddleware,
  PermissionChecker('/academic-verifications', 'view'),
  getAcademicVerificationById
);

/**
 * 6. Get academic verification by user ID
 * Permission: view
 */
router.get(
  '/user/:user_id',
  authMiddleware,
  PermissionChecker('/academic-verifications', 'view'),
  getAcademicVerificationByUserId
);

/**
 * 7. Get all academic verifications (Admin)
 * Permission: view
 */
router.get(
  '/',
  authMiddleware,
  PermissionChecker('/academic-verifications', 'view'),
  getAllAcademicVerifications
);

/**
 * 8. Get pending academic verifications (Admin)
 * Permission: view
 */
router.get(
  '/pending/list',
  authMiddleware,
  PermissionChecker('/academic-verifications', 'view'),
  getPendingAcademicVerifications
);

/**
 * 9. Get academic verification document (view/download)
 * Permission: view
 */
router.get(
  '/:id/document',
  authMiddleware,
  PermissionChecker('/academic-verifications', 'view'),
  getAcademicVerificationDocument
);

export default router;


