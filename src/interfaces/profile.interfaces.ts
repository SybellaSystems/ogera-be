// ====================== SKILL INTERFACES ======================
export interface UserSkill {
    skill_id: string;
    user_id: string;
    skill_name: string;
    skill_type: 'key_skill' | 'it_skill';
    proficiency_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    years_of_experience?: number;
    last_used_year?: number;
    created_at: Date;
    updated_at: Date;
}

// ====================== EMPLOYMENT INTERFACES ======================
export interface UserEmployment {
    employment_id: string;
    user_id: string;
    job_title: string;
    company_name: string;
    employment_type: 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance';
    start_date: Date;
    end_date?: Date | null;
    is_current: boolean;
    location?: string;
    description?: string;
    notice_period?: string;
    current_salary?: number;
    salary_currency?: string;
    key_skills?: string[]; // JSON array of skills used in this role
    created_at: Date;
    updated_at: Date;
}

// ====================== EDUCATION INTERFACES ======================
export interface UserEducation {
    education_id: string;
    user_id: string;
    degree: string;
    field_of_study: string;
    institution_name: string;
    start_year: number;
    end_year?: number | null;
    is_current: boolean;
    grade?: string;
    grade_type?: 'percentage' | 'cgpa' | 'gpa';
    description?: string;
    created_at: Date;
    updated_at: Date;
}

// ====================== PROJECT INTERFACES ======================
export interface UserProject {
    project_id: string;
    user_id: string;
    project_title: string;
    project_url?: string;
    start_date?: Date;
    end_date?: Date | null;
    is_ongoing: boolean;
    description?: string;
    technologies?: string[]; // JSON array of technologies used
    role_in_project?: string;
    created_at: Date;
    updated_at: Date;
}

// ====================== ACCOMPLISHMENT INTERFACES ======================
export interface UserAccomplishment {
    accomplishment_id: string;
    user_id: string;
    accomplishment_type: 'certification' | 'award' | 'publication' | 'patent' | 'other';
    title: string;
    issuing_organization?: string;
    issue_date?: Date;
    expiry_date?: Date | null;
    credential_id?: string;
    credential_url?: string;
    description?: string;
    created_at: Date;
    updated_at: Date;
}

// ====================== EXTENDED USER PROFILE ======================
export interface ExtendedUserProfile {
    user_id: string;
    resume_headline?: string;
    profile_summary?: string;
    total_experience_years?: number;
    total_experience_months?: number;
    current_salary?: number;
    expected_salary?: number;
    salary_currency?: string;
    notice_period?: string;
    date_of_birth?: Date;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    marital_status?: 'single' | 'married' | 'divorced' | 'widowed' | 'prefer_not_to_say';
    languages?: string[]; // JSON array of languages known
    social_profiles?: {
        linkedin?: string;
        github?: string;
        portfolio?: string;
        twitter?: string;
        other?: string;
    };
}

// ====================== API REQUEST/RESPONSE TYPES ======================
export interface CreateSkillRequest {
    skill_name: string;
    skill_type: 'key_skill' | 'it_skill';
    proficiency_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    years_of_experience?: number;
    last_used_year?: number;
}

export interface CreateEmploymentRequest {
    job_title: string;
    company_name: string;
    employment_type: 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance';
    start_date: string;
    end_date?: string;
    is_current: boolean;
    location?: string;
    description?: string;
    notice_period?: string;
    current_salary?: number;
    salary_currency?: string;
    key_skills?: string[];
}

export interface CreateEducationRequest {
    degree: string;
    field_of_study: string;
    institution_name: string;
    start_year: number;
    end_year?: number;
    is_current: boolean;
    grade?: string;
    grade_type?: 'percentage' | 'cgpa' | 'gpa';
    description?: string;
}

export interface CreateProjectRequest {
    project_title: string;
    project_url?: string;
    start_date?: string;
    end_date?: string;
    is_ongoing: boolean;
    description?: string;
    technologies?: string[];
    role_in_project?: string;
}

export interface CreateAccomplishmentRequest {
    accomplishment_type: 'certification' | 'award' | 'publication' | 'patent' | 'other';
    title: string;
    issuing_organization?: string;
    issue_date?: string;
    expiry_date?: string;
    credential_id?: string;
    credential_url?: string;
    description?: string;
}

export interface UpdateExtendedProfileRequest {
    resume_headline?: string;
    profile_summary?: string;
    total_experience_years?: number;
    total_experience_months?: number;
    current_salary?: number;
    expected_salary?: number;
    salary_currency?: string;
    notice_period?: string;
    date_of_birth?: string;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    marital_status?: 'single' | 'married' | 'divorced' | 'widowed' | 'prefer_not_to_say';
    languages?: string[];
    social_profiles?: {
        linkedin?: string;
        github?: string;
        portfolio?: string;
        twitter?: string;
        other?: string;
    };
}

// ====================== BULK OPERATIONS ======================
export interface BulkSkillsRequest {
    skills: CreateSkillRequest[];
}

