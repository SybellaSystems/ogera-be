export interface GradeEntry {
    subject: string;
    grade: string;
    score?: number;
}

export interface Records {
    record_id: string;
    student_id: string;
    document_url: string;
    extracted_grades: GradeEntry[];
    status: 'Pending' | 'Approved' | 'Rejected';
    uploaded_at: Date;
}