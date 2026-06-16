import repo from './job.repo';
import { CustomError } from '@/utils/custom-error';
import { StatusCodes } from 'http-status-codes';
import { Messages } from '@/utils/messages';
import { Job } from '@/interfaces/job.interfaces';
import { DB } from '@/database';
import { MOMO_CONFIG } from '@/config';
import jobCategoryRepo from '../jobCategory/jobCategory.repo';

export const createJobService = async (
    jobData: Partial<Job> & { questions?: any[] },
    user_id: string,
    userRole: string,
) => {
    // Check if user has employer or superadmin roleType
    const user = await DB.Users.findOne({
        where: { user_id },
        include: [
            {
                model: DB.Roles,
                as: 'role',
                attributes: ['roleType', 'roleName'],
            },
        ],
    });

    if (!user || !user.role) {
        throw new CustomError('User not found', StatusCodes.NOT_FOUND);
    }

        const roleType = user.role.roleType;
    const roleName = user.role.roleName.toLowerCase();

    // Only employer and superadmin can create jobs
    if (
        roleType !== 'employer' &&
        roleType !== 'superAdmin' &&
        roleName !== 'superadmin'
    ) {
        throw new CustomError(
            'Only employer and superadmin users can create jobs',
            StatusCodes.FORBIDDEN,
        );
    }

    // If user is superadmin, they can create jobs for any employer
    // If user is employer, they can only create jobs for themselves
    const employer_id =
        roleType === 'employer' ? user_id : jobData.employer_id || user_id;

    // Validate required fields
    if (!jobData.job_title) {
        throw new CustomError('Job title is required', StatusCodes.BAD_REQUEST);
    }
    if (!jobData.category) {
        throw new CustomError('Category is required', StatusCodes.BAD_REQUEST);
    }
    
    // Validate that the category exists in the database
    const categoryExists = await jobCategoryRepo.findCategoryByName(jobData.category.trim());
    if (!categoryExists) {
        throw new CustomError(
            'Invalid category. Please select a valid category from the list.',
            StatusCodes.BAD_REQUEST,
        );
    }
    
    if (!jobData.budget) {
        throw new CustomError('Budget is required', StatusCodes.BAD_REQUEST);
    }
    if (!jobData.currency || !String(jobData.currency).trim()) {
        jobData.currency = MOMO_CONFIG.currency || 'EUR';
    } else {
        jobData.currency = String(jobData.currency).trim().toUpperCase();
    }
    if (!jobData.duration) {
        throw new CustomError('Duration is required', StatusCodes.BAD_REQUEST);
    }
    if (!jobData.location) {
        throw new CustomError('Location is required', StatusCodes.BAD_REQUEST);
    }

    const existingJob = await repo.findJobByEmployerAndUniqueFields(
        employer_id,
        jobData.job_title,
        jobData.location,
    );

    if (existingJob) {
        throw new CustomError(
            'A job with the same title and location already exists for this employer',
            StatusCodes.CONFLICT,
        );
    }

    const { questions, ...jobPayloadData } = jobData;
    
    const jobPayload = {
        employer_id,
        ...jobPayloadData,
        // Employers must be approved by admin/superadmin before publication.
        // Superadmins can still choose an explicit status when creating.
        status: roleType === 'employer' ? 'Pending' : jobPayloadData.status || 'Pending',
    };

    const job = await repo.createJob(jobPayload);

    // Create questions if provided
    if (questions && Array.isArray(questions) && questions.length > 0) {
        await repo.createJobQuestions(job.job_id, questions);
    }

    // Return job with questions
    const createdJob = await repo.findJobById(job.job_id);
    if (!createdJob) {
        throw new CustomError(
            'Failed to retrieve created job',
            StatusCodes.INTERNAL_SERVER_ERROR,
        );
    }
        try {
            await DB.ActivityLogs.create({
                user_id: user_id || null,
                action: 'CREATE',
                entity_type: 'Job',
                entity_id: createdJob.job_id,
                description: `Job created: ${createdJob.job_title || createdJob.job_id}`,
            } as any);
        } catch (e) {
            // swallow logging errors
        }
        return createdJob;
};

