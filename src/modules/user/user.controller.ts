import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Op } from 'sequelize';
import { ResponseFormat } from '@/exception/responseFormat';
import { Messages } from '@/utils/messages';
import { getAllUsersService } from '@/modules/auth/auth.service';
import { DB } from '@/database';

// Maps landing page category slugs to skill keywords for filtering
const CATEGORY_KEYWORDS: Record<string, string[]> = {
    development: [
        'Development',
        'JavaScript',
        'TypeScript',
        'React',
        'Node',
        'Vue',
        'Angular',
        'Python',
        'Java',
        'PHP',
        'Laravel',
        'Django',
        'Ruby',
        'Swift',
        'Flutter',
        'Mobile',
        'Web',
        'Backend',
        'Frontend',
        'Software',
        'Developer',
        'Programming',
    ],
    design: [
        'Figma',
        'UI',
        'UX',
        'Design',
        'Illustrator',
        'Photoshop',
        'Adobe',
        'Sketch',
        'Creative',
        'Graphic',
        'Motion',
        'Branding',
    ],
    finance: [
        'Finance',
        'Accounting',
        'Excel',
        'QuickBooks',
        'SAP',
        'Financial',
        'Budget',
        'Bookkeeping',
        'Audit',
        'Tax',
        'IFRS',
    ],
    sales: [
        'Sales',
        'Marketing',
        'CRM',
        'Salesforce',
        'Digital Marketing',
        'SEO',
        'Social Media',
        'Growth',
        'Content',
        'Advertising',
        'Branding',
    ],
    'ai-services': [
        'AI',
        'Machine Learning',
        'TensorFlow',
        'PyTorch',
        'Data Science',
        'NLP',
        'Deep Learning',
        'Data Analysis',
        'Computer Vision',
        'LLM',
    ],
    law: [
        'Legal',
        'Law',
        'Contract',
        'Compliance',
        'Corporate',
        'Litigation',
        'Attorney',
        'Intellectual Property',
        'Paralegal',
    ],
    hr: [
        'HR',
        'Human Resources',
        'Recruitment',
        'Training',
        'Talent',
        'HRIS',
        'Payroll',
        'Employee Relations',
        'Onboarding',
    ],
    engineering: [
        'Engineering',
        'Architecture',
        'AutoCAD',
        'Civil',
        'Mechanical',
        'Electrical',
        'Structural',
        'CAD',
        '3D Modeling',
        'Construction',
    ],
    writing: [
        'Writing',
        'Content',
        'Translation',
        'Copywriting',
        'Technical Writing',
        'Editing',
        'Proofreading',
        'Blogging',
        'Journalism',
    ],
    admin: [
        'Admin',
        'Support',
        'Virtual Assistant',
        'Data Entry',
        'Customer Service',
        'Reception',
        'Office Management',
        'Scheduling',
    ],
};

const response = new ResponseFormat();

// Get All Users
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const type = req.query.type as string | undefined;
        const search = (req.query.search as string) || undefined; // Add search parameter

        // Get current user's role to determine if admin roles should be excluded
        const currentUserRole = req.user?.role;

        const { data, pagination, counts } = await getAllUsersService(
            { page, limit, type, search }, // Pass search to service
            currentUserRole,
        );

        res.status(StatusCodes.OK).json({
            status: StatusCodes.OK,
            message: Messages.User.FETCH_USERS,
            success: true,
            pagination,
            data,
            counts,
        });
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

// Get All Students
export const getAllStudents = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = (req.query.search as string) || undefined; // Add search parameter

        const { data, pagination } = await getAllUsersService(
            { page, limit, type: 'Student', search }, // Pass search to service
            req.user?.role,
        );

        res.status(StatusCodes.OK).json({
            status: StatusCodes.OK,
            message: Messages.User.FETCH_STUDENTS,
            success: true,
            pagination,
            data,
        });
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};

