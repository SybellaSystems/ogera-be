import repo from './academicVerification.repo';
import { CustomError } from '@/utils/custom-error';
import { StatusCodes } from 'http-status-codes';
import { saveFile, deleteFile } from '@/utils/storage.service';
import { AcademicVerificationStatus, ReviewAcademicVerificationData } from '@/interfaces/academicVerification.interfaces';
import { PaginationQuery } from '@/interfaces/pagination.interfaces';
import { DB } from '@/database';
import { checkAndAwardPioneerBadge } from '@/modules/badge/badge.service';

// -------------------- UPLOAD ACADEMIC DOCUMENT --------------------
export const uploadAcademicDocService = async (
  user_id: string,
  file: Express.Multer.File
) => {
  if (!file) {
    throw new CustomError('Document file is required', StatusCodes.BAD_REQUEST);
  }

  // Allow multiple document uploads per student

  // Save file to storage (local or S3 based on .env)
  const { path: document_path, storageType } = await saveFile(file, 'academic-proofs');

  // Find a user with verifyDocAdmin role to assign the verification
  let assignedAdminId: string | null = null;
  
  // First, find the verifyDocAdmin role
  const verifyDocAdminRole = await DB.Roles.findOne({
    where: { roleName: 'verifyDocAdmin' },
  });

  if (verifyDocAdminRole) {
    // Find all users with verifyDocAdmin role
    const verifyDocAdminUsers = await DB.Users.findAll({
      where: { role_id: verifyDocAdminRole.id },
      attributes: ['user_id'],
      order: [['created_at', 'ASC']],
    });

    if (verifyDocAdminUsers && verifyDocAdminUsers.length > 0) {
      // Get count of pending verifications assigned to each admin for load balancing
      // For now, use round-robin: assign to the admin with the least pending verifications
      let selectedAdmin = verifyDocAdminUsers[0]; // Default to first admin
      let minPendingCount = Infinity;

      for (const admin of verifyDocAdminUsers) {
        // Count pending verifications assigned to this admin
        const pendingCount = await DB.AcademicVerifications.count({
          where: {
            assigned_to: admin.user_id,
            status: 'pending',
          },
        });

        // Select admin with least pending verifications
        if (pendingCount < minPendingCount) {
          minPendingCount = pendingCount;
          selectedAdmin = admin;
        }
      }

      assignedAdminId = selectedAdmin.user_id;
      console.log(`Verification assigned to verifyDocAdmin user: ${assignedAdminId} (${minPendingCount} pending verifications)`);
    }
  }

  // If no verifyDocAdmin user found, the verification will be created without assignment
  // This allows the system to work even if no admin is set up yet
  if (!assignedAdminId) {
    console.warn('No verifyDocAdmin user found. Verification created without assignment.');
  }

  // Create academic verification record
  const academicVerification = await repo.create({
    user_id,
    document_path,
    storage_type: storageType as 'local' | 's3',
    status: 'pending',
    assigned_to: assignedAdminId,
  });

  return academicVerification;
};

// -------------------- RE-UPLOAD ACADEMIC DOCUMENT (IF REJECTED) --------------------
export const reuploadAcademicDocService = async (
  id: string,
  user_id: string,
  file: Express.Multer.File
) => {
  if (!file) {
    throw new CustomError('Document file is required', StatusCodes.BAD_REQUEST);
  }

  // Find the academic verification
  const existing = await repo.findByUserIdAndId(user_id, id);
  
  if (!existing) {
    throw new CustomError('Academic verification not found', StatusCodes.NOT_FOUND);
  }

  // Only allow re-upload if status is rejected
  if (existing.status !== 'rejected' && existing.status !== 'resubmission_required') {
    throw new CustomError(
      `Cannot re-upload. Current status is: ${existing.status}. Only rejected or resubmission-required verifications can be re-uploaded.`,
      StatusCodes.BAD_REQUEST
    );
  }

  // Delete old file
  try {
    await deleteFile(existing.document_path, existing.storage_type);
  } catch (error) {
    // Log error but continue (file might not exist)
    console.error('Error deleting old file:', error);
  }

  // Save new file
  const { path: document_path, storageType } = await saveFile(file, 'academic-proofs');

  // Find a user with verifyDocAdmin role to assign the verification (if not already assigned)
  let assignedAdminId: string | null = null;
  
  const verifyDocAdminRole = await DB.Roles.findOne({
    where: { roleName: 'verifyDocAdmin' },
  });

  if (verifyDocAdminRole) {
    // Find all users with verifyDocAdmin role for load balancing
    const verifyDocAdminUsers = await DB.Users.findAll({
      where: { role_id: verifyDocAdminRole.id },
      attributes: ['user_id'],
      order: [['created_at', 'ASC']],
    });

    if (verifyDocAdminUsers && verifyDocAdminUsers.length > 0) {
      // Assign to admin with least pending verifications (load balancing)
      let selectedAdmin = verifyDocAdminUsers[0];
      let minPendingCount = Infinity;

      for (const admin of verifyDocAdminUsers) {
        const pendingCount = await DB.AcademicVerifications.count({
          where: {
            assigned_to: admin.user_id,
            status: 'pending',
          },
        });

        if (pendingCount < minPendingCount) {
          minPendingCount = pendingCount;
          selectedAdmin = admin;
        }
      }

      assignedAdminId = selectedAdmin.user_id;
    }
  }

  // Update academic verification
  await repo.update(id, {
    document_path,
    storage_type: storageType as 'local' | 's3',
    status: 'pending',
    rejection_reason: null,
    reviewed_by: null,
    reviewed_at: null,
    assigned_to: assignedAdminId,
  });

  const updated = await repo.findById(id);
  if (!updated) {
    throw new CustomError('Failed to retrieve updated verification', StatusCodes.INTERNAL_SERVER_ERROR);
  }

  return updated;
};

