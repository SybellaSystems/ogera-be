import express from "express";
const recordRouter = express.Router();
import { uploadReportCard } from "./record.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { uploadSingle } from "../../middlewares/multer";

recordRouter.post("/:studentId/report-card", authMiddleware, uploadSingle('file'), uploadReportCard);

export default recordRouter;