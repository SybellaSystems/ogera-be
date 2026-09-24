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
        search,
    }: {
        page: number;
        limit: number;
        roleWhere?: any;
        type?: 'student' | 'employer';
        search?: string;
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

        // Build where conditions for the Users table
        const usersWhere: any = {};

        // Add search filter if provided - search by name or email
        if (search && search.trim()) {
            usersWhere[Op.or] = [
                { full_name: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } },
            ];
        }

        return await DB.Users.findAndCountAll({
            where: usersWhere,
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
                    'login_2fa_otp',
                    'login_2fa_otp_expiry',
                    'email_verification_token',
                    'email_verification_token_expiry',
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
        search,
    }: PaginationQuery & { roleWhere?: any; search?: string }) => {
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
        // Build where condition for Users table (search by name or email)
        const usersWhere: any = {};
        if (search && search.trim()) {
            usersWhere[Op.or] = [
                { full_name: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } },
            ];
        }

        return await DB.Users.findAndCountAll({
            where: usersWhere,
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
                    'two_fa_secret',
                    'login_2fa_otp',
                    'login_2fa_otp_expiry',
                    'email_verification_token',
                    'email_verification_token_expiry',
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
                    'two_fa_secret',
                    'phone_verification_otp',
                    'phone_verification_otp_expiry',
                    'login_2fa_otp',
                    'login_2fa_otp_expiry',
                    'email_verification_token',
                    'email_verification_token_expiry',
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
    getRoleCounts: async (): Promise<{
        studentCount: number;
        employerCount: number;
    }> => {
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
