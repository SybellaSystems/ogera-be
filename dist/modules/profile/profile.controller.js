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
exports.getFullProfile = exports.updateExtendedProfile = exports.getExtendedProfile = exports.deleteAccomplishment = exports.updateAccomplishment = exports.getAccomplishments = exports.addAccomplishment = exports.deleteProject = exports.updateProject = exports.getProjects = exports.addProject = exports.deleteEducation = exports.updateEducation = exports.getEducations = exports.addEducation = exports.deleteEmployment = exports.updateEmployment = exports.getEmployments = exports.addEmployment = exports.deleteSkill = exports.updateSkill = exports.getSkills = exports.addBulkSkills = exports.addSkill = void 0;
const http_status_codes_1 = require("http-status-codes");
const responseFormat_1 = require("../../exception/responseFormat");
const profile_service_1 = require("./profile.service");
const response = new responseFormat_1.ResponseFormat();
// ====================== SKILLS ======================
const addSkill = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!user_id) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const skill = yield (0, profile_service_1.addSkillService)(user_id, req.body);
        response.response(res, true, http_status_codes_1.StatusCodes.CREATED, skill, 'Skill added successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.addSkill = addSkill;
const addBulkSkills = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!user_id) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const { skills } = req.body;
        if (!skills || !Array.isArray(skills)) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.BAD_REQUEST, false, 'Skills array is required');
            return;
        }
        const createdSkills = yield (0, profile_service_1.addBulkSkillsService)(user_id, skills);
        response.response(res, true, http_status_codes_1.StatusCodes.CREATED, createdSkills, 'Skills added successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.addBulkSkills = addBulkSkills;
const getSkills = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!user_id) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const skill_type = req.query.skill_type;
        const skills = yield (0, profile_service_1.getSkillsService)(user_id, skill_type);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, skills, 'Skills retrieved successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getSkills = getSkills;
const updateSkill = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!user_id) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const { id } = req.params;
        const skill = yield (0, profile_service_1.updateSkillService)(user_id, id, req.body);
        if (!skill) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.NOT_FOUND, false, 'Skill not found');
            return;
        }
        response.response(res, true, http_status_codes_1.StatusCodes.OK, skill, 'Skill updated successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.updateSkill = updateSkill;
const deleteSkill = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!user_id) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const { id } = req.params;
        const result = yield (0, profile_service_1.deleteSkillService)(user_id, id);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, result, 'Skill deleted successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.deleteSkill = deleteSkill;
// ====================== EMPLOYMENT ======================
const addEmployment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!user_id) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const employment = yield (0, profile_service_1.addEmploymentService)(user_id, req.body);
        response.response(res, true, http_status_codes_1.StatusCodes.CREATED, employment, 'Employment added successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.addEmployment = addEmployment;
const getEmployments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!user_id) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const employments = yield (0, profile_service_1.getEmploymentsService)(user_id);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, employments, 'Employments retrieved successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getEmployments = getEmployments;
const updateEmployment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!user_id) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const { id } = req.params;
        const employment = yield (0, profile_service_1.updateEmploymentService)(user_id, id, req.body);
        if (!employment) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.NOT_FOUND, false, 'Employment not found');
            return;
        }
        response.response(res, true, http_status_codes_1.StatusCodes.OK, employment, 'Employment updated successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.updateEmployment = updateEmployment;
const deleteEmployment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!user_id) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const { id } = req.params;
        const result = yield (0, profile_service_1.deleteEmploymentService)(user_id, id);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, result, 'Employment deleted successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.deleteEmployment = deleteEmployment;
