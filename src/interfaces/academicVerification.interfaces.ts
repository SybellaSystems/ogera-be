export type AcademicVerificationStatus =
    | 'pending'
    | 'accepted'
    | 'rejected'
    | 'resubmission_required';
export type StorageType = 'local' | 's3';

export interface AcademicVerification {
    id: string;
    user_id: string;
    document_path: string;
    storage_type: StorageType;
    status: AcademicVerificationStatus;
    rejection_reason?: string | null;
    reviewed_by?: string | null;
    reviewed_at?: Date | null;
    assigned_to?: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface AcademicVerificationCreationAttributes {
    user_id: string;
    document_path: string;
    storage_type: StorageType;
    status?: AcademicVerificationStatus;
    rejection_reason?: string | null;
    reviewed_by?: string | null;
    reviewed_at?: Date | null;
    assigned_to?: string | null;
}

export interface ReviewAcademicVerificationData {
    status: 'accepted' | 'rejected' | 'resubmission_required';
    rejection_reason?: string | null;
}
