import repo from './job.repo';
import { CustomError } from '@/utils/custom-error';
import { StatusCodes } from 'http-status-codes';
import { Messages } from '@/utils/messages';
import { Job } from '@/interfaces/job.interfaces';
import { DB } from '@/database';

export const createJobService = async (
    jobData: Partial<Job>,
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
    if (!jobData.budget) {
        throw new CustomError('Budget is required', StatusCodes.BAD_REQUEST);
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
        status: jobPayloadData.status || 'Pending', // New jobs default to Pending for approval
    };

    const job = await repo.createJob(jobPayload);

    // Create questions if provided
    if (questions && Array.isArray(questions) && questions.length > 0) {
        await repo.createJobQuestions(job.job_id, questions);
    }

    // Return job with questions
    return await repo.findJobById(job.job_id);
};

export const getAllJobsService = async (status?: string) => {
    return await repo.findAllJobs(status);
};

export const getJobsByStatusService = async (
    status: 'Pending' | 'Active' | 'Inactive' | 'Completed',
) => {
    return await repo.findAllJobs(status);
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

    const { questions, ...jobUpdates } = updates;

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
        return await repo.findJobById(job_id);
    }

    return updated;
};

export const deleteJobService = async (job_id: string) => {
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

    // Only employer and superadmin can toggle job status
    if (
        roleType !== 'employer' &&
        roleType !== 'superAdmin' &&
        roleName !== 'superadmin'
    ) {
        throw new CustomError(
            'Only employer and superadmin users can toggle job status',
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
    if (roleType === 'employer' && job.employer_id !== user_id) {
        throw new CustomError(
            'You can only toggle status for your own jobs',
            StatusCodes.FORBIDDEN,
        );
    }

    // Check if job status can be toggled (Active, Inactive, and Pending can be toggled)
    if (
        job.status !== 'Active' &&
        job.status !== 'Inactive' &&
        job.status !== 'Pending'
    ) {
        throw new CustomError(
            'Only Active, Inactive, or Pending jobs can have their status toggled',
            StatusCodes.BAD_REQUEST,
        );
    }

    // Toggle status: Active -> Inactive, Inactive -> Active, Pending -> Active
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
