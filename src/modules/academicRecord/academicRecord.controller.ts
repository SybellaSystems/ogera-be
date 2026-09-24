import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ResponseFormat } from '@/exception/responseFormat';
import { getFileUrl, getLocalFile } from '@/utils/storage.service';
import * as path from 'path';
import {
    addAcademicRecordService,
    deleteAcademicRecordService,
    getAllAcademicRecordsService,
    getAcademicRecordByIdService,
    getAcademicRecordsByUserService,
    getMyAcademicRecordsService,
} from './academicRecord.service';

const response = new ResponseFormat();

export const addAcademicRecord = async (
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

        const {
            academic_profile,
            class_name,
            board,
            degree,
            university,
            percentage,
            grade,
        } = req.body;
        if (!academic_profile || percentage == null) {
            response.errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                false,
                'academic_profile and percentage are required',
            );
            return;
        }

        const created = await addAcademicRecordService(user_id, {
            academic_profile,
            class_name,
            board,
            degree,
            university,
            percentage: Number(percentage),
            grade,
            file: (req as any).file,
        });

        response.response(
            res,
            true,
            StatusCodes.CREATED,
            created,
            'Academic record added successfully',
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

export const getMyAcademicRecords = async (
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

        const records = await getMyAcademicRecordsService(user_id);
        response.response(
            res,
            true,
            StatusCodes.OK,
            records,
            'Academic records fetched successfully',
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

export const getAcademicRecordsByUser = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { user_id } = req.params;
        const records = await getAcademicRecordsByUserService(
            user_id as string,
        );
        response.response(
            res,
            true,
            StatusCodes.OK,
            records,
            'Academic records fetched successfully',
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

export const getAllAcademicRecords = async (
    _req: Request,
    res: Response,
): Promise<void> => {
    try {
        const records = await getAllAcademicRecordsService();
        response.response(
            res,
            true,
            StatusCodes.OK,
            records,
            'All academic records fetched successfully',
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

export const deleteAcademicRecord = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        const role = req.user?.role;
        const { id } = req.params;

        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        const result = await deleteAcademicRecordService(id as string, {
            user_id,
            role,
        });

        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            'Academic record deleted successfully',
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

export const viewAcademicRecordCertificate = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user_id = req.user?.user_id;
        const role = String(req.user?.role || '').toLowerCase();
        const { id } = req.params;

        if (!user_id) {
            response.errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                false,
                'User not authenticated',
            );
            return;
        }

        const record = (await getAcademicRecordByIdService(
            id as string,
        )) as any;
        if (role !== 'superadmin' && record.user_id !== user_id) {
            response.errorResponse(
                res,
                StatusCodes.FORBIDDEN,
                false,
                'You can only view your own certificate',
            );
            return;
        }

        const filePath = record.certificate_path || record.certificate;
        const storageType = record.storage_type || 'local';
        if (!filePath) {
            response.errorResponse(
                res,
                StatusCodes.NOT_FOUND,
                false,
                'Certificate file not found',
            );
            return;
        }

        if (storageType === 's3') {
            const url = await getFileUrl(filePath, 's3');
            res.status(StatusCodes.OK).json({ success: true, url });
            return;
        }

        const fileBuffer = getLocalFile(filePath);
        if (!fileBuffer) {
            response.errorResponse(
                res,
                StatusCodes.NOT_FOUND,
                false,
                'Certificate file not found on server',
            );
            return;
        }

        const ext = path.extname(filePath || '').toLowerCase();
        const mimeMap: Record<string, string> = {
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.doc': 'application/msword',
            '.docx':
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        };
        const contentType = mimeMap[ext] || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', 'inline');
        res.status(StatusCodes.OK).send(fileBuffer);
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message,
        );
    }
};
