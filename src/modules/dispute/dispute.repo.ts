import { DB } from '@/database';
import { Dispute, DisputeStatus, DisputePriority } from '@/interfaces/dispute.interfaces';
import { Op } from 'sequelize';

const repo = {
    createDispute: async (disputeData: Partial<Dispute>) => {
        return await DB.Disputes.create(disputeData as any);
    },

    findAllDisputes: async (filters?: {
        status?: DisputeStatus | DisputeStatus[];
        priority?: DisputePriority;
        type?: string;
        reported_by?: 'student' | 'employer';
        page?: number;
        limit?: number;
    }) => {
        const whereClause: any = {};
        if (filters?.status) {
            // Support both single status and array of statuses
            if (Array.isArray(filters.status)) {
                whereClause.status = { [Op.in]: filters.status };
            } else {
                whereClause.status = filters.status;
            }
        }
        if (filters?.priority) whereClause.priority = filters.priority;
        if (filters?.type) whereClause.type = filters.type;
        if (filters?.reported_by) whereClause.reported_by = filters.reported_by;

        const page = filters?.page || 1;
        const limit = filters?.limit || 10;
        const offset = (page - 1) * limit;

        return await DB.Disputes.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: DB.Users,
                    as: 'student',
                    attributes: ['user_id', 'full_name', 'email'],
                },
                {
                    model: DB.Users,
                    as: 'employer',
                    attributes: ['user_id', 'full_name', 'email'],
                },
                {
                    model: DB.Users,
                    as: 'moderator',
                    attributes: ['user_id', 'full_name', 'email'],
                    required: false,
                },
                {
                    model: DB.Jobs,
                    as: 'job',
                    attributes: ['job_id', 'job_title'],
                    required: false,
                },
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset,
        });
    },

    findDisputeById: async (dispute_id: string) => {
        return await DB.Disputes.findOne({
            where: { dispute_id },
            include: [
                {
                    model: DB.Users,
                    as: 'student',
                    attributes: ['user_id', 'full_name', 'email'],
                },
                {
                    model: DB.Users,
                    as: 'employer',
                    attributes: ['user_id', 'full_name', 'email'],
                },
                {
                    model: DB.Users,
                    as: 'moderator',
                    attributes: ['user_id', 'full_name', 'email'],
                    required: false,
                },
                {
                    model: DB.Users,
                    as: 'escalatedAdmin',
                    attributes: ['user_id', 'full_name', 'email'],
                    required: false,
                },
                {
                    model: DB.Jobs,
                    as: 'job',
                    attributes: ['job_id', 'job_title', 'budget'],
                    required: false,
                },
            ],
        });
    },

    findDisputesByUser: async (user_id: string, role: 'student' | 'employer') => {
        const whereClause: any = role === 'student' ? { student_id: user_id } : { employer_id: user_id };
        
        return await DB.Disputes.findAll({
            where: whereClause,
            include: [
                {
                    model: DB.Users,
                    as: 'student',
                    attributes: ['user_id', 'full_name', 'email'],
                },
                {
                    model: DB.Users,
                    as: 'employer',
                    attributes: ['user_id', 'full_name', 'email'],
                },
                {
                    model: DB.Users,
                    as: 'moderator',
                    attributes: ['user_id', 'full_name', 'email'],
                    required: false,
                },
            ],
            order: [['created_at', 'DESC']],
        });
    },

    updateDispute: async (dispute_id: string, updates: Partial<Dispute>) => {
        const [rows] = await DB.Disputes.update(updates, { where: { dispute_id } });
        if (rows === 0) return null;
        return await repo.findDisputeById(dispute_id);
    },

    assignModerator: async (dispute_id: string, moderator_id: string) => {
        return await DB.Disputes.update(
            { moderator_id, status: 'Under Review' },
            { where: { dispute_id } }
        );
    },

    escalateDispute: async (dispute_id: string, escalated_to: string, fee_penalty: number) => {
        return await DB.Disputes.update(
            {
                escalated_to,
                fee_penalty,
                auto_escalated_at: new Date(),
                status: 'Under Review',
            },
            { where: { dispute_id } }
        );
    },

    resolveDispute: async (
        dispute_id: string,
        resolution: 'Refunded' | 'Settled' | 'Dismissed' | 'Escalated',
        resolution_notes?: string,
        refund_amount?: number
    ) => {
        return await DB.Disputes.update(
            {
                status: 'Resolved',
                resolution,
                resolution_notes,
                refund_amount,
                resolved_at: new Date(),
            },
            { where: { dispute_id } }
        );
    },

    // Evidence operations
    addEvidence: async (evidenceData: any) => {
        return await DB.DisputeEvidence.create(evidenceData);
    },

    getDisputeEvidence: async (dispute_id: string) => {
        return await DB.DisputeEvidence.findAll({
            where: { dispute_id },
            include: [
                {
                    model: DB.Users,
                    as: 'uploader',
                    attributes: ['user_id', 'full_name'],
                },
            ],
            order: [['created_at', 'DESC']],
        });
    },

    // Message operations
    addMessage: async (messageData: any) => {
        return await DB.DisputeMessages.create(messageData);
    },

    getDisputeMessages: async (dispute_id: string, userRole?: string) => {
        const whereClause: any = { dispute_id };
        // Students and employers can't see internal moderator messages
        if (userRole !== 'moderator' && userRole !== 'admin' && userRole !== 'superadmin') {
            whereClause.is_internal = false;
        }

        return await DB.DisputeMessages.findAll({
            where: whereClause,
            include: [
                {
                    model: DB.Users,
                    as: 'sender',
                    attributes: ['user_id', 'full_name', 'email'],
                },
            ],
            order: [['created_at', 'ASC']],
        });
    },

    // Timeline operations
    addTimelineEvent: async (timelineData: any) => {
        return await DB.DisputeTimeline.create(timelineData);
    },

    getDisputeTimeline: async (dispute_id: string) => {
        return await DB.DisputeTimeline.findAll({
            where: { dispute_id },
            include: [
                {
                    model: DB.Users,
                    as: 'performer',
                    attributes: ['user_id', 'full_name'],
                    required: false,
                },
            ],
            order: [['created_at', 'ASC']],
        });
    },

    // Auto-escalation: Find disputes that need escalation
    findDisputesNeedingEscalation: async () => {
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

        // Disputes with no response for 24+ hours (need reassignment)
        const needsReassignment = await DB.Disputes.findAll({
            where: {
                status: { [Op.in]: ['Open', 'Under Review'] },
                moderator_id: { [Op.ne]: null },
                last_response_at: { [Op.lt]: twentyFourHoursAgo },
                auto_escalated_at: null,
            },
        });

        // Disputes with no response for 48+ hours (need senior admin escalation)
        const needsEscalation = await DB.Disputes.findAll({
            where: {
                status: { [Op.in]: ['Open', 'Under Review'] },
                moderator_id: { [Op.ne]: null },
                last_response_at: { [Op.lt]: fortyEightHoursAgo },
                auto_escalated_at: null,
            },
        });

        return { needsReassignment, needsEscalation };
    },

    // Get statistics
    getDisputeStats: async () => {
        const [open, underReview, resolved, highPriority] = await Promise.all([
            DB.Disputes.count({ where: { status: 'Open' } }),
            DB.Disputes.count({ where: { status: 'Under Review' } }),
            DB.Disputes.count({
                where: { status: 'Resolved' },
                // This month
                created_at: {
                    [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                },
            }),
            DB.Disputes.count({ where: { priority: 'High' } }),
        ]);

        return { open, underReview, resolved, highPriority };
    },

    // Find available moderators
    findAvailableModerators: async () => {
        return await DB.Users.findAll({
            include: [
                {
                    model: DB.Roles,
                    as: 'role',
                    where: {
                        roleType: { [Op.in]: ['admin', 'superAdmin'] },
                    },
                    attributes: ['roleName', 'roleType'],
                },
            ],
            attributes: ['user_id', 'full_name', 'email'],
        });
    },
};

export default repo;