export const getAllJobsService = async (
    filters?: {
        status?: string;
        funded?: string;
        search?: string;
        location?: string;
        category?: string;
        currency?: string;
        payment_range?: string;
    },
    user?: { user_id: string; role: string },
) => {
    try {
        const normalizedRole = user?.role ? String(user.role).toLowerCase().trim() : '';
        const fundedFilter =
            filters?.funded === 'true' ? true : filters?.funded === 'false' ? false : undefined;
        let budget_min: number | undefined;
        let budget_max: number | undefined;
        if (filters?.payment_range === 'under-500') {
            budget_max = 499.99;
        } else if (filters?.payment_range === '500-2000') {
            budget_min = 500;
            budget_max = 2000;
        } else if (filters?.payment_range === '2000-5000') {
            budget_min = 2000.01;
            budget_max = 5000;
        } else if (filters?.payment_range === '5000-plus') {
            budget_min = 5000.01;
        }
        const repoFilters = {
            status: filters?.status,
            funded: fundedFilter,
            search: filters?.search,
            location: filters?.location,
            category: filters?.category,
            currency: filters?.currency,
            budget_min,
            budget_max,
        };

        // Students should see only admin-approved/published jobs.
        // Funding is NOT required for visibility.
        if (normalizedRole === 'student') {
            const jobs = await repo.findAllJobs({
                ...repoFilters,
                status: 'Active',
            });
            return jobs;
        }

        // Employers should see all their jobs by default.
        // They can still explicitly filter funded/unfunded with funded=true/false.
        if (normalizedRole === 'employer') {
            const jobs = await repo.findAllJobs({
                ...repoFilters,
                employer_id: user?.user_id,
            });
            return jobs;
        }

        const jobs = await repo.findAllJobs(repoFilters);
        return jobs;
    } catch (error: any) {
        console.error('Error in getAllJobsService:', error);
        throw error;
    }
};

export const getJobsByStatusService = async (
    status: 'Pending' | 'Active' | 'Inactive' | 'Completed',
    user?: { user_id: string; role: string },
) => {
    const normalizedRole = user?.role ? String(user.role).toLowerCase().trim() : '';

    // Public/unauthenticated views should only get funded jobs.
    if (!user) {
        return await repo.findAllJobs({ status, funded: true });
    }

    if (normalizedRole === 'student' || normalizedRole === 'employer') {
        return await repo.findAllJobs({ status, funded: true });
    }

    return await repo.findAllJobs({ status });
};

export const getJobByIdService = async (job_id: string) => {
    const job = await repo.findJobById(job_id);
    if (!job) {
        throw new CustomError(
            Messages.Job.JOB_NOT_FOUND,
            StatusCodes.NOT_FOUND,
        );
    }
    return job;
};

export const updateJobService = async (
    job_id: string,
    updates: Partial<Job> & { employer_name?: string; questions?: any[] },
) => {
    if (updates.employer_name) {
        const employer = await repo.findEmployerByNameAndRole(
            updates.employer_name,
        );
        if (!employer) {
            throw new CustomError('Employer not found', StatusCodes.NOT_FOUND);
        }
        updates.employer_id = employer.user_id;
        delete updates.employer_name;
    }

    // Validate category if it's being updated
    if (updates.category) {
        const categoryExists = await jobCategoryRepo.findCategoryByName(updates.category.trim());
        if (!categoryExists) {
            throw new CustomError(
                'Invalid category. Please select a valid category from the list.',
                StatusCodes.BAD_REQUEST,
            );
        }
    }

    const { questions, ...jobUpdates } = updates;
    if (jobUpdates.currency) {
        jobUpdates.currency = String(jobUpdates.currency).trim().toUpperCase();
    }

    const updated = await repo.updateJob(job_id, jobUpdates);
    if (!updated) {
        throw new CustomError(
            Messages.Job.JOB_NOT_FOUND,
            StatusCodes.NOT_FOUND,
        );
    }

    // Update questions if provided
    if (questions !== undefined) {
        if (Array.isArray(questions)) {
            if (questions.length > 0) {
                await repo.createJobQuestions(job_id, questions);
            } else {
                // If empty array, delete all questions
                await DB.JobQuestions.destroy({ where: { job_id } });
            }
        }
        // Return updated job with questions
        const updatedJob = await repo.findJobById(job_id);
        if (!updatedJob) {
            throw new CustomError(
                'Failed to retrieve updated job',
                StatusCodes.INTERNAL_SERVER_ERROR,
            );
                }
                try {
                    await DB.ActivityLogs.create({
                        user_id: null,
                        action: 'UPDATE',
                        entity_type: 'Job',
                        entity_id: updatedJob.job_id,
                        description: `Job updated: ${updatedJob.job_title || updatedJob.job_id}`,
                    } as any);
                } catch (e) {
                    // swallow logging errors
                }
                return updatedJob;
    }

        try {
            await DB.ActivityLogs.create({
                user_id: null,
                action: 'UPDATE',
                entity_type: 'Job',
                entity_id: job_id,
                description: `Job updated: ${job_id}`,
            } as any);
        } catch (e) {
            // swallow logging errors
        }

        return updated;
};

