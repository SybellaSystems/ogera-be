export interface User {
    user_id: string;
    email: string;
    mobile_number: string;
    password_hash: string;

    role_id: string;
    role_type: 'student' | 'employer' | 'superAdmin' | 'admin';

    two_fa_enabled: boolean;
    two_fa_secret?: string;
    full_name: string;
    national_id_number?: string;
    business_registration_id?: string;
    resume_url?: string;
    cover_letter?: string;
    preferred_location?: string;

    terms_accepted: boolean;
    privacy_accepted: boolean;
    terms_accepted_at: Date | null;
    privacy_accepted_at: Date | null;

    reset_otp?: string | null;
    reset_otp_expiry?: Date | null;

    email_verified?: boolean;
    email_verification_token?: string | null;
    email_verification_token_expiry?: Date | null;

    phone_verified?: boolean;
    phone_verification_otp?: string | null;
    phone_verification_otp_expiry?: Date | null;

    created_at: Date;
    updated_at: Date;
}

export interface JWTInterface {
    user_id: string;
    role: string;
}
