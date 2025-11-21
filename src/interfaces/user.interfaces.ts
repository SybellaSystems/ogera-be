export interface User {
  user_id: string;
  email: string;
  mobile_number: string;
  password_hash: string;

  role_id: string;

  two_fa_enabled: boolean;
  two_fa_secret?: string;
  full_name: string;
  national_id_number?: string;
  business_registration_id?: string;

  terms_accepted: boolean;
  privacy_accepted: boolean;
  terms_accepted_at: Date | null;
  privacy_accepted_at: Date | null;

  reset_otp?: string | null;
  reset_otp_expiry?: Date | null;

  created_at: Date;
  updated_at: Date;
}


export interface JWTInterface {
    user_id: string;
    role: string;
}