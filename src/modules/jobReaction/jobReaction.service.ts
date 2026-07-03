import repo from './jobReaction.repo';

class JobReactionService {
    async like(job_id: string, user_id: string) {
        const transaction = await repo.getTransaction();

        try {
            const reaction = await repo.findReaction(job_id, user_id);

            if (!reaction) {
                await repo.createReaction(
                    {
                        job_id,
                        user_id,
                        reaction_type: 'like',
                    },
                    transaction,
                );

                await repo.incrementLike(job_id, transaction);
            } else if (reaction.reaction_type === 'like') {
                await repo.deleteReaction(reaction, transaction);

                await repo.decrementLike(job_id, transaction);
            } else {
                await repo.updateReaction(reaction, 'like', transaction);

                await repo.decrementDislike(job_id, transaction);

                await repo.incrementLike(job_id, transaction);
            }

            await transaction.commit();

            const job = await repo.getJob(job_id);

            if (!job) {
                throw new Error('Job not found');
            }

            const currentReaction = await repo.findReaction(job_id, user_id);

            return {
                likes_count: job.likes_count,
                dislikes_count: job.dislikes_count,
                user_reaction: currentReaction?.reaction_type || null,
            };
        } catch (error) {
            await transaction.rollback();

            throw error;
        }
    }

    async dislike(job_id: string, user_id: string) {
        const transaction = await repo.getTransaction();

        try {
            const reaction = await repo.findReaction(job_id, user_id);

            if (!reaction) {
                await repo.createReaction(
                    {
                        job_id,
                        user_id,
                        reaction_type: 'dislike',
                    },
                    transaction,
                );

                await repo.incrementDislike(job_id, transaction);
            } else if (reaction.reaction_type === 'dislike') {
                await repo.deleteReaction(reaction, transaction);

                await repo.decrementDislike(job_id, transaction);
            } else {
                await repo.updateReaction(reaction, 'dislike', transaction);

                await repo.decrementLike(job_id, transaction);

                await repo.incrementDislike(job_id, transaction);
            }

            await transaction.commit();

            const job = await repo.getJob(job_id);

            if (!job) {
                throw new Error('Job not found');
            }

            const currentReaction = await repo.findReaction(job_id, user_id);

            return {
                likes_count: job.likes_count,
                dislikes_count: job.dislikes_count,
                user_reaction: currentReaction?.reaction_type || null,
            };
        } catch (error) {
            await transaction.rollback();

            throw error;
        }
    }
}

export default new JobReactionService();
