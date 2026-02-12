export interface TrustScore {
    user_id: string;
    trust_score: number;
    email_verified: boolean;
    phone_verified: boolean;
    academic_verified: boolean;
    breakdown: {
        email_verification_score: number;
        phone_verification_score: number;
        academic_verification_score: number;
    };
    level: 'Limited' | 'Emerging' | 'Developing' | 'Competent' | 'Exceptional';
    description: string;
}

export interface TrustScoreBreakdown {
    email_verification_score: number;
    phone_verification_score: number;
    academic_verification_score: number;
    total_score: number;
}

