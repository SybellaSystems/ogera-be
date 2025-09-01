export interface StudentProfile {
  student_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  national_id: string;
  identity_status: "Pending" | "Verified" | "Rejected";
  academic_status: "Pending" | "Verified" | "Rejected";
  trust_score: number;
  impact_score: number;
  locked_out_until: Date;
}