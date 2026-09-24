import { DB } from '@/database';
import { TaskCreationAttributes } from '@/database/models/task.model';

const taskIncludes = [
    {
        model: DB.Jobs,
        as: 'job',
        attributes: [
            'job_id',
            'job_title',
            'employer_id',
            'status',
            'budget',
            'applications',
            'funding_status',
        ],
    },
    {
        model: DB.Users,
        as: 'assignedStudent',
        attributes: ['user_id', 'full_name', 'email', 'mobile_number'],
    },
];

const repo = {
    createTask: async (taskData: TaskCreationAttributes) => {
        return DB.Tasks.create(taskData);
    },

    findTaskById: async (task_id: string) => {
        return DB.Tasks.findOne({
            where: { task_id },
            include: taskIncludes,
        });
    },

    findTasksByJobId: async (job_id: string) => {
        return DB.Tasks.findAll({
            where: { job_id },
            include: taskIncludes,
            order: [
                ['created_at', 'DESC'],
                ['title', 'ASC'],
            ],
        });
    },

    findTasksByAssignedStudentId: async (student_id: string) => {
        return DB.Tasks.findAll({
            where: { assigned_student_id: student_id },
            include: taskIncludes,
            order: [
                ['updated_at', 'DESC'],
                ['created_at', 'DESC'],
            ],
        });
    },

    updateTask: async (task_id: string, updates: Record<string, unknown>) => {
        const [rows] = await DB.Tasks.update(updates, { where: { task_id } });
        if (rows === 0) return null;
        return repo.findTaskById(task_id);
    },

    deleteTask: async (task_id: string) => {
        const rows = await DB.Tasks.destroy({ where: { task_id } });
        return rows > 0;
    },

    findApprovedApplicationForJobAndStudent: async (
        job_id: string,
        student_id: string,
    ) => {
        return DB.JobApplications.findOne({
            where: {
                job_id,
                student_id,
                status: 'Accepted',
            },
            include: [
                {
                    model: DB.Users,
                    as: 'student',
                    attributes: [
                        'user_id',
                        'full_name',
                        'email',
                        'mobile_number',
                    ],
                },
            ],
        });
    },

    findApprovedApplicationsByJobId: async (job_id: string) => {
        return DB.JobApplications.findAll({
            where: {
                job_id,
                status: 'Accepted',
            },
            include: [
                {
                    model: DB.Users,
                    as: 'student',
                    attributes: [
                        'user_id',
                        'full_name',
                        'email',
                        'mobile_number',
                    ],
                },
            ],
            order: [['reviewed_at', 'DESC']],
        });
    },

    findEmployerActiveJobs: async (employer_id: string) => {
        return DB.Jobs.findAll({
            where: {
                employer_id,
                status: 'Active',
            },
            attributes: [
                'job_id',
                'job_title',
                'applications',
                'status',
                'budget',
                'location',
                'duration',
            ],
            order: [['created_at', 'DESC']],
        });
    },
};

export default repo;