export const reviewJobService = async (
    job_id: string,
    reviewerId: string,
    reviewerRole: string,
    nextStatus: 'Active' | 'Inactive',
) => {
    const role = String(reviewerRole || '').toLowerCase().trim();
    const reviewer = await DB.Users.findOne({ where: { user_id: reviewerId } });
    if (!reviewer) {
        throw new CustomError('Reviewer not found', StatusCodes.NOT_FOUND);
    }

    // Allow built-in and custom admin roles (e.g. verifydocadmin, courseadmin),
    // but never allow student/employer roles to review/publish jobs.
    const isAdminLike =
        role.includes('admin') &&
        !role.includes('student') &&
        !role.includes('employer');

    if (!isAdminLike) {
        throw new CustomError(
            'Only admin or superadmin can review jobs',
            StatusCodes.FORBIDDEN,
        );
    }

    const job = await repo.findJobById(job_id);
    if (!job) {
        throw new CustomError(
            Messages.Job.JOB_NOT_FOUND,
            StatusCodes.NOT_FOUND,
        );
    }

    const updated = await repo.updateJob(job_id, { status: nextStatus });
    if (!updated) {
        throw new CustomError(
            'Failed to review job',
            StatusCodes.INTERNAL_SERVER_ERROR,
        );
    }
    return updated;
};

export const deleteJobService = async (
    job_id: string,
    user_id: string,
    userRole: string,
) => {
    // Load the job to verify it exists and check ownership.
    const job = await repo.findJobById(job_id);
    if (!job) {
        throw new CustomError(
            Messages.Job.JOB_NOT_FOUND,
            StatusCodes.NOT_FOUND,
        );
    }

    // Access rules:
    //  - superadmin / admin (any casing): can delete ANY job
    //  - employer: can only delete their OWN jobs
    //  - anyone else: forbidden
    const role = (userRole || '').toLowerCase();
    const isAdmin = role === 'admin' || role === 'superadmin';
    const isOwner = job.employer_id === user_id;

    if (!isAdmin && !isOwner) {
        throw new CustomError(
            'You can only delete your own jobs',
            StatusCodes.FORBIDDEN,
        );
    }

    const deleted = await repo.deleteJob(job_id);
    if (!deleted) {
        throw new CustomError(
            Messages.Job.JOB_NOT_FOUND,
            StatusCodes.NOT_FOUND,
        );
    }
    return { message: Messages.Job.DELETE_JOB };
};

// Toggle job status between Active and Inactive (employer only)
export const toggleJobStatusService = async (
    job_id: string,
    user_id: string,
    userRole: string,
) => {
    // Check if user has permission
    const user = await DB.Users.findOne({
        where: { user_id },
        include: [
            {
                model: DB.Roles,
                as: 'role',
                attributes: ['roleType', 'roleName'],
            },
        ],
    });

    if (!user || !user.role) {
        throw new CustomError('User not found', StatusCodes.NOT_FOUND);
    }

    const roleType = user.role.roleType;
    const roleName = user.role.roleName.toLowerCase();

    const normalizedRole = String(userRole || '').toLowerCase().trim();
    const isAdmin = normalizedRole === 'admin' || normalizedRole === 'superadmin';
    const isEmployer = roleType === 'employer';

    // Only employer/admin/superadmin can toggle job status.
    if (!isEmployer && !isAdmin && roleType !== 'superAdmin' && roleName !== 'superadmin') {
        throw new CustomError(
            'Only employer, admin, and superadmin users can toggle job status',
            StatusCodes.FORBIDDEN,
        );
    }

    // Get the job
    const job = await repo.findJobById(job_id);
    if (!job) {
        throw new CustomError(
            Messages.Job.JOB_NOT_FOUND,
            StatusCodes.NOT_FOUND,
        );
    }

    // If user is employer, check if they own the job
    if (isEmployer && job.employer_id !== user_id) {
        throw new CustomError(
            'You can only toggle status for your own jobs',
            StatusCodes.FORBIDDEN,
        );
    }

    // Employers are NOT allowed to publish Pending jobs.
    // Pending -> Active must be done by admin/superadmin review only.
    if (isEmployer && job.status === 'Pending') {
        throw new CustomError(
            'Pending jobs must be reviewed by admin before publication',
            StatusCodes.FORBIDDEN,
        );
    }

    // Check if job status can be toggled
    if (job.status !== 'Active' && job.status !== 'Inactive' && job.status !== 'Pending') {
        throw new CustomError(
            'Only Active, Inactive, or Pending jobs can have their status toggled',
            StatusCodes.BAD_REQUEST,
        );
    }

    // Toggle status:
    // - Active -> Inactive
    // - Inactive -> Active
    // - Pending -> Active (admin/superadmin only)
    let newStatus: string;
    if (job.status === 'Active') {
        newStatus = 'Inactive';
    } else if (job.status === 'Inactive') {
        newStatus = 'Active';
    } else if (job.status === 'Pending') {
        newStatus = 'Active';
    } else {
        newStatus = 'Active'; // Default fallback
    }

    const updated = await repo.updateJob(job_id, { status: newStatus });
    if (!updated) {
        throw new CustomError(
            'Failed to update job status',
            StatusCodes.INTERNAL_SERVER_ERROR,
        );
    }

    return updated;
};
