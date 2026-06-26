export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Review {
  id: string;
  name: string;
  location: string | null;
  document_type: string | null;
  rating: number;
  comment: string;
  status: ReviewStatus;
  created_at: string;
}

/** The public-facing subset returned by GET /api/reviews. */
export type PublicReview = Pick<
  Review,
  'id' | 'name' | 'location' | 'document_type' | 'rating' | 'comment' | 'created_at'
>;
