import express from "express";
import { 
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob
} from "./job.controller";

const jobRouter = express.Router();

jobRouter.post("/", createJob);
jobRouter.get("/", getAllJobs);
jobRouter.get("/:id", getJobById);
jobRouter.put("/:id", updateJob);
jobRouter.delete("/:id", deleteJob);

export default jobRouter;
