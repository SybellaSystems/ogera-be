import { CustomError } from '@/utils/custom-error';
import { StatusCodes } from 'http-status-codes';
import { DB } from '@/database';
import { Op } from 'sequelize';
import {
    TrustScorePayload,
    TrustLevel,
    TrustScoreHistoryItem,
    LeaderboardStudentRow,
    TrustAdminSummary,
    AdminDashboardMetrics ,
} from '@/interfaces/trustScore.interfaces';

const W_I = 0.4;
const W_E = 0.35;
const W_C = 0.25;
const INTELLIGENCE_COGNITIVE_WEIGHT = 0.4;
const INTELLIGENCE_ACADEMIC_WEIGHT = 0.3;
const INTELLIGENCE_PROBLEM_SOLVING_WEIGHT = 0.3;

const clamp01 = (n: number): number => {
    if (Number.isNaN(n) || n < 0) return 0;
    if (n > 1) return 1;
    return n;
};

const round2 = (n: number): number => Math.round(n * 100) / 100;
const hasDiff = (a: number | null | undefined, b: number): boolean =>
    a == null || Math.abs(Number(a) - b) > 0.0001;

/**
 * Cognitive component:
 * - For repeated attempts of the same test, use only the latest attempt.
 * - Across different tests, average all latest test scores.
 */
const computeCognitiveIntelligence = async (user_id: string): Promise<number> => {
    const rows = await DB.UserTests.findAll({
        where: { user_id },
        attributes: [
            'test_id',
            'cognitive_test_id',
            'test_name',
            'score',
            'max_score',
            'taken_at',
            'created_at',
            'updated_at',
        ],
        order: [
            ['taken_at', 'DESC'],
            ['created_at', 'DESC'],
            ['updated_at', 'DESC'],
        ],
    });
    if (!rows.length) return 0;

    const latestAttemptPerTest = new Map<string, (typeof rows)[number]>();
    for (const r of rows) {
        const cognitiveTestId = r.get('cognitive_test_id');
        const testName = r.get('test_name');
        const testId = r.get('test_id');
        const testKey = String(cognitiveTestId || testName || testId || '');
        if (!testKey || latestAttemptPerTest.has(testKey)) continue;
        latestAttemptPerTest.set(testKey, r);
    }

    let sum = 0;
    let count = 0;
    for (const r of latestAttemptPerTest.values()) {
        const max = Number(r.get('max_score'));
        if (max == null || max <= 0) continue;
        const score = Number(r.get('score')) || 0;
        sum += clamp01(score / max);
        count += 1;
    }
    return count ? sum / count : 0;
};

/**
 * Academic component from dedicated academic_records table.
 * If multiple records exist, use average percentage.
 */
const computeAcademicIntelligence = async (user_id: string): Promise<number> => {
    const rows = await DB.AcademicRecords.findAll({
        where: { user_id },
        attributes: ['percentage'],
    });
    if (!rows.length) return 0;

    let sum = 0;
    let count = 0;
    for (const r of rows) {
        const percentage = Number(r.get('percentage'));
        if (!Number.isFinite(percentage)) continue;
        sum += clamp01(percentage / 100);
        count += 1;
    }

    return count ? sum / count : 0;
};

const PROBLEM_SOLVING_SKILL_REGEX =
    /\b(problem[\s-]?solving|analytical|critical thinking|reasoning|logic|troubleshooting|decision making)\b/i;
const PROFICIENCY_SCORE: Record<string, number> = {
    beginner: 0.25,
    intermediate: 0.5,
    advanced: 0.75,
    expert: 1,
};

/**
 * Problem-solving component from explicit problem-solving related skills.
 */
const computeProblemSolvingIntelligence = async (user_id: string): Promise<number> => {
    const rows = await DB.UserSkills.findAll({
        where: { user_id },
        attributes: ['skill_name', 'proficiency_level', 'years_of_experience'],
    });
    if (!rows.length) return 0;

    const matched = rows.filter((r) =>
        PROBLEM_SOLVING_SKILL_REGEX.test(String(r.get('skill_name') || '')),
    );
    if (!matched.length) return 0;

    let sum = 0;
    for (const r of matched) {
        const proficiency = String(r.get('proficiency_level') || '').toLowerCase();
        const proficiencyScore = PROFICIENCY_SCORE[proficiency] ?? 0.5;
        const years = Math.max(0, Number(r.get('years_of_experience')) || 0);
        const experienceScore = clamp01(years / 5);
        // Blend proficiency and practical years for a stable normalized score.
        sum += clamp01(proficiencyScore * 0.7 + experienceScore * 0.3);
    }

    return sum / matched.length;
};

