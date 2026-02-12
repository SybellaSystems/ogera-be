import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '@/middlewares/auth.middleware';
import {
    // Skills
    addSkill,
    addBulkSkills,
    getSkills,
    updateSkill,
    deleteSkill,
    // Employment
    addEmployment,
    getEmployments,
    updateEmployment,
    deleteEmployment,
    // Education
    addEducation,
    getEducations,
    updateEducation,
    deleteEducation,
    // Projects
    addProject,
    getProjects,
    updateProject,
    deleteProject,
    // Accomplishments
    addAccomplishment,
    getAccomplishments,
    updateAccomplishment,
    deleteAccomplishment,
    // Extended Profile
    getExtendedProfile,
    updateExtendedProfile,
    // Full Profile
    getFullProfile,
    // Profile Image
    uploadProfileImage,
} from './profile.controller';

const router = Router();

// Multer config for profile image upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files (JPEG, PNG, GIF, WEBP) are allowed'));
        }
    },
});

// All routes require authentication
router.use(authMiddleware);

// ====================== FULL PROFILE ======================
router.get('/full', getFullProfile);

// ====================== PROFILE IMAGE ======================
router.post('/upload-image', upload.single('profile_image'), uploadProfileImage);

// ====================== EXTENDED PROFILE ======================
router.get('/extended', getExtendedProfile);
router.put('/extended', updateExtendedProfile);

// ====================== SKILLS ======================
router.get('/skills', getSkills);
router.post('/skills', addSkill);
router.post('/skills/bulk', addBulkSkills);
router.put('/skills/:id', updateSkill);
router.delete('/skills/:id', deleteSkill);

// ====================== EMPLOYMENT ======================
router.get('/employments', getEmployments);
router.post('/employments', addEmployment);
router.put('/employments/:id', updateEmployment);
router.delete('/employments/:id', deleteEmployment);

// ====================== EDUCATION ======================
router.get('/educations', getEducations);
router.post('/educations', addEducation);
router.put('/educations/:id', updateEducation);
router.delete('/educations/:id', deleteEducation);

// ====================== PROJECTS ======================
router.get('/projects', getProjects);
router.post('/projects', addProject);
router.put('/projects/:id', updateProject);
router.delete('/projects/:id', deleteProject);

// ====================== ACCOMPLISHMENTS ======================
router.get('/accomplishments', getAccomplishments);
router.post('/accomplishments', addAccomplishment);
router.put('/accomplishments/:id', updateAccomplishment);
router.delete('/accomplishments/:id', deleteAccomplishment);

export default router;

