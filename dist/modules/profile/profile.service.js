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
exports.uploadProfileImageService = exports.getFullProfileService = exports.updateExtendedProfileService = exports.getExtendedProfileService = exports.deleteAccomplishmentService = exports.updateAccomplishmentService = exports.getAccomplishmentsService = exports.addAccomplishmentService = exports.deleteProjectService = exports.updateProjectService = exports.getProjectsService = exports.addProjectService = exports.deleteEducationService = exports.updateEducationService = exports.getEducationsService = exports.addEducationService = exports.deleteEmploymentService = exports.updateEmploymentService = exports.getEmploymentsService = exports.addEmploymentService = exports.deleteSkillService = exports.updateSkillService = exports.getSkillsService = exports.addBulkSkillsService = exports.addSkillService = void 0;
const path = __importStar(require("path"));
const http_status_codes_1 = require("http-status-codes");
const custom_error_1 = require("../../utils/custom-error");
const profile_repo_1 = __importDefault(require("./profile.repo"));
const storage_service_1 = require("../../utils/storage.service");
const database_1 = require("../../database");
// ====================== SKILLS ======================
const addSkillService = (user_id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const skill = yield profile_repo_1.default.createSkill(user_id, data);
    return skill;
});
exports.addSkillService = addSkillService;
const addBulkSkillsService = (user_id, skills) => __awaiter(void 0, void 0, void 0, function* () {
    // First delete existing skills of the same type if replacing
    const skillTypes = [...new Set(skills.map(s => s.skill_type))];
    for (const skillType of skillTypes) {
        yield profile_repo_1.default.deleteAllSkillsByUserId(user_id, skillType);
    }
    const createdSkills = yield profile_repo_1.default.createBulkSkills(user_id, skills);
    return createdSkills;
});
exports.addBulkSkillsService = addBulkSkillsService;
const getSkillsService = (user_id, skill_type) => __awaiter(void 0, void 0, void 0, function* () {
    const skills = yield profile_repo_1.default.findSkillsByUserId(user_id, skill_type);
    return skills;
});
exports.getSkillsService = getSkillsService;
const updateSkillService = (user_id, skill_id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const skill = yield profile_repo_1.default.findSkillById(skill_id);
    if (!skill) {
        throw new custom_error_1.CustomError('Skill not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    if (skill.user_id !== user_id) {
        throw new custom_error_1.CustomError('Unauthorized to update this skill', http_status_codes_1.StatusCodes.FORBIDDEN);
    }
    yield profile_repo_1.default.updateSkill(skill_id, data);
    return profile_repo_1.default.findSkillById(skill_id);
});
exports.updateSkillService = updateSkillService;
const deleteSkillService = (user_id, skill_id) => __awaiter(void 0, void 0, void 0, function* () {
    const skill = yield profile_repo_1.default.findSkillById(skill_id);
    if (!skill) {
        throw new custom_error_1.CustomError('Skill not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    if (skill.user_id !== user_id) {
        throw new custom_error_1.CustomError('Unauthorized to delete this skill', http_status_codes_1.StatusCodes.FORBIDDEN);
    }
    yield profile_repo_1.default.deleteSkill(skill_id);
    return { message: 'Skill deleted successfully' };
});
exports.deleteSkillService = deleteSkillService;
// ====================== EMPLOYMENT ======================
const addEmploymentService = (user_id, data) => __awaiter(void 0, void 0, void 0, function* () {
    // If this is marked as current, unmark other current employments
    if (data.is_current) {
        const existingEmployments = yield profile_repo_1.default.findEmploymentsByUserId(user_id);
        for (const emp of existingEmployments) {
            if (emp.is_current) {
                yield profile_repo_1.default.updateEmployment(emp.employment_id, { is_current: false });
            }
        }
    }
    const employment = yield profile_repo_1.default.createEmployment(user_id, data);
    return employment;
});
exports.addEmploymentService = addEmploymentService;
const getEmploymentsService = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const employments = yield profile_repo_1.default.findEmploymentsByUserId(user_id);
    return employments;
});
exports.getEmploymentsService = getEmploymentsService;
const updateEmploymentService = (user_id, employment_id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const employment = yield profile_repo_1.default.findEmploymentById(employment_id);
    if (!employment) {
        throw new custom_error_1.CustomError('Employment not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    if (employment.user_id !== user_id) {
        throw new custom_error_1.CustomError('Unauthorized to update this employment', http_status_codes_1.StatusCodes.FORBIDDEN);
    }
    // If this is being marked as current, unmark other current employments
    if (data.is_current) {
        const existingEmployments = yield profile_repo_1.default.findEmploymentsByUserId(user_id);
        for (const emp of existingEmployments) {
            if (emp.is_current && emp.employment_id !== employment_id) {
                yield profile_repo_1.default.updateEmployment(emp.employment_id, { is_current: false });
            }
        }
    }
    yield profile_repo_1.default.updateEmployment(employment_id, data);
    return profile_repo_1.default.findEmploymentById(employment_id);
});
exports.updateEmploymentService = updateEmploymentService;
const deleteEmploymentService = (user_id, employment_id) => __awaiter(void 0, void 0, void 0, function* () {
    const employment = yield profile_repo_1.default.findEmploymentById(employment_id);
    if (!employment) {
        throw new custom_error_1.CustomError('Employment not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    if (employment.user_id !== user_id) {
        throw new custom_error_1.CustomError('Unauthorized to delete this employment', http_status_codes_1.StatusCodes.FORBIDDEN);
    }
    yield profile_repo_1.default.deleteEmployment(employment_id);
    return { message: 'Employment deleted successfully' };
});
exports.deleteEmploymentService = deleteEmploymentService;
// ====================== EDUCATION ======================
const addEducationService = (user_id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const education = yield profile_repo_1.default.createEducation(user_id, data);
    return education;
});
exports.addEducationService = addEducationService;
const getEducationsService = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const educations = yield profile_repo_1.default.findEducationsByUserId(user_id);
    return educations;
});
exports.getEducationsService = getEducationsService;
const updateEducationService = (user_id, education_id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const education = yield profile_repo_1.default.findEducationById(education_id);
    if (!education) {
        throw new custom_error_1.CustomError('Education not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    if (education.user_id !== user_id) {
        throw new custom_error_1.CustomError('Unauthorized to update this education', http_status_codes_1.StatusCodes.FORBIDDEN);
    }
    yield profile_repo_1.default.updateEducation(education_id, data);
    return profile_repo_1.default.findEducationById(education_id);
});
exports.updateEducationService = updateEducationService;
const deleteEducationService = (user_id, education_id) => __awaiter(void 0, void 0, void 0, function* () {
    const education = yield profile_repo_1.default.findEducationById(education_id);
    if (!education) {
        throw new custom_error_1.CustomError('Education not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    if (education.user_id !== user_id) {
        throw new custom_error_1.CustomError('Unauthorized to delete this education', http_status_codes_1.StatusCodes.FORBIDDEN);
    }
    yield profile_repo_1.default.deleteEducation(education_id);
    return { message: 'Education deleted successfully' };
});
exports.deleteEducationService = deleteEducationService;
// ====================== PROJECTS ======================
const addProjectService = (user_id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const project = yield profile_repo_1.default.createProject(user_id, data);
    return project;
});
exports.addProjectService = addProjectService;
const getProjectsService = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const projects = yield profile_repo_1.default.findProjectsByUserId(user_id);
    return projects;
});
exports.getProjectsService = getProjectsService;
const updateProjectService = (user_id, project_id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const project = yield profile_repo_1.default.findProjectById(project_id);
    if (!project) {
        throw new custom_error_1.CustomError('Project not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    if (project.user_id !== user_id) {
        throw new custom_error_1.CustomError('Unauthorized to update this project', http_status_codes_1.StatusCodes.FORBIDDEN);
    }
    yield profile_repo_1.default.updateProject(project_id, data);
    return profile_repo_1.default.findProjectById(project_id);
});
exports.updateProjectService = updateProjectService;
const deleteProjectService = (user_id, project_id) => __awaiter(void 0, void 0, void 0, function* () {
    const project = yield profile_repo_1.default.findProjectById(project_id);
    if (!project) {
        throw new custom_error_1.CustomError('Project not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    if (project.user_id !== user_id) {
        throw new custom_error_1.CustomError('Unauthorized to delete this project', http_status_codes_1.StatusCodes.FORBIDDEN);
    }
    yield profile_repo_1.default.deleteProject(project_id);
    return { message: 'Project deleted successfully' };
});
exports.deleteProjectService = deleteProjectService;
// ====================== ACCOMPLISHMENTS ======================
const addAccomplishmentService = (user_id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const accomplishment = yield profile_repo_1.default.createAccomplishment(user_id, data);
    return accomplishment;
});
exports.addAccomplishmentService = addAccomplishmentService;
const getAccomplishmentsService = (user_id, accomplishment_type) => __awaiter(void 0, void 0, void 0, function* () {
    const accomplishments = yield profile_repo_1.default.findAccomplishmentsByUserId(user_id, accomplishment_type);
    return accomplishments;
});
exports.getAccomplishmentsService = getAccomplishmentsService;
const updateAccomplishmentService = (user_id, accomplishment_id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const accomplishment = yield profile_repo_1.default.findAccomplishmentById(accomplishment_id);
    if (!accomplishment) {
        throw new custom_error_1.CustomError('Accomplishment not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    if (accomplishment.user_id !== user_id) {
        throw new custom_error_1.CustomError('Unauthorized to update this accomplishment', http_status_codes_1.StatusCodes.FORBIDDEN);
    }
    yield profile_repo_1.default.updateAccomplishment(accomplishment_id, data);
    return profile_repo_1.default.findAccomplishmentById(accomplishment_id);
});
exports.updateAccomplishmentService = updateAccomplishmentService;
const deleteAccomplishmentService = (user_id, accomplishment_id) => __awaiter(void 0, void 0, void 0, function* () {
    const accomplishment = yield profile_repo_1.default.findAccomplishmentById(accomplishment_id);
    if (!accomplishment) {
        throw new custom_error_1.CustomError('Accomplishment not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    if (accomplishment.user_id !== user_id) {
        throw new custom_error_1.CustomError('Unauthorized to delete this accomplishment', http_status_codes_1.StatusCodes.FORBIDDEN);
    }
    yield profile_repo_1.default.deleteAccomplishment(accomplishment_id);
    return { message: 'Accomplishment deleted successfully' };
});
exports.deleteAccomplishmentService = deleteAccomplishmentService;
// ====================== EXTENDED PROFILE ======================
const getExtendedProfileService = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const extendedProfile = yield profile_repo_1.default.findExtendedProfileByUserId(user_id);
    return extendedProfile;
});
exports.getExtendedProfileService = getExtendedProfileService;
const updateExtendedProfileService = (user_id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const extendedProfile = yield profile_repo_1.default.createOrUpdateExtendedProfile(user_id, data);
    return extendedProfile;
});
exports.updateExtendedProfileService = updateExtendedProfileService;
// ====================== FULL PROFILE ======================
const getFullProfileService = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const fullProfile = yield profile_repo_1.default.getFullProfile(user_id);
    return fullProfile;
});
exports.getFullProfileService = getFullProfileService;
// ====================== PROFILE IMAGE ======================
const uploadProfileImageService = (user_id, file) => __awaiter(void 0, void 0, void 0, function* () {
    const { path: filePath, storageType } = yield (0, storage_service_1.saveFile)(file, 'profile-images');
    // For local storage, store a URL-friendly relative path
    let imageUrl = filePath;
    if (storageType === 'local') {
        const fileName = path.basename(filePath);
        imageUrl = `/uploads/profile-images/${fileName}`;
    }
    yield database_1.DB.Users.update({ profile_image_url: imageUrl }, { where: { user_id } });
    return { profile_image_url: imageUrl };
});
exports.uploadProfileImageService = uploadProfileImageService;
