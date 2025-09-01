import { DB } from "@/database";
import { User } from "@/interfaces/user.interfaces";
import { StudentProfile as Student } from "@/interfaces/student.interface";
import { EmployerProfile as Employer } from "@/interfaces/employer.interface";
import { UserCreationAttributes } from "@/database/models/user.model"; 
import { StudentProfileCreationAttributes } from "@/database/models/studentProfile.model";
import { EmployerProfileCreationAttributes } from "@/database/models/employerProfile.model";

export const userRepo = {
  findUserByEmail: async (email: string, transaction?: any): Promise<User | null> => {
    const options = transaction ? { transaction } : {};
    const user = await DB.User.findOne({ 
      where: { email }, 
      ...options 
    });
    return user ? user.toJSON() as User : null;
  },
  
  findUserById: async (user_id: string, transaction?: any): Promise<User | null> => {
    const options = transaction ? { transaction } : {};
    const user = await DB.User.findOne({ 
      where: { user_id }, 
      ...options 
    });
    return user ? user.toJSON() as User : null;
  },

  createUser: async (
    userData: UserCreationAttributes, 
    transaction?: any
  ): Promise<User> => {
    const options = transaction ? { transaction } : {};
    const user = await DB.User.create(userData, options);
    return user.toJSON() as User;
  },

  updateUser: async (id: string, updates: Partial<User>, transaction?: any): Promise<void> => {
    const options = transaction ? { transaction } : {};
    await DB.User.update(updates, { 
      where: { user_id: id }, 
      ...options 
    });
  },
};

export const studentRepo = {
  findStudentById: async (user_id: string, transaction?: any): Promise<Student | null> => {
    const options = transaction ? { transaction } : {};
    const student = await DB.StudentProfile.findOne({ 
      where: { user_id }, 
      ...options 
    });
    return student ? student.toJSON() as Student : null;
  },

  createStudent: async (userData: StudentProfileCreationAttributes, transaction?: any): Promise<Student> => {
    const options = transaction ? { transaction } : {};
    const student = await DB.StudentProfile.create(userData, options);
    return student.toJSON() as Student;
  },

  updateStudent: async (id: string, updates: Partial<Student>, transaction?: any): Promise<void> => {
    const options = transaction ? { transaction } : {};
    await DB.StudentProfile.update(updates, { 
      where: { user_id: id }, 
      ...options 
    });
  },
}

export const employerRepo = {
  findEmployerById: async (user_id: string, transaction?: any): Promise<Employer | null> => {
    const options = transaction ? { transaction } : {};
    const employer = await DB.EmployerProfile.findOne({ 
      where: { user_id }, 
      ...options 
    });
    return employer ? employer.toJSON() as Employer : null;
  },

  createEmployer: async (userData: EmployerProfileCreationAttributes, transaction?: any): Promise<Employer> => {
    const options = transaction ? { transaction } : {};
    const employer = await DB.EmployerProfile.create(userData, options);
    return employer.toJSON() as Employer;
  },

  updateEmployer: async (id: string, updates: Partial<Employer>, transaction?: any): Promise<void> => {
    const options = transaction ? { transaction } : {};
    await DB.EmployerProfile.update(updates, { 
      where: { user_id: id }, 
      ...options 
    });
  },
}