import repo from './dispute.repo';
import { CustomError } from '@/utils/custom-error';
import { StatusCodes } from 'http-status-codes';
import { DB } from '@/database';
import {
    CreateDisputeRequest,
    UpdateDisputeRequest,
    AddDisputeMessageRequest,
    Dispute,
    DisputeStatus,
    DisputePriority,
} from '@/interfaces/dispute.interfaces';
import { uploadFile } from '@/utils/storage.service';
import { createNotificationService } from '../notification/notification.service';
import { sendMail } from '@/utils/mailer';
import logger from '@/utils/logger';

// Create a new dispute
export const createDisputeService = async (
    data: CreateDisputeRequest,
    user_id: string,
    userRole: 'student' | 'employer',
) => {
    // Verify job exists
    const job = await DB.Jobs.findOne({ where: { job_id: data.job_id } });
    if (!job) {
        throw new CustomError('Job not found', StatusCodes.NOT_FOUND);
    }

    // Determine student and employer IDs
    const student_id = userRole === 'student' ? user_id : job.employer_id === user_id ? null : job.employer_id;
    const employer_id = userRole === 'employer' ? user_id : job.employer_id;

    if (!student_id || !employer_id) {
        throw new CustomError('Invalid job relationship', StatusCodes.BAD_REQUEST);
    }

    // Determine priority based on type (Payment = High priority)
    const priority: DisputePriority = data.priority || (data.type === 'Payment' ? 'High' : 'Medium');

    // Create dispute
    const dispute = await repo.createDispute({
        job_id: data.job_id,
        job_application_id: data.job_application_id,
        student_id,
        employer_id,
        type: data.type,
        title: data.title,
        description: data.description,
        priority,
        status: 'Open',
        reported_by: userRole,
        last_response_at: new Date(),
    });

    // Add timeline event
    await repo.addTimelineEvent({
        dispute_id: dispute.dispute_id,
        action: 'dispute_created',
        performed_by: user_id,
        performed_by_type: userRole,
        details: `Dispute created: ${data.type} - ${data.title}`,
    });

    // Upload evidence files if provided
    if (data.evidence_files && data.evidence_files.length > 0) {
        for (const file of data.evidence_files) {
            try {
                const uploadResult = await uploadFile(file, 'dispute-evidence');
                await repo.addEvidence({
                    dispute_id: dispute.dispute_id,
                    uploaded_by: user_id,
                    file_url: uploadResult.path,
                    file_name: file.originalname,
                    file_type: file.mimetype,
                    file_size: file.size,
                });
            } catch (error) {
                logger.error('Failed to upload evidence file:', error);
            }
        }
    }

    // Auto-assign moderator (find available admin/moderator)
    await autoAssignModerator(dispute.dispute_id);

    // Notify parties
    await notifyDisputeParties(dispute.dispute_id, 'created');

    return await repo.findDisputeById(dispute.dispute_id);
};

// Auto-assign moderator
const autoAssignModerator = async (dispute_id: string) => {
    const moderators = await repo.findAvailableModerators();
    if (moderators.length === 0) {
        logger.warn('No moderators available for dispute assignment');
        return;
    }

    // Assign first available moderator (can be improved with load balancing)
    const moderator = moderators[0];
    await repo.assignModerator(dispute_id, moderator.user_id);

    // Update status to "Under Review" when moderator is assigned
    await repo.updateDispute(dispute_id, {
        status: 'Under Review',
        last_response_at: new Date(),
    });

    await repo.addTimelineEvent({
        dispute_id,
        action: 'moderator_assigned',
        performed_by: moderator.user_id,
        performed_by_type: 'moderator',
        details: `Moderator ${moderator.full_name} assigned - Status changed to Under Review`,
    });

    // Notify moderator
    await createNotificationService({
        user_id: moderator.user_id,
        type: 'system',
        title: 'New Dispute Assigned',
        message: 'A new dispute has been assigned to you for review.',
        related_id: dispute_id,
    });
};

// Notify dispute parties
const notifyDisputeParties = async (dispute_id: string, event: string) => {
    const dispute = await repo.findDisputeById(dispute_id);
    if (!dispute) return;

    const messages: { [key: string]: string } = {
        created: 'A new dispute has been filed. Please review and respond.',
        assigned: 'A moderator has been assigned to your dispute.',
        escalated: 'Your dispute has been escalated to a senior administrator.',
        resolved: 'Your dispute has been resolved.',
    };

    const message = messages[event] || 'There is an update on your dispute.';

    // Notify student
    await createNotificationService({
        user_id: dispute.student_id,
        type: 'system',
        title: 'Dispute Update',
        message,
        related_id: dispute_id,
    });

    // Notify employer
    await createNotificationService({
        user_id: dispute.employer_id,
        type: 'system',
        title: 'Dispute Update',
        message,
        related_id: dispute_id,
    });

    // Send email notifications (optional, can be enhanced)
    try {
        const student = await DB.Users.findOne({ where: { user_id: dispute.student_id } });
        const employer = await DB.Users.findOne({ where: { user_id: dispute.employer_id } });

        if (student?.email) {
            await sendMail({
                to: student.email,
                subject: 'Dispute Update',
                text: message,
                html: `<p>${message}</p><p>Dispute ID: ${dispute_id}</p>`,
            });
        }

        if (employer?.email) {
            await sendMail({
                to: employer.email,
                subject: 'Dispute Update',
                text: message,
                html: `<p>${message}</p><p>Dispute ID: ${dispute_id}</p>`,
            });
        }
    } catch (error) {
        logger.error('Failed to send email notifications:', error);
    }
};

