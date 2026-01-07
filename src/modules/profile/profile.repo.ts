import { DB } from '@/database';
import {
    CreateSkillRequest,
    CreateEmploymentRequest,
    CreateEducationRequest,
    CreateProjectRequest,
    CreateAccomplishmentRequest,
    UpdateExtendedProfileRequest,
} from '@/interfaces/profile.interfaces';

// ====================== SKILLS ======================
export const createSkill = async (user_id: string, data: CreateSkillRequest) => {
    return DB.UserSkills.create({
        user_id,
        ...data,
    });
};

export const createBulkSkills = async (user_id: string, skills: CreateSkillRequest[]) => {
    const skillsWithUserId = skills.map(skill => ({
        user_id,
        ...skill,
    }));
    return DB.UserSkills.bulkCreate(skillsWithUserId, {
        ignoreDuplicates: true,
    });
};

export const findSkillsByUserId = async (user_id: string, skill_type?: 'key_skill' | 'it_skill') => {
    const where: any = { user_id };
    if (skill_type) {
        where.skill_type = skill_type;
    }
    return DB.UserSkills.findAll({
        where,
        order: [['created_at', 'DESC']],
    });
};

export const findSkillById = async (skill_id: string) => {
    return DB.UserSkills.findByPk(skill_id);
};

export const updateSkill = async (skill_id: string, data: Partial<CreateSkillRequest>) => {
    return DB.UserSkills.update(data, {
        where: { skill_id },
    });
};

export const deleteSkill = async (skill_id: string) => {
    return DB.UserSkills.destroy({
        where: { skill_id },
    });
};

export const deleteAllSkillsByUserId = async (user_id: string, skill_type?: 'key_skill' | 'it_skill') => {
    const where: any = { user_id };
    if (skill_type) {
        where.skill_type = skill_type;
    }
    return DB.UserSkills.destroy({ where });
};

// ====================== EMPLOYMENT ======================
export const createEmployment = async (user_id: string, data: CreateEmploymentRequest) => {
    return DB.UserEmployments.create({
        user_id,
        ...data,
        start_date: new Date(data.start_date),
        end_date: data.end_date ? new Date(data.end_date) : null,
    });
};

export const findEmploymentsByUserId = async (user_id: string) => {
    return DB.UserEmployments.findAll({
        where: { user_id },
        order: [['is_current', 'DESC'], ['start_date', 'DESC']],
    });
};

export const findEmploymentById = async (employment_id: string) => {
    return DB.UserEmployments.findByPk(employment_id);
};

export const updateEmployment = async (employment_id: string, data: Partial<CreateEmploymentRequest>) => {
    const updateData: any = { ...data };
    if (data.start_date) {
        updateData.start_date = new Date(data.start_date);
    }
    if (data.end_date) {
        updateData.end_date = new Date(data.end_date);
    } else if (data.end_date === null || data.end_date === '') {
        updateData.end_date = null;
    }
    return DB.UserEmployments.update(updateData, {
        where: { employment_id },
    });
};

export const deleteEmployment = async (employment_id: string) => {
    return DB.UserEmployments.destroy({
        where: { employment_id },
    });
};

// ====================== EDUCATION ======================
export const createEducation = async (user_id: string, data: CreateEducationRequest) => {
    return DB.UserEducations.create({
        user_id,
        ...data,
    });
};

export const findEducationsByUserId = async (user_id: string) => {
    return DB.UserEducations.findAll({
        where: { user_id },
        order: [['is_current', 'DESC'], ['end_year', 'DESC']],
    });
};

export const findEducationById = async (education_id: string) => {
    return DB.UserEducations.findByPk(education_id);
};

export const updateEducation = async (education_id: string, data: Partial<CreateEducationRequest>) => {
    return DB.UserEducations.update(data, {
        where: { education_id },
    });
};

export const deleteEducation = async (education_id: string) => {
    return DB.UserEducations.destroy({
        where: { education_id },
    });
};

// ====================== PROJECTS ======================
export const createProject = async (user_id: string, data: CreateProjectRequest) => {
    return DB.UserProjects.create({
        user_id,
        ...data,
        start_date: data.start_date ? new Date(data.start_date) : undefined,
        end_date: data.end_date ? new Date(data.end_date) : null,
    });
};

export const findProjectsByUserId = async (user_id: string) => {
    return DB.UserProjects.findAll({
        where: { user_id },
        order: [['is_ongoing', 'DESC'], ['start_date', 'DESC']],
    });
};

export const findProjectById = async (project_id: string) => {
    return DB.UserProjects.findByPk(project_id);
};

export const updateProject = async (project_id: string, data: Partial<CreateProjectRequest>) => {
    const updateData: any = { ...data };
    if (data.start_date) {
        updateData.start_date = new Date(data.start_date);
    }
    if (data.end_date) {
        updateData.end_date = new Date(data.end_date);
    } else if (data.end_date === null || data.end_date === '') {
        updateData.end_date = null;
    }
    return DB.UserProjects.update(updateData, {
        where: { project_id },
    });
};

export const deleteProject = async (project_id: string) => {
    return DB.UserProjects.destroy({
        where: { project_id },
    });
};

// ====================== ACCOMPLISHMENTS ======================
export const createAccomplishment = async (user_id: string, data: CreateAccomplishmentRequest) => {
    return DB.UserAccomplishments.create({
        user_id,
        ...data,
        issue_date: data.issue_date ? new Date(data.issue_date) : undefined,
        expiry_date: data.expiry_date ? new Date(data.expiry_date) : null,
    });
};

export const findAccomplishmentsByUserId = async (user_id: string, accomplishment_type?: string) => {
    const where: any = { user_id };
    if (accomplishment_type) {
        where.accomplishment_type = accomplishment_type;
    }
    return DB.UserAccomplishments.findAll({
        where,
        order: [['issue_date', 'DESC']],
    });
};

export const findAccomplishmentById = async (accomplishment_id: string) => {
    return DB.UserAccomplishments.findByPk(accomplishment_id);
};

export const updateAccomplishment = async (accomplishment_id: string, data: Partial<CreateAccomplishmentRequest>) => {
    const updateData: any = { ...data };
    if (data.issue_date) {
        updateData.issue_date = new Date(data.issue_date);
    }
    if (data.expiry_date) {
        updateData.expiry_date = new Date(data.expiry_date);
    } else if (data.expiry_date === null || data.expiry_date === '') {
        updateData.expiry_date = null;
    }
    return DB.UserAccomplishments.update(updateData, {
        where: { accomplishment_id },
    });
};

export const deleteAccomplishment = async (accomplishment_id: string) => {
    return DB.UserAccomplishments.destroy({
        where: { accomplishment_id },
    });
};

// ====================== EXTENDED PROFILE ======================
export const findExtendedProfileByUserId = async (user_id: string) => {
    return DB.UserExtendedProfiles.findByPk(user_id);
};

export const createOrUpdateExtendedProfile = async (user_id: string, data: UpdateExtendedProfileRequest) => {
    const existing = await findExtendedProfileByUserId(user_id);
    
    const updateData: any = { ...data };
    if (data.date_of_birth) {
        updateData.date_of_birth = new Date(data.date_of_birth);
    }

    if (existing) {
        await DB.UserExtendedProfiles.update(updateData, {
            where: { user_id },
        });
        return findExtendedProfileByUserId(user_id);
    } else {
        return DB.UserExtendedProfiles.create({
            user_id,
            ...updateData,
        });
    }
};

// ====================== FULL PROFILE ======================
export const getFullProfile = async (user_id: string) => {
    const [
        extendedProfile,
        skills,
        employments,
        educations,
        projects,
        accomplishments,
    ] = await Promise.all([
        findExtendedProfileByUserId(user_id),
        findSkillsByUserId(user_id),
        findEmploymentsByUserId(user_id),
        findEducationsByUserId(user_id),
        findProjectsByUserId(user_id),
        findAccomplishmentsByUserId(user_id),
    ]);

    return {
        extendedProfile,
        skills,
        employments,
        educations,
        projects,
        accomplishments,
    };
};

export default {
    // Skills
    createSkill,
    createBulkSkills,
    findSkillsByUserId,
    findSkillById,
    updateSkill,
    deleteSkill,
    deleteAllSkillsByUserId,
    // Employment
    createEmployment,
    findEmploymentsByUserId,
    findEmploymentById,
    updateEmployment,
    deleteEmployment,
    // Education
    createEducation,
    findEducationsByUserId,
    findEducationById,
    updateEducation,
    deleteEducation,
    // Projects
    createProject,
    findProjectsByUserId,
    findProjectById,
    updateProject,
    deleteProject,
    // Accomplishments
    createAccomplishment,
    findAccomplishmentsByUserId,
    findAccomplishmentById,
    updateAccomplishment,
    deleteAccomplishment,
    // Extended Profile
    findExtendedProfileByUserId,
    createOrUpdateExtendedProfile,
    // Full Profile
    getFullProfile,
};

