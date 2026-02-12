import { DB } from '@/database';
import { AcademicVerification, AcademicVerificationStatus } from '@/interfaces/academicVerification.interfaces';
import { PaginationQuery } from '@/interfaces/pagination.interfaces';
import { Op } from 'sequelize';

const repo = {
  // Create new academic verification
  create: async (data: {
    user_id: string;
    document_path: string;
    storage_type: 'local' | 's3';
    status?: AcademicVerificationStatus;
    assigned_to?: string | null;
  }): Promise<AcademicVerification> => {
    return await DB.AcademicVerifications.create(data as any);
  },

  // Find academic verification by ID
  findById: async (id: string): Promise<AcademicVerification | null> => {
    return await DB.AcademicVerifications.findOne({
      where: { id },
      include: [
        {
          model: DB.Users,
          as: 'user',
          attributes: ['user_id', 'full_name', 'email'],
        },
        {
          model: DB.Users,
          as: 'reviewer',
          attributes: ['user_id', 'full_name', 'email'],
          required: false,
        },
        {
          model: DB.Users,
          as: 'assignedAdmin',
          attributes: ['user_id', 'full_name', 'email'],
          required: false,
        },
      ],
    });
  },

  // Find academic verification by user_id
  findByUserId: async (user_id: string): Promise<AcademicVerification | null> => {
    return await DB.AcademicVerifications.findOne({
      where: { user_id },
      order: [['created_at', 'DESC']],
      include: [
        {
          model: DB.Users,
          as: 'reviewer',
          attributes: ['user_id', 'full_name', 'email'],
          required: false,
        },
        {
          model: DB.Users,
          as: 'assignedAdmin',
          attributes: ['user_id', 'full_name', 'email'],
          required: false,
        },
      ],
    });
  },

  // Find academic verification by user_id and ID (for re-upload validation)
  findByUserIdAndId: async (user_id: string, id: string): Promise<AcademicVerification | null> => {
    return await DB.AcademicVerifications.findOne({
      where: { user_id, id },
    });
  },

  // Update academic verification
  update: async (id: string, updates: Partial<AcademicVerification>): Promise<void> => {
    await DB.AcademicVerifications.update(updates, {
      where: { id },
    });
  },

  // Find all academic verifications with pagination
  findAll: async ({ page, limit, status }: PaginationQuery & { status?: AcademicVerificationStatus }): Promise<{ rows: AcademicVerification[]; count: number }> => {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    return await DB.AcademicVerifications.findAndCountAll({
      where,
      offset: (page - 1) * limit,
      limit,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: DB.Users,
          as: 'user',
          attributes: ['user_id', 'full_name', 'email', 'mobile_number'],
        },
        {
          model: DB.Users,
          as: 'reviewer',
          attributes: ['user_id', 'full_name', 'email'],
          required: false,
        },
        {
          model: DB.Users,
          as: 'assignedAdmin',
          attributes: ['user_id', 'full_name', 'email'],
          required: false,
        },
      ],
    });
  },

  // Find pending academic verifications
  findPending: async ({ page, limit }: PaginationQuery): Promise<{ rows: AcademicVerification[]; count: number }> => {
    return await DB.AcademicVerifications.findAndCountAll({
      where: { status: 'pending' },
      offset: (page - 1) * limit,
      limit,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: DB.Users,
          as: 'user',
          attributes: ['user_id', 'full_name', 'email', 'mobile_number'],
        },
        {
          model: DB.Users,
          as: 'assignedAdmin',
          attributes: ['user_id', 'full_name', 'email'],
          required: false,
        },
      ],
    });
  },
};

export default repo;

