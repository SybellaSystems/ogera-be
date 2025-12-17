import api from "./axiosInstance";

export type AcademicVerificationStatus = "pending" | "accepted" | "rejected";
export type StorageType = "local" | "s3";

export interface AcademicVerification {
  id: string;
  user_id: string;
  document_path: string;
  storage_type: StorageType;
  status: AcademicVerificationStatus;
  rejection_reason?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  status: number;
  message: string;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ---------- STUDENT ----------

// Get current user's academic verification
export const getMyAcademicVerification = async () => {
  const res = await api.get<PaginatedResponse<AcademicVerification>>(
    "/academic-verifications/my-verification"
  );
  return res.data;
};

// Upload academic document (new)
export const uploadAcademicVerification = async (file: File) => {
  const formData = new FormData();
  formData.append("document", file);

  const res = await api.post<PaginatedResponse<AcademicVerification>>(
    "/academic-verifications",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data;
};

// Re-upload academic document (when rejected)
export const reuploadAcademicVerification = async (id: string, file: File) => {
  const formData = new FormData();
  formData.append("document", file);

  const res = await api.post<PaginatedResponse<AcademicVerification>>(
    `/academic-verifications/${id}/reupload`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data;
};

// ---------- ADMIN ----------

// Get pending verifications (admin)
export const getPendingAcademicVerifications = async (params?: {
  page?: number;
  limit?: number;
}) => {
  const { page = 1, limit = 10 } = params || {};

  const res = await api.get<
    PaginatedResponse<AcademicVerification[]>
  >("/academic-verifications/pending/list", {
    params: { page, limit },
  });

  return res.data;
};

// Get verifications by status (accepted / rejected / pending)
export const getAcademicVerificationsByStatus = async (
  status: AcademicVerificationStatus,
  params?: { page?: number; limit?: number }
) => {
  const { page = 1, limit = 10 } = params || {};

  const res = await api.get<
    PaginatedResponse<AcademicVerification[]>
  >("/academic-verifications", {
    params: { status, page, limit },
  });

  return res.data;
};

// Review verification (accept/reject)
export const reviewAcademicVerification = async (options: {
  id: string;
  status: "accepted" | "rejected";
  rejection_reason?: string;
}) => {
  const res = await api.patch<PaginatedResponse<AcademicVerification>>(
    `/academic-verifications/${options.id}/review`,
    {
      status: options.status,
      rejection_reason: options.rejection_reason,
    }
  );

  return res.data;
};




