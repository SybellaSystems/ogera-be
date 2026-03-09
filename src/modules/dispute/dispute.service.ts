import repo from './dispute.repo';
import { CustomError } from '@/utils/custom-error';
import { StatusCodes } from 'http-status-codes';
import { DB } from '@/database';
import { Op } from 'sequelize';
import {
    CreateDisputeRequest,
    UpdateDisputeRequest,
    AddDisputeMessageRequest,
    Dispute,
    DisputeStatus,
    DisputePriority,
} from '@/interfaces/dispute.interfaces';
import { saveFile } from '@/utils/storage.service';
import { createNotificationService } from '../notification/notification.service';
import { sendMail } from '@/utils/mailer';
import logger from '@/utils/logger';
import { emitToDispute } from '@/utils/socket';

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
    let student_id: string;
    let employer_id: string;

    if (userRole === 'student') {
        // Student is creating the dispute
        student_id = user_id;
        employer_id = job.employer_id;
    } else {
        // Employer is creating the dispute
        // Verify that the job belongs to this employer
        if (job.employer_id !== user_id) {
            throw new CustomError('You can only create disputes for jobs you posted', StatusCodes.FORBIDDEN);
        }
        
        employer_id = user_id;
        
        // Find student from job_application if provided
        if (data.job_application_id) {
            const jobApplication = await DB.JobApplications.findOne({
                where: { application_id: data.job_application_id, job_id: data.job_id },
            });
            if (!jobApplication) {
                throw new CustomError('Job application not found', StatusCodes.NOT_FOUND);
            }
            // Verify the application belongs to this job
            if (jobApplication.job_id !== data.job_id) {
                throw new CustomError('Job application does not belong to the selected job', StatusCodes.BAD_REQUEST);
            }
            student_id = jobApplication.student_id;
        } else {
            // If no job_application_id provided, try to find the first accepted application for this job
            const jobApplication = await DB.JobApplications.findOne({
                where: { 
                    job_id: data.job_id,
                    status: { [Op.in]: ['Accepted', 'Hired'] },
                },
                order: [['created_at', 'DESC']],
            });
            if (!jobApplication) {
                throw new CustomError('No accepted or hired student found for this job. Please specify a job application.', StatusCodes.BAD_REQUEST);
            }
            student_id = jobApplication.student_id;
        }
    }

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
                const uploadResult = await saveFile(file, 'dispute-evidence');
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

