import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ResponseFormat } from '@/exception/responseFormat';
import {
    addSkillService,
    addBulkSkillsService,
    getSkillsService,
    updateSkillService,
    deleteSkillService,
    addEmploymentService,
    getEmploymentsService,
    updateEmploymentService,
    deleteEmploymentService,
    addEducationService,
    getEducationsService,
    updateEducationService,
    deleteEducationService,
    addProjectService,
    getProjectsService,
    updateProjectService,
    deleteProjectService,
    addAccomplishmentService,
    getAccomplishmentsService,
    updateAccomplishmentService,
    deleteAccomplishmentService,
    getExtendedProfileService,
    updateExtendedProfileService,
    updateCompanyInfoService,
    updateOnlinePresenceService,
    getFullProfileService,
    uploadProfileImageService,
    getProfileCompletionService,
    updateProfileImageUrlService,
    getOtherUserFullProfileService,
} from './profile.service';

const response = new ResponseFormat();

// ====================== SKILLS ======================
export const addSkill = async (req: Request, res: Response): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        const skill = await addSkillService(user_id, req.body);
        response.response(
            res,
            true,
            StatusCodes.CREATED,
            skill,
            'Skill added successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const addBulkSkills = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        const { skills } = req.body;
        if (!skills || !Array.isArray(skills)) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'Skills array is required',
            );
            return;
        }

        const createdSkills = await addBulkSkillsService(user_id, skills);
        response.response(
            res,
            true,
            StatusCodes.CREATED,
            createdSkills,
            'Skills added successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const getSkills = async (req: Request, res: Response): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        const skill_type = req.query.skill_type as
            | 'key_skill'
            | 'it_skill'
            | undefined;
        const skills = await getSkillsService(user_id, skill_type);
        response.response(
            res,
            true,
            StatusCodes.OK,
            skills,
            'Skills retrieved successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const updateSkill = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        const { id } = req.params;
        const skill = await updateSkillService(user_id, id as string, req.body);
        if (!skill) {
            response.errorResponse(
                res,
                StatusCodes.NOT_FOUND,
                false,
                'Skill not found',
            );
            return;
        }
        response.response(
            res,
            true,
            StatusCodes.OK,
            skill,
            'Skill updated successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const deleteSkill = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        const { id } = req.params;
        const result = await deleteSkillService(user_id, id as string);
        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            'Skill deleted successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

// ====================== EMPLOYMENT ======================
export const addEmployment = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        const employment = await addEmploymentService(user_id, req.body);
        response.response(
            res,
            true,
            StatusCodes.CREATED,
            employment,
            'Employment added successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const getEmployments = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        const employments = await getEmploymentsService(user_id);
        response.response(
            res,
            true,
            StatusCodes.OK,
            employments,
            'Employments retrieved successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const updateEmployment = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        const { id } = req.params;
        const employment = await updateEmploymentService(
            user_id,
            id as string,
            req.body,
        );
        if (!employment) {
            response.errorResponse(
                res,
                StatusCodes.NOT_FOUND,
                false,
                'Employment not found',
            );
            return;
        }
        response.response(
            res,
            true,
            StatusCodes.OK,
            employment,
            'Employment updated successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const deleteEmployment = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        const { id } = req.params;
        const result = await deleteEmploymentService(user_id, id as string);
        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            'Employment deleted successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

// ====================== EDUCATION ======================
export const addEducation = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        const education = await addEducationService(user_id, req.body);
        response.response(
            res,
            true,
            StatusCodes.CREATED,
            education,
            'Education added successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const getEducations = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        const educations = await getEducationsService(user_id);
        response.response(
            res,
            true,
            StatusCodes.OK,
            educations,
            'Educations retrieved successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const updateEducation = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        const { id } = req.params;
        const education = await updateEducationService(
            user_id,
            id as string,
            req.body,
        );
        if (!education) {
            response.errorResponse(
                res,
                StatusCodes.NOT_FOUND,
                false,
                'Education not found',
            );
            return;
        }
        response.response(
            res,
            true,
            StatusCodes.OK,
            education,
            'Education updated successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const deleteEducation = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        const { id } = req.params;
        const result = await deleteEducationService(user_id, id as string);
        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            'Education deleted successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

// ====================== PROJECTS ======================
export const addProject = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        const project = await addProjectService(user_id, req.body);
        response.response(
            res,
            true,
            StatusCodes.CREATED,
            project,
            'Project added successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const getProjects = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        const projects = await getProjectsService(user_id);
        response.response(
            res,
            true,
            StatusCodes.OK,
            projects,
            'Projects retrieved successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const updateProject = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        const { id } = req.params;
        const project = await updateProjectService(
            user_id,
            id as string,
            req.body,
        );
        if (!project) {
            response.errorResponse(
                res,
                StatusCodes.NOT_FOUND,
                false,
                'Project not found',
            );
            return;
        }
        response.response(
            res,
            true,
            StatusCodes.OK,
            project,
            'Project updated successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const deleteProject = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        const { id } = req.params;
        const result = await deleteProjectService(user_id, id as string);
        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            'Project deleted successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

// ====================== ACCOMPLISHMENTS ======================
export const addAccomplishment = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        const accomplishment = await addAccomplishmentService(
            user_id,
            req.body,
        );
        response.response(
            res,
            true,
            StatusCodes.CREATED,
            accomplishment,
            'Accomplishment added successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const getAccomplishments = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        const accomplishment_type = req.query.type as string | undefined;
        const accomplishments = await getAccomplishmentsService(
            user_id,
            accomplishment_type,
        );
        response.response(
            res,
            true,
            StatusCodes.OK,
            accomplishments,
            'Accomplishments retrieved successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const updateAccomplishment = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        const { id } = req.params;
        const accomplishment = await updateAccomplishmentService(
            user_id,
            id as string,
            req.body,
        );
        if (!accomplishment) {
            response.errorResponse(
                res,
                StatusCodes.NOT_FOUND,
                false,
                'Accomplishment not found',
            );
            return;
        }
        response.response(
            res,
            true,
            StatusCodes.OK,
            accomplishment,
            'Accomplishment updated successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const deleteAccomplishment = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        const { id } = req.params;
        const result = await deleteAccomplishmentService(user_id, id as string);
        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            'Accomplishment deleted successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

// ====================== EXTENDED PROFILE ======================
export const getExtendedProfile = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        const extendedProfile = await getExtendedProfileService(user_id);
        if (!extendedProfile) {
            response.errorResponse(
                res,
                StatusCodes.NOT_FOUND,
                false,
                'Extended profile not found',
            );
            return;
        }
        response.response(
            res,
            true,
            StatusCodes.OK,
            extendedProfile,
            'Extended profile retrieved successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const updateExtendedProfile = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        // DEBUG LOG: Log incoming request body
        console.log(
            '[CONTROLLER] updateExtendedProfile - Incoming request body:',
            JSON.stringify(req.body, null, 2),
        );

        const extendedProfile = await updateExtendedProfileService(
            user_id,
            req.body,
        );
        if (!extendedProfile) {
            response.errorResponse(
                res,
                StatusCodes.NOT_FOUND,
                false,
                'Extended profile not found',
            );
            return;
        }
        response.response(
            res,
            true,
            StatusCodes.OK,
            extendedProfile,
            'Extended profile updated successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const updateCompanyInfo = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        if ((req.user?.role || '').toLowerCase() !== 'employer') {
            response.errorResponse(
                res,
                StatusCodes.FORBIDDEN,
                false,
                'Only employers can update company info',
            );
            return;
        }

        const normalizeText = (value: unknown) => {
            if (typeof value !== 'string') {
                return undefined;
            }

            const trimmed = value.trim();
            return trimmed.length > 0 ? trimmed : undefined;
        };

        // DEBUG LOG: Log incoming request body
        console.log(
            '[CONTROLLER] updateCompanyInfo - Incoming request body:',
            JSON.stringify(req.body, null, 2),
        );

        const company_name = normalizeText(req.body.company_name);
        const industry_category = normalizeText(req.body.industry_category);
        const company_size = normalizeText(req.body.company_size);
        const company_location = normalizeText(req.body.company_location);

        if (
            !company_name &&
            !industry_category &&
            !company_size &&
            !company_location
        ) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'At least one company field must be provided',
            );
            return;
        }

        // DEBUG LOG: Log normalized values before service call
        console.log('[CONTROLLER] updateCompanyInfo - Normalized values:', {
            company_name,
            industry_category,
            company_size,
            company_location,
        });

        const companyProfile = await updateCompanyInfoService(user_id, {
            company_name,
            industry_category,
            company_size,
            company_location,
        });

        if (!companyProfile) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'Failed to update company information',
            );
            return;
        }

        response.response(
            res,
            true,
            StatusCodes.OK,
            companyProfile,
            'Company information updated successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

// ====================== ONLINE PRESENCE ======================
export const updateOnlinePresence = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        // DEBUG LOG: Log incoming request body
        console.log(
            '[CONTROLLER] updateOnlinePresence - Incoming request body:',
            JSON.stringify(req.body, null, 2),
        );
        console.log('[CONTROLLER] updateOnlinePresence - USER ID:', user_id);

        // Extract and validate website (frontend sends 'website', DB stores as 'website_url')
        const website =
            typeof req.body.website === 'string'
                ? req.body.website.trim()
                : undefined;
        // Extract and validate linkedin (frontend sends 'linkedin', DB stores as 'linkedin_url')
        const linkedin =
            typeof req.body.linkedin === 'string'
                ? req.body.linkedin.trim()
                : undefined;

        // Ensure at least one field is provided
        if (!website && !linkedin) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'At least one field (website or linkedin) is required',
            );
            return;
        }

        console.log('[CONTROLLER] updateOnlinePresence - Extracted values:', {
            website,
            linkedin,
        });

        // Call service with mapped field names
        const result = await updateOnlinePresenceService(user_id, {
            website,
            linkedin,
        });

        if (!result) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'Failed to update online presence',
            );
            return;
        }

        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            'Online presence saved successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

// ====================== FULL PROFILE ======================
export const getFullProfile = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        const fullProfile = await getFullProfileService(user_id);
        response.response(
            res,
            true,
            StatusCodes.OK,
            fullProfile,
            'Full profile retrieved successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

// ====================== PROFILE IMAGE & COMPLETION ======================

export const uploadProfileImage = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        if (!req.file) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'No image file provided',
            );
            return;
        }

        const result = await uploadProfileImageService(user_id, req.file);
        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            'Profile image uploaded successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};
export const getProfileCompletion = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        const completion = await getProfileCompletionService(user_id);
        response.response(
            res,
            true,
            StatusCodes.OK,
            completion,
            'Profile completion retrieved successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

export const updateProfileImageUrl = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        const { profile_image_url } = req.body;
        if (!profile_image_url) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'Profile image URL is required',
            );
            return;
        }

        const result = await updateProfileImageUrlService(
            user_id,
            profile_image_url,
        );
        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            'Profile image URL updated successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

// ====================== OTHER USER PROFILE ======================

export const getOtherUserFullProfile = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const userId = req.params.userId as string;

        const fullProfile = await getOtherUserFullProfileService(userId);

        if (!fullProfile) {
            response.errorResponse(
                res,
                StatusCodes.NOT_FOUND,
                false,
                'User profile not found',
            );
            return;
        }

        response.response(
            res,
            true,
            StatusCodes.OK,
            fullProfile,
            'User profile retrieved successfully',
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};
