import { StatusCodes } from 'http-status-codes';
import { CustomError } from '@/utils/custom-error';
import repo from './profile.repo';
import {
    CreateSkillRequest,
    CreateEmploymentRequest,
    CreateEducationRequest,
    CreateProjectRequest,
    CreateAccomplishmentRequest,
    UpdateExtendedProfileRequest,
} from '@/interfaces/profile.interfaces';

// ====================== SKILLS ======================
export const addSkillService = async (user_id: string, data: CreateSkillRequest) => {
    const skill = await repo.createSkill(user_id, data);
    return skill;
};

export const addBulkSkillsService = async (user_id: string, skills: CreateSkillRequest[]) => {
    // First delete existing skills of the same type if replacing
    const skillTypes = [...new Set(skills.map(s => s.skill_type))];
    for (const skillType of skillTypes) {
        await repo.deleteAllSkillsByUserId(user_id, skillType);
    }
    
    const createdSkills = await repo.createBulkSkills(user_id, skills);
    return createdSkills;
};

export const getSkillsService = async (user_id: string, skill_type?: 'key_skill' | 'it_skill') => {
    const skills = await repo.findSkillsByUserId(user_id, skill_type);
    return skills;
};

export const updateSkillService = async (user_id: string, skill_id: string, data: Partial<CreateSkillRequest>) => {
    const skill = await repo.findSkillById(skill_id);
    if (!skill) {
        throw new CustomError('Skill not found', StatusCodes.NOT_FOUND);
    }
    if (skill.user_id !== user_id) {
        throw new CustomError('Unauthorized to update this skill', StatusCodes.FORBIDDEN);
    }
    
    await repo.updateSkill(skill_id, data);
    return repo.findSkillById(skill_id);
};

export const deleteSkillService = async (user_id: string, skill_id: string) => {
    const skill = await repo.findSkillById(skill_id);
    if (!skill) {
        throw new CustomError('Skill not found', StatusCodes.NOT_FOUND);
    }
    if (skill.user_id !== user_id) {
        throw new CustomError('Unauthorized to delete this skill', StatusCodes.FORBIDDEN);
    }
    
    await repo.deleteSkill(skill_id);
    return { message: 'Skill deleted successfully' };
};

// ====================== EMPLOYMENT ======================
export const addEmploymentService = async (user_id: string, data: CreateEmploymentRequest) => {
    // If this is marked as current, unmark other current employments
    if (data.is_current) {
        const existingEmployments = await repo.findEmploymentsByUserId(user_id);
        for (const emp of existingEmployments) {
            if (emp.is_current) {
                await repo.updateEmployment(emp.employment_id, { is_current: false });
            }
        }
    }
    
    const employment = await repo.createEmployment(user_id, data);
    return employment;
};

export const getEmploymentsService = async (user_id: string) => {
    const employments = await repo.findEmploymentsByUserId(user_id);
    return employments;
};

export const updateEmploymentService = async (user_id: string, employment_id: string, data: Partial<CreateEmploymentRequest>) => {
    const employment = await repo.findEmploymentById(employment_id);
    if (!employment) {
        throw new CustomError('Employment not found', StatusCodes.NOT_FOUND);
    }
    if (employment.user_id !== user_id) {
        throw new CustomError('Unauthorized to update this employment', StatusCodes.FORBIDDEN);
    }
    
    // If this is being marked as current, unmark other current employments
    if (data.is_current) {
        const existingEmployments = await repo.findEmploymentsByUserId(user_id);
        for (const emp of existingEmployments) {
            if (emp.is_current && emp.employment_id !== employment_id) {
                await repo.updateEmployment(emp.employment_id, { is_current: false });
            }
        }
    }
    
    await repo.updateEmployment(employment_id, data);
    return repo.findEmploymentById(employment_id);
};

export const deleteEmploymentService = async (user_id: string, employment_id: string) => {
    const employment = await repo.findEmploymentById(employment_id);
    if (!employment) {
        throw new CustomError('Employment not found', StatusCodes.NOT_FOUND);
    }
    if (employment.user_id !== user_id) {
        throw new CustomError('Unauthorized to delete this employment', StatusCodes.FORBIDDEN);
    }
    
    await repo.deleteEmployment(employment_id);
    return { message: 'Employment deleted successfully' };
};

// ====================== EDUCATION ======================
export const addEducationService = async (user_id: string, data: CreateEducationRequest) => {
    const education = await repo.createEducation(user_id, data);
    return education;
};

export const getEducationsService = async (user_id: string) => {
    const educations = await repo.findEducationsByUserId(user_id);
    return educations;
};

