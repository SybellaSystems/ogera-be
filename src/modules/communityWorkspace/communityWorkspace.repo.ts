import { DB } from '@/database';
import { Op } from 'sequelize';
import { StudentLinkCreationAttributes } from '@/database/models/studentLink.model';
import { PeerReviewCreationAttributes } from '@/database/models/peerReview.model';

class CommunityWorkspaceRepo {
    /*
    |--------------------------------------------------------------------------
    | Student Links
    |--------------------------------------------------------------------------
    */

    async createStudentLink(
        payload: StudentLinkCreationAttributes,
        transaction?: any,
    ) {
        return DB.StudentLinks.create(payload, { transaction });
    }

    async findStudentLinksByUserId(userId: string) {
        return DB.StudentLinks.findAll({
            where: {
                user_id: userId,
                status: 'active',
            },
            order: [['created_at', 'DESC']],
        });
    }

    async findStudentLinkById(id: string) {
        return DB.StudentLinks.findByPk(id);
    }

    async updateStudentLink(
        id: string,
        payload: Partial<StudentLinkCreationAttributes>,
        transaction?: any,
    ) {
        return DB.StudentLinks.update(payload, {
            where: {
                id,
            },
            transaction,
        });
    }

    async deleteStudentLink(id: string, transaction?: any) {
        return DB.StudentLinks.destroy({
            where: {
                id,
            },
            transaction,
        });
    }

    async getPeerFeed(userId: string) {
        return DB.StudentLinks.findAll({
            where: {
                status: 'active',
                visibility: true,
                user_id: {
                    [Op.ne]: userId, // Exclude logged-in user's profiles
                },
            },

            include: [
                {
                    model: DB.Users,
                    as: 'student',
                    attributes: ['user_id', 'full_name', 'profile_image_url'],
                },
            ],

            order: [['created_at', 'DESC']],
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Peer Reviews
    |--------------------------------------------------------------------------
    */

    async createPeerReview(
        payload: PeerReviewCreationAttributes,
        transaction?: any,
    ) {
        return DB.PeerReviews.create(payload, {
            transaction,
        });
    }

    async findReviewByReviewerAndLink(reviewerId: string, linkId: string) {
        return DB.PeerReviews.findOne({
            where: {
                reviewer_id: reviewerId,
                link_id: linkId,
            },
        });
    }

    async getReviewsByLinkId(linkId: string) {
        return DB.PeerReviews.findAll({
            where: {
                link_id: linkId,
                status: 'published',
            },

            include: [
                {
                    model: DB.Users,
                    as: 'reviewer',
                    attributes: ['user_id', 'full_name', 'profile_image_url'],
                },
            ],

            order: [['created_at', 'DESC']],
        });
    }

    async deleteReview(reviewId: string, transaction?: any) {
        return DB.PeerReviews.destroy({
            where: {
                id: reviewId,
            },
            transaction,
        });
    }

    async findDuplicateStudentLink(
        userId: string,
        link_type: string,
        url: string,
    ) {
        return DB.StudentLinks.findOne({
            where: {
                user_id: userId,
                link_type,
                url,
                status: 'active',
            },
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Transaction
    |--------------------------------------------------------------------------
    */

    async getTransaction() {
        return DB.sequelize.transaction();
    }
}

export default new CommunityWorkspaceRepo();
