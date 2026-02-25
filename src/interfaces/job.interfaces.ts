export interface Job {
  job_id: string;
  employer_id: string;   
  job_title: string;
  applications: number;
  category: string;
  budget: number;
  duration: string;
  location: string;
  description?: string;
  requirements?: string;
  skills?: string;
  employment_type?: string;
  experience_level?: string;
  status: "Pending" | "Active" | "Inactive" | "Completed";
  funding_status?: "Unfunded" | "Pending" | "Funded";
  momo_reference_id?: string | null;
  momo_paid_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}
