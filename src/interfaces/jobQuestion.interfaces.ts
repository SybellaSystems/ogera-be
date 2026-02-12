export interface JobQuestion {
  question_id: string;
  job_id: string;
  question_text: string;
  question_type: "text" | "number" | "yes_no" | "multiple_choice";
  is_required: boolean;
  options?: string; // JSON string for multiple choice options
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

