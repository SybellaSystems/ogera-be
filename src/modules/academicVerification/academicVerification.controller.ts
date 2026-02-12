import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ResponseFormat } from '@/exception/responseFormat';
import { DB } from '@/database';
import {
  uploadAcademicDocService,
  reuploadAcademicDocService,
  reviewAcademicDocService,
  getAcademicVerificationByIdService,
  getAcademicVerificationByUserIdService,
  getAllAcademicVerificationsService,
  getPendingAcademicVerificationsService,
} from './academicVerification.service';
import { getFileUrl, getLocalFile } from '@/utils/storage.service';
import * as path from 'path';

const response = new ResponseFormat();

// -------------------- UPLOAD ACADEMIC DOCUMENT (STUDENT) --------------------
export const uploadAcademicDoc = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user?.user_id;
    const file = req.file;

    if (!userId) {
      response.errorResponse(
        res,
        StatusCodes.UNAUTHORIZED,
        false,
        'User not authenticated'
      );
      return;
    }

    if (!file) {
      response.errorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        false,
        'Document file is required'
      );
      return;
    }

    const result = await uploadAcademicDocService(userId, file);

    response.response(
      res,
      true,
      StatusCodes.CREATED,
      result,
      'Academic document uploaded successfully. Status: pending'
    );
  } catch (error: any) {
    response.errorResponse(
      res,
      error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      error.message
    );
  }
};

  // -------------------- DOWNLOAD / VIEW DOCUMENT --------------------
  export const getAcademicVerificationDocument = async (req: any, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.user_id;
      const role = req.user?.role;

    console.log(`[VIEW_DOC] Request for doc ID: ${id}, User: ${userId}, Role: ${role}`);

    const verification = await getAcademicVerificationByIdService(id);
    console.log(`[VIEW_DOC] Verification found. Storage type: ${verification.storage_type}, Path: ${verification.document_path}`);

    // Students can only access their own document
    if (role === 'student' && verification.user_id !== userId) {
      response.errorResponse(
        res,
        StatusCodes.FORBIDDEN,
        false,
        'You can only view your own academic verification document'
      );
      return;
    }

    const { storage_type, document_path } = verification as any;

    if (storage_type === 's3') {
      // Return presigned URL so frontend can open it directly
      const url = await getFileUrl(document_path, 's3');
      console.log(`[VIEW_DOC] S3 URL generated: ${url}`);
      res.status(StatusCodes.OK).json({ success: true, url });
      return;
    }

    // Local storage: stream the file as binary
    console.log(`[VIEW_DOC] Attempting to fetch local file: ${document_path}`);
    const fileBuffer = getLocalFile(document_path);
    if (!fileBuffer) {
      console.error(`[VIEW_DOC] File buffer is null for path: ${document_path}`);
      response.errorResponse(
        res,
        StatusCodes.NOT_FOUND,
        false,
        'Document file not found on server'
      );
      return;
    }

    // Determine content type from extension (basic mapping)
    const ext = path.extname(document_path || '').toLowerCase();
    const mimeMap: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    const contentType = mimeMap[ext] || 'application/octet-stream';
    console.log(`[VIEW_DOC] Sending file with content type: ${contentType}, size: ${fileBuffer.length} bytes`);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline');
    res.status(StatusCodes.OK).send(fileBuffer);
  } catch (error: any) {
    console.error(`[VIEW_DOC] Error:`, error);
    response.errorResponse(
      res,
      error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      error.message
    );
  }
};

// -------------------- RE-UPLOAD ACADEMIC DOCUMENT (STUDENT - IF REJECTED) --------------------
export const reuploadAcademicDoc = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user?.user_id;
    const { id } = req.params;
    const file = req.file;

    if (!userId) {
      response.errorResponse(
        res,
        StatusCodes.UNAUTHORIZED,
        false,
        'User not authenticated'
      );
      return;
    }

    if (!file) {
      response.errorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        false,
        'Document file is required'
      );
      return;
    }

    const result = await reuploadAcademicDocService(id, userId, file);

    response.response(
      res,
      true,
      StatusCodes.OK,
      result,
      'Academic document re-uploaded successfully. Status: pending'
    );
  } catch (error: any) {
    response.errorResponse(
      res,
      error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      error.message
    );
  }
};

