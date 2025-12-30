import { CustomError } from '@/utils/custom-error';
import { StatusCodes } from 'http-status-codes';
import { DB } from '@/database';
import { TrustScore, TrustScoreBreakdown } from '@/interfaces/trustScore.interfaces';

// Constants for TrustScore calculation
const EMAIL_VERIFICATION_WEIGHT = 33.33;
const PHONE_VERIFICATION_WEIGHT = 33.33;
const ACADEMIC_VERIFICATION_WEIGHT = 33.34;

/**
 * Calculate TrustScore breakdown based on verifications
 */
const calculateTrustScoreBreakdown = (
    emailVerified: boolean,
    phoneVerified: boolean,
    academicVerified: boolean,
): TrustScoreBreakdown => {
    const emailScore = emailVerified ? EMAIL_VERIFICATION_WEIGHT : 0;
    const phoneScore = phoneVerified ? PHONE_VERIFICATION_WEIGHT : 0;
    const academicScore = academicVerified ? ACADEMIC_VERIFICATION_WEIGHT : 0;

    const totalScore = emailScore + phoneScore + academicScore;

    return {
        email_verification_score: emailScore,
        phone_verification_score: phoneScore,
        academic_verification_score: academicScore,
        total_score: Math.round(totalScore * 100) / 100, // Round to 2 decimal places
    };
};

/**
 * Get TrustScore level and description based on score
 */
const getTrustScoreLevel = (
    score: number,
): { level: TrustScore['level']; description: string } => {
    if (score >= 85) {
        return {
            level: 'Exceptional',
            description:
                'Demonstrates outstanding verification status with all credentials verified. Trusted for leadership and high-value transactions.',
        };
    } else if (score >= 70) {
        return {
            level: 'Competent',
            description:
                'Reliable verification status. Performs well with majority of credentials verified.',
        };
    } else if (score >= 55) {
        return {
            level: 'Developing',
            description:
                'Shows potential with some verifications completed. Requires additional verification for full access.',
        };
    } else if (score >= 40) {
        return {
            level: 'Emerging',
            description:
                'Basic verification status. Limited verifications completed. High potential for growth.',
        };
    } else {
        return {
            level: 'Limited',
            description:
                'Insufficient verification status. Please complete email, phone, and academic verifications to improve your TrustScore.',
        };
    }
};

/**
 * Get TrustScore for a user
 */
export const getTrustScoreService = async (user_id: string): Promise<TrustScore> => {
    // Get user with all verification fields
    const user = await DB.Users.findOne({
        where: { user_id },
    });
    if (!user) {
        throw new CustomError('User not found', StatusCodes.NOT_FOUND);
    }

    // Check academic verification status
    const academicVerification = await DB.AcademicVerifications.findOne({
        where: { user_id },
    });

    const emailVerified = user.email_verified || false;
    const phoneVerified = user.phone_verified || false;
    const academicVerified =
        academicVerification?.status === 'accepted' ? true : false;

    // Calculate TrustScore breakdown
    const breakdown = calculateTrustScoreBreakdown(
        emailVerified,
        phoneVerified,
        academicVerified,
    );

    // Get TrustScore level
    const { level, description } = getTrustScoreLevel(breakdown.total_score);

    return {
        user_id,
        trust_score: breakdown.total_score,
        email_verified: emailVerified,
        phone_verified: phoneVerified,
        academic_verified: academicVerified,
        breakdown,
        level,
        description,
    };
};

/**
 * Get TrustScore for current authenticated user
 */
export const getMyTrustScoreService = async (
    user_id: string,
): Promise<TrustScore> => {
    return getTrustScoreService(user_id);
};

