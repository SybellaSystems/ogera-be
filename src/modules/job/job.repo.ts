import { DB } from '@/database';
import { Job } from '@/interfaces/job.interfaces';

const repo = {
    createJob: async (jobData: Partial<Job>): Promise<Job> => {
        return await DB.Jobs.create(jobData as any);
    },

    findAllJobs: async (): Promise<Job[]> => {
        return await DB.Jobs.findAll({
            include: [
                {
                    model: DB.Users,
                    as: 'employer', 
                    attributes: ['user_id', 'full_name', 'role'], 
                },
            ],
        });
    },

    findJobById: async (job_id: string): Promise<Job | null> => {
        return await DB.Jobs.findOne({
            where: { job_id },
            include: [
                {
                    model: DB.Users,
                    as: 'employer',
                    attributes: ['full_name', 'role'],
                },
            ],
        });
    },

    updateJob: async (
        job_id: string,
        updates: Partial<Job>,
    ): Promise<Job | null> => {
        const [rows] = await DB.Jobs.update(updates, { where: { job_id } });
        if (rows === 0) return null;
        return await DB.Jobs.findOne({ where: { job_id } });
    },

    deleteJob: async (job_id: string): Promise<boolean> => {
        const rows = await DB.Jobs.destroy({ where: { job_id } });
        return rows > 0;
    },

   
    findEmployerByNameAndRole: async (
        employer_name: string,
    ): Promise<any | null> => {
        return await DB.Users.findOne({
            where: { full_name: employer_name, role: 'employer' },
        });
    },

    findJobByEmployerAndUniqueFields: async (
        employer_id: string,
        job_title?: string,
        location?: string,
    ): Promise<Job | null> => {
        return await DB.Jobs.findOne({
            where: { employer_id, job_title, location },
        });
    },
};

export default repo;