// -------------------- REVIEW ACADEMIC DOCUMENT (ADMIN ONLY) --------------------
export const reviewAcademicDocService = async (
  id: string,
  data: ReviewAcademicVerificationData,
  admin_id: string
) => {
  const { status, rejection_reason } = data;

  // Validate status
  if (status !== 'accepted' && status !== 'rejected' && status !== 'resubmission_required') {
    throw new CustomError(
      "Status must be either 'accepted', 'rejected', or 'resubmission_required'",
      StatusCodes.BAD_REQUEST
    );
  }

  // If rejected or resubmission_required, reason is required
  if ((status === 'rejected' || status === 'resubmission_required') && !rejection_reason) {
    throw new CustomError(
      'Reason is required when status is rejected or resubmission_required',
      StatusCodes.BAD_REQUEST
    );
  }

  // Find the academic verification
  const academicVerification = await repo.findById(id);
  
  if (!academicVerification) {
    throw new CustomError('Academic verification not found', StatusCodes.NOT_FOUND);
  }

  // Update academic verification
  await repo.update(id, {
    status,
    rejection_reason: status === 'rejected' || status === 'resubmission_required' ? rejection_reason : null,
    reviewed_by: admin_id,
    reviewed_at: new Date(),
  });

  const updated = await repo.findById(id);
  if (!updated) {
    throw new CustomError('Failed to retrieve updated verification', StatusCodes.INTERNAL_SERVER_ERROR);
  }

  // Log activity: APPROVE or REJECT
  try {
    await DB.ActivityLogs.create({
      user_id: admin_id || null,
      action: status === 'accepted' ? 'APPROVE' : status === 'rejected' ? 'REJECT' : 'RESUBMISSION_REQUIRED',
      entity_type: 'Verification',
      entity_id: id,
      description: `Verification ${
        status === 'accepted'
          ? 'approved'
          : status === 'rejected'
          ? 'rejected'
          : 'marked as resubmission required'
      } for user ${updated.user_id}`,
    } as any);
  } catch (e) {
    // ignore logging errors
  }

  if (status === 'accepted') {
    checkAndAwardPioneerBadge(updated.user_id).catch(() => {});
  }

  return updated;
};

// -------------------- GET ACADEMIC VERIFICATION BY ID --------------------
export const getAcademicVerificationByIdService = async (id: string) => {
  const academicVerification = await repo.findById(id);
  
  if (!academicVerification) {
    throw new CustomError('Academic verification not found', StatusCodes.NOT_FOUND);
  }

  return academicVerification;
};

// -------------------- GET ACADEMIC VERIFICATION BY USER ID --------------------
export const getAcademicVerificationByUserIdService = async (user_id: string) => {
  const verifications = await repo.findAllByUserId(user_id);
  return verifications;
};

// -------------------- GET ALL ACADEMIC VERIFICATIONS (WITH FILTER) --------------------
export const getAllAcademicVerificationsService = async ({
  page,
  limit,
  status,
}: PaginationQuery & { status?: AcademicVerificationStatus }) => {
  const { rows, count } = await repo.findAll({ page, limit, status });

  return {
    data: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
};

// -------------------- GET PENDING ACADEMIC VERIFICATIONS --------------------
export const getPendingAcademicVerificationsService = async ({
  page,
  limit,
}: PaginationQuery) => {
  const { rows, count } = await repo.findPending({ page, limit });

  return {
    data: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
};

