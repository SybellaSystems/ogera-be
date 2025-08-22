export interface User {
  user_id: string;
  email: string;
  mobile_number: string;
  password_hash: string; 
  role: "student" | "employer" | "admin";
  two_fa_enabled: boolean;
  two_fa_secret?: string;
  full_name: string;
  national_id_number?: string;
  business_registration_id?: string;
  reset_otp?: string | null;   
  reset_otp_expiry?: Date | null;
  created_at: Date;
}

export interface JWTInterface {
    user_id: string;
    role: string;
}