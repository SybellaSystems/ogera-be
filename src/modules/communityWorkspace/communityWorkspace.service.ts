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
        profession: link.student?.profession,
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

            const existingReview = await repo.findReviewByReviewerAndLink(
                reviewerId,
                linkId,
            );

            if (existingReview) {
                throw new Error('You have already reviewed this profile.');
            }

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
}

export default new CommunityWorkspaceService();
