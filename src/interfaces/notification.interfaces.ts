export interface Notification {
  notification_id: string;
  user_id: string;
  type: 'job_application' | 'application_status' | 'job_posted' | 'system';
  title: string;
  message: string;
  related_id?: string; // Can be application_id, job_id, etc.
  is_read: boolean;
  created_at: Date;
  updated_at: Date;
}

