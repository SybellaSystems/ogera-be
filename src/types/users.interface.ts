export interface User {
    user_id: string;
    email: string;
    mobile_number: number;
    password: string;
    role: 'student' | 'employer' | 'admin';
    two_fa_enabled: boolean;
    created_at: Date;
}