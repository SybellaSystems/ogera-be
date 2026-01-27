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
const sequelize_1 = require("sequelize");
const repo = {
    // Find user by email
    findUserByEmail: (email) => __awaiter(void 0, void 0, void 0, function* () {
        return yield database_1.DB.Users.findOne({
            where: { email },
        });
    }),
    // Find user by user_id (UUID)
    findUserById: (user_id) => __awaiter(void 0, void 0, void 0, function* () {
        return yield database_1.DB.Users.findOne({
            where: { user_id },
        });
    }),
    // Create new user
    createUser: (userData) => __awaiter(void 0, void 0, void 0, function* () {
        return yield database_1.DB.Users.create(userData);
    }),
    findAllUsers: (_a) => __awaiter(void 0, [_a], void 0, function* ({ page, limit, roleWhere, type, }) {
        const includeOptions = {
            model: database_1.DB.Roles,
            as: 'role',
            attributes: ['id', 'roleName', 'roleType'],
        };
        // Apply where condition: roleWhere takes precedence, then type, then no filter
        if (roleWhere) {
            includeOptions.where = roleWhere;
        }
        else if (type) {
            includeOptions.where = { roleType: type };
        }
        return yield database_1.DB.Users.findAndCountAll({
            include: includeOptions,
            offset: (page - 1) * limit,
            limit,
            order: [['created_at', 'DESC']],
            attributes: {
                exclude: [
                    'password_hash',
                    'reset_otp',
                    'reset_otp_expiry',
                    'two_fa_secret',
                    'phone_verification_otp',
                    'phone_verification_otp_expiry',
                ],
            },
        });
    }),
    // findAllStudents: async ({
    //     page,
    //     limit,
    //     roleWhere,
    // }: PaginationQuery & { roleWhere?: any }) => {
    //     const includeOptions: any = {
    //         model: DB.Roles,
    //         as: 'role',
    //         attributes: ['id', 'roleName', 'roleType'],
    //     };
    //     // Use provided where condition or default to student roleType
    //     includeOptions.where = roleWhere || { roleType: 'student' };
    //     return await DB.Users.findAndCountAll({
    //         include: [includeOptions],
    //         offset: (page - 1) * limit,
    //         limit,
    //         order: [['created_at', 'DESC']],
    //         attributes: {
    //             exclude: [
    //                 'password_hash',
    //                 'reset_otp',
    //                 'reset_otp_expiry',
    //                 'two_fa_secret',
    //                 'phone_verification_otp',
    //                 'phone_verification_otp_expiry',
    //             ],
    //         },
    //     });
    // },
    // findAllEmployers: async ({
    //     page,
    //     limit,
    //     roleWhere,
    // }: PaginationQuery & { roleWhere?: any }) => {
    //     const includeOptions: any = {
    //         model: DB.Roles,
    //         as: 'role',
    //         attributes: ['id', 'roleName', 'roleType'],
    //     };
    //     // Use provided where condition or default to employer roleType
    //     includeOptions.where = roleWhere || { roleType: 'employer' };
    //     return await DB.Users.findAndCountAll({
    //         include: [includeOptions],
    //         offset: (page - 1) * limit,
    //         limit,
    //         order: [['created_at', 'DESC']],
    //         attributes: {
    //             exclude: [
    //                 'password_hash',
    //                 'reset_otp',
    //                 'reset_otp_expiry',
    //                 'two_fa_secret',
    //                 'phone_verification_otp',
    //                 'phone_verification_otp_expiry',
    //             ],
    //         },
    //     });
    // },
    // findAndCount: async ({include,offset,order, limit }: PaginationQuery) => {
    //   return await DB.Users.findAndCountAll({
    //         include: include,
    //         offset: (page - 1) * limit,
    //         limit,
    //         order: [['created_at', 'DESC']],
    //     });
    // },
    findAllSubAdmins: (_a) => __awaiter(void 0, [_a], void 0, function* ({ page, limit, roleWhere, }) {
        const includeOptions = {
            model: database_1.DB.Roles,
            as: 'role',
            attributes: ['id', 'roleName', 'roleType'],
        };
        // Use provided where condition or default to admin roleType only (exclude superAdmin)
        includeOptions.where = roleWhere || {
            roleType: {
                [sequelize_1.Op.eq]: 'admin',
            },
        };
        return yield database_1.DB.Users.findAndCountAll({
            include: [includeOptions],
            offset: (page - 1) * limit,
            limit,
            order: [['created_at', 'DESC']],
            attributes: {
                exclude: [
                    'password_hash',
                    'reset_otp',
                    'reset_otp_expiry',
                    'two_fa_secret',
                    'phone_verification_otp',
                    'phone_verification_otp_expiry',
                ],
            },
        });
    }),
    // Delete user by UUID
    deleteUser: (id) => __awaiter(void 0, void 0, void 0, function* () {
        yield database_1.DB.Users.destroy({
            where: { user_id: id },
        });
    }),
    // Update user by UUID
    updateUser: (id, updates) => __awaiter(void 0, void 0, void 0, function* () {
        yield database_1.DB.Users.update(updates, {
            where: { user_id: id },
        });
    }),
    // Find user profile by user_id with role information
    findUserProfileById: (user_id) => __awaiter(void 0, void 0, void 0, function* () {
        return yield database_1.DB.Users.findOne({
            where: { user_id },
            attributes: {
                exclude: [
                    'password_hash',
                    'reset_otp',
                    'reset_otp_expiry',
                    'two_fa_secret',
                    'phone_verification_otp',
                    'phone_verification_otp_expiry',
                ],
            },
            include: [
                {
                    model: database_1.DB.Roles,
                    as: 'role',
                    attributes: ['id', 'roleName', 'roleType'],
                },
            ],
        });
    }),
    // Get counts for students and employers
    getRoleCounts: () => __awaiter(void 0, void 0, void 0, function* () {
        const [studentCount, employerCount] = yield Promise.all([
            database_1.DB.Users.count({
                include: [
                    {
                        model: database_1.DB.Roles,
                        as: 'role',
                        where: { roleType: 'student' },
                        attributes: [],
                    },
                ],
            }),
            database_1.DB.Users.count({
                include: [
                    {
                        model: database_1.DB.Roles,
                        as: 'role',
                        where: { roleType: 'employer' },
                        attributes: [],
                    },
                ],
            }),
        ]);
        return { studentCount, employerCount };
    }),
};
exports.default = repo;
