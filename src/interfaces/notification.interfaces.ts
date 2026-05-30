export interface Notification {
  notification_id: string;
  user_id: string;
  type: 'job_application' | 'application_status' | 'job_posted' | 'system' | 'new_message';
  title: string;
  message: string;
  related_id?: string; // Can be application_id, job_id, etc.
  action_url?: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, any> | null;
  is_read: boolean;
  read_at?: Date | null;
  email_sent_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

