export type DisputeType = 'Payment' | 'Contract Violation' | 'Quality Issue' | 'Timeline';
export type DisputeStatus = 'Open' | 'Under Review' | 'Mediation' | 'Resolved' | 'Closed';
export type DisputePriority = 'High' | 'Medium' | 'Low';
export type DisputeResolution = 'Refunded' | 'Settled' | 'Dismissed' | 'Escalated' | null;

export interface Dispute {
    dispute_id: string;
    job_id: string;
    job_application_id?: string;
    student_id: string;
    employer_id: string;
    type: DisputeType;
    status: DisputeStatus;
    priority: DisputePriority;
    title: string;
    description: string;
    reported_by: 'student' | 'employer';
    moderator_id?: string | null;
    escalated_to?: string | null; // Senior admin for escalation
    resolution?: DisputeResolution;
    resolution_notes?: string;
    escrow_amount?: number;
    refund_amount?: number;
    fee_penalty?: number; // 10% fee for 48hr escalation
    auto_escalated_at?: Date | null;
    last_response_at?: Date | null;
    resolved_at?: Date | null;
    created_at: Date;
    updated_at: Date;
}

export interface DisputeEvidence {
    evidence_id: string;
    dispute_id: string;
    uploaded_by: string; // user_id
    file_url: string;
    file_name: string;
    file_type: string;
    file_size: number;
    description?: string;
    created_at: Date;
}

export interface DisputeMessage {
    message_id: string;
    dispute_id: string;
    sender_id: string; // user_id (student, employer, or moderator)
    sender_type: 'student' | 'employer' | 'moderator';
    message: string;
    is_internal?: boolean; // For moderator-only notes
    created_at: Date;
}

export interface DisputeTimeline {
    timeline_id: string;
    dispute_id: string;
    action: string; // 'created', 'assigned', 'escalated', 'resolved', etc.
    performed_by: string; // user_id
    performed_by_type: 'student' | 'employer' | 'moderator' | 'system';
    details?: string;
    created_at: Date;
}

export interface CreateDisputeRequest {
    job_id: string;
    job_application_id?: string;
    type: DisputeType;
    title: string;
    description: string;
    evidence_files?: File[];
    priority?: DisputePriority;
}

export interface UpdateDisputeRequest {
    status?: DisputeStatus;
    priority?: DisputePriority;
    moderator_id?: string;
    resolution?: DisputeResolution;
    resolution_notes?: string;
    refund_amount?: number;
}

export interface AddDisputeMessageRequest {
    message: string;
    is_internal?: boolean;
}

export interface UploadDisputeEvidenceRequest {
    file: File;
    description?: string;
}