// Auto-assign moderator using Round Robin
const autoAssignModerator = async (dispute_id: string) => {
    // Find all admins with roleType 'admin' (not superadmin)
    const allAdmins = await DB.Users.findAll({
        include: [
            {
                model: DB.Roles,
                as: 'role',
                where: {
                    roleType: 'admin',
                },
                attributes: ['roleName', 'roleType', 'permission_json'],
            },
        ],
        attributes: ['user_id', 'full_name', 'email'],
    });

    // Filter admins that have dispute route permission
    const disputeAdmins: any[] = [];
    for (const admin of allAdmins) {
        const role = admin.role;
        if (!role) continue;

        // Parse permission_json
        const permissions: any[] =
            typeof role.permission_json === 'string'
                ? JSON.parse(role.permission_json)
                : role.permission_json || [];

        // Check if admin has dispute route permission (view or edit)
        const hasDisputePermission = permissions.some((perm: any) => {
            const permRoute = perm.route || '';
            const permActions = perm.permission || {};
            return (
                (permRoute === '/disputes' || permRoute.startsWith('/disputes')) &&
                (permActions.view === true || permActions.edit === true)
            );
        });

        if (hasDisputePermission) {
            disputeAdmins.push(admin);
        }
    }

    // If no admins with dispute permission, fall back to superadmin
    let moderator: any;
    if (disputeAdmins.length === 0) {
        const superAdmins = await DB.Users.findAll({
            include: [
                {
                    model: DB.Roles,
                    as: 'role',
                    where: {
                        roleType: 'superAdmin',
                    },
                    attributes: ['roleName', 'roleType'],
                },
            ],
            attributes: ['user_id', 'full_name', 'email'],
        });
        
        if (superAdmins.length === 0) {
            logger.warn('No moderators available for dispute assignment');
            return;
        }
        moderator = superAdmins[0];
    } else {
        // Round Robin: Get count of disputes assigned to each admin, then assign to the one with least
        const adminDisputeCounts = await Promise.all(
            disputeAdmins.map(async (admin) => {
                const count = await DB.Disputes.count({
                    where: {
                        moderator_id: admin.user_id,
                        status: { [Op.in]: ['Open', 'Under Review', 'Mediation'] },
                    },
                });
                return { admin, count };
            })
        );

        // Sort by count (ascending) and pick the first one (least disputes)
        adminDisputeCounts.sort((a, b) => a.count - b.count);
        moderator = adminDisputeCounts[0].admin;
    }

    await repo.assignModerator(dispute_id, moderator.user_id);

    // Update status to "Under Review" when moderator is assigned
    await repo.updateDispute(dispute_id, {
        status: 'Under Review',
        last_response_at: new Date(),
    });

    // Get moderator role to determine display name
    const moderatorUser = await DB.Users.findOne({
        where: { user_id: moderator.user_id },
        include: [
            {
                model: DB.Roles,
                as: 'role',
                attributes: ['roleName', 'roleType'],
            },
        ],
    });

    const moderatorDisplayRole = moderatorUser?.role?.roleType === 'superAdmin' ? 'superadmin' : 'Admin';

    await repo.addTimelineEvent({
        dispute_id,
        action: 'moderator_assigned',
        performed_by: moderator.user_id,
        performed_by_type: 'moderator',
        details: `${moderatorDisplayRole} ${moderator.full_name} assigned - Status changed to Under Review`,
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
export const getAllDisputesService = async (
    filters?: {
        status?: DisputeStatus | DisputeStatus[];
        priority?: DisputePriority;
        type?: string;
        page?: number;
        limit?: number;
    },
    user_id?: string,
    userRole?: string,
) => {
    // If user is student or employer, filter to only disputes they created (reported_by)
    let whereClause: any = {};
    if (user_id && userRole) {
        const normalizedRole = userRole.toLowerCase();
        if (normalizedRole === 'student' || normalizedRole === 'employer') {
            // Check if user is admin/superadmin by roleType
            const user = await DB.Users.findOne({
                where: { user_id },
                include: [
                    {
                        model: DB.Roles,
                        as: 'role',
                        attributes: ['roleName', 'roleType'],
                    },
                ],
            });

            const isAdmin = user?.role?.roleType === 'admin' || user?.role?.roleType === 'superAdmin';
            
            // If not admin/superadmin, filter to only disputes they created
            if (!isAdmin) {
                whereClause.reported_by = normalizedRole;
                if (normalizedRole === 'student') {
                    whereClause.student_id = user_id;
                } else {
                    whereClause.employer_id = user_id;
                }
            }
        }
    }

    // Merge with existing filters
    const finalFilters = {
        ...filters,
        ...whereClause,
    };

    const { rows, count } = await repo.findAllDisputes(finalFilters);
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
    // Admins and superadmins can see all disputes
    if (user_id && userRole) {
        // Superadmin can always access
        if (userRole.toLowerCase() === 'superadmin') {
            // Allow access
        } else {
            // Check if user is admin (by roleType, not roleName)
            const user = await DB.Users.findOne({
                where: { user_id },
                include: [
                    {
                        model: DB.Roles,
                        as: 'role',
                        attributes: ['roleName', 'roleType'],
                    },
                ],
            });

            const isAdmin = user?.role?.roleType === 'admin' || user?.role?.roleType === 'superAdmin';
            
            // If not admin/superadmin, check if user created the dispute
            if (!isAdmin) {
                if (dispute.reported_by === 'student' && dispute.student_id !== user_id) {
                    throw new CustomError('Access denied: You can only view disputes you created', StatusCodes.FORBIDDEN);
                }
                if (dispute.reported_by === 'employer' && dispute.employer_id !== user_id) {
                    throw new CustomError('Access denied: You can only view disputes you created', StatusCodes.FORBIDDEN);
                }
            }
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

// Update dispute (admin with dispute permission or superadmin only)
// Note: The middleware PermissionChecker('/disputes', 'edit') already verifies permissions
// This service check is a safety measure to ensure only admins/superadmin can update
export const updateDisputeService = async (
    dispute_id: string,
    data: UpdateDisputeRequest,
    user_id: string,
    userRole: string,
) => {
    // Superadmin can always update disputes
    if (userRole?.toLowerCase() === 'superadmin') {
        // Allow - superadmin bypasses all checks
    } else {
        // For other roles, verify they have admin roleType
        // The middleware already checked permissions, so if they reached here, they have dispute permission
        const user = await DB.Users.findOne({
            where: { user_id },
            include: [
                {
                    model: DB.Roles,
                    as: 'role',
                    attributes: ['roleName', 'roleType'],
                },
            ],
        });

        // Only admins (with roleType 'admin' or 'superAdmin') can update disputes
        // Students and employers are blocked by middleware, but this is an extra safety check
        if (!user?.role || (user.role.roleType !== 'admin' && user.role.roleType !== 'superAdmin')) {
            throw new CustomError('Only admins with dispute permission can update disputes', StatusCodes.FORBIDDEN);
        }
    }

    const existingDispute = await repo.findDisputeById(dispute_id);

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
    if (data.status && existingDispute && data.status !== existingDispute.status) {
        await notifyDisputeParties(dispute_id, 'updated');
    }

    return await repo.findDisputeById(dispute_id);
};

// Resolve dispute
// Note: The middleware PermissionChecker('/disputes', 'edit') already verifies permissions
// This service check is a safety measure to ensure only admins/superadmin can resolve
export const resolveDisputeService = async (
    dispute_id: string,
    resolution: 'Refunded' | 'Settled' | 'Dismissed' | 'Escalated',
    resolution_notes: string,
    user_id: string,
    userRole: string,
    refund_amount?: number,
) => {
    const dispute = await repo.findDisputeById(dispute_id);
    if (!dispute) {
        throw new CustomError('Dispute not found', StatusCodes.NOT_FOUND);
    }

    // Superadmin can always resolve disputes
    if (userRole?.toLowerCase() === 'superadmin') {
        // Allow - superadmin bypasses all checks
    } else {
        // For other roles, verify they have admin roleType
        // The middleware already checked permissions, so if they reached here, they have dispute permission
        const user = await DB.Users.findOne({
            where: { user_id },
            include: [
                {
                    model: DB.Roles,
                    as: 'role',
                    attributes: ['roleName', 'roleType'],
                },
            ],
        });

        // Only admins (with roleType 'admin' or 'superAdmin') can resolve disputes
        // Students and employers are blocked by middleware, but this is an extra safety check
        if (!user?.role || (user.role.roleType !== 'admin' && user.role.roleType !== 'superAdmin')) {
            throw new CustomError('Only admins with dispute permission can resolve disputes', StatusCodes.FORBIDDEN);
        }

        // Check if admin is assigned to this dispute (unless superadmin)
        if (dispute.moderator_id && dispute.moderator_id !== user_id) {
            throw new CustomError('Only the assigned moderator can resolve this dispute', StatusCodes.FORBIDDEN);
        }
    }

    await repo.resolveDispute(dispute_id, resolution, resolution_notes, refund_amount);

    // Get user info for timeline
    const resolvingUser = await DB.Users.findOne({
        where: { user_id },
        include: [
            {
                model: DB.Roles,
                as: 'role',
                attributes: ['roleName', 'roleType'],
            },
        ],
    });

    const adminDisplayRole = resolvingUser?.role?.roleType === 'superAdmin' ? 'superadmin' : 'Admin';
    const adminName = resolvingUser?.full_name || 'Admin';

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
    // Check if user is admin/superadmin by roleType (not roleName)
    let isModerator = false;
    if (userRole?.toLowerCase() === 'superadmin') {
        isModerator = true;
    } else {
        const user = await DB.Users.findOne({
            where: { user_id },
            include: [
                {
                    model: DB.Roles,
                    as: 'role',
                    attributes: ['roleName', 'roleType'],
                },
            ],
        });
        isModerator = user?.role?.roleType === 'admin' || user?.role?.roleType === 'superAdmin';
    }
    
    // Students and employers can only message disputes they created (reported_by)
    if (!isModerator) {
        if (dispute.reported_by === 'student' && dispute.student_id !== user_id) {
            throw new CustomError('Access denied: You can only message disputes you created', StatusCodes.FORBIDDEN);
        }
        if (dispute.reported_by === 'employer' && dispute.employer_id !== user_id) {
            throw new CustomError('Access denied: You can only message disputes you created', StatusCodes.FORBIDDEN);
        }
    } else {
        // Moderators can only message if they are assigned (unless superadmin)
        if (userRole?.toLowerCase() !== 'superadmin') {
            if (dispute.moderator_id && dispute.moderator_id !== user_id) {
                throw new CustomError('Access denied: Only the assigned moderator can message this dispute', StatusCodes.FORBIDDEN);
            }
        }
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

    // Emit real-time message to dispute room via Socket.IO
    try {
        // Get full message with sender details
        const fullMessage = await repo.getMessageById((message as any).message_id || (message as any).dataValues?.message_id);
        if (fullMessage) {
            emitToDispute(dispute_id, 'new_message', {
                message: fullMessage.toJSON ? fullMessage.toJSON() : fullMessage,
            });
        } else {
            // Fallback: emit with basic message data
            emitToDispute(dispute_id, 'new_message', {
                message: message.toJSON ? message.toJSON() : message,
            });
        }
    } catch (error) {
        logger.error('Failed to emit socket message:', error);
    }

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

    // Verify user has access - only the user who created the dispute can upload evidence
    if (dispute.reported_by === 'student' && dispute.student_id !== user_id) {
        throw new CustomError('Access denied: You can only upload evidence to disputes you created', StatusCodes.FORBIDDEN);
    }
    if (dispute.reported_by === 'employer' && dispute.employer_id !== user_id) {
        throw new CustomError('Access denied: You can only upload evidence to disputes you created', StatusCodes.FORBIDDEN);
    }

    const uploadResult = await saveFile(file, 'dispute-evidence');
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

        // Find all admins with dispute permission (same logic as autoAssignModerator)
        const allAdmins = await DB.Users.findAll({
            include: [
                {
                    model: DB.Roles,
                    as: 'role',
                    where: {
                        roleType: 'admin',
                    },
                    attributes: ['roleName', 'roleType', 'permission_json'],
                },
            ],
            attributes: ['user_id', 'full_name', 'email'],
        });

        // Filter admins that have dispute route permission
        const disputeAdmins: any[] = [];
        for (const admin of allAdmins) {
            const role = admin.role;
            if (!role) continue;

            // Parse permission_json
            const permissions: any[] =
                typeof role.permission_json === 'string'
                    ? JSON.parse(role.permission_json)
                    : role.permission_json || [];

            // Check if admin has dispute route permission
            const hasDisputePermission = permissions.some((perm: any) => {
                const permRoute = perm.route || '';
                const permActions = perm.permission || {};
                return (
                    (permRoute === '/disputes' || permRoute.startsWith('/disputes')) &&
                    (permActions.view === true || permActions.edit === true)
                );
            });

            if (hasDisputePermission && admin.user_id !== dispute.moderator_id) {
                disputeAdmins.push(admin);
            }
        }

        // Use Round Robin to find next available moderator
        if (disputeAdmins.length > 0) {
            const adminDisputeCounts = await Promise.all(
                disputeAdmins.map(async (admin) => {
                    const count = await DB.Disputes.count({
                        where: {
                            moderator_id: admin.user_id,
                            status: { [Op.in]: ['Open', 'Under Review', 'Mediation'] },
                        },
                    });
                    return { admin, count };
                })
            );

            adminDisputeCounts.sort((a, b) => a.count - b.count);
            const newModerator = adminDisputeCounts[0].admin;

            await repo.assignModerator(dispute.dispute_id, newModerator.user_id);
            await repo.addTimelineEvent({
                dispute_id: dispute.dispute_id,
                action: 'moderator_reassigned',
                performed_by: newModerator.user_id,
                performed_by_type: 'moderator',
                details: `Auto-reassigned to ${newModerator.full_name} due to 24hr no response`,
            });

            // Notify new moderator
            await createNotificationService({
                user_id: newModerator.user_id,
                type: 'system',
                title: 'Dispute Reassigned',
                message: 'A dispute has been reassigned to you due to no response from previous moderator.',
                related_id: dispute.dispute_id,
            });
        }
    }

    // Escalate disputes with no response for 48+ hours to superadmin
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
            await repo.escalateDispute(dispute.dispute_id, seniorAdmin.user_id, 0);
            
            await repo.addTimelineEvent({
                dispute_id: dispute.dispute_id,
                action: 'dispute_escalated',
                performed_by: seniorAdmin.user_id,
                performed_by_type: 'moderator',
                details: `Escalated to superadmin after 48 hours of no response`,
            });

            // Notify superadmin
            await createNotificationService({
                user_id: seniorAdmin.user_id,
                type: 'system',
                title: 'Dispute Escalated',
                message: 'A dispute has been escalated to you after 48 hours of no response.',
                related_id: dispute.dispute_id,
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
    const disputes = await repo.findDisputesByUser(user_id, role);
    return disputes; // Return array directly
};