// Get all disputes with filters
export const getAllDisputesService = async (filters?: {
    status?: DisputeStatus | DisputeStatus[];
    priority?: DisputePriority;
    type?: string;
    page?: number;
    limit?: number;
}) => {
    const { rows, count } = await repo.findAllDisputes(filters);
    return {
        data: rows,
        pagination: {
            total: count,
            page: filters?.page || 1,
            limit: filters?.limit || 10,
            totalPages: Math.ceil(count / (filters?.limit || 10)),
        },
    };
};

// Get dispute by ID
export const getDisputeByIdService = async (dispute_id: string, user_id?: string, userRole?: string) => {
    const dispute = await repo.findDisputeById(dispute_id);
    if (!dispute) {
        throw new CustomError('Dispute not found', StatusCodes.NOT_FOUND);
    }

    // Check access: students/employers can only see their own disputes
    if (userRole && userRole !== 'admin' && userRole !== 'superadmin' && userRole !== 'moderator') {
        if (dispute.student_id !== user_id && dispute.employer_id !== user_id) {
            throw new CustomError('Access denied', StatusCodes.FORBIDDEN);
        }
    }

    // Get related data
    const [evidence, messages, timeline] = await Promise.all([
        repo.getDisputeEvidence(dispute_id),
        repo.getDisputeMessages(dispute_id, userRole),
        repo.getDisputeTimeline(dispute_id),
    ]);

    return {
        dispute,
        evidence,
        messages,
        timeline,
    };
};

// Update dispute (moderator/admin only)
export const updateDisputeService = async (
    dispute_id: string,
    data: UpdateDisputeRequest,
    user_id: string,
    userRole: string,
) => {
    // Only moderators/admins can update disputes
    if (userRole !== 'admin' && userRole !== 'superadmin' && userRole !== 'moderator') {
        throw new CustomError('Only moderators can update disputes', StatusCodes.FORBIDDEN);
    }

    const dispute = await repo.findDisputeById(dispute_id);
    if (!dispute) {
        throw new CustomError('Dispute not found', StatusCodes.NOT_FOUND);
    }

    const updates: Partial<Dispute> = {};
    if (data.status) updates.status = data.status;
    if (data.priority) updates.priority = data.priority;
    if (data.moderator_id) updates.moderator_id = data.moderator_id;
    if (data.resolution) updates.resolution = data.resolution;
    if (data.resolution_notes) updates.resolution_notes = data.resolution_notes;
    if (data.refund_amount !== undefined) updates.refund_amount = data.refund_amount;

    // Update last response time
    updates.last_response_at = new Date();

    await repo.updateDispute(dispute_id, updates);

    // Add timeline event
    await repo.addTimelineEvent({
        dispute_id,
        action: 'dispute_updated',
        performed_by: user_id,
        performed_by_type: 'moderator',
        details: `Dispute updated: ${JSON.stringify(updates)}`,
    });

    // Notify parties if status changed
    if (data.status && data.status !== dispute.status) {
        await notifyDisputeParties(dispute_id, 'updated');
    }

    return await repo.findDisputeById(dispute_id);
};

// Resolve dispute
export const resolveDisputeService = async (
    dispute_id: string,
    resolution: 'Refunded' | 'Settled' | 'Dismissed' | 'Escalated',
    resolution_notes: string,
    refund_amount?: number,
    user_id: string,
    userRole: string,
) => {
    if (userRole !== 'admin' && userRole !== 'superadmin' && userRole !== 'moderator') {
        throw new CustomError('Only moderators can resolve disputes', StatusCodes.FORBIDDEN);
    }

    await repo.resolveDispute(dispute_id, resolution, resolution_notes, refund_amount);

    await repo.addTimelineEvent({
        dispute_id,
        action: 'dispute_resolved',
        performed_by: user_id,
        performed_by_type: 'moderator',
        details: `Dispute resolved: ${resolution} - ${resolution_notes}`,
    });

    await notifyDisputeParties(dispute_id, 'resolved');

    return await repo.findDisputeById(dispute_id);
};