/**
 * Problem metrics component:
 * - Every puzzle attempt counts.
 * - Average all attempt percentages for the final problem-metrics contribution.
 */
const computeProblemMetricIntelligence = async (user_id: string): Promise<number> => {
    const rows = await DB.UserTests.findAll({
        where: {
            user_id,
            problem_metric_id: { [Op.ne]: null },
        },
        attributes: ['score', 'max_score'],
    });
    if (!rows.length) return 0;

    let sum = 0;
    let count = 0;
    for (const r of rows) {
        const max = Number(r.get('max_score'));
        if (max == null || max <= 0) continue;
        const score = Number(r.get('score')) || 0;
        sum += clamp01(score / max);
        count += 1;
    }

    return count ? sum / count : 0;
};

/**
 * Intelligence (I) structure:
 * - 40% cognitive test performance
 * - 30% academic record
 * - 30% problem metrics puzzle performance
 */
const computeIntelligence = async (user_id: string): Promise<number> => {
    const [cognitive, academic, problemMetrics] = await Promise.all([
        computeCognitiveIntelligence(user_id),
        computeAcademicIntelligence(user_id),
        computeProblemMetricIntelligence(user_id),
    ]);

    return clamp01(
        cognitive * INTELLIGENCE_COGNITIVE_WEIGHT +
            academic * INTELLIGENCE_ACADEMIC_WEIGHT +
            problemMetrics * INTELLIGENCE_PROBLEM_SOLVING_WEIGHT,
    );
};

const EXPERIENCE_CATEGORY_WEIGHT = 0.2;
const INTERNSHIP_KEYWORD_REGEX = /\bintern(ship)?\b/i;
const getExperienceYearsBoost = (years: number): number => {
    if (years > 4) return 0.2;
    if (years >= 3) return 0.15;
    if (years >= 2) return 0.1;
    if (years >= 1) return 0.05;
    return 0;
};

/**
 * Experience (E) category caps (20% each):
 * - Resume uploaded
 * - At least one internship entry
 * - At least one project
 * - At least one accomplishment
 *
 * Multiple records in the same category do not increase E beyond that category cap.
 */
const computeExperience = async (user_id: string): Promise<number> => {
    const [user, extendedProfile, internshipEmploymentCount, projectCount, accomplishments] = await Promise.all([
        DB.Users.findOne({
            where: { user_id },
            attributes: ['resume_url'],
        }),
        DB.UserExtendedProfiles.findByPk(user_id, {
            attributes: ['total_experience_years'],
        }),
        DB.UserEmployments.count({
            where: { user_id, employment_type: 'internship' },
        }),
        DB.UserProjects.count({
            where: { user_id },
        }),
        DB.UserAccomplishments.findAll({
            where: { user_id },
            attributes: ['title', 'description', 'issuing_organization', 'credential_id'],
        }),
    ]);

    let experience = 0;
    const internshipCertificates = accomplishments.filter((a) => {
        const title = String(a.get('title') || '');
        const description = String(a.get('description') || '');
        const issuingOrg = String(a.get('issuing_organization') || '');
        const credentialId = String(a.get('credential_id') || '');
        const searchable = `${title} ${description} ${issuingOrg} ${credentialId}`;
        return INTERNSHIP_KEYWORD_REGEX.test(searchable);
    });
    const internshipCertificateCount = internshipCertificates.length;
    const nonInternshipAccomplishmentCount = accomplishments.length - internshipCertificateCount;
    const internshipCount = internshipEmploymentCount + internshipCertificateCount;

    if (user?.resume_url) experience += EXPERIENCE_CATEGORY_WEIGHT;
    if (internshipCount > 0) experience += EXPERIENCE_CATEGORY_WEIGHT;
    if (projectCount > 0) experience += EXPERIENCE_CATEGORY_WEIGHT;
    // Internship certificates count under internship category only, not accomplishment too.
    if (nonInternshipAccomplishmentCount > 0) {
        experience += EXPERIENCE_CATEGORY_WEIGHT;
    }
    experience += getExperienceYearsBoost(
        Math.max(0, Number(extendedProfile?.get('total_experience_years')) || 0),
    );

    return clamp01(experience);
};

