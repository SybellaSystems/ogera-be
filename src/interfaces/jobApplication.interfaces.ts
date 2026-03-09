export interface JobApplication {
  application_id: string;
  job_id: string;
  student_id: string;
  status: "Pending" | "Accepted" | "Rejected";
  cover_letter?: string;
  resume_url?: string;
  applied_at: Date;
  completed_at?: Date;
  reviewed_at?: Date;
  reviewed_by?: string;
  created_at: Date;
  updated_at: Date;
}

