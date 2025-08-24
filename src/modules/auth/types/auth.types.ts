export interface RegisterPayload {
    first_name: string;
    last_name: string;
    email: string;
    mobile_number: string;
    password: string;
    role: 'Student' | 'Employer' | 'Admin';
    national_id: string;
    business_id: string;
    company_name: string;
    company_description: string;
    company_address: string;
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