/**
 * Interaction: AVG(rating) / 5 (ratings clamped to 0–5).
 */
const computeInteraction = async (user_id: string): Promise<number> => {
    // Count all published peer reviews received across all submitted links
    const reviewCount = await DB.PeerReviews.count({
        include: [
            {
                model: DB.StudentLinks,
                as: 'studentLink', // <-- use your association alias
                where: { user_id },
                attributes: [],
            },
        ],
        where: {
            status: 'published',
        },
    });

    if (reviewCount >= 5) {
        return 1; // 100%
    }

    return reviewCount * 0.2;
};

const trustScoreFromIEC = (I: number, E: number, C: number): number => {
    const raw = (W_I * I + W_E * E + W_C * C) * 100;
    return round2(Math.min(100, Math.max(0, raw)));
};

export const getTrustScoreLevel = (
    score: number,
): { level: TrustLevel; description: string } => {
    if (score >= 85) {
        return {
            level: 'Exceptional',
            description:
                'Outstanding balance of assessment results, portfolio completion, and peer feedback.',
        };
    }
    if (score >= 70) {
        return {
            level: 'Competent',
            description:
                'Strong trust profile; continue building projects and collaboration.',
        };
    }
    if (score >= 55) {
        return {
            level: 'Developing',
            description:
                'Good progress; focus on weaker areas below to move up a tier.',
        };
    }
    if (score >= 40) {
        return {
            level: 'Emerging',
            description:
                'Foundational trust; complete more projects and gather feedback.',
        };
    }
    return {
        level: 'Limited',
        description:
            'Limited data yet. Add assessments, projects, and ratings to improve your TrustScore.',
    };
};

const buildSuggestions = (I: number, E: number, C: number): string[] => {
    const out: string[] = [];
    if (E < 0.5) {
        out.push(
            '',
        );
    }
    if (C < 0.5) {
        out.push(
            '',
        );
    }
    if (I < 0.5) {
        out.push(
            '',
        );
    }
    if (!out.length) {
        out.push('Keep maintaining your profile, projects, and collaboration.');
    }
    return out;
};

const toPayload = (
    user_id: string,
    I: number,
    E: number,
    C: number,
    trust: number,
    level: TrustLevel,
    description: string,
    source: 'cached' | 'computed',
): TrustScorePayload => ({
    user_id,
    trust_score: trust,
    intelligence_score: round2(I),
    experience_score: round2(E),
    interaction_score: round2(C),
    // Weighted IEC contribution breakdown on a 0-100 trust scale.
    intelligence_percent: round2(I * 100),
    experience_percent: round2(E * 100),
    interaction_percent: round2(C * 100),
    level,
    description,
    suggestions: buildSuggestions(I, E, C),
    source,
});

/**
 * Recompute I/E/C from source tables (no DB write).
 */
export const computeTrustComponents = async (
    user_id: string,
): Promise<{ I: number; E: number; C: number; trust_score: number; level: TrustLevel; description: string }> => {
    const I = await computeIntelligence(user_id);
    const E = await computeExperience(user_id);
    const C = await computeInteraction(user_id);
    const trust_score = trustScoreFromIEC(I, E, C);
    const { level, description } = getTrustScoreLevel(trust_score);
    return { I, E, C, trust_score, level, description };
};

/**
 * GET trust score: use cached columns on `users` when present; otherwise live compute (not saved).
 */
export const getTrustScoreService = async (
    user_id: string,
): Promise<TrustScorePayload> => {
    const user = await DB.Users.findOne({ where: { user_id } });
    if (!user) {
        throw new CustomError('User not found', StatusCodes.NOT_FOUND);
    }

    const { I, E, C, trust_score, level, description } =
        await computeTrustComponents(user_id);

    // Keep cache in sync so UI does not show stale TrustScore after profile changes.
    if (
        hasDiff(user.intelligence_score, round2(I)) ||
        hasDiff(user.experience_score, round2(E)) ||
        hasDiff(user.interaction_score, round2(C)) ||
        hasDiff(user.trust_score, trust_score) ||
        (user.trust_level as TrustLevel | null) !== level
    ) {
        await user.update({
            intelligence_score: round2(I),
            experience_score: round2(E),
            interaction_score: round2(C),
            trust_score,
            trust_level: level,
        });
    }

    return toPayload(user_id, I, E, C, trust_score, level, description, 'computed');
};