// Add message to dispute
export const addDisputeMessageService = async (
    dispute_id: string,
    data: AddDisputeMessageRequest,
    user_id: string,
    userRole: 'student' | 'employer' | 'moderator' | 'admin' | 'superadmin',
) => {
    const dispute = await repo.findDisputeById(dispute_id);
    if (!dispute) {
        throw new CustomError('Dispute not found', StatusCodes.NOT_FOUND);
    }

    // Verify user has access
    const isModerator = userRole === 'moderator' || userRole === 'admin' || userRole === 'superadmin';
    if (!isModerator && dispute.student_id !== user_id && dispute.employer_id !== user_id) {
        throw new CustomError('Access denied', StatusCodes.FORBIDDEN);
    }

    const senderType = isModerator ? 'moderator' : (userRole === 'student' ? 'student' : 'employer');

    const message = await repo.addMessage({
        dispute_id,
        sender_id: user_id,
        sender_type: senderType,
        message: data.message,
        is_internal: data.is_internal || false,
    });

    // Update last response time
    await repo.updateDispute(dispute_id, { last_response_at: new Date() });

    // Notify other party
    const notifyUserId = dispute.student_id === user_id ? dispute.employer_id : dispute.student_id;
    await createNotificationService({
        user_id: notifyUserId,
        type: 'system',
        title: 'New Message in Dispute',
        message: 'You have a new message in your dispute thread.',
        related_id: dispute_id,
    });

    return message;
};

// Upload evidence
export const uploadEvidenceService = async (
    dispute_id: string,
    file: Express.Multer.File,
    description: string | undefined,
    user_id: string,
) => {
    const dispute = await repo.findDisputeById(dispute_id);
    if (!dispute) {
        throw new CustomError('Dispute not found', StatusCodes.NOT_FOUND);
    }

    // Verify user has access
    if (dispute.student_id !== user_id && dispute.employer_id !== user_id) {
        throw new CustomError('Access denied', StatusCodes.FORBIDDEN);
    }

    const uploadResult = await uploadFile(file, 'dispute-evidence');
    const evidence = await repo.addEvidence({
        dispute_id,
        uploaded_by: user_id,
        file_url: uploadResult.path,
        file_name: file.originalname,
        file_type: file.mimetype,
        file_size: file.size,
        description,
    });

    await repo.addTimelineEvent({
        dispute_id,
        action: 'evidence_uploaded',
        performed_by: user_id,
        performed_by_type: dispute.student_id === user_id ? 'student' : 'employer',
        details: `Evidence uploaded: ${file.originalname}`,
    });

    return evidence;
};

// Auto-escalation check (should be run periodically via cron job)
export const checkAutoEscalationService = async () => {
    const { needsReassignment, needsEscalation } = await repo.findDisputesNeedingEscalation();

    // Reassign disputes with no response for 24+ hours
    for (const dispute of needsReassignment) {
        if (!dispute.moderator_id) continue;

        const moderators = await repo.findAvailableModerators();
        const newModerator = moderators.find(m => m.user_id !== dispute.moderator_id);
        
        if (newModerator) {
            await repo.assignModerator(dispute.dispute_id, newModerator.user_id);
            await repo.addTimelineEvent({
                dispute_id: dispute.dispute_id,
                action: 'moderator_reassigned',
                performed_by: newModerator.user_id,
                performed_by_type: 'moderator',
                details: 'Auto-reassigned due to 24hr no response',
            });
        }
    }

    // Escalate disputes with no response for 48+ hours
    for (const dispute of needsEscalation) {
        // Find senior admin (superadmin)
        const seniorAdmin = await DB.Users.findOne({
            include: [
                {
                    model: DB.Roles,
                    as: 'role',
                    where: { roleType: 'superAdmin' },
                },
            ],
        });

        if (seniorAdmin) {
            const feePenalty = dispute.escrow_amount ? dispute.escrow_amount * 0.1 : 0; // 10% fee
            await repo.escalateDispute(dispute.dispute_id, seniorAdmin.user_id, feePenalty);
            
            await repo.addTimelineEvent({
                dispute_id: dispute.dispute_id,
                action: 'dispute_escalated',
                performed_by: seniorAdmin.user_id,
                performed_by_type: 'moderator',
                details: `Escalated to senior admin - 10% fee penalty applied: $${feePenalty}`,
            });

            await notifyDisputeParties(dispute.dispute_id, 'escalated');
        }
    }

    return { reassigned: needsReassignment.length, escalated: needsEscalation.length };
};

// Get dispute statistics
export const getDisputeStatsService = async () => {
    return await repo.getDisputeStats();
};

// Get user disputes
export const getUserDisputesService = async (user_id: string, role: 'student' | 'employer') => {
    return await repo.findDisputesByUser(user_id, role);
};


