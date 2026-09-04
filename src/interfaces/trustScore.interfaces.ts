export type TrustLevel =
    | 'Limited'
    | 'Emerging'
    | 'Developing'
    | 'Competent'
    | 'Exceptional';

/** Public API payload: I/E/C are normalized 0-1; percents are 0-100 for UI */
export interface TrustScorePayload {
    user_id: string;
    trust_score: number;
    intelligence_score: number;
    experience_score: number;
    interaction_score: number;
    intelligence_percent: number;
    experience_percent: number;
    interaction_percent: number;
    level: TrustLevel;
    description: string;
    suggestions: string[];
    /** cached = read from users row; computed = live from source tables (not yet saved) */
    source: 'cached' | 'computed';
}

export interface TrustScoreHistoryItem {
    history_id: string;
    user_id: string;
    intelligence_score: number | null;
    experience_score: number | null;
    interaction_score: number | null;
    trust_score: number | null;
    trust_level: string | null;
    computed_at: Date;
}

export interface LeaderboardStudentRow {
    user_id: string;
    full_name: string;
    email: string;
    trust_score: number | null;
    trust_level: string | null;
}

export interface TrustAdminSummary {
    average_trust_score: number | null;
    students_with_score: number;
    top_users: LeaderboardStudentRow[];
    distribution: {
        label: string;
        min: number;
        max: number;
        count: number;
    }[];

    // User analytics
    total_users: number;
    total_students: number;
    total_employers: number;
    user_growth_percent: number;

    // Job analytics
    total_jobs_posted: number;
    job_growth_percent: number;
}

export interface AdminDashboardMetrics {
    total_users: number;
    user_growth_percent: number;

    total_students: number;
    total_employers: number;

    total_jobs_posted: number;
    job_growth_percent: number;
}
