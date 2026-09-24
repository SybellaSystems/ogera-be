import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { superadminOnly } from '@/middlewares/role.middleware';
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
    updateCompanyInfo,
    updateOnlinePresence,
    // Full Profile
    getFullProfile,
    getOtherUserFullProfile,
    // Profile Image & Completion
    uploadProfileImage,
    getProfileCompletion,
    updateProfileImageUrl,
} from './profile.controller';
const router = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        allowed.includes(file.mimetype)
            ? cb(null, true)
            : cb(new Error('Only image files allowed'));
    },
});

// All routes require authentication
router.use(authMiddleware);

// ====================== FULL PROFILE ======================
router.get('/full', getFullProfile);
router.get('/full/:userId', superadminOnly, getOtherUserFullProfile);

// ====================== PROFILE COMPLETION ======================
router.get('/completion', getProfileCompletion);

// ====================== PROFILE IMAGE ======================
router.post(
    '/upload-image',
    upload.single('profile_image'),
    uploadProfileImage,
);
router.put('/image', updateProfileImageUrl);
// ====================== EXTENDED PROFILE ======================
router.get('/extended', getExtendedProfile);
router.put('/extended', updateExtendedProfile);
router.put('/company-info', updateCompanyInfo);
router.put('/online-presence', updateOnlinePresence);

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
