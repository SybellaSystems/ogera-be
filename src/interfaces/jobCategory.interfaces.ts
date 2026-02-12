export interface JobCategory {
  category_id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  job_count?: number;
  created_at: Date;
  updated_at: Date;
}
