export interface CourseStep {
  step_id: string;
  course_id: string;
  step_type: "video" | "link" | "pdf" | "image" | "text";
  step_content: string;
  step_title?: string;
  step_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface Course {
  course_id: string;
  course_name: string;
  type: string;
  tag: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
  steps?: CourseStep[];
}


