import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { ResponseFormat } from "@/exception/responseFormat";
import { Messages } from "@/utils/messages";
import { 
  createJobService,
  getAllJobsService,
  getJobByIdService,
  updateJobService,
  deleteJobService
} from "./job.service";

const response = new ResponseFormat();

export const createJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await createJobService(req.body);
    response.response(res, true, StatusCodes.CREATED, job, Messages.Job.CREATE_JOB);
  } catch (error: any) {
    response.errorResponse(res, error.status || StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
  }
};

export const getAllJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jobs = await getAllJobsService();
    response.response(res, true, StatusCodes.OK, jobs, Messages.Job.GET_ALL_JOBS);
  } catch (error: any) {
    response.errorResponse(res, error.status || StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
  }
};

export const getJobById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await getJobByIdService(req.params.id);
    response.response(res, true, StatusCodes.OK, job, Messages.Job.GET_JOB_BY_ID);
  } catch (error: any) {
    response.errorResponse(res, error.status || StatusCodes.NOT_FOUND, false, error.message);
  }
};

export const updateJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await updateJobService(req.params.id, req.body);
    response.response(res, true, StatusCodes.OK, job, Messages.Job.UPDATE_JOB);
  } catch (error: any) {
    response.errorResponse(res, error.status || StatusCodes.BAD_REQUEST, false, error.message);
  }
};

export const deleteJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await deleteJobService(req.params.id);
    response.response(res, true, StatusCodes.OK, result, Messages.Job.DELETE_JOB);
  } catch (error: any) {
    response.errorResponse(res, error.status || StatusCodes.NOT_FOUND, false, error.message);
  }
};
