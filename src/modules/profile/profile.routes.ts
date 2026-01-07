import { Router } from 'express';
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
} from './profile.controller';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ====================== FULL PROFILE ======================
router.get('/full', getFullProfile);

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