// -------------------- REVIEW ACADEMIC DOCUMENT (ADMIN ONLY) --------------------
export const reviewAcademicDoc = async (req: any, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.user_id;
    const { id } = req.params;
    const { status, rejection_reason } = req.body;

    if (!adminId) {
      response.errorResponse(
        res,
        StatusCodes.UNAUTHORIZED,
        false,
        'User not authenticated'
      );
      return;
    }

    // Check if user has admin roleType (not just roleName)
    const user = await DB.Users.findOne({
      where: { user_id: adminId },
      include: [{
        model: DB.Roles,
        as: 'role',
        attributes: ['roleName', 'roleType'],
      }],
    }) as any;

    if (!user || !user.role) {
      response.errorResponse(
        res,
        StatusCodes.FORBIDDEN,
        false,
        'User role not found'
      );
      return;
    }

    // Check if user has admin or superAdmin roleType
    const roleType = user.role.roleType;
    if (roleType !== 'admin' && roleType !== 'superAdmin') {
      response.errorResponse(
        res,
        StatusCodes.FORBIDDEN,
        false,
        'Only admin can review academic verifications'
      );
      return;
    }

    if (!status || (status !== 'accepted' && status !== 'rejected')) {
      response.errorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        false,
        "Status must be either 'accepted' or 'rejected'"
      );
      return;
    }

    const result = await reviewAcademicDocService(id, { status, rejection_reason }, adminId);

    response.response(
      res,
      true,
      StatusCodes.OK,
      result,
      `Academic verification ${status} successfully`
    );
  } catch (error: any) {
    response.errorResponse(
      res,
      error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      error.message
    );
  }
};

// -------------------- GET ACADEMIC VERIFICATION BY ID --------------------
export const getAcademicVerificationById = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.user_id;
    const role = req.user?.role;

    const result = await getAcademicVerificationByIdService(id);

    // Students can only view their own verification
    if (role === 'student' && result.user_id !== userId) {
      response.errorResponse(
        res,
        StatusCodes.FORBIDDEN,
        false,
        'You can only view your own academic verification'
      );
      return;
    }

    response.response(
      res,
      true,
      StatusCodes.OK,
      result,
      'Academic verification retrieved successfully'
    );
  } catch (error: any) {
    response.errorResponse(
      res,
      error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      error.message
    );
  }
};

// -------------------- GET ACADEMIC VERIFICATION BY USER ID --------------------
export const getAcademicVerificationByUserId = async (req: any, res: Response): Promise<void> => {
  try {
    const { user_id } = req.params;
    const userId = req.user?.user_id;
    const role = req.user?.role;

    // Students can only view their own verification
    if (role === 'student' && user_id !== userId) {
      response.errorResponse(
        res,
        StatusCodes.FORBIDDEN,
        false,
        'You can only view your own academic verification'
      );
      return;
    }

    const result = await getAcademicVerificationByUserIdService(user_id);

    response.response(
      res,
      true,
      StatusCodes.OK,
      result,
      'Academic verification retrieved successfully'
    );
  } catch (error: any) {
    response.errorResponse(
      res,
      error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      error.message
    );
  }
};

// -------------------- GET MY ACADEMIC VERIFICATION (STUDENT) --------------------
export const getMyAcademicVerification = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      response.errorResponse(
        res,
        StatusCodes.UNAUTHORIZED,
        false,
        'User not authenticated'
      );
      return;
    }

    const result = await getAcademicVerificationByUserIdService(userId);

    response.response(
      res,
      true,
      StatusCodes.OK,
      result,
      'Academic verification retrieved successfully'
    );
  } catch (error: any) {
    response.errorResponse(
      res,
      error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      error.message
    );
  }
};

