import * as path from 'path';
import { StatusCodes } from 'http-status-codes';
import { CustomError } from '@/utils/custom-error';
import logger from '@/utils/logger';
import { calculateTrustScoreService } from '@/modules/trustScore/trustScore.service';
import repo from './profile.repo';
import { getFileUrl, saveFile } from '@/utils/storage.service';
import { DB } from '@/database';
import cloudinary from "@/config/cloudinary";
import streamifier from "streamifier";
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

async function refreshTrustScoreAfterProfileChange(user_id: string): Promise<void> {
    try {
        await calculateTrustScoreService(user_id);
    } catch (err: any) {
        logger.warn(
            `TrustScore refresh after profile change failed for ${user_id}: ${err?.message || err}`,
        );
    }
}

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
    await refreshTrustScoreAfterProfileChange(user_id);
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
    await refreshTrustScoreAfterProfileChange(user_id);
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
    await refreshTrustScoreAfterProfileChange(user_id);
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
    await refreshTrustScoreAfterProfileChange(user_id);
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
    await refreshTrustScoreAfterProfileChange(user_id);
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
    await refreshTrustScoreAfterProfileChange(user_id);
    return { message: 'Project deleted successfully' };
};

// ====================== ACCOMPLISHMENTS ======================
export const addAccomplishmentService = async (user_id: string, data: CreateAccomplishmentRequest) => {
    const accomplishment = await repo.createAccomplishment(user_id, data);
    await refreshTrustScoreAfterProfileChange(user_id);
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
    await refreshTrustScoreAfterProfileChange(user_id);
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
    await refreshTrustScoreAfterProfileChange(user_id);
    return { message: 'Accomplishment deleted successfully' };
};

// ====================== EXTENDED PROFILE ======================
export const getExtendedProfileService = async (user_id: string) => {
    const extendedProfile = await repo.findExtendedProfileByUserId(user_id);
    return extendedProfile;
};

export const updateExtendedProfileService = async (user_id: string, data: UpdateExtendedProfileRequest) => {
    // DEBUG LOG: Log data being sent to repository
    console.log('[SERVICE] updateExtendedProfileService - Data received:', JSON.stringify(data, null, 2));
    
    const extendedProfile = await repo.createOrUpdateExtendedProfile(user_id, data);
    
    // DEBUG LOG: Log result from repository
    console.log('[SERVICE] updateExtendedProfileService - Result from DB:', extendedProfile);
    
    await refreshTrustScoreAfterProfileChange(user_id);
    return extendedProfile;
};

export const updateCompanyInfoService = async (user_id: string, data: UpdateCompanyInfoRequest) => {
    // DEBUG LOG: Log data being sent to repository
    console.log('[SERVICE] updateCompanyInfoService - Data received:', JSON.stringify(data, null, 2));
    
    try {
        const companyProfile = await repo.updateCompanyInfo(user_id, data);

        // DEBUG LOG: Log result from repository
        console.log('[SERVICE] updateCompanyInfoService - Result from DB:', companyProfile);

        if (!companyProfile) {
            logger.warn(`WARNING: No row updated for user_id: ${user_id}`);
            return null;
        }

        await refreshTrustScoreAfterProfileChange(user_id);
        return companyProfile;
    } catch (error: any) {
        logger.error(
            `Failed to save company information for ${user_id}: ${error?.message || error}`,
        );
        if (error instanceof CustomError) {
            throw error;
        }
        throw new CustomError('Failed to save company information', StatusCodes.INTERNAL_SERVER_ERROR);
    }
};

