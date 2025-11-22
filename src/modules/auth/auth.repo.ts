import { DB } from "@/database";
import { User } from "@/interfaces/user.interfaces";
import { PaginationQuery } from "@/interfaces/pagination.interfaces";
import { DB } from '@/database';
import { User } from '@/interfaces/user.interfaces';

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

  updateUser: async (id: string, updates: Partial<User>): Promise<void> => {
    await DB.Users.update(updates, { where: { user_id: id } });
  },

  findAllUsers: async ({ page, limit }: PaginationQuery): Promise<{ rows: User[]; count: number }> => {
    return await DB.Users.findAndCountAll({
      offset: (page - 1) * limit,
      limit,
      order: [["created_at", "DESC"]],
    });
  },

  findAllStudents: async ({ page, limit }: PaginationQuery): Promise<{ rows: User[]; count: number }> => {
    return await DB.Users.findAndCountAll({
      where: { role: "student" },
      offset: (page - 1) * limit,
      limit,
      order: [["created_at", "DESC"]],
    });
  },

  findAllEmployers: async ({ page, limit }: PaginationQuery): Promise<{ rows: User[]; count: number }> => {
    return await DB.Users.findAndCountAll({
      where: { role: "employer" },
      offset: (page - 1) * limit,
      limit,
      order: [["created_at", "DESC"]],
    });
  },

    // Update user by UUID
    updateUser: async (id: string, updates: Partial<User>): Promise<void> => {
        await DB.Users.update(updates, {
            where: { user_id: id },
        });
    },
};

export default repo;