export const updateEducationService = async (user_id: string, education_id: string, data: Partial<CreateEducationRequest>) => {
    const education = await repo.findEducationById(education_id);
    if (!education) {
        throw new CustomError('Education not found', StatusCodes.NOT_FOUND);
    }
    if (education.user_id !== user_id) {
        throw new CustomError('Unauthorized to update this education', StatusCodes.FORBIDDEN);
    }
    
    await repo.updateEducation(education_id, data);
    return repo.findEducationById(education_id);
};

export const deleteEducationService = async (user_id: string, education_id: string) => {
    const education = await repo.findEducationById(education_id);
    if (!education) {
        throw new CustomError('Education not found', StatusCodes.NOT_FOUND);
    }
    if (education.user_id !== user_id) {
        throw new CustomError('Unauthorized to delete this education', StatusCodes.FORBIDDEN);
    }
    
    await repo.deleteEducation(education_id);
    return { message: 'Education deleted successfully' };
};

// ====================== PROJECTS ======================
export const addProjectService = async (user_id: string, data: CreateProjectRequest) => {
    const project = await repo.createProject(user_id, data);
    return project;
};

export const getProjectsService = async (user_id: string) => {
    const projects = await repo.findProjectsByUserId(user_id);
    return projects;
};

export const updateProjectService = async (user_id: string, project_id: string, data: Partial<CreateProjectRequest>) => {
    const project = await repo.findProjectById(project_id);
    if (!project) {
        throw new CustomError('Project not found', StatusCodes.NOT_FOUND);
    }
    if (project.user_id !== user_id) {
        throw new CustomError('Unauthorized to update this project', StatusCodes.FORBIDDEN);
    }
    
    await repo.updateProject(project_id, data);
    return repo.findProjectById(project_id);
};

export const deleteProjectService = async (user_id: string, project_id: string) => {
    const project = await repo.findProjectById(project_id);
    if (!project) {
        throw new CustomError('Project not found', StatusCodes.NOT_FOUND);
    }
    if (project.user_id !== user_id) {
        throw new CustomError('Unauthorized to delete this project', StatusCodes.FORBIDDEN);
    }
    
    await repo.deleteProject(project_id);
    return { message: 'Project deleted successfully' };
};

// ====================== ACCOMPLISHMENTS ======================
export const addAccomplishmentService = async (user_id: string, data: CreateAccomplishmentRequest) => {
    const accomplishment = await repo.createAccomplishment(user_id, data);
    return accomplishment;
};

export const getAccomplishmentsService = async (user_id: string, accomplishment_type?: string) => {
    const accomplishments = await repo.findAccomplishmentsByUserId(user_id, accomplishment_type);
    return accomplishments;
};

export const updateAccomplishmentService = async (user_id: string, accomplishment_id: string, data: Partial<CreateAccomplishmentRequest>) => {
    const accomplishment = await repo.findAccomplishmentById(accomplishment_id);
    if (!accomplishment) {
        throw new CustomError('Accomplishment not found', StatusCodes.NOT_FOUND);
    }
    if (accomplishment.user_id !== user_id) {
        throw new CustomError('Unauthorized to update this accomplishment', StatusCodes.FORBIDDEN);
    }
    
    await repo.updateAccomplishment(accomplishment_id, data);
    return repo.findAccomplishmentById(accomplishment_id);
};

export const deleteAccomplishmentService = async (user_id: string, accomplishment_id: string) => {
    const accomplishment = await repo.findAccomplishmentById(accomplishment_id);
    if (!accomplishment) {
        throw new CustomError('Accomplishment not found', StatusCodes.NOT_FOUND);
    }
    if (accomplishment.user_id !== user_id) {
        throw new CustomError('Unauthorized to delete this accomplishment', StatusCodes.FORBIDDEN);
    }
    
    await repo.deleteAccomplishment(accomplishment_id);
    return { message: 'Accomplishment deleted successfully' };
};

// ====================== EXTENDED PROFILE ======================
export const getExtendedProfileService = async (user_id: string) => {
    const extendedProfile = await repo.findExtendedProfileByUserId(user_id);
    return extendedProfile;
};

export const updateExtendedProfileService = async (user_id: string, data: UpdateExtendedProfileRequest) => {
    const extendedProfile = await repo.createOrUpdateExtendedProfile(user_id, data);
    return extendedProfile;
};

// ====================== FULL PROFILE ======================
export const getFullProfileService = async (user_id: string) => {
    const fullProfile = await repo.getFullProfile(user_id);
    return fullProfile;
};

