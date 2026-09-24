import { DB } from '@/database';
import {
    CreateSkillRequest,
    CreateEmploymentRequest,
    CreateEducationRequest,
    CreateProjectRequest,
    CreateAccomplishmentRequest,
    UpdateExtendedProfileRequest,
    UpdateCompanyInfoRequest,
    UpdateOnlinePresenceRequest,
} from '@/interfaces/profile.interfaces';

// ====================== SKILLS ======================
export const createSkill = async (
    user_id: string,
    data: CreateSkillRequest,
) => {
    return DB.UserSkills.create({
        user_id,
        ...data,
    });
};

export const createBulkSkills = async (
    user_id: string,
    skills: CreateSkillRequest[],
) => {
    const skillsWithUserId = skills.map(skill => ({
        user_id,
        ...skill,
    }));
    return DB.UserSkills.bulkCreate(skillsWithUserId, {
        ignoreDuplicates: true,
    });
};

export const findSkillsByUserId = async (
    user_id: string,
    skill_type?: 'key_skill' | 'it_skill',
) => {
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

export const updateSkill = async (
    skill_id: string,
    data: Partial<CreateSkillRequest>,
) => {
    return DB.UserSkills.update(data, {
        where: { skill_id },
    });
};

export const deleteSkill = async (skill_id: string) => {
    return DB.UserSkills.destroy({
        where: { skill_id },
    });
};

export const deleteAllSkillsByUserId = async (
    user_id: string,
    skill_type?: 'key_skill' | 'it_skill',
) => {
    const where: any = { user_id };
    if (skill_type) {
        where.skill_type = skill_type;
    }
    return DB.UserSkills.destroy({ where });
};

// ====================== EMPLOYMENT ======================
export const createEmployment = async (
    user_id: string,
    data: CreateEmploymentRequest,
) => {
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
        order: [
            ['is_current', 'DESC'],
            ['start_date', 'DESC'],
        ],
    });
};

export const findEmploymentById = async (employment_id: string) => {
    return DB.UserEmployments.findByPk(employment_id);
};

export const updateEmployment = async (
    employment_id: string,
    data: Partial<CreateEmploymentRequest>,
) => {
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
export const createEducation = async (
    user_id: string,
    data: CreateEducationRequest,
) => {
    return DB.UserEducations.create({
        user_id,
        ...data,
    });
};

export const findEducationsByUserId = async (user_id: string) => {
    return DB.UserEducations.findAll({
        where: { user_id },
        order: [
            ['is_current', 'DESC'],
            ['end_year', 'DESC'],
        ],
    });
};

export const findEducationById = async (education_id: string) => {
    return DB.UserEducations.findByPk(education_id);
};

export const updateEducation = async (
    education_id: string,
    data: Partial<CreateEducationRequest>,
) => {
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
export const createProject = async (
    user_id: string,
    data: CreateProjectRequest,
) => {
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
        order: [
            ['is_ongoing', 'DESC'],
            ['start_date', 'DESC'],
        ],
    });
};

export const findProjectById = async (project_id: string) => {
    return DB.UserProjects.findByPk(project_id);
};

