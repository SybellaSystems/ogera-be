"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFullProfile = exports.createOrUpdateExtendedProfile = exports.findExtendedProfileByUserId = exports.deleteAccomplishment = exports.updateAccomplishment = exports.findAccomplishmentById = exports.findAccomplishmentsByUserId = exports.createAccomplishment = exports.deleteProject = exports.updateProject = exports.findProjectById = exports.findProjectsByUserId = exports.createProject = exports.deleteEducation = exports.updateEducation = exports.findEducationById = exports.findEducationsByUserId = exports.createEducation = exports.deleteEmployment = exports.updateEmployment = exports.findEmploymentById = exports.findEmploymentsByUserId = exports.createEmployment = exports.deleteAllSkillsByUserId = exports.deleteSkill = exports.updateSkill = exports.findSkillById = exports.findSkillsByUserId = exports.createBulkSkills = exports.createSkill = void 0;
const database_1 = require("../../database");
// ====================== SKILLS ======================
const createSkill = (user_id, data) => __awaiter(void 0, void 0, void 0, function* () {
    return database_1.DB.UserSkills.create(Object.assign({ user_id }, data));
});
exports.createSkill = createSkill;
const createBulkSkills = (user_id, skills) => __awaiter(void 0, void 0, void 0, function* () {
    const skillsWithUserId = skills.map(skill => (Object.assign({ user_id }, skill)));
    return database_1.DB.UserSkills.bulkCreate(skillsWithUserId, {
        ignoreDuplicates: true,
    });
});
exports.createBulkSkills = createBulkSkills;
const findSkillsByUserId = (user_id, skill_type) => __awaiter(void 0, void 0, void 0, function* () {
    const where = { user_id };
    if (skill_type) {
        where.skill_type = skill_type;
    }
    return database_1.DB.UserSkills.findAll({
        where,
        order: [['created_at', 'DESC']],
    });
});
exports.findSkillsByUserId = findSkillsByUserId;
const findSkillById = (skill_id) => __awaiter(void 0, void 0, void 0, function* () {
    return database_1.DB.UserSkills.findByPk(skill_id);
});
exports.findSkillById = findSkillById;
const updateSkill = (skill_id, data) => __awaiter(void 0, void 0, void 0, function* () {
    return database_1.DB.UserSkills.update(data, {
        where: { skill_id },
    });
});
exports.updateSkill = updateSkill;
const deleteSkill = (skill_id) => __awaiter(void 0, void 0, void 0, function* () {
    return database_1.DB.UserSkills.destroy({
        where: { skill_id },
    });
});
exports.deleteSkill = deleteSkill;
const deleteAllSkillsByUserId = (user_id, skill_type) => __awaiter(void 0, void 0, void 0, function* () {
    const where = { user_id };
    if (skill_type) {
        where.skill_type = skill_type;
    }
    return database_1.DB.UserSkills.destroy({ where });
});
exports.deleteAllSkillsByUserId = deleteAllSkillsByUserId;
// ====================== EMPLOYMENT ======================
const createEmployment = (user_id, data) => __awaiter(void 0, void 0, void 0, function* () {
    return database_1.DB.UserEmployments.create(Object.assign(Object.assign({ user_id }, data), { start_date: new Date(data.start_date), end_date: data.end_date ? new Date(data.end_date) : null }));
});
exports.createEmployment = createEmployment;
const findEmploymentsByUserId = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    return database_1.DB.UserEmployments.findAll({
        where: { user_id },
        order: [['is_current', 'DESC'], ['start_date', 'DESC']],
    });
});
exports.findEmploymentsByUserId = findEmploymentsByUserId;
const findEmploymentById = (employment_id) => __awaiter(void 0, void 0, void 0, function* () {
    return database_1.DB.UserEmployments.findByPk(employment_id);
});
exports.findEmploymentById = findEmploymentById;
const updateEmployment = (employment_id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const updateData = Object.assign({}, data);
    if (data.start_date) {
        updateData.start_date = new Date(data.start_date);
    }
    if (data.end_date) {
        updateData.end_date = new Date(data.end_date);
    }
    else if (data.end_date === null || data.end_date === '') {
        updateData.end_date = null;
    }
    return database_1.DB.UserEmployments.update(updateData, {
        where: { employment_id },
    });
});
exports.updateEmployment = updateEmployment;
const deleteEmployment = (employment_id) => __awaiter(void 0, void 0, void 0, function* () {
    return database_1.DB.UserEmployments.destroy({
        where: { employment_id },
    });
});
exports.deleteEmployment = deleteEmployment;
// ====================== EDUCATION ======================
const createEducation = (user_id, data) => __awaiter(void 0, void 0, void 0, function* () {
    return database_1.DB.UserEducations.create(Object.assign({ user_id }, data));
});
exports.createEducation = createEducation;
const findEducationsByUserId = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    return database_1.DB.UserEducations.findAll({
        where: { user_id },
        order: [['is_current', 'DESC'], ['end_year', 'DESC']],
    });
});
exports.findEducationsByUserId = findEducationsByUserId;
const findEducationById = (education_id) => __awaiter(void 0, void 0, void 0, function* () {
    return database_1.DB.UserEducations.findByPk(education_id);
});
exports.findEducationById = findEducationById;
const updateEducation = (education_id, data) => __awaiter(void 0, void 0, void 0, function* () {
    return database_1.DB.UserEducations.update(data, {
        where: { education_id },
    });
});
exports.updateEducation = updateEducation;
const deleteEducation = (education_id) => __awaiter(void 0, void 0, void 0, function* () {
    return database_1.DB.UserEducations.destroy({
        where: { education_id },
    });
});
exports.deleteEducation = deleteEducation;
// ====================== PROJECTS ======================
const createProject = (user_id, data) => __awaiter(void 0, void 0, void 0, function* () {
    return database_1.DB.UserProjects.create(Object.assign(Object.assign({ user_id }, data), { start_date: data.start_date ? new Date(data.start_date) : undefined, end_date: data.end_date ? new Date(data.end_date) : null }));
});
exports.createProject = createProject;
const findProjectsByUserId = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    return database_1.DB.UserProjects.findAll({
        where: { user_id },
        order: [['is_ongoing', 'DESC'], ['start_date', 'DESC']],
    });
});
exports.findProjectsByUserId = findProjectsByUserId;
const findProjectById = (project_id) => __awaiter(void 0, void 0, void 0, function* () {
    return database_1.DB.UserProjects.findByPk(project_id);
});
exports.findProjectById = findProjectById;
const updateProject = (project_id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const updateData = Object.assign({}, data);
    if (data.start_date) {
        updateData.start_date = new Date(data.start_date);
    }
    if (data.end_date) {
        updateData.end_date = new Date(data.end_date);
    }
    else if (data.end_date === null || data.end_date === '') {
        updateData.end_date = null;
    }
    return database_1.DB.UserProjects.update(updateData, {
        where: { project_id },
    });
});
exports.updateProject = updateProject;
const deleteProject = (project_id) => __awaiter(void 0, void 0, void 0, function* () {
    return database_1.DB.UserProjects.destroy({
        where: { project_id },
    });
});
exports.deleteProject = deleteProject;
// ====================== ACCOMPLISHMENTS ======================
const createAccomplishment = (user_id, data) => __awaiter(void 0, void 0, void 0, function* () {
    return database_1.DB.UserAccomplishments.create(Object.assign(Object.assign({ user_id }, data), { issue_date: data.issue_date ? new Date(data.issue_date) : undefined, expiry_date: data.expiry_date ? new Date(data.expiry_date) : null }));
});
exports.createAccomplishment = createAccomplishment;
const findAccomplishmentsByUserId = (user_id, accomplishment_type) => __awaiter(void 0, void 0, void 0, function* () {
    const where = { user_id };
    if (accomplishment_type) {
        where.accomplishment_type = accomplishment_type;
    }
    return database_1.DB.UserAccomplishments.findAll({
        where,
        order: [['issue_date', 'DESC']],
    });
});
exports.findAccomplishmentsByUserId = findAccomplishmentsByUserId;
const findAccomplishmentById = (accomplishment_id) => __awaiter(void 0, void 0, void 0, function* () {
    return database_1.DB.UserAccomplishments.findByPk(accomplishment_id);
});
exports.findAccomplishmentById = findAccomplishmentById;
const updateAccomplishment = (accomplishment_id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const updateData = Object.assign({}, data);
    if (data.issue_date) {
        updateData.issue_date = new Date(data.issue_date);
    }
    if (data.expiry_date) {
        updateData.expiry_date = new Date(data.expiry_date);
    }
    else if (data.expiry_date === null || data.expiry_date === '') {
        updateData.expiry_date = null;
    }
    return database_1.DB.UserAccomplishments.update(updateData, {
        where: { accomplishment_id },
    });
});
exports.updateAccomplishment = updateAccomplishment;
const deleteAccomplishment = (accomplishment_id) => __awaiter(void 0, void 0, void 0, function* () {
    return database_1.DB.UserAccomplishments.destroy({
        where: { accomplishment_id },
    });
});
exports.deleteAccomplishment = deleteAccomplishment;
// ====================== EXTENDED PROFILE ======================
const findExtendedProfileByUserId = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    return database_1.DB.UserExtendedProfiles.findByPk(user_id);
});
exports.findExtendedProfileByUserId = findExtendedProfileByUserId;
const createOrUpdateExtendedProfile = (user_id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield (0, exports.findExtendedProfileByUserId)(user_id);
    const updateData = Object.assign({}, data);
    if (data.date_of_birth) {
        updateData.date_of_birth = new Date(data.date_of_birth);
    }
    if (existing) {
        yield database_1.DB.UserExtendedProfiles.update(updateData, {
            where: { user_id },
        });
        return (0, exports.findExtendedProfileByUserId)(user_id);
    }
    else {
        return database_1.DB.UserExtendedProfiles.create(Object.assign({ user_id }, updateData));
    }
});
exports.createOrUpdateExtendedProfile = createOrUpdateExtendedProfile;
// ====================== FULL PROFILE ======================
const getFullProfile = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const [extendedProfile, skills, employments, educations, projects, accomplishments,] = yield Promise.all([
        (0, exports.findExtendedProfileByUserId)(user_id),
        (0, exports.findSkillsByUserId)(user_id),
        (0, exports.findEmploymentsByUserId)(user_id),
        (0, exports.findEducationsByUserId)(user_id),
        (0, exports.findProjectsByUserId)(user_id),
        (0, exports.findAccomplishmentsByUserId)(user_id),
    ]);
    return {
        extendedProfile,
        skills,
        employments,
        educations,
        projects,
        accomplishments,
    };
});
exports.getFullProfile = getFullProfile;
exports.default = {
    // Skills
    createSkill: exports.createSkill,
    createBulkSkills: exports.createBulkSkills,
    findSkillsByUserId: exports.findSkillsByUserId,
    findSkillById: exports.findSkillById,
    updateSkill: exports.updateSkill,
    deleteSkill: exports.deleteSkill,
    deleteAllSkillsByUserId: exports.deleteAllSkillsByUserId,
    // Employment
    createEmployment: exports.createEmployment,
    findEmploymentsByUserId: exports.findEmploymentsByUserId,
    findEmploymentById: exports.findEmploymentById,
    updateEmployment: exports.updateEmployment,
    deleteEmployment: exports.deleteEmployment,
    // Education
    createEducation: exports.createEducation,
    findEducationsByUserId: exports.findEducationsByUserId,
    findEducationById: exports.findEducationById,
    updateEducation: exports.updateEducation,
    deleteEducation: exports.deleteEducation,
    // Projects
    createProject: exports.createProject,
    findProjectsByUserId: exports.findProjectsByUserId,
    findProjectById: exports.findProjectById,
    updateProject: exports.updateProject,
    deleteProject: exports.deleteProject,
    // Accomplishments
    createAccomplishment: exports.createAccomplishment,
    findAccomplishmentsByUserId: exports.findAccomplishmentsByUserId,
    findAccomplishmentById: exports.findAccomplishmentById,
    updateAccomplishment: exports.updateAccomplishment,
    deleteAccomplishment: exports.deleteAccomplishment,
    // Extended Profile
    findExtendedProfileByUserId: exports.findExtendedProfileByUserId,
    createOrUpdateExtendedProfile: exports.createOrUpdateExtendedProfile,
    // Full Profile
    getFullProfile: exports.getFullProfile,
};
