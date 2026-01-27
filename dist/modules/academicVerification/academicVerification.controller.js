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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPendingAcademicVerifications = exports.getAllAcademicVerifications = exports.getMyAcademicVerification = exports.getAcademicVerificationByUserId = exports.getAcademicVerificationById = exports.reviewAcademicDoc = exports.reuploadAcademicDoc = exports.uploadAcademicDoc = void 0;
const http_status_codes_1 = require("http-status-codes");
const responseFormat_1 = require("../../exception/responseFormat");
const database_1 = require("../../database");
const academicVerification_service_1 = require("./academicVerification.service");
const response = new responseFormat_1.ResponseFormat();
// -------------------- UPLOAD ACADEMIC DOCUMENT (STUDENT) --------------------
const uploadAcademicDoc = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        const file = req.file;
        if (!userId) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        if (!file) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.BAD_REQUEST, false, 'Document file is required');
            return;
        }
        const result = yield (0, academicVerification_service_1.uploadAcademicDocService)(userId, file);
        response.response(res, true, http_status_codes_1.StatusCodes.CREATED, result, 'Academic document uploaded successfully. Status: pending');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.uploadAcademicDoc = uploadAcademicDoc;
// -------------------- RE-UPLOAD ACADEMIC DOCUMENT (STUDENT - IF REJECTED) --------------------
const reuploadAcademicDoc = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        const { id } = req.params;
        const file = req.file;
        if (!userId) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        if (!file) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.BAD_REQUEST, false, 'Document file is required');
            return;
        }
        const result = yield (0, academicVerification_service_1.reuploadAcademicDocService)(id, userId, file);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, result, 'Academic document re-uploaded successfully. Status: pending');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.reuploadAcademicDoc = reuploadAcademicDoc;
// -------------------- REVIEW ACADEMIC DOCUMENT (ADMIN ONLY) --------------------
const reviewAcademicDoc = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        const { id } = req.params;
        const { status, rejection_reason } = req.body;
        if (!adminId) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        // Check if user has admin roleType (not just roleName)
        const user = yield database_1.DB.Users.findOne({
            where: { user_id: adminId },
            include: [{
                    model: database_1.DB.Roles,
                    as: 'role',
                    attributes: ['roleName', 'roleType'],
                }],
        });
        if (!user || !user.role) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.FORBIDDEN, false, 'User role not found');
            return;
        }
        // Check if user has admin or superAdmin roleType
        const roleType = user.role.roleType;
        if (roleType !== 'admin' && roleType !== 'superAdmin') {
            response.errorResponse(res, http_status_codes_1.StatusCodes.FORBIDDEN, false, 'Only admin can review academic verifications');
            return;
        }
        if (!status || (status !== 'accepted' && status !== 'rejected')) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.BAD_REQUEST, false, "Status must be either 'accepted' or 'rejected'");
            return;
        }
        const result = yield (0, academicVerification_service_1.reviewAcademicDocService)(id, { status, rejection_reason }, adminId);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, result, `Academic verification ${status} successfully`);
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.reviewAcademicDoc = reviewAcademicDoc;
// -------------------- GET ACADEMIC VERIFICATION BY ID --------------------
const getAcademicVerificationById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        const role = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        const result = yield (0, academicVerification_service_1.getAcademicVerificationByIdService)(id);
        // Students can only view their own verification
        if (role === 'student' && result.user_id !== userId) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.FORBIDDEN, false, 'You can only view your own academic verification');
            return;
        }
        response.response(res, true, http_status_codes_1.StatusCodes.OK, result, 'Academic verification retrieved successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getAcademicVerificationById = getAcademicVerificationById;
// -------------------- GET ACADEMIC VERIFICATION BY USER ID --------------------
const getAcademicVerificationByUserId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { user_id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        const role = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        // Students can only view their own verification
        if (role === 'student' && user_id !== userId) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.FORBIDDEN, false, 'You can only view your own academic verification');
            return;
        }
        const result = yield (0, academicVerification_service_1.getAcademicVerificationByUserIdService)(user_id);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, result, 'Academic verification retrieved successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getAcademicVerificationByUserId = getAcademicVerificationByUserId;
