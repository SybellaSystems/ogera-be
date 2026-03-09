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
  funding_status?: "Unfunded" | "Pending" | "Funded" | "Paid";
  momo_reference_id?: string | null;
  momo_paid_at?: Date | null;
  disbursement_reference_id?: string | null;
  paid_at?: Date | null;
  amount_paid_to_student?: number | null;
  created_at: Date;
  updated_at: Date;
}
