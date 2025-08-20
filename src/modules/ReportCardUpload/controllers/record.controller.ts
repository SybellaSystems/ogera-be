import { Request, Response } from "express";
import { AppError, asyncHandler } from "../../../middlewares/errorHandler.js";

export const uploadReportCard = asyncHandler(async(req: Request, res: Response): Promise<void> => {
    const {
        body: { student_id, document_url, extracted_grades },
        user,
        params: { studentID }
    } = req;

    if (!user) {
        throw new AppError('User not authenticated.', 401, true);
    }
    const { userID, role } = user;

    if (!student_id || !document_url || !extracted_grades) {
        throw new AppError('Please fill all required fields.', 400, true, 'EMPTY_INPUT_FIELD');
    }
    if (role === 'student' && userID !== studentID) {
        throw new AppError('Studen can only upload their own result.', 403, true);
    }
});