export const getMyTrustScoreService = async (
    user_id: string,
): Promise<TrustScorePayload> => getTrustScoreService(user_id);

/**
 * POST/GET calculate: recompute, update users, append history.
 */
export const calculateTrustScoreService = async (
    user_id: string,
): Promise<TrustScorePayload> => {
    const user = await DB.Users.findOne({ where: { user_id } });
    if (!user) {
        throw new CustomError('User not found', StatusCodes.NOT_FOUND);
    }

    const { I, E, C, trust_score, level, description } =
        await computeTrustComponents(user_id);

    await user.update({
        intelligence_score: round2(I),
        experience_score: round2(E),
        interaction_score: round2(C),
        trust_score,
        trust_level: level,
    });

    await DB.TrustscoreHistory.create({
        user_id,
        intelligence_score: round2(I),
        experience_score: round2(E),
        interaction_score: round2(C),
        trust_score,
        trust_level: level,
        computed_at: new Date(),
    });

    return toPayload(user_id, I, E, C, trust_score, level, description, 'cached');
};

export const getTrustScoreHistoryService = async (
    user_id: string,
    limit = 20,
): Promise<TrustScoreHistoryItem[]> => {
    const rows = await DB.TrustscoreHistory.findAll({
        where: { user_id },
        order: [['computed_at', 'DESC']],
        limit: Math.min(Math.max(limit, 1), 100),
    });
    return rows.map((r) => ({
        history_id: r.history_id,
        user_id: r.user_id,
        intelligence_score: r.intelligence_score,
        experience_score: r.experience_score,
        interaction_score: r.interaction_score,
        trust_score: r.trust_score,
        trust_level: r.trust_level,
        computed_at: r.computed_at,
    }));
};

export const getStudentLeaderboardService = async (
    limit = 20,
): Promise<LeaderboardStudentRow[]> => {
    const take = Math.min(Math.max(limit, 1), 100);
    const rows = await DB.Users.findAll({
        where: {
            role_type: 'student',
            trust_score: { [Op.ne]: null },
        },
        attributes: ['user_id', 'full_name', 'email', 'trust_score', 'trust_level'],
        order: [['trust_score', 'DESC']],
        limit: take,
    });
    return rows.map((u) => ({
        user_id: u.user_id,
        full_name: u.full_name,
        email: u.email,
        trust_score: u.trust_score ?? null,
        trust_level: u.trust_level ?? null,
    }));
};

// export const getAdminTrustSummaryService = async (): Promise<TrustAdminSummary> => {
//     const students = await DB.Users.findAll({
//         where: { role_type: 'student' },
//         attributes: ['user_id', 'full_name', 'email', 'trust_score', 'trust_level'],
//     });

//     const withScore = students.filter(
//         (s) => s.trust_score != null && !Number.isNaN(Number(s.trust_score)),
//     );
//     const scores = withScore.map((s) => Number(s.trust_score));
//     const avg =
//         scores.length > 0
//             ? round2(scores.reduce((a, b) => a + b, 0) / scores.length)
//             : null;

//     const top_users = [...withScore]
//         .sort((a, b) => Number(b.trust_score) - Number(a.trust_score))
//         .slice(0, 5)
//         .map((u) => ({
//             user_id: u.user_id,
//             full_name: u.full_name,
//             email: u.email,
//             trust_score: u.trust_score ?? null,
//             trust_level: u.trust_level ?? null,
//         }));

//     const buckets = [
//         { label: 'Limited (<40)', min: 0, max: 39.99 },
//         { label: 'Emerging (40–54)', min: 40, max: 54.99 },
//         { label: 'Developing (55–69)', min: 55, max: 69.99 },
//         { label: 'Competent (70–84)', min: 70, max: 84.99 },
//         { label: 'Exceptional (85+)', min: 85, max: 100 },
//     ];

//     const distribution = buckets.map((b) => ({
//         label: b.label,
//         min: b.min,
//         max: b.max,
//         count: scores.filter((s) => s >= b.min && s <= b.max).length,
//     }));

