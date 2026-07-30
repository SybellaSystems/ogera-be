import repo from './communityWorkspace.repo';
import { calculateTrustScoreService } from '../trustScore/trustScore.service';

class CommunityWorkspaceService {
    /*
    |--------------------------------------------------------------------------
    | Submit Student Link
    |--------------------------------------------------------------------------
    */

    async submitStudentLink(
        userId: string,
        payload: {
            link_type: 'github' | 'linkedin' | 'portfolio' | 'other';
            url: string;
            visibility?: boolean;
        },
    ) {
        const transaction = await repo.getTransaction();

        try {
            const duplicateLink = await repo.findDuplicateStudentLink(
                userId,
                payload.link_type,
                payload.url,
            );

            if (duplicateLink) {
                throw new Error('This profile has already been submitted.');
            }

            const studentLink = await repo.createStudentLink(
                {
                    user_id: userId,
                    link_type: payload.link_type,
                    url: payload.url,
                    visibility: payload.visibility ?? true,
                    status: 'active',
                },
                transaction,
            );

            await transaction.commit();

            return studentLink;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Get My Submitted Link
    |--------------------------------------------------------------------------
    */

    async getMyStudentLink(userId: string) {
        return repo.findStudentLinksByUserId(userId);
    }

    /*
    |--------------------------------------------------------------------------
    | Update Link
    |--------------------------------------------------------------------------
    */

    async updateStudentLink(id: string, payload: any) {
        const transaction = await repo.getTransaction();

        try {
            await repo.updateStudentLink(id, payload, transaction);

            await transaction.commit();

            return repo.findStudentLinkById(id);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Delete Link
    |--------------------------------------------------------------------------
    */

    async deleteStudentLink(id: string) {
        const transaction = await repo.getTransaction();

        try {
            await repo.deleteStudentLink(id, transaction);

            await transaction.commit();

            return true;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Community Feed
    |--------------------------------------------------------------------------
    */

    async getCommunityFeed(userId: string) {
        const links = await repo.getPeerFeed(userId);

        return links.map((link: any) => ({
            id: link.id,
            user_id: link.user_id,
            full_name: link.student?.full_name,
            profile_image_url: link.student?.profile_image_url,
            link_type: link.link_type,
            url: link.url,
        }));
    }
    /*
    |--------------------------------------------------------------------------
    | Submit Review
    |--------------------------------------------------------------------------
    */

    async submitPeerReview(
        reviewerId: string,
        linkId: string,
        payload: {
            rating: number;
            review: string;
        },
    ) {
        const transaction = await repo.getTransaction();

        try {
            const studentLink = await repo.findStudentLinkById(linkId);

            if (!studentLink) {
                throw new Error('Submitted profile not found.');
            }

            if (studentLink.user_id === reviewerId) {
                throw new Error('You cannot review your own profile.');
            }

            // const existingReview = await repo.findReviewByReviewerAndLink(
            //     reviewerId,
            //     linkId,
            // );

            // if (existingReview) {
            //     throw new Error('You have already reviewed this profile.');
            // }

            const review = await repo.createPeerReview(
                {
                    reviewer_id: reviewerId,
                    link_id: linkId,
                    rating: payload.rating,
                    review: payload.review,
                    status: 'published',
                },
                transaction,
            );

            await transaction.commit();

            /*
|--------------------------------------------------------------------------
| Recalculate Trust Score of the profile owner
|--------------------------------------------------------------------------
*/
            await calculateTrustScoreService(studentLink.user_id);

            return review;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /*
|--------------------------------------------------------------------------
| Submit Reply
|--------------------------------------------------------------------------
*/

    async submitReply(
        userId: string,
        reviewId: string,
        payload: {
            reply: string;
        },
    ) {
        const transaction = await repo.getTransaction();

        try {
            const review: any = await repo.findReviewById(reviewId);

            if (!review) {
                throw new Error('Review not found.');
            }

            const studentLink = review.studentLink;

            if (!studentLink) {
                throw new Error('Submitted profile not found.');
            }

            // Only profile owner can reply
            if (studentLink.user_id !== userId) {
                throw new Error('Only the profile owner can reply.');
            }

            // Prevent replying to own review
            if (review.reviewer_id === userId) {
                throw new Error('You cannot reply to your own review.');
            }

            // One reply only
            const existingReply = await repo.findReplyByReviewId(reviewId);

            if (existingReply) {
                throw new Error(
                    'A reply has already been submitted for this review.',
                );
            }

            const reply = payload.reply.trim();

            if (reply.length < 5) {
                throw new Error('Reply must contain at least 5 characters.');
            }

            if (reply.length > 1000) {
                throw new Error('Reply cannot exceed 1000 characters.');
            }

            const result = await repo.createReply(
                {
                    review_id: reviewId,
                    user_id: userId,
                    reply,
                },
                transaction,
            );

            await transaction.commit();

            return result;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /*
|--------------------------------------------------------------------------
| Update Reply
|--------------------------------------------------------------------------
*/

    async updateReply(
        userId: string,
        reviewId: string,
        payload: {
            reply: string;
        },
    ) {
        const transaction = await repo.getTransaction();

        try {
            const review: any = await repo.findReviewById(reviewId);

            if (!review) {
                throw new Error('Review not found.');
            }

            const studentLink = review.studentLink;

            if (studentLink.user_id !== userId) {
                throw new Error('Only the profile owner can edit this reply.');
            }

            const existingReply: any = await repo.findReplyByReviewId(reviewId);

            if (!existingReply) {
                throw new Error('Reply not found.');
            }

            const reply = payload.reply.trim();

            if (reply.length < 5) {
                throw new Error('Reply must contain at least 5 characters.');
            }

            if (reply.length > 1000) {
                throw new Error('Reply cannot exceed 1000 characters.');
            }

            await repo.updateReply(reviewId, reply, transaction);

            await transaction.commit();

            return repo.findReplyByReviewId(reviewId);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Get Reviews
    |--------------------------------------------------------------------------
    */

    async getReviews(linkId: string) {
        return repo.getReviewsByLinkId(linkId);
    }

    /*
    |--------------------------------------------------------------------------
    | Delete Review
    |--------------------------------------------------------------------------
    */

    async deleteReview(reviewId: string) {
        const transaction = await repo.getTransaction();

        try {
            await repo.deleteReview(reviewId, transaction);

            await transaction.commit();

            return true;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /*
|--------------------------------------------------------------------------
| My Reviews
|--------------------------------------------------------------------------
*/

    async getMyReviews(userId: string) {
    const reviews: any[] = await repo.getMyReviews(userId);

    return reviews.map((review: any) => ({
        id: review.id,
        reviewer_id: review.reviewer_id,
        rating: review.rating,
        review: review.review,
        created_at: review.created_at,
        updated_at: review.updated_at,

        student: {
            user_id: review.studentLink.student.user_id,
            full_name: review.studentLink.student.full_name,
            profile_image_url:
                review.studentLink.student.profile_image_url,
        },

        link_type: review.studentLink.link_type,
        url: review.studentLink.url,

        reply: review.reply
            ? {
                  id: review.reply.id,
                  reply: review.reply.reply,
                  created_at: review.reply.created_at,
                  updated_at: review.reply.updated_at,
              }
            : null,
    }));
}
}

export default new CommunityWorkspaceService();
