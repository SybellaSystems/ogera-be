/** SRS: Micro-courses 2–10 hours. Step types: video, quizzes, resources, peer reviews. */
export type CourseStepType =
    | 'video'
    | 'link'
    | 'pdf'
    | 'image'
    | 'text'
    | 'quiz';

export interface CourseStep {
    step_id: string;
    course_id: string;
    step_type: CourseStepType;
    step_content: string;
    step_title?: string;
    step_order: number;
    created_at: Date;
    updated_at: Date;
}

/** SRS: Trending topics Rwanda – Digital Marketing, Data Entry/Analysis, Graphic Design, etc. */
export const COURSE_CATEGORIES = [
    'Digital Marketing',
    'Data Entry/Analysis',
    'Graphic Design',
    'Virtual Assistance',
    'Coding Basics',
    'Customer Service',
    'Content Writing',
    'Academic Research Skills',
    'Digital Literacy',
    'CV Writing',
    'Other',
] as const;

export type CourseCategory = typeof COURSE_CATEGORIES[number];

/** SRS: Free core skills vs paid premium (RWF 2,000–10,000). Discount 50% for TrustScore 500+. */
export interface Course {
    course_id: string;
    course_name: string;
    type: string;
    tag: string;
    description?: string;
    /** Micro-course: 2–10 hours (SRS). */
    estimated_hours?: number | null;
    /** SRS: category for trending topics / filters. */
    category?: CourseCategory | string | null;
    /** SRS: Free vs paid. Paid: RWF 2,000–10,000. */
    is_free: boolean;
    /** Price in smallest currency unit (e.g. RWF). Null when is_free. */
    price_amount?: number | null;
    price_currency?: string | null;
    /** TrustScore >= this gets discount_percent (e.g. 50). */
    discount_trust_score_min?: number | null;
    discount_percent?: number | null;
    /** Student-created courses (TrustScore 700+): creator user_id. */
    created_by?: string | null;
    created_at: Date;
    updated_at: Date;
    steps?: CourseStep[];
}

/** SRS: Complete course → admin reviews free/paid → if paid, check funded → issue certificate. */
export type CertificateStatus =
    | 'none'
    | 'pending_payment'
    | 'pending_review'
    | 'approved';

export interface CourseEnrollment {
    enrollment_id: string;
    user_id: string;
    course_id: string;
    enrolled_at: Date;
    completed_at?: Date | null;
    certificate_status: CertificateStatus;
    /** Amount due for paid course (RWF). Deducted from balance when job completed. */
    amount_due?: number | null;
    amount_paid?: number | null;
    /** Admin-set: certificate issued when funded. */
    funded?: boolean | null;
    created_at: Date;
    updated_at: Date;
}