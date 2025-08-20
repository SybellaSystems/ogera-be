export interface User {
    user_id: string;
    email: string;
    mobile_number: number;
    password: string;
    role: 'student' | 'employer' | 'admin';
    two_fa_enabled: boolean;
    created_at: Date;
}

export interface StudentProfile {
    student_id: string;
    user_id: string;
    national_id: number;
    identity_status: 'Pending' | 'Verified' | 'Rejected';
    academic_status: 'Pending' | 'Verified' | 'Rejected';
    trust_score: number;
    impact_score: number;
    locked_out_until: Date;
}