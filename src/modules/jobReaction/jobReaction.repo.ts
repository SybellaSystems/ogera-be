import { DB } from '@/database';

const { JobReactions, Jobs, sequelize, Sequelize } = DB;

export class JobReactionRepository {
    async findReaction(job_id: string, user_id: string) {
        return JobReactions.findOne({
            where: {
                job_id,
                user_id,
            },
        });
    }

    async createReaction(data: any, transaction: any) {
        return JobReactions.create(data, {
            transaction,
        });
    }

    async updateReaction(
        reaction: any,
        reactionType: 'like' | 'dislike',
        transaction: any,
    ) {
        reaction.reaction_type = reactionType;

        return reaction.save({
            transaction,
        });
    }

    async deleteReaction(reaction: any, transaction: any) {
        return reaction.destroy({
            transaction,
        });
    }

    async incrementLike(job_id: string, transaction: any) {
        return Jobs.increment(
            {
                likes_count: 1,
            },
            {
                where: { job_id },
                transaction,
            },
        );
    }

    async decrementLike(job_id: string, transaction: any) {
        const job = await Jobs.findByPk(job_id, { transaction });

        if (!job) return;

        if (job.likes_count > 0) {
            return Jobs.decrement(
                {
                    likes_count: 1,
                },
                {
                    where: { job_id },
                    transaction,
                },
            );
        }
    }

    async incrementDislike(job_id: string, transaction: any) {
        return Jobs.increment(
            {
                dislikes_count: 1,
            },
            {
                where: { job_id },
                transaction,
            },
        );
    }

    async decrementDislike(job_id: string, transaction: any) {
        const job = await Jobs.findByPk(job_id, { transaction });

        if (!job) return;

        if (job.dislikes_count > 0) {
            return Jobs.decrement(
                {
                    dislikes_count: 1,
                },
                {
                    where: { job_id },
                    transaction,
                },
            );
        }
    }

    async getJob(job_id: string) {
        return Jobs.findByPk(job_id);
    }

    getTransaction() {
        return sequelize.transaction();
    }
}

export default new JobReactionRepository();
