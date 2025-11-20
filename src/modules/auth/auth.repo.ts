import { DB } from "@/database";
import { User } from "@/interfaces/user.interfaces";

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

  // Update user by UUID
  updateUser: async (id: string, updates: Partial<User>): Promise<void> => {
    await DB.Users.update(updates, {
      where: { user_id: id },
    });
  },
};

export default repo;