// -------------------- GET ALL ACADEMIC VERIFICATIONS (ADMIN ONLY) --------------------
export const getAllAcademicVerifications = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user?.user_id;
    const roleName = req.user?.role;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as 'pending' | 'accepted' | 'rejected' | undefined;

    // Check if user has admin roleType (not just roleName)
    const user = await DB.Users.findOne({
      where: { user_id: userId },
      include: [{
        model: DB.Roles,
        as: 'role',
        attributes: ['roleName', 'roleType'],
      }],
    }) as any;

    if (!user || !user.role) {
      response.errorResponse(
        res,
        StatusCodes.FORBIDDEN,
        false,
        'User role not found'
      );
      return;
    }

    const roleType = user.role.roleType;

    // If student, return only their own verification (filtered by status if provided)
    if (roleName === 'student' || roleType === 'student') {
      try {
        const myVerification = await getAcademicVerificationByUserIdService(userId);
        
        // Filter by status if provided and matches
        if (status && myVerification.status !== status) {
          // If status filter doesn't match, return empty result
          res.status(StatusCodes.OK).json({
            status: StatusCodes.OK,
            message: 'Academic verification retrieved successfully',
            success: true,
            pagination: {
              total: 0,
              page,
              limit,
              totalPages: 0,
            },
            data: [],
          });
          return;
        }

        // Return student's own verification
        res.status(StatusCodes.OK).json({
          status: StatusCodes.OK,
          message: 'Academic verification retrieved successfully',
          success: true,
          pagination: {
            total: 1,
            page,
            limit,
            totalPages: 1,
          },
          data: [myVerification],
        });
        return;
      } catch (error: any) {
        // If no verification found, return empty result
        if (error.status === StatusCodes.NOT_FOUND) {
          res.status(StatusCodes.OK).json({
            status: StatusCodes.OK,
            message: 'Academic verification retrieved successfully',
            success: true,
            pagination: {
              total: 0,
              page,
              limit,
              totalPages: 0,
            },
            data: [],
          });
          return;
        }
        throw error;
      }
    }

    // Check if user has admin or superAdmin roleType
    if (roleType !== 'admin' && roleType !== 'superAdmin') {
      response.errorResponse(
        res,
        StatusCodes.FORBIDDEN,
        false,
        'Only admin can view all academic verifications'
      );
      return;
    }

    const result = await getAllAcademicVerificationsService({ page, limit, status });

    res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: 'Academic verifications retrieved successfully',
      success: true,
      pagination: result.pagination,
      data: result.data,
    });
  } catch (error: any) {
    response.errorResponse(
      res,
      error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      error.message
    );
  }
};

// -------------------- GET PENDING ACADEMIC VERIFICATIONS (ADMIN ONLY) --------------------
export const getPendingAcademicVerifications = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user?.user_id;
    const roleName = req.user?.role;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Check if user has admin roleType (not just roleName)
    const user = await DB.Users.findOne({
      where: { user_id: userId },
      include: [{
        model: DB.Roles,
        as: 'role',
        attributes: ['roleName', 'roleType'],
      }],
    }) as any;

    if (!user || !user.role) {
      response.errorResponse(
        res,
        StatusCodes.FORBIDDEN,
        false,
        'User role not found'
      );
      return;
    }

    // Check if user has admin or superAdmin roleType
    const roleType = user.role.roleType;
    if (roleType !== 'admin' && roleType !== 'superAdmin') {
      response.errorResponse(
        res,
        StatusCodes.FORBIDDEN,
        false,
        'Only admin can view pending academic verifications'
      );
      return;
    }

    const result = await getPendingAcademicVerificationsService({ page, limit });

    res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: 'Pending academic verifications retrieved successfully',
      success: true,
      pagination: result.pagination,
      data: result.data,
    });
  } catch (error: any) {
    response.errorResponse(
      res,
      error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      error.message
    );
  }
};