// ====================== ONLINE PRESENCE ======================
export const updateOnlinePresenceService = async (user_id: string, data: UpdateOnlinePresenceRequest) => {
    // DEBUG LOG: Log data being sent to repository
    console.log('[SERVICE] updateOnlinePresenceService - Data received:', JSON.stringify(data, null, 2));

    try {
        const result = await repo.updateOnlinePresence(user_id, data);

        // DEBUG LOG: Log result from repository
        console.log('[SERVICE] updateOnlinePresenceService - Result from DB:', result);

        if (!result) {
            logger.warn(`WARNING: No row updated for user_id: ${user_id}`);
            return null;
        }

        // Refresh trust score after successful update
        await refreshTrustScoreAfterProfileChange(user_id);
        return result;
    } catch (error: any) {
        logger.error(
            `Failed to save online presence for ${user_id}: ${error?.message || error}`,
        );
        if (error instanceof CustomError) {
            throw error;
        }
        throw new CustomError('Failed to save online presence', StatusCodes.INTERNAL_SERVER_ERROR);
    }
};

// ====================== FULL PROFILE ======================
export const getFullProfileService = async (user_id: string) => {
    const fullProfile = await repo.getFullProfile(user_id);
    return fullProfile;
};

const uploadToCloudinary = (
    file: Express.Multer.File
): Promise<{
    secure_url: string;
    public_id: string;
}> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "profile-images",
                resource_type: "image",
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }

                resolve({
                    secure_url: result!.secure_url,
                    public_id: result!.public_id,
                });
            }
        );

        streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
};

// ====================== PROFILE IMAGE UPLOAD ======================
export const uploadProfileImageService = async (
    user_id: string,
    file: Express.Multer.File
) => {

    const user = await DB.Users.findByPk(user_id);

    if (!user) {
        throw new CustomError("User not found", StatusCodes.NOT_FOUND);
    }

    // Delete previous image from Cloudinary
    if ((user as any).profile_image_public_id) {
        try {
            await cloudinary.uploader.destroy(
                (user as any).profile_image_public_id
            );
        } catch (err) {
            console.error("Failed to delete old Cloudinary image:", err);
        }
    }

    // Upload new image
    const upload = await uploadToCloudinary(file);

    // Save new image URL and public_id
    await DB.Users.update(
        {
            profile_image_url: upload.secure_url,
            profile_image_public_id: upload.public_id,
        },
        {
            where: {
                user_id,
            },
        }
    );

    return {
        profile_image_url: upload.secure_url,
    };
};
// export const uploadProfileImageService = async (user_id: string, file: Express.Multer.File) => {
//     const { path: filePath, storageType } = await saveFile(file, 'profile-images');
//     let storedUrl = filePath;
//     let displayUrl = filePath;
//     if (storageType === 'local') {
//         const fileName = path.basename(filePath);
//         const baseUrl = process.env.BASE_URL?.replace('/api', '') || `http://localhost:${process.env.PORT || 5000}`;
//         storedUrl = `${baseUrl}/uploads/profile-images/${fileName}`;
//         displayUrl = storedUrl;
//     } else {
//         displayUrl = await getFileUrl(filePath, storageType);
//     }
//     try {
//         await DB.Users.update({ profile_image_url: storedUrl }, { where: { user_id } });
//     } catch (err: any) {
//         console.warn('⚠️ Could not update profile_image_url column:', err.message);
//     }
//     return { profile_image_url: displayUrl };
// };

// ====================== PROFILE COMPLETION ======================
export const getProfileCompletionService = async (user_id: string) => {
    const user = await DB.Users.findByPk(user_id);
    if (!user) throw new CustomError('User not found', StatusCodes.NOT_FOUND);

    const fullProfile = await repo.getFullProfile(user_id);
    const role = (user.role_type || '').toLowerCase();

    const completedFields: string[] = [];
    const missingFields: string[] = [];

    if (user.full_name) completedFields.push('full_name'); else missingFields.push('full_name');
    if (user.email_verified) completedFields.push('email_verified'); else missingFields.push('email_verified');
    if (user.phone_verified) completedFields.push('phone_verified'); else missingFields.push('phone_verified');
    if ((user as any).profile_image_url) completedFields.push('profile_image'); else missingFields.push('profile_image');

    const bio = fullProfile.extendedProfile?.profile_summary || '';
    if (bio.length >= 20) completedFields.push('bio'); else missingFields.push('bio');

    if (role === 'student') {
        if (user.resume_url) completedFields.push('resume'); else missingFields.push('resume');
        if (fullProfile.skills && fullProfile.skills.length >= 3) completedFields.push('skills'); else missingFields.push('skills');
        if (fullProfile.educations && fullProfile.educations.length >= 1) completedFields.push('education'); else missingFields.push('education');
        if (fullProfile.employments && fullProfile.employments.length >= 1) completedFields.push('employment'); else missingFields.push('employment');
        if (fullProfile.projects && fullProfile.projects.length >= 1) completedFields.push('projects'); else missingFields.push('projects');
        if (user.preferred_location) completedFields.push('preferred_location'); else missingFields.push('preferred_location');
    } else if (role === 'employer') {
        if (user.business_registration_id) completedFields.push('business_registration'); else missingFields.push('business_registration');
        if (bio.length >= 50) {
            if (!completedFields.includes('bio')) completedFields.push('company_description');
        } else {
            missingFields.push('company_description');
        }
        if (user.preferred_location) completedFields.push('preferred_location'); else missingFields.push('preferred_location');
    }

    const totalFields = completedFields.length + missingFields.length;
    const percentage = totalFields > 0 ? Math.round((completedFields.length / totalFields) * 100) : 0;

    const stepMap: Record<string, { title: string; description: string; icon: string }> = {
        profile_image: { title: 'Profile Photo', description: 'Upload a profile photo', icon: 'camera' },
        bio: { title: 'Bio / Summary', description: 'Write a short bio about yourself', icon: 'document' },
        skills: { title: 'Skills', description: 'Add at least 3 key skills', icon: 'star' },
        education: { title: 'Education', description: 'Add your education history', icon: 'academic' },
        employment: { title: 'Work Experience', description: 'Add your work experience', icon: 'briefcase' },
        resume: { title: 'Resume', description: 'Upload your resume', icon: 'document' },
        email_verified: { title: 'Email Verification', description: 'Verify your email address', icon: 'mail' },
        phone_verified: { title: 'Phone Verification', description: 'Verify your phone number', icon: 'phone' },
        full_name: { title: 'Full Name', description: 'Complete your full name', icon: 'user' },
        preferred_location: { title: 'Location', description: 'Set your preferred location', icon: 'location' },
        business_registration: { title: 'Business Registration', description: 'Add your business registration ID', icon: 'building' },
        company_description: { title: 'Company Description', description: 'Describe your company', icon: 'document' },
        projects: { title: 'Projects', description: 'Add at least one project', icon: 'folder' },
    };

    const wizardSteps = missingFields.map((field, i) => ({
        step: i + 1,
        title: stepMap[field]?.title || field,
        description: stepMap[field]?.description || `Complete ${field}`,
        field,
        icon: stepMap[field]?.icon || 'star',
    }));

    return {
        profile_completion_percentage: percentage,
        is_complete: missingFields.length === 0,
        profile_completed_at: missingFields.length === 0 ? new Date().toISOString() : null,
        missingFields,
        completedFields,
        badges: [],
        wizardSteps,
        profile_image_url: (user as any).profile_image_url || null,
    };
};

// ====================== UPDATE PROFILE IMAGE URL ======================
export const updateProfileImageUrlService = async (user_id: string, profile_image_url: string) => {
    const user = await DB.Users.findByPk(user_id);
    if (!user) throw new CustomError('User not found', StatusCodes.NOT_FOUND);
    await DB.Users.update({ profile_image_url }, { where: { user_id } });
    const completion = await getProfileCompletionService(user_id);
    return {
        profile_image_url,
        profile_completion_percentage: completion.profile_completion_percentage,
        missingFields: completion.missingFields,
        completedFields: completion.completedFields,
    };
};

// ====================== OTHER USER FULL PROFILE ======================

export const getOtherUserFullProfileService = async (target_user_id: string) => {
    const fullProfile = await repo.getFullProfile(target_user_id);

    if (!fullProfile) {
        throw new CustomError('User profile not found', StatusCodes.NOT_FOUND);
    }

    return fullProfile;
};