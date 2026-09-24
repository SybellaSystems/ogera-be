import express from 'express';
import multer from 'multer';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { studentRoleOnly, superadminOnly } from '@/middlewares/role.middleware';
import {
    addAcademicRecord,
    deleteAcademicRecord,
    getAllAcademicRecords,
    getAcademicRecordsByUser,
    getMyAcademicRecords,
    viewAcademicRecordCertificate,
} from './academicRecord.controller';

const academicRecordRouter = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
});

academicRecordRouter.post(
    '/',
    authMiddleware,
    studentRoleOnly,
    upload.single('certificate'),
    addAcademicRecord,
);

academicRecordRouter.get(
    '/my',
    authMiddleware,
    studentRoleOnly,
    getMyAcademicRecords,
);
academicRecordRouter.get(
    '/:id/certificate',
    authMiddleware,
    viewAcademicRecordCertificate,
);
academicRecordRouter.delete('/:id', authMiddleware, deleteAcademicRecord);
// Fallback route for environments/proxies that block DELETE method.
academicRecordRouter.post('/:id/delete', authMiddleware, deleteAcademicRecord);

// Superadmin can view records, but cannot add (enforced above).
academicRecordRouter.get(
    '/',
    authMiddleware,
    superadminOnly,
    getAllAcademicRecords,
);
academicRecordRouter.get(
    '/user/:user_id',
    authMiddleware,
    superadminOnly,
    getAcademicRecordsByUser,
);

export default academicRecordRouter;
