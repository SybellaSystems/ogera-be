"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const profile_controller_1 = require("./profile.controller");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authMiddleware);
// ====================== FULL PROFILE ======================
router.get('/full', profile_controller_1.getFullProfile);
// ====================== EXTENDED PROFILE ======================
router.get('/extended', profile_controller_1.getExtendedProfile);
router.put('/extended', profile_controller_1.updateExtendedProfile);
// ====================== SKILLS ======================
router.get('/skills', profile_controller_1.getSkills);
router.post('/skills', profile_controller_1.addSkill);
router.post('/skills/bulk', profile_controller_1.addBulkSkills);
router.put('/skills/:id', profile_controller_1.updateSkill);
router.delete('/skills/:id', profile_controller_1.deleteSkill);
// ====================== EMPLOYMENT ======================
router.get('/employments', profile_controller_1.getEmployments);
router.post('/employments', profile_controller_1.addEmployment);
router.put('/employments/:id', profile_controller_1.updateEmployment);
router.delete('/employments/:id', profile_controller_1.deleteEmployment);
// ====================== EDUCATION ======================
router.get('/educations', profile_controller_1.getEducations);
router.post('/educations', profile_controller_1.addEducation);
router.put('/educations/:id', profile_controller_1.updateEducation);
router.delete('/educations/:id', profile_controller_1.deleteEducation);
// ====================== PROJECTS ======================
router.get('/projects', profile_controller_1.getProjects);
router.post('/projects', profile_controller_1.addProject);
router.put('/projects/:id', profile_controller_1.updateProject);
router.delete('/projects/:id', profile_controller_1.deleteProject);
// ====================== ACCOMPLISHMENTS ======================
router.get('/accomplishments', profile_controller_1.getAccomplishments);
router.post('/accomplishments', profile_controller_1.addAccomplishment);
router.put('/accomplishments/:id', profile_controller_1.updateAccomplishment);
router.delete('/accomplishments/:id', profile_controller_1.deleteAccomplishment);
exports.default = router;