//     return {
//         average_trust_score: avg,
//         students_with_score: withScore.length,
//         top_users,
//         distribution,
//     };
// };

// export const getAdminTrustSummaryService =
//     async (): Promise<TrustAdminSummary> => {
//         const students = await DB.Users.findAll({
//             where: {
//                 role_type: 'student',
//             },
//             attributes: [
//                 'user_id',
//                 'full_name',
//                 'email',
//                 'trust_score',
//                 'trust_level',
//             ],
//         });

//         // ----------------------------------------
//         // Get students having a valid trust score
//         // ----------------------------------------
//         const scoredStudents = students
//             .filter((student) => {
//                 if (student.trust_score == null) {
//                     return false;
//                 }

//                 const score = Number(student.trust_score);

//                 return !Number.isNaN(score);
//             })
//             .map((student) => ({
//                 user_id: student.user_id,
//                 full_name: student.full_name,
//                 email: student.email,
//                 trust_score: Number(student.trust_score),
//                 trust_level: student.trust_level ?? null,
//             }));

//         // ----------------------------------------
//         // Get TOP 5 students
//         // ----------------------------------------
//         const top_users = [...scoredStudents]
//             .sort(
//                 (a, b) =>
//                     b.trust_score - a.trust_score,
//             )
//             .slice(0, 5);

//         // ----------------------------------------
//         // Use ONLY top 5 for calculations
//         // ----------------------------------------
//         const topScores = top_users.map(
//             (student) => student.trust_score,
//         );

//         // ----------------------------------------
//         // Average trust score of TOP 5
//         // ----------------------------------------
//         const average_trust_score =
//             topScores.length > 0
//                 ? round2(
//                       topScores.reduce(
//                           (total, score) => total + score,
//                           0,
//                       ) / topScores.length,
//                   )
//                 : null;

//         // ----------------------------------------
//         // Distribution based on TOP 5
//         // ----------------------------------------
//         const buckets = [
//             {
//                 label: 'Limited (<40)',
//                 min: 0,
//                 max: 39.99,
//             },
//             {
//                 label: 'Emerging (40–54)',
//                 min: 40,
//                 max: 54.99,
//             },
//             {
//                 label: 'Developing (55–69)',
//                 min: 55,
//                 max: 69.99,
//             },
//             {
//                 label: 'Competent (70–84)',
//                 min: 70,
//                 max: 84.99,
//             },
//             {
//                 label: 'Exceptional (85+)',
//                 min: 85,
//                 max: 100,
//             },
//         ];

//         const distribution = buckets.map((bucket) => ({
//             label: bucket.label,
//             min: bucket.min,
//             max: bucket.max,
//             count: topScores.filter(
//                 (score) =>
//                     score >= bucket.min &&
//                     score <= bucket.max,
//             ).length,
//         }));

