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
exports.getAllEmployers = exports.getAllStudents = exports.getAllUsers = void 0;
const http_status_codes_1 = require("http-status-codes");
const responseFormat_1 = require("../../exception/responseFormat");
const messages_1 = require("../../utils/messages");
const auth_service_1 = require("../../modules/auth/auth.service");
const response = new responseFormat_1.ResponseFormat();
// Get All Users
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const type = req.query.type;
        // Get current user's role to determine if admin roles should be excluded
        const currentUserRole = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        const { data, pagination, counts } = yield (0, auth_service_1.getAllUsersService)({ page, limit, type }, currentUserRole);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            status: http_status_codes_1.StatusCodes.OK,
            message: messages_1.Messages.User.FETCH_USERS,
            success: true,
            pagination,
            data,
            counts,
        });
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getAllUsers = getAllUsers;
// Get All Students
const getAllStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { data, pagination } = yield (0, auth_service_1.getAllUsersService)({ page, limit, type: 'Student' }, (_a = req.user) === null || _a === void 0 ? void 0 : _a.role);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            status: http_status_codes_1.StatusCodes.OK,
            message: messages_1.Messages.User.FETCH_STUDENTS,
            success: true,
            pagination,
            data,
        });
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getAllStudents = getAllStudents;
// Get All Employers
const getAllEmployers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { data, pagination } = yield (0, auth_service_1.getAllUsersService)({ page, limit, type: 'Employer' }, (_a = req.user) === null || _a === void 0 ? void 0 : _a.role);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            status: http_status_codes_1.StatusCodes.OK,
            message: messages_1.Messages.User.FETCH_EMPLOYERS,
            success: true,
            pagination,
            data,
        });
    }
    catch (error) {
        response.errorResponse(res, error.status || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, false, error.message);
    }
});
exports.getAllEmployers = getAllEmployers;
