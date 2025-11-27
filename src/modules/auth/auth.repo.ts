import { DB } from '@/database';
import { User } from '@/interfaces/user.interfaces';
import { PaginationQuery } from '@/interfaces/pagination.interfaces';

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
    }: PaginationQuery): Promise<{ rows: User[]; count: number }> => {
        return await DB.Users.findAndCountAll({
            offset: (page - 1) * limit,
            limit,
            order: [['created_at', 'DESC']],
        });
    },

    findAllStudents: async ({ page, limit }: PaginationQuery) => {
        return await DB.Users.findAndCountAll({
            include: [
                {
                    model: DB.Roles,
                    as: 'role',
                    attributes: ['id', 'roleName'],
                    where: { roleName: 'student' },
                },
            ],
            offset: (page - 1) * limit,
            limit,
            order: [['created_at', 'DESC']],
        });
    },

    findAllEmployers: async ({ page, limit }: PaginationQuery) => {
        return await DB.Users.findAndCountAll({
            include: [
                {
                    model: DB.Roles,
                    as: 'role',
                    attributes: ['id', 'roleName'],
                    where: { roleName: 'employer' },
                },
            ],
            offset: (page - 1) * limit,
            limit,
            order: [['created_at', 'DESC']],
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
                exclude: ['password_hash', 'reset_otp', 'reset_otp_expiry', 'two_fa_secret']
            },
            include: [
                {
                    model: DB.Roles,
                    as: 'role',
                    attributes: ['id', 'roleName'],
                },
            ],
        });
    },
};

export default repo;
