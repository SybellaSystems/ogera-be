"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPendingAcademicVerificationsService = exports.getAllAcademicVerificationsService = exports.getAcademicVerificationByUserIdService = exports.getAcademicVerificationByIdService = exports.reviewAcademicDocService = exports.reuploadAcademicDocService = exports.uploadAcademicDocService = void 0;
const academicVerification_repo_1 = __importDefault(require("./academicVerification.repo"));
const custom_error_1 = require("../../utils/custom-error");
const http_status_codes_1 = require("http-status-codes");
const storage_service_1 = require("../../utils/storage.service");
const database_1 = require("../../database");
// -------------------- UPLOAD ACADEMIC DOCUMENT --------------------
const uploadAcademicDocService = (user_id, file) => __awaiter(void 0, void 0, void 0, function* () {
    if (!file) {
        throw new custom_error_1.CustomError('Document file is required', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    // Check if user already has an academic verification
    const existing = yield academicVerification_repo_1.default.findByUserId(user_id);
    if (existing) {
        // If existing is rejected, allow re-upload
        if (existing.status === 'rejected') {
            throw new custom_error_1.CustomError('You have a rejected verification. Please use the re-upload endpoint.', http_status_codes_1.StatusCodes.BAD_REQUEST);
        }
        // If pending or accepted, don't allow new upload
        throw new custom_error_1.CustomError(`You already have an academic verification with status: ${existing.status}`, http_status_codes_1.StatusCodes.CONFLICT);
    }
    // Save file to storage (local or S3 based on .env)
    const { path: document_path, storageType } = yield (0, storage_service_1.saveFile)(file, 'academic-proofs');
    // Find a user with verifyDocAdmin role to assign the verification
    let assignedAdminId = null;
    // First, find the verifyDocAdmin role
    const verifyDocAdminRole = yield database_1.DB.Roles.findOne({
        where: { roleName: 'verifyDocAdmin' },
    });
    if (verifyDocAdminRole) {
        // Find all users with verifyDocAdmin role
        const verifyDocAdminUsers = yield database_1.DB.Users.findAll({
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
                const pendingCount = yield database_1.DB.AcademicVerifications.count({
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
    const academicVerification = yield academicVerification_repo_1.default.create({
        user_id,
        document_path,
        storage_type: storageType,
        status: 'pending',
        assigned_to: assignedAdminId,
    });
    return academicVerification;
});
exports.uploadAcademicDocService = uploadAcademicDocService;
// -------------------- RE-UPLOAD ACADEMIC DOCUMENT (IF REJECTED) --------------------
const reuploadAcademicDocService = (id, user_id, file) => __awaiter(void 0, void 0, void 0, function* () {
    if (!file) {
        throw new custom_error_1.CustomError('Document file is required', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    // Find the academic verification
    const existing = yield academicVerification_repo_1.default.findByUserIdAndId(user_id, id);
    if (!existing) {
        throw new custom_error_1.CustomError('Academic verification not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    // Only allow re-upload if status is rejected
    if (existing.status !== 'rejected') {
        throw new custom_error_1.CustomError(`Cannot re-upload. Current status is: ${existing.status}. Only rejected verifications can be re-uploaded.`, http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    // Delete old file
    try {
        yield (0, storage_service_1.deleteFile)(existing.document_path, existing.storage_type);
    }
    catch (error) {
        // Log error but continue (file might not exist)
        console.error('Error deleting old file:', error);
    }
    // Save new file
    const { path: document_path, storageType } = yield (0, storage_service_1.saveFile)(file, 'academic-proofs');
    // Find a user with verifyDocAdmin role to assign the verification (if not already assigned)
    let assignedAdminId = null;
    const verifyDocAdminRole = yield database_1.DB.Roles.findOne({
        where: { roleName: 'verifyDocAdmin' },
    });
    if (verifyDocAdminRole) {
        // Find all users with verifyDocAdmin role for load balancing
        const verifyDocAdminUsers = yield database_1.DB.Users.findAll({
            where: { role_id: verifyDocAdminRole.id },
            attributes: ['user_id'],
            order: [['created_at', 'ASC']],
        });
        if (verifyDocAdminUsers && verifyDocAdminUsers.length > 0) {
            // Assign to admin with least pending verifications (load balancing)
            let selectedAdmin = verifyDocAdminUsers[0];
            let minPendingCount = Infinity;
            for (const admin of verifyDocAdminUsers) {
                const pendingCount = yield database_1.DB.AcademicVerifications.count({
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
    yield academicVerification_repo_1.default.update(id, {
        document_path,
        storage_type: storageType,
        status: 'pending',
        rejection_reason: null,
        reviewed_by: null,
        reviewed_at: null,
        assigned_to: assignedAdminId,
    });
    const updated = yield academicVerification_repo_1.default.findById(id);
    if (!updated) {
        throw new custom_error_1.CustomError('Failed to retrieve updated verification', http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
    }
    return updated;
});
exports.reuploadAcademicDocService = reuploadAcademicDocService;
// -------------------- REVIEW ACADEMIC DOCUMENT (ADMIN ONLY) --------------------
const reviewAcademicDocService = (id, data, admin_id) => __awaiter(void 0, void 0, void 0, function* () {
    const { status, rejection_reason } = data;
    // Validate status
    if (status !== 'accepted' && status !== 'rejected') {
        throw new custom_error_1.CustomError("Status must be either 'accepted' or 'rejected'", http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    // If rejected, rejection_reason is required
    if (status === 'rejected' && !rejection_reason) {
        throw new custom_error_1.CustomError('Rejection reason is required when status is rejected', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    // Find the academic verification
    const academicVerification = yield academicVerification_repo_1.default.findById(id);
    if (!academicVerification) {
        throw new custom_error_1.CustomError('Academic verification not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    // Update academic verification
    yield academicVerification_repo_1.default.update(id, {
        status,
        rejection_reason: status === 'rejected' ? rejection_reason : null,
        reviewed_by: admin_id,
        reviewed_at: new Date(),
    });
    const updated = yield academicVerification_repo_1.default.findById(id);
    if (!updated) {
        throw new custom_error_1.CustomError('Failed to retrieve updated verification', http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
    }
    // Log activity: APPROVE or REJECT
    try {
        yield database_1.DB.ActivityLogs.create({
            user_id: admin_id || null,
            action: status === 'accepted' ? 'APPROVE' : 'REJECT',
            entity_type: 'Verification',
            entity_id: id,
            description: `Verification ${status === 'accepted' ? 'approved' : 'rejected'} for user ${updated.user_id}`,
        });
    }
    catch (e) {
        // ignore logging errors
    }
    return updated;
});
exports.reviewAcademicDocService = reviewAcademicDocService;
// -------------------- GET ACADEMIC VERIFICATION BY ID --------------------
const getAcademicVerificationByIdService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const academicVerification = yield academicVerification_repo_1.default.findById(id);
    if (!academicVerification) {
        throw new custom_error_1.CustomError('Academic verification not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    return academicVerification;
});
exports.getAcademicVerificationByIdService = getAcademicVerificationByIdService;
// -------------------- GET ACADEMIC VERIFICATION BY USER ID --------------------
const getAcademicVerificationByUserIdService = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const academicVerification = yield academicVerification_repo_1.default.findByUserId(user_id);
    if (!academicVerification) {
        throw new custom_error_1.CustomError('Academic verification not found for this user', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    return academicVerification;
});
exports.getAcademicVerificationByUserIdService = getAcademicVerificationByUserIdService;
// -------------------- GET ALL ACADEMIC VERIFICATIONS (WITH FILTER) --------------------
const getAllAcademicVerificationsService = (_a) => __awaiter(void 0, [_a], void 0, function* ({ page, limit, status, }) {
    const { rows, count } = yield academicVerification_repo_1.default.findAll({ page, limit, status });
    return {
        data: rows,
        pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
        },
    };
});
exports.getAllAcademicVerificationsService = getAllAcademicVerificationsService;
// -------------------- GET PENDING ACADEMIC VERIFICATIONS --------------------
const getPendingAcademicVerificationsService = (_a) => __awaiter(void 0, [_a], void 0, function* ({ page, limit, }) {
    const { rows, count } = yield academicVerification_repo_1.default.findPending({ page, limit });
    return {
        data: rows,
        pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
        },
    };
});
exports.getPendingAcademicVerificationsService = getPendingAcademicVerificationsService;
