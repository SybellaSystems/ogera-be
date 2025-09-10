export interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile_number: string;
  password_hash: string; 
  role: "Student" | "Employer" | "Admin";
  national_id?: string;
  business_id?: string;
  two_fa_enabled: boolean;
  two_fa_secret?: string;
  reset_otp?: string | null;   
  reset_otp_expiry?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface JWTInterface {
    userId: string;
    role: string;
}