export const updateProject = async (
    project_id: string,
    data: Partial<CreateProjectRequest>,
) => {
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
export const createAccomplishment = async (
    user_id: string,
    data: CreateAccomplishmentRequest,
) => {
    return DB.UserAccomplishments.create({
        user_id,
        ...data,
        issue_date: data.issue_date ? new Date(data.issue_date) : undefined,
        expiry_date: data.expiry_date ? new Date(data.expiry_date) : null,
    });
};

export const findAccomplishmentsByUserId = async (
    user_id: string,
    accomplishment_type?: string,
) => {
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

export const updateAccomplishment = async (
    accomplishment_id: string,
    data: Partial<CreateAccomplishmentRequest>,
) => {
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

export const createOrUpdateExtendedProfile = async (
    user_id: string,
    data: UpdateExtendedProfileRequest,
) => {
    const updateData: any = { ...data };
    if (data.date_of_birth) {
        updateData.date_of_birth = new Date(data.date_of_birth);
    }

    // DEBUG LOG: Log values being sent to DB
    console.log(
        '[REPO] createOrUpdateExtendedProfile - Values being sent to DB:',
        {
            user_id,
            resume_headline: updateData.resume_headline,
            profile_summary: updateData.profile_summary,
            company_name: updateData.company_name,
            industry_category: updateData.industry_category,
            company_size: updateData.company_size,
            company_location: updateData.company_location,
            total_experience_years: updateData.total_experience_years,
            total_experience_months: updateData.total_experience_months,
            current_salary: updateData.current_salary,
            expected_salary: updateData.expected_salary,
            salary_currency: updateData.salary_currency,
            notice_period: updateData.notice_period,
            date_of_birth: updateData.date_of_birth,
            gender: updateData.gender,
            marital_status: updateData.marital_status,
            languages: updateData.languages,
            social_profiles: updateData.social_profiles,
            website_url: updateData.website_url,
            linkedin_url: updateData.linkedin_url,
        },
    );

    const [rows, metadata] = (await DB.sequelize.query(
        `
        UPDATE user_extended_profiles
        SET
            resume_headline = COALESCE(:resume_headline, resume_headline),
            profile_summary = COALESCE(:profile_summary, profile_summary),
            company_name = COALESCE(:company_name, company_name),
            industry_category = COALESCE(:industry_category, industry_category),
            company_size = COALESCE(:company_size, company_size),
            company_location = COALESCE(:company_location, company_location),
            total_experience_years = COALESCE(:total_experience_years, total_experience_years),
            total_experience_months = COALESCE(:total_experience_months, total_experience_months),
            current_salary = COALESCE(:current_salary, current_salary),
            expected_salary = COALESCE(:expected_salary, expected_salary),
            salary_currency = COALESCE(:salary_currency, salary_currency),
            notice_period = COALESCE(:notice_period, notice_period),
            date_of_birth = COALESCE(:date_of_birth, date_of_birth),
            gender = COALESCE(:gender, gender),
            marital_status = COALESCE(:marital_status, marital_status),
            languages = COALESCE(:languages, languages),
            social_profiles = COALESCE(:social_profiles, social_profiles),
            website_url = COALESCE(:website_url, website_url),
            linkedin_url = COALESCE(:linkedin_url, linkedin_url),
            updated_at = now()
        WHERE user_id = :user_id
        RETURNING *;
        `,
        {
            replacements: {
                user_id,
                resume_headline: updateData.resume_headline ?? null,
                profile_summary: updateData.profile_summary ?? null,
                company_name: updateData.company_name ?? null,
                industry_category: updateData.industry_category ?? null,
                company_size: updateData.company_size ?? null,
                company_location: updateData.company_location ?? null,
                total_experience_years:
                    updateData.total_experience_years ?? null,
                total_experience_months:
                    updateData.total_experience_months ?? null,
                current_salary: updateData.current_salary ?? null,
                expected_salary: updateData.expected_salary ?? null,
                salary_currency: updateData.salary_currency ?? null,
                notice_period: updateData.notice_period ?? null,
                date_of_birth: updateData.date_of_birth ?? null,
                gender: updateData.gender ?? null,
                marital_status: updateData.marital_status ?? null,
                languages: updateData.languages ?? null,
                social_profiles: updateData.social_profiles ?? null,
                website_url: updateData.website_url ?? null,
                linkedin_url: updateData.linkedin_url ?? null,
            },
        },
    )) as any;

    const rowCount =
        typeof metadata?.rowCount === 'number'
            ? metadata.rowCount
            : Array.isArray(rows)
            ? rows.length
            : 0;

    // DEBUG LOG: Log DB result
    console.log(
        '[REPO] createOrUpdateExtendedProfile - DB result rowCount:',
        rowCount,
    );
    console.log(
        '[REPO] createOrUpdateExtendedProfile - DB returned data:',
        rows?.[0],
    );

    if (rowCount === 0) {
        console.log('[REPO] WARNING: No profile found for this user_id');
        return null;
    }

    return Array.isArray(rows) ? rows[0] : null;
};

export const updateCompanyInfo = async (
    user_id: string,
    data: UpdateCompanyInfoRequest,
) => {
    // DEBUG LOG: Log values being sent to DB
    console.log('[REPO] updateCompanyInfo - Values being sent to DB:', {
        user_id,
        company_name: data.company_name,
        industry_category: data.industry_category,
        company_size: data.company_size,
        company_location: data.company_location,
    });

    const [rows, metadata] = (await DB.sequelize.query(
        `
        UPDATE user_extended_profiles
        SET
            company_name = COALESCE(:company_name, company_name),
            industry_category = COALESCE(:industry_category, industry_category),
            company_size = COALESCE(:company_size, company_size),
            company_location = COALESCE(:company_location, company_location),
            updated_at = now()
        WHERE user_id = :user_id
        RETURNING *;
        `,
        {
            replacements: {
                user_id,
                company_name: data.company_name ?? null,
                industry_category: data.industry_category ?? null,
                company_size: data.company_size ?? null,
                company_location: data.company_location ?? null,
            },
        },
    )) as any;

    const rowCount =
        typeof metadata?.rowCount === 'number'
            ? metadata.rowCount
            : Array.isArray(rows)
            ? rows.length
            : 0;

    // DEBUG LOG: Log DB result
    console.log('[REPO] updateCompanyInfo - DB result rowCount:', rowCount);
    console.log('[REPO] updateCompanyInfo - DB returned data:', rows?.[0]);

    if (rowCount === 0) {
        console.log('[REPO] WARNING: No profile found for this user_id');
        return null;
    }

    return Array.isArray(rows) ? rows[0] : null;
};

// ====================== ONLINE PRESENCE ======================
export const updateOnlinePresence = async (
    user_id: string,
    data: UpdateOnlinePresenceRequest,
) => {
    const { website, linkedin } = data;

    // DEBUG LOG: Log values being sent to DB
    console.log('[REPO] updateOnlinePresence - Values being sent to DB:', {
        user_id,
        website_url: website,
        linkedin_url: linkedin,
    });

    const query = `
        UPDATE user_extended_profiles
        SET
            website_url = COALESCE(:website_url, website_url),
            linkedin_url = COALESCE(:linkedin_url, linkedin_url),
            updated_at = now()
        WHERE user_id = :user_id
        RETURNING *;
    `;

    const values = {
        website_url: website || null,
        linkedin_url: linkedin || null,
        user_id,
    };

    console.log('[REPO] updateOnlinePresence - Query values:', values);

    const [rows, metadata] = (await DB.sequelize.query(query, {
        replacements: values,
    })) as any;

    const rowCount =
        typeof metadata?.rowCount === 'number'
            ? metadata.rowCount
            : Array.isArray(rows)
            ? rows.length
            : 0;

    // STRICT CHECK - Only succeed if exactly one row was updated
    console.log('[REPO] updateOnlinePresence - DB result rowCount:', rowCount);
    console.log('[REPO] updateOnlinePresence - DB returned data:', rows?.[0]);

    if (!metadata || rowCount === 0) {
        console.error(
            '[REPO] UPDATE FAILED: No matching user_id or no changes applied',
        );
        return null;
    }

    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
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
    updateCompanyInfo,
    updateOnlinePresence,
    // Full Profile
    getFullProfile,
};
