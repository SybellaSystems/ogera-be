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
const database_1 = require("../../database");
const repo = {
    // Create new academic verification
    create: (data) => __awaiter(void 0, void 0, void 0, function* () {
        return yield database_1.DB.AcademicVerifications.create(data);
    }),
    // Find academic verification by ID
    findById: (id) => __awaiter(void 0, void 0, void 0, function* () {
        return yield database_1.DB.AcademicVerifications.findOne({
            where: { id },
            include: [
                {
                    model: database_1.DB.Users,
                    as: 'user',
                    attributes: ['user_id', 'full_name', 'email'],
                },
                {
                    model: database_1.DB.Users,
                    as: 'reviewer',
                    attributes: ['user_id', 'full_name', 'email'],
                    required: false,
                },
                {
                    model: database_1.DB.Users,
                    as: 'assignedAdmin',
                    attributes: ['user_id', 'full_name', 'email'],
                    required: false,
                },
            ],
        });
    }),
    // Find academic verification by user_id
    findByUserId: (user_id) => __awaiter(void 0, void 0, void 0, function* () {
        return yield database_1.DB.AcademicVerifications.findOne({
            where: { user_id },
            order: [['created_at', 'DESC']],
            include: [
                {
                    model: database_1.DB.Users,
                    as: 'reviewer',
                    attributes: ['user_id', 'full_name', 'email'],
                    required: false,
                },
                {
                    model: database_1.DB.Users,
                    as: 'assignedAdmin',
                    attributes: ['user_id', 'full_name', 'email'],
                    required: false,
                },
            ],
        });
    }),
    // Find academic verification by user_id and ID (for re-upload validation)
    findByUserIdAndId: (user_id, id) => __awaiter(void 0, void 0, void 0, function* () {
        return yield database_1.DB.AcademicVerifications.findOne({
            where: { user_id, id },
        });
    }),
    // Update academic verification
    update: (id, updates) => __awaiter(void 0, void 0, void 0, function* () {
        yield database_1.DB.AcademicVerifications.update(updates, {
            where: { id },
        });
    }),
    // Find all academic verifications with pagination
    findAll: (_a) => __awaiter(void 0, [_a], void 0, function* ({ page, limit, status }) {
        const where = {};
        if (status) {
            where.status = status;
        }
        return yield database_1.DB.AcademicVerifications.findAndCountAll({
            where,
            offset: (page - 1) * limit,
            limit,
            order: [['created_at', 'DESC']],
            include: [
                {
                    model: database_1.DB.Users,
                    as: 'user',
                    attributes: ['user_id', 'full_name', 'email', 'mobile_number'],
                },
                {
                    model: database_1.DB.Users,
                    as: 'reviewer',
                    attributes: ['user_id', 'full_name', 'email'],
                    required: false,
                },
                {
                    model: database_1.DB.Users,
                    as: 'assignedAdmin',
                    attributes: ['user_id', 'full_name', 'email'],
                    required: false,
                },
            ],
        });
    }),
    // Find pending academic verifications
    findPending: (_a) => __awaiter(void 0, [_a], void 0, function* ({ page, limit }) {
        return yield database_1.DB.AcademicVerifications.findAndCountAll({
            where: { status: 'pending' },
            offset: (page - 1) * limit,
            limit,
            order: [['created_at', 'DESC']],
            include: [
                {
                    model: database_1.DB.Users,
                    as: 'user',
                    attributes: ['user_id', 'full_name', 'email', 'mobile_number'],
                },
                {
                    model: database_1.DB.Users,
                    as: 'assignedAdmin',
                    attributes: ['user_id', 'full_name', 'email'],
                    required: false,
                },
            ],
        });
    }),
};
exports.default = repo;
