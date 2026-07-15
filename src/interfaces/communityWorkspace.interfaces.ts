export type LinkType = 'github' | 'linkedin' | 'portfolio' | 'other';

export type LinkStatus = 'active' | 'inactive';

export type ReviewStatus = 'published' | 'hidden';

/**
 * ===========================
 * Student Link
 * ===========================
 */
export interface StudentLink {
  id: string;
  user_id: string;

  link_type: LinkType;
  url: string;

  visibility: boolean;

  status: LinkStatus;

  created_at?: Date;
  updated_at?: Date;
}

/**
 * Used when creating a new student link.
 */
export interface CreateStudentLinkDto {
  link_type: LinkType;
  url: string;
  visibility?: boolean;
}

/**
 * Used when updating an existing link.
 */
export interface UpdateStudentLinkDto {
  link_type?: LinkType;
  url?: string;
  visibility?: boolean;
  status?: LinkStatus;
}

/**
 * ===========================
 * Peer Review
 * ===========================
 */
export interface PeerReview {
  id: string;

  link_id: string;

  reviewer_id: string;

  rating: number;

  review: string;

  status: ReviewStatus;

  created_at?: Date;
  updated_at?: Date;
}

/**
 * Used when creating a review.
 */
export interface CreatePeerReviewDto {
  rating: number;
  review: string;
}

/**
 * Used when updating a review.
 */
export interface UpdatePeerReviewDto {
  rating?: number;
  review?: string;
  status?: ReviewStatus;
}