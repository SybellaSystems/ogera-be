import repo from "./job.repo";
import { CustomError } from "@/utils/custom-error";
import { StatusCodes } from "http-status-codes";
import { Messages } from "@/utils/messages";
import { Job } from "@/interfaces/job.interfaces";

export const createJobService = async (jobData: Partial<Job> & { employer_name?: string }) => {
  const { employer_name, ...rest } = jobData;

  if (!employer_name) {
    throw new CustomError("Employer name is required", StatusCodes.BAD_REQUEST);
  }

  const employer = await repo.findEmployerByNameAndRole(employer_name);
  if (!employer) {
    throw new CustomError("Employer not found", StatusCodes.NOT_FOUND);
  }

  const existingJob = await repo.findJobByEmployerAndUniqueFields(
    employer.user_id,
    rest.job_title,
    rest.location
  );

  if (existingJob) {
    throw new CustomError(
      "A job with the same title and location already exists for this employer",
      StatusCodes.CONFLICT
    );
  }

  const jobPayload = {
    employer_id: employer.user_id,
    ...rest,
  };

  return await repo.createJob(jobPayload);
};

export const getAllJobsService = async () => {
  return await repo.findAllJobs();
};

export const getJobByIdService = async (job_id: string) => {
  const job = await repo.findJobById(job_id);
  if (!job) {
    throw new CustomError(Messages.Job.JOB_NOT_FOUND, StatusCodes.NOT_FOUND);
  }
  return job;
};

export const updateJobService = async (job_id: string, updates: Partial<Job> & { employer_name?: string }) => {
  if (updates.employer_name) {
    const employer = await repo.findEmployerByNameAndRole(updates.employer_name);
    if (!employer) {
      throw new CustomError("Employer not found", StatusCodes.NOT_FOUND);
    }
    updates.employer_id = employer.user_id;
    delete updates.employer_name;
  }

  const updated = await repo.updateJob(job_id, updates);
  if (!updated) {
    throw new CustomError(Messages.Job.JOB_NOT_FOUND, StatusCodes.NOT_FOUND);
  }
  return updated;
};

export const deleteJobService = async (job_id: string) => {
  const deleted = await repo.deleteJob(job_id);
  if (!deleted) {
    throw new CustomError(Messages.Job.JOB_NOT_FOUND, StatusCodes.NOT_FOUND);
  }
  return { message: Messages.Job.DELETE_JOB };
};
