import { DB } from '@/database';
import { User } from '@/interfaces/user.interfaces';
import { PaginationQuery } from '@/interfaces/pagination.interfaces';
import { Op } from 'sequelize';

const repo = {
    // Find user by email
    findUserByEmail: async (email: string): Promise<User | null> => {
        return await DB.Users.findOne({
            where: { email },
        });
    },

    // Find user by user_id (UUID)
    findUserById: async (user_id: string): Promise<User | null> => {
        return await DB.Users.findOne({
            where: { user_id },
        });
    },

    // Create new user
    createUser: async (userData: Partial<User>): Promise<User> => {
        return await DB.Users.create(userData as any);
    },

    findAllUsers: async ({
        page,
        limit,
        roleWhere,
        type,
    }: {
        page: number;
        limit: number;
        roleWhere?: any;
        type?: 'student' | 'employer';
    }): Promise<{
        rows: User[];
        count: number;
    }> => {
        const includeOptions: any = {
            model: DB.Roles,
            as: 'role',
            attributes: ['id', 'roleName', 'roleType'],
        };

        // Apply where condition: roleWhere takes precedence, then type, then no filter
        if (roleWhere) {
            includeOptions.where = roleWhere;
        } else if (type) {
            includeOptions.where = { roleType: type };
        }

        return await DB.Users.findAndCountAll({
            include: includeOptions,
            offset: (page - 1) * limit,
            limit,
            order: [['created_at', 'DESC']],
            attributes: {
                exclude: [
                    'password_hash',
                    'reset_otp',
                    'reset_otp_expiry',
                    'phone_verification_otp',
                    'phone_verification_otp_expiry',
                ],
            },
        });
    },

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

    findAllSubAdmins: async ({
        page,
        limit,
        roleWhere,
    }: PaginationQuery & { roleWhere?: any }) => {
        const includeOptions: any = {
            model: DB.Roles,
            as: 'role',
            attributes: ['id', 'roleName', 'roleType'],
        };

        // Use provided where condition or default to admin roleType only (exclude superAdmin)
        includeOptions.where = roleWhere || {
            roleType: {
                [Op.eq]: 'admin',
            },
        };

        return await DB.Users.findAndCountAll({
            include: [includeOptions],
            offset: (page - 1) * limit,
            limit,
            order: [['created_at', 'DESC']],
            attributes: {
                exclude: [
                    'password_hash',
                    'reset_otp',
                    'reset_otp_expiry',
                    'phone_verification_otp',
                    'phone_verification_otp_expiry',
                ],
            },
        });
    },

    // Delete user by UUID
    deleteUser: async (id: string): Promise<void> => {
        await DB.Users.destroy({
            where: { user_id: id },
        });
    },

    // Update user by UUID
    updateUser: async (id: string, updates: Partial<User>): Promise<void> => {
        await DB.Users.update(updates, {
            where: { user_id: id },
        });
    },

    // Find user profile by user_id with role information
    findUserProfileById: async (user_id: string): Promise<any> => {
        return await DB.Users.findOne({
            where: { user_id },
            attributes: {
                exclude: [
                    'password_hash',
                    'reset_otp',
                    'reset_otp_expiry',
                    'phone_verification_otp',
                    'phone_verification_otp_expiry',
                ],
            },
            include: [
                {
                    model: DB.Roles,
                    as: 'role',
                    attributes: ['id', 'roleName', 'roleType'],
                },
            ],
        });
    },

    // Get counts for students and employers
    getRoleCounts: async (): Promise<{ studentCount: number; employerCount: number }> => {
        const [studentCount, employerCount] = await Promise.all([
            DB.Users.count({
                include: [
                    {
                        model: DB.Roles,
                        as: 'role',
                        where: { roleType: 'student' },
                        attributes: [],
                    },
                ],
            }),
            DB.Users.count({
                include: [
                    {
                        model: DB.Roles,
                        as: 'role',
                        where: { roleType: 'employer' },
                        attributes: [],
                    },
                ],
            }),
        ]);

        return { studentCount, employerCount };
    },
};

export default repo;