//         // ----------------------------------------
//         // Return summary
//         // ----------------------------------------
//         return {
//             average_trust_score,
//             students_with_score: top_users.length,
//             top_users,
//             distribution,
//         };
//     };

    export const getAdminTrustSummaryService =
    async (): Promise<TrustAdminSummary> => {
        // ============================================================
        // 1. GET STUDENTS FOR TRUST SCORE ANALYTICS
        // ============================================================

        const students = await DB.Users.findAll({
            where: {
                role_type: 'student',
            },
            attributes: [
                'user_id',
                'full_name',
                'email',
                'trust_score',
                'trust_level',
            ],
        });

        // ============================================================
        // 2. GET STUDENTS HAVING A VALID TRUST SCORE
        // ============================================================

        const scoredStudents = students
            .filter((student) => {
                if (student.trust_score == null) {
                    return false;
                }

                const score = Number(student.trust_score);

                return Number.isFinite(score);
            })
            .map((student) => ({
                user_id: student.user_id,
                full_name: student.full_name,
                email: student.email,
                trust_score: Number(student.trust_score),
                trust_level: student.trust_level ?? null,
            }));

        // ============================================================
        // 3. TOP 5 STUDENTS BY TRUST SCORE
        // ============================================================

        const top_users = [...scoredStudents]
            .sort(
                (a, b) =>
                    b.trust_score - a.trust_score,
            )
            .slice(0, 5);

        // ============================================================
        // 4. TRUST SCORE CALCULATIONS BASED ON TOP 5
        // ============================================================

        const topScores = top_users.map(
            (student) => student.trust_score,
        );

        const average_trust_score =
            topScores.length > 0
                ? round2(
                      topScores.reduce(
                          (total, score) => total + score,
                          0,
                      ) / topScores.length,
                  )
                : null;

        // ============================================================
        // 5. TRUST SCORE DISTRIBUTION
        // ============================================================

        const buckets = [
            {
                label: 'Limited (<40)',
                min: 0,
                max: 39.99,
            },
            {
                label: 'Emerging (40–54)',
                min: 40,
                max: 54.99,
            },
            {
                label: 'Developing (55–69)',
                min: 55,
                max: 69.99,
            },
            {
                label: 'Competent (70–84)',
                min: 70,
                max: 84.99,
            },
            {
                label: 'Exceptional (85+)',
                min: 85,
                max: 100,
            },
        ];

        const distribution = buckets.map((bucket) => ({
            label: bucket.label,
            min: bucket.min,
            max: bucket.max,
            count: topScores.filter(
                (score) =>
                    score >= bucket.min &&
                    score <= bucket.max,
            ).length,
        }));

        // ============================================================
        // 6. DATE RANGES
        // ============================================================

        const now = new Date();

        // Start of current month
        const currentMonthStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            1,
        );

        // Start of previous month
        const previousMonthStart = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            1,
        );

        // ============================================================
        // 7. TOTAL STUDENTS
        // ============================================================

        const total_students = await DB.Users.count({
            where: {
                role_type: 'student',
            },
        });

        // ============================================================
        // 8. TOTAL EMPLOYERS
        // ============================================================

        const total_employers = await DB.Users.count({
            where: {
                role_type: 'employer',
            },
        });

        // ============================================================
        // 9. TOTAL USERS
        //    Only students + employers
        //    Admin/superAdmin are NOT included
        // ============================================================

        const total_users =
            total_students + total_employers;

        // ============================================================
        // 10. USERS BEFORE CURRENT MONTH
        //
        // This gives us the total user count at the end of
        // the previous month.
        // ============================================================

        const studentsBeforeCurrentMonth =
            await DB.Users.count({
                where: {
                    role_type: 'student',
                    created_at: {
                        [Op.lt]: currentMonthStart,
                    },
                },
            });

        const employersBeforeCurrentMonth =
            await DB.Users.count({
                where: {
                    role_type: 'employer',
                    created_at: {
                        [Op.lt]: currentMonthStart,
                    },
                },
            });

        const previousMonthTotalUsers =
            studentsBeforeCurrentMonth +
            employersBeforeCurrentMonth;

        // ============================================================
        // 11. USER GROWTH %
        //
        // Example:
        // Previous total = 100
        // Current total  = 120
        //
        // Growth = ((120 - 100) / 100) * 100
        //        = 20%
        // ============================================================

        const user_growth_percent =
            previousMonthTotalUsers > 0
                ? round2(
                      ((total_users -
                          previousMonthTotalUsers) /
                          previousMonthTotalUsers) *
                          100,
                  )
                : total_users > 0
                  ? 100
                  : 0;

        // ============================================================
        // 12. TOTAL JOBS POSTED
        // ============================================================

        const total_jobs_posted =
            await DB.Jobs.count();

        // ============================================================
        // 13. JOBS BEFORE CURRENT MONTH
        //
        // This gives the total number of jobs that existed
        // before the current month.
        // ============================================================

        const previousMonthTotalJobs =
            await DB.Jobs.count({
                where: {
                    created_at: {
                        [Op.lt]: currentMonthStart,
                    },
                },
            });

        // ============================================================
        // 14. JOB GROWTH %
        // ============================================================

        const job_growth_percent =
            previousMonthTotalJobs > 0
                ? round2(
                      ((total_jobs_posted -
                          previousMonthTotalJobs) /
                          previousMonthTotalJobs) *
                          100,
                  )
                : total_jobs_posted > 0
                  ? 100
                  : 0;

        // ============================================================
        // 15. RETURN EVERYTHING
        // ============================================================

        return {
            // Existing TrustScore data
            average_trust_score,
            students_with_score: top_users.length,
            top_users,
            distribution,

            // User analytics
            total_users,
            total_students,
            total_employers,
            user_growth_percent,

            // Job analytics
            total_jobs_posted,
            job_growth_percent,
        };
    };
    
