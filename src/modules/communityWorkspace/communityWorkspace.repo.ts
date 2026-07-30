import { DB } from '@/database';
import { Op } from 'sequelize';
import { StudentLinkCreationAttributes } from '@/database/models/studentLink.model';
import { PeerReviewCreationAttributes } from '@/database/models/peerReview.model';
import { PeerReviewReplyCreationAttributes } from '@/database/models/peerReviewReply.model';

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
                [Op.ne]: userId,
            },
        },

        include: [
            {
                model: DB.Users,
                as: 'student',

                attributes: [
                    'user_id',
                    'full_name',
                    'profile_image_url',
                ],
            },

            {
                model: DB.PeerReviews,
                as: 'peerReviews',

                required: false,

                where: {
                    reviewer_id: userId,
                },

                attributes: [
                    'id',
                    'rating',
                    'review',
                    'created_at',
                ],

                include: [
                    {
                        model: DB.PeerReviewReplies,
                        as: 'reply',

                        required: false,

                        attributes: [
                            'id',
                            'reply',
                            'created_at',
                            'updated_at',
                        ],

                        include: [
                            {
                                model: DB.Users,
                                as: 'author',

                                attributes: [
                                    'user_id',
                                    'full_name',
                                    'profile_image_url',
                                ],
                            },
                        ],
                    },
                ],
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

        // async findReviewByReviewerAndLink(reviewerId: string, linkId: string) {
        //     return DB.PeerReviews.findOne({
        //         where: {
        //             reviewer_id: reviewerId,
        //             link_id: linkId,
        //         },
        //     });
        // }

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

                {
                    model: DB.PeerReviewReplies,
                    as: 'reply',

                    attributes: ['id', 'reply', 'created_at', 'updated_at'],

                    include: [
                        {
                            model: DB.Users,
                            as: 'author',

                            attributes: [
                                'user_id',
                                'full_name',
                                'profile_image_url',
                            ],
                        },
                    ],
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

    /*
|--------------------------------------------------------------------------
| Peer Review Replies
|--------------------------------------------------------------------------
*/

    async findReviewById(reviewId: string) {
        return DB.PeerReviews.findByPk(reviewId, {
            include: [
                {
                    model: DB.StudentLinks,
                    as: 'studentLink',
                },
            ],
        });
    }

    async findReplyByReviewId(reviewId: string) {
        return DB.PeerReviewReplies.findOne({
            where: {
                review_id: reviewId,
            },
        });
    }

    async createReply(
        payload: PeerReviewReplyCreationAttributes,
        transaction?: any,
    ) {
        return DB.PeerReviewReplies.create(payload, {
            transaction,
        });
    }

    async updateReply(reviewId: string, reply: string, transaction?: any) {
        return DB.PeerReviewReplies.update(
            {
                reply,
            },
            {
                where: {
                    review_id: reviewId,
                },
                transaction,
            },
        );
    }

    async deleteReply(reviewId: string, transaction?: any) {
        return DB.PeerReviewReplies.destroy({
            where: {
                review_id: reviewId,
            },
            transaction,
        });
    }

    /*
|--------------------------------------------------------------------------
| My Reviews
|--------------------------------------------------------------------------
*/

    async getMyReviews(userId: string) {
        return DB.PeerReviews.findAll({
            where: {
                reviewer_id: userId,
            },

            include: [
                {
                    model: DB.StudentLinks,
                    as: 'studentLink',

                    attributes: ['id', 'link_type', 'url', 'user_id'],

                    include: [
                        {
                            model: DB.Users,
                            as: 'student',

                            attributes: [
                                'user_id',
                                'full_name',
                                'profile_image_url',
                            ],
                        },
                    ],
                },

                {
                    model: DB.PeerReviewReplies,
                    as: 'reply',

                    attributes: ['id', 'reply', 'created_at', 'updated_at'],

                    include: [
                        {
                            model: DB.Users,
                            as: 'author',

                            attributes: [
                                'user_id',
                                'full_name',
                                'profile_image_url',
                            ],
                        },
                    ],
                },
            ],

            order: [['created_at', 'DESC']],
        });
    }
}

export default new CommunityWorkspaceRepo();