// ====================== EDUCATION ======================
const addEducation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!user_id) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const education = yield (0, profile_service_1.addEducationService)(user_id, req.body);
        response.response(res, true, http_status_codes_1.StatusCodes.CREATED, education, 'Education added successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.addEducation = addEducation;
const getEducations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!user_id) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const educations = yield (0, profile_service_1.getEducationsService)(user_id);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, educations, 'Educations retrieved successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getEducations = getEducations;
const updateEducation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!user_id) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const { id } = req.params;
        const education = yield (0, profile_service_1.updateEducationService)(user_id, id, req.body);
        if (!education) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.NOT_FOUND, false, 'Education not found');
            return;
        }
        response.response(res, true, http_status_codes_1.StatusCodes.OK, education, 'Education updated successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.updateEducation = updateEducation;
const deleteEducation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!user_id) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const { id } = req.params;
        const result = yield (0, profile_service_1.deleteEducationService)(user_id, id);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, result, 'Education deleted successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.deleteEducation = deleteEducation;
// ====================== PROJECTS ======================
const addProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!user_id) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const project = yield (0, profile_service_1.addProjectService)(user_id, req.body);
        response.response(res, true, http_status_codes_1.StatusCodes.CREATED, project, 'Project added successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.addProject = addProject;
const getProjects = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!user_id) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const projects = yield (0, profile_service_1.getProjectsService)(user_id);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, projects, 'Projects retrieved successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getProjects = getProjects;
const updateProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!user_id) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const { id } = req.params;
        const project = yield (0, profile_service_1.updateProjectService)(user_id, id, req.body);
        if (!project) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.NOT_FOUND, false, 'Project not found');
            return;
        }
        response.response(res, true, http_status_codes_1.StatusCodes.OK, project, 'Project updated successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.updateProject = updateProject;
const deleteProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!user_id) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const { id } = req.params;
        const result = yield (0, profile_service_1.deleteProjectService)(user_id, id);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, result, 'Project deleted successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.deleteProject = deleteProject;
// ====================== ACCOMPLISHMENTS ======================
const addAccomplishment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!user_id) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const accomplishment = yield (0, profile_service_1.addAccomplishmentService)(user_id, req.body);
        response.response(res, true, http_status_codes_1.StatusCodes.CREATED, accomplishment, 'Accomplishment added successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.addAccomplishment = addAccomplishment;
const getAccomplishments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!user_id) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const accomplishment_type = req.query.type;
        const accomplishments = yield (0, profile_service_1.getAccomplishmentsService)(user_id, accomplishment_type);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, accomplishments, 'Accomplishments retrieved successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getAccomplishments = getAccomplishments;
const updateAccomplishment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!user_id) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const { id } = req.params;
        const accomplishment = yield (0, profile_service_1.updateAccomplishmentService)(user_id, id, req.body);
        if (!accomplishment) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.NOT_FOUND, false, 'Accomplishment not found');
            return;
        }
        response.response(res, true, http_status_codes_1.StatusCodes.OK, accomplishment, 'Accomplishment updated successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.updateAccomplishment = updateAccomplishment;
const deleteAccomplishment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!user_id) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const { id } = req.params;
        const result = yield (0, profile_service_1.deleteAccomplishmentService)(user_id, id);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, result, 'Accomplishment deleted successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.deleteAccomplishment = deleteAccomplishment;
// ====================== EXTENDED PROFILE ======================
const getExtendedProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!user_id) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const extendedProfile = yield (0, profile_service_1.getExtendedProfileService)(user_id);
        if (!extendedProfile) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.NOT_FOUND, false, 'Extended profile not found');
            return;
        }
        response.response(res, true, http_status_codes_1.StatusCodes.OK, extendedProfile, 'Extended profile retrieved successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getExtendedProfile = getExtendedProfile;
const updateExtendedProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!user_id) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const extendedProfile = yield (0, profile_service_1.updateExtendedProfileService)(user_id, req.body);
        if (!extendedProfile) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.NOT_FOUND, false, 'Extended profile not found');
            return;
        }
        response.response(res, true, http_status_codes_1.StatusCodes.OK, extendedProfile, 'Extended profile updated successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.updateExtendedProfile = updateExtendedProfile;
// ====================== FULL PROFILE ======================
const getFullProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!user_id) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const fullProfile = yield (0, profile_service_1.getFullProfileService)(user_id);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, fullProfile, 'Full profile retrieved successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getFullProfile = getFullProfile;