// -------------------- GET MY ACADEMIC VERIFICATION (STUDENT) --------------------
const getMyAcademicVerification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!userId) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'User not authenticated');
            return;
        }
        const result = yield (0, academicVerification_service_1.getAcademicVerificationByUserIdService)(userId);
        response.response(res, true, http_status_codes_1.StatusCodes.OK, result, 'Academic verification retrieved successfully');
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getMyAcademicVerification = getMyAcademicVerification;
// -------------------- GET ALL ACADEMIC VERIFICATIONS (ADMIN ONLY) --------------------
const getAllAcademicVerifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        const roleName = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        // Check if user has admin roleType (not just roleName)
        const user = yield database_1.DB.Users.findOne({
            where: { user_id: userId },
            include: [{
                    model: database_1.DB.Roles,
                    as: 'role',
                    attributes: ['roleName', 'roleType'],
                }],
        });
        if (!user || !user.role) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.FORBIDDEN, false, 'User role not found');
            return;
        }
        const roleType = user.role.roleType;
        // If student, return only their own verification (filtered by status if provided)
        if (roleName === 'student' || roleType === 'student') {
            try {
                const myVerification = yield (0, academicVerification_service_1.getAcademicVerificationByUserIdService)(userId);
                // Filter by status if provided and matches
                if (status && myVerification.status !== status) {
                    // If status filter doesn't match, return empty result
                    res.status(http_status_codes_1.StatusCodes.OK).json({
                        status: http_status_codes_1.StatusCodes.OK,
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
                res.status(http_status_codes_1.StatusCodes.OK).json({
                    status: http_status_codes_1.StatusCodes.OK,
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
            }
            catch (error) {
                // If no verification found, return empty result
                if (error.status === http_status_codes_1.StatusCodes.NOT_FOUND) {
                    res.status(http_status_codes_1.StatusCodes.OK).json({
                        status: http_status_codes_1.StatusCodes.OK,
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
            response.errorResponse(res, http_status_codes_1.StatusCodes.FORBIDDEN, false, 'Only admin can view all academic verifications');
            return;
        }
        const result = yield (0, academicVerification_service_1.getAllAcademicVerificationsService)({ page, limit, status });
        res.status(http_status_codes_1.StatusCodes.OK).json({
            status: http_status_codes_1.StatusCodes.OK,
            message: 'Academic verifications retrieved successfully',
            success: true,
            pagination: result.pagination,
            data: result.data,
        });
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getAllAcademicVerifications = getAllAcademicVerifications;
// -------------------- GET PENDING ACADEMIC VERIFICATIONS (ADMIN ONLY) --------------------
const getPendingAcademicVerifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        const roleName = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        // Check if user has admin roleType (not just roleName)
        const user = yield database_1.DB.Users.findOne({
            where: { user_id: userId },
            include: [{
                    model: database_1.DB.Roles,
                    as: 'role',
                    attributes: ['roleName', 'roleType'],
                }],
        });
        if (!user || !user.role) {
            response.errorResponse(res, http_status_codes_1.StatusCodes.FORBIDDEN, false, 'User role not found');
            return;
        }
        // Check if user has admin or superAdmin roleType
        const roleType = user.role.roleType;
        if (roleType !== 'admin' && roleType !== 'superAdmin') {
            response.errorResponse(res, http_status_codes_1.StatusCodes.FORBIDDEN, false, 'Only admin can view pending academic verifications');
            return;
        }
        const result = yield (0, academicVerification_service_1.getPendingAcademicVerificationsService)({ page, limit });
        res.status(http_status_codes_1.StatusCodes.OK).json({
            status: http_status_codes_1.StatusCodes.OK,
            message: 'Pending academic verifications retrieved successfully',
            success: true,
            pagination: result.pagination,
            data: result.data,
        });
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getPendingAcademicVerifications = getPendingAcademicVerifications;
