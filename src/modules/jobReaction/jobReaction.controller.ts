import { Request, Response } from "express";
import service from "./jobReaction.service";

class JobReactionController {

    async like(req: Request, res: Response) {

        if (!req.user) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        const job_id = req.params.jobId;

        const user_id = req.user.user_id;

        const response = await service.like(
            job_id,
            user_id,
        );

        return res.status(200).json(response);
    }

    async dislike(req: Request, res: Response) {

        if (!req.user) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        const job_id = req.params.jobId;

        const user_id = req.user.user_id;

        const response = await service.dislike(
            job_id,
            user_id,
        );

        return res.status(200).json(response);
    }

}

export default new JobReactionController();