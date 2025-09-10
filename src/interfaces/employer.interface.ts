export interface EmployerProfile {
  employer_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  business_id: string;
  company_name: string;
  company_description: string;
  business_document_url: string;
  verification_status: 'Pending' | 'Verified' | 'Rejected';
  website?: string;
  company_size?: string;
  contact_email?: string;
  company_address: string;
  created_at: Date;
  updated_at: Date
  }