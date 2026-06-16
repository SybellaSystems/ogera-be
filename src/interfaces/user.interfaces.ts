export interface User {
    user_id: string;
    email: string;
    mobile_number: string;
    country_code?: string;
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
    profile_image_url?: string;

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

    // One-time 2FA login codes (separate from reset_otp)
    login_2fa_otp?: string | null;
    login_2fa_otp_expiry?: Date | null;

    /** SRS: Balance from employer payments; used for courses/platform services. */
    balance?: number | null;

    /** TrustScore (I/E/C model): normalized 0–1 components and 0–100 aggregate */
    intelligence_score?: number | null;
    experience_score?: number | null;
    interaction_score?: number | null;
    trust_score?: number | null;
    trust_level?: string | null;

    /** Student membership badge tier */
    badge?: 'FREE' | 'PREMIUM' | 'PIONEER';
    badge_expiry_date?: Date | null;
    subscription_start_date?: Date | null;
    subscription_end_date?: Date | null;
    pioneer_eligible?: boolean;

    created_at: Date;
    updated_at: Date;
}

export interface JWTInterface {
    user_id: string;
    role: string;
}
