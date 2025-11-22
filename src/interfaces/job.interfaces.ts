export interface Job {
  job_id: string;
  employer_id: string;   
  job_title: string;
  applications: number;
  category: string;
  budget: number;
  duration: string;
  location: string;
  status: "Pending" | "Active" | "Completed";
  created_at: Date;
  updated_at: Date;
}
