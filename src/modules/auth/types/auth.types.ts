export interface RegisterPayload {
    email: string
    mobile_number: string;
    password: string;
    role: 'student' | 'employer' | 'admin';
}

export interface LoginPayload {
    email: string;
    password: string;
    otp: string;
}

export interface JWTInterface {
    user_id: string;
    role: string;
}