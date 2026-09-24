import { JobApplicationModel } from '@/database/models/jobApplication.model';
import { JobModel } from '@/database/models/job.model';
import { UserModel } from '@/database/models/user.model';

export type TaskStatus =
    | 'NOT_STARTED'
    | 'IN_PROGRESS'
    | 'SUBMITTED'
    | 'UNDER_REVIEW'
    | 'COMPLETED'
    | 'REJECTED'
    | 'DISPUTED';

export interface Task {
    task_id: string;
    job_id: string;
    assigned_student_id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    deadline?: Date | null;
    payment_amount?: number | null;
    created_at: Date;
    updated_at: Date;
    job?: JobModel;
    assignedStudent?: UserModel;
    assignedApplication?: JobApplicationModel | null;
}

export interface TaskManagementSummary {
    applicant_count: number;
    approved_students_count: number;
    task_count: number;
    completed_task_count: number;
    disputed_task_count: number;
    overall_progress: number;
}