// Helper: fetch students with optional skill filter
const fetchStudents = async (
    keywords: string[],
    limit: number,
    offset: number,
) => {
    const skillInclude: any = {
        model: DB.UserSkills,
        as: 'skills',
        attributes: ['skill_name'],
        required: keywords.length > 0,
    };
    if (keywords.length > 0) {
        skillInclude.where = {
            [Op.or]: keywords.map(k => ({
                skill_name: { [Op.iLike]: `%${k}%` },
            })),
        };
    }

    return DB.Users.findAndCountAll({
        where: { role_type: 'student' },
        attributes: [
            'user_id',
            'full_name',
            'preferred_location',
            'profile_image_url',
            'created_at',
        ],
        include: [
            skillInclude,
            {
                model: DB.UserExtendedProfiles,
                as: 'extendedProfile',
                attributes: [
                    'resume_headline',
                    'profile_summary',
                    'total_experience_years',
                ],
                required: false,
            },
        ],
        limit,
        offset,
        distinct: true,
        order: [['created_at', 'DESC']],
    });
};

// Get public worker profiles for landing page
export const getPublicWorkers = async (req: Request, res: Response) => {
    try {
        const category = (req.query.category as string) || '';
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = (page - 1) * limit;

        const keywords = CATEGORY_KEYWORDS[category] || [];

        const result = await fetchStudents(keywords, limit, offset);
        const isFiltered = keywords.length > 0;

        const { rows: workers, count: total } = result;

        // Fetch all skills for returned workers (not just the filter-matched ones)
        const workerIds = workers.map((w: any) => w.user_id);
        const allSkills =
            workerIds.length > 0
                ? await DB.UserSkills.findAll({
                      where: { user_id: { [Op.in]: workerIds } },
                      attributes: ['user_id', 'skill_name'],
                  })
                : [];

        const skillsByUser: Record<string, string[]> = {};
        allSkills.forEach((s: any) => {
            if (!skillsByUser[s.user_id]) skillsByUser[s.user_id] = [];
            skillsByUser[s.user_id].push(s.skill_name);
        });

        const data = workers.map((w: any) => {
            const plain = w.get({ plain: true });
            return {
                user_id: plain.user_id,
                full_name: plain.full_name,
                location: plain.preferred_location || '',
                profile_image_url: plain.profile_image_url || null,
                title: plain.extendedProfile?.resume_headline || '',
                description: plain.extendedProfile?.profile_summary || '',
                experience_years:
                    plain.extendedProfile?.total_experience_years || 0,
                skills: skillsByUser[plain.user_id] || [],
            };
        });

        res.status(StatusCodes.OK).json({
            success: true,
            status: StatusCodes.OK,
            message: 'Workers retrieved successfully',
            data,
            filtered: isFiltered,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error('[getPublicWorkers] ERROR:', error?.message);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            message: error.message,
        });
    }
};

// Get single public worker profile by user_id
export const getPublicWorkerById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const worker = await DB.Users.findOne({
            where: { user_id: id, role_type: 'student' },
            attributes: [
                'user_id',
                'full_name',
                'preferred_location',
                'profile_image_url',
            ],
            include: [
                {
                    model: DB.UserSkills,
                    as: 'skills',
                    attributes: ['skill_name', 'proficiency_level'],
                    required: false,
                },
                {
                    model: DB.UserExtendedProfiles,
                    as: 'extendedProfile',
                    attributes: [
                        'resume_headline',
                        'profile_summary',
                        'total_experience_years',
                    ],
                    required: false,
                },
            ],
        });

        if (!worker) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                status: StatusCodes.NOT_FOUND,
                message: 'Worker not found',
            });
        }

        const plain = worker.get({ plain: true }) as any;
        const data = {
            user_id: plain.user_id,
            full_name: plain.full_name,
            location: plain.preferred_location || '',
            profile_image_url: plain.profile_image_url || null,
            title: plain.extendedProfile?.resume_headline || '',
            description: plain.extendedProfile?.profile_summary || '',
            experience_years:
                plain.extendedProfile?.total_experience_years || 0,
            skills: (plain.skills || []).map((s: any) => s.skill_name),
        };

        res.status(StatusCodes.OK).json({
            success: true,
            status: StatusCodes.OK,
            message: 'Worker retrieved successfully',
            data,
        });
    } catch (error: any) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            message: error.message,
        });
    }
};

// Get All Employers
export const getAllEmployers = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = (req.query.search as string) || undefined; // Add search parameter

        const { data, pagination } = await getAllUsersService(
            { page, limit, type: 'Employer', search }, // Pass search to service
            req.user?.role,
        );

        res.status(StatusCodes.OK).json({
            status: StatusCodes.OK,
            message: Messages.User.FETCH_EMPLOYERS,
            success: true,
            pagination,
            data,
        });
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};
