import { CustomError } from '@/utils/custom-error';
import { StatusCodes } from 'http-status-codes';
import { DB } from '@/database';
import { Op, Sequelize } from 'sequelize';
import { calculateTrustScoreService } from '@/modules/trustScore/trustScore.service';
import type { ProblemMetricCategory } from '@/database/models/problemMetric.model';
import type { ProblemPuzzleDifficulty } from '@/database/models/problemPuzzleQuestion.model';

const validCategory = (c: string): c is ProblemMetricCategory =>
    ['visual_puzzle', 'situational_puzzle', 'riddle', 'other'].includes(c);

const validDifficulty = (d: string): d is ProblemPuzzleDifficulty =>
    ['easy', 'medium', 'hard'].includes(d);

const CATEGORY_CONTENT_RULES: Record<
    Exclude<ProblemMetricCategory, 'other'>,
    { label: string; regex: RegExp }
> = {
    visual_puzzle: {
        label: 'visual puzzle',
        regex: /\b(image|picture|shape|pattern|diagram|figure|symbol|visual|mirror|rotate|rotation|sequence|grid|spot|match)\b/i,
    },
    situational_puzzle: {
        label: 'situational puzzle',
        regex: /\b(situation|scenario|case|response|reaction|decision|choice|action|best step|next step|what should|should you)\b/i,
    },
    riddle: {
        label: 'riddle',
        regex: /\b(riddle|guess|wordplay|clue|hint|who am i|what am i|answer this)\b/i,
    },
};

const buildQuestionText = (body: {
    prompt?: string;
    option_a?: string;
    option_b?: string;
    option_c?: string;
    option_d?: string;
}) =>
    [body.prompt, body.option_a, body.option_b, body.option_c, body.option_d]
        .filter(Boolean)
        .join(' ')
        .trim();

const validateQuestionMatchesCategory = (
    category: ProblemMetricCategory,
    body: {
        prompt?: string;
        option_a?: string;
        option_b?: string;
        option_c?: string;
        option_d?: string;
    },
) => {
    if (category === 'other') return;

    const rule = CATEGORY_CONTENT_RULES[category];
    const text = buildQuestionText(body);
    if (!text || rule.regex.test(text)) return;

    throw new CustomError(
        `This ${rule.label} set only accepts ${rule.label} questions. Please enter a matching question.`,
        StatusCodes.BAD_REQUEST,
    );
};

export const getProblemMetricAdminService = async (
    problem_metric_id: string,
) => {
    const metric = await DB.ProblemMetrics.findByPk(problem_metric_id, {
        include: [
            {
                model: DB.ProblemMetricQuestions,
                as: 'questions',
                separate: true,
                order: [
                    ['sort_order', 'ASC'],
                    ['created_at', 'ASC'],
                ],
            },
        ],
    });
    if (!metric) {
        throw new CustomError(
            'Problem metric not found',
            StatusCodes.NOT_FOUND,
        );
    }
    return metric.get({ plain: true });
};

export const createProblemMetricService = async (
    body: { title: string; description?: string; category?: string },
    created_by: string,
) => {
    const { title, description, category = 'visual_puzzle' } = body;
    if (!title?.trim()) {
        throw new CustomError('Title is required', StatusCodes.BAD_REQUEST);
    }
    if (!validCategory(category)) {
        throw new CustomError('Invalid category', StatusCodes.BAD_REQUEST);
    }
    const row = await DB.ProblemMetrics.create({
        title: title.trim(),
        description: description?.trim() || null,
        category,
        published: false,
        created_by,
    });
    return getProblemMetricAdminService(row.problem_metric_id);
};

export const listProblemMetricsAdminService = async ({
    category,
    search,
    page,
    limit,
}: {
    category?: string;
    search?: string;
    page: number;
    limit: number;
}) => {
    if (category && !validCategory(category)) {
        throw new CustomError('Invalid category', StatusCodes.BAD_REQUEST);
    }

    const where: Record<string | symbol, unknown> = {};
    if (category) where.category = category;
    if (search?.trim()) {
        const searchTerm = `%${search.trim()}%`;
        where[Op.or] = [
            { title: { [Op.iLike]: searchTerm } },
            Sequelize.where(Sequelize.cast(Sequelize.col('category'), 'text'), {
                [Op.iLike]: searchTerm,
            }),
            { description: { [Op.iLike]: searchTerm } },
        ];
    }

    const { rows, count } = await DB.ProblemMetrics.findAndCountAll({
        where,
        order: [['updated_at', 'DESC']],
        limit,
        offset: (page - 1) * limit,
        distinct: true,
        include: [
            {
                model: DB.ProblemMetricQuestions,
                as: 'questions',
                attributes: ['question_id'],
            },
        ],
    });
    const data = rows.map(r => {
        const plain = r.get({ plain: true }) as any;
        return {
            problem_metric_id: plain.problem_metric_id,
            title: plain.title,
            description: plain.description,
            category: plain.category,
            published: plain.published,
            created_by: plain.created_by,
            question_count: plain.questions?.length ?? 0,
            updated_at: plain.updated_at,
            created_at: plain.created_at,
        };
    });

    return {
        data,
        pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
        },
    };
};

export const updateProblemMetricService = async (
    problem_metric_id: string,
    body: {
        title?: string;
        description?: string | null;
        category?: string;
        published?: boolean;
    },
) => {
    const metric = await DB.ProblemMetrics.findByPk(problem_metric_id);
    if (!metric) {
        throw new CustomError(
            'Problem metric not found',
            StatusCodes.NOT_FOUND,
        );
    }
    const patch: Record<string, unknown> = {};
    if (body.title !== undefined) {
        if (!String(body.title).trim()) {
            throw new CustomError(
                'Title cannot be empty',
                StatusCodes.BAD_REQUEST,
            );
        }
        patch.title = String(body.title).trim();
    }
    if (body.description !== undefined) {
        patch.description =
            body.description === null || body.description === ''
                ? null
                : String(body.description).trim();
    }
    if (body.category !== undefined) {
        if (!validCategory(body.category)) {
            throw new CustomError('Invalid category', StatusCodes.BAD_REQUEST);
        }
        if (body.category !== 'other') {
            const questions = await DB.ProblemMetricQuestions.findAll({
                where: { problem_metric_id },
                attributes: [
                    'prompt',
                    'option_a',
                    'option_b',
                    'option_c',
                    'option_d',
                ],
            });
            for (const question of questions) {
                validateQuestionMatchesCategory(body.category, {
                    prompt: String(question.get('prompt') || ''),
                    option_a: String(question.get('option_a') || ''),
                    option_b: String(question.get('option_b') || ''),
                    option_c: String(question.get('option_c') || ''),
                    option_d: String(question.get('option_d') || ''),
                });
            }
        }
        patch.category = body.category;
    }
    if (body.published !== undefined) {
        patch.published = Boolean(body.published);
    }
    await metric.update(patch);
    return getProblemMetricAdminService(problem_metric_id);
};

export const deleteProblemMetricService = async (problem_metric_id: string) => {
    const metric = await DB.ProblemMetrics.findByPk(problem_metric_id);
    if (!metric) {
        throw new CustomError(
            'Problem metric not found',
            StatusCodes.NOT_FOUND,
        );
    }
    await metric.destroy();
    return { deleted: true };
};

export const addProblemMetricQuestionService = async (
    problem_metric_id: string,
    body: {
        prompt: string;
        option_a: string;
        option_b: string;
        option_c: string;
        option_d: string;
        correct_index: number;
        difficulty?: string;
        sort_order?: number;
    },
) => {
    const metric = await DB.ProblemMetrics.findByPk(problem_metric_id);
    if (!metric) {
        throw new CustomError(
            'Problem metric not found',
            StatusCodes.NOT_FOUND,
        );
    }
    const {
        prompt,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_index,
        difficulty = 'medium',
        sort_order,
    } = body;
    if (!prompt?.trim()) {
        throw new CustomError('Prompt is required', StatusCodes.BAD_REQUEST);
    }
    for (const [k, v] of Object.entries({
        option_a,
        option_b,
        option_c,
        option_d,
    })) {
        if (v == null || !String(v).trim()) {
            throw new CustomError(`${k} is required`, StatusCodes.BAD_REQUEST);
        }
    }
    const ci = Number(correct_index);
    if (!Number.isInteger(ci) || ci < 0 || ci > 3) {
        throw new CustomError(
            'correct_index must be 0–3',
            StatusCodes.BAD_REQUEST,
        );
    }
    if (!validDifficulty(difficulty)) {
        throw new CustomError('Invalid difficulty', StatusCodes.BAD_REQUEST);
    }
    validateQuestionMatchesCategory(metric.category, {
        prompt,
        option_a,
        option_b,
        option_c,
        option_d,
    });

    let order = sort_order;
    if (order === undefined || order === null) {
        const max = await DB.ProblemMetricQuestions.max('sort_order', {
            where: { problem_metric_id },
        });
        order = (typeof max === 'number' ? max : 0) + 1;
    }

    await DB.ProblemMetricQuestions.create({
        problem_metric_id,
        prompt: prompt.trim(),
        option_a: String(option_a).trim(),
        option_b: String(option_b).trim(),
        option_c: String(option_c).trim(),
        option_d: String(option_d).trim(),
        correct_index: ci,
        difficulty,
        sort_order: order,
    });

    return getProblemMetricAdminService(problem_metric_id);
};

export const updateProblemMetricQuestionService = async (
    problem_metric_id: string,
    question_id: string,
    body: Partial<{
        prompt: string;
        option_a: string;
        option_b: string;
        option_c: string;
        option_d: string;
        correct_index: number;
        difficulty: string;
        sort_order: number;
    }>,
) => {
    const q = await DB.ProblemMetricQuestions.findOne({
        where: { question_id, problem_metric_id },
    });
    if (!q) {
        throw new CustomError('Question not found', StatusCodes.NOT_FOUND);
    }
    const metric = await DB.ProblemMetrics.findByPk(problem_metric_id);
    if (!metric) {
        throw new CustomError(
            'Problem metric not found',
            StatusCodes.NOT_FOUND,
        );
    }
    const patch: Record<string, unknown> = {};
    if (body.prompt !== undefined) {
        if (!String(body.prompt).trim()) {
            throw new CustomError(
                'Prompt cannot be empty',
                StatusCodes.BAD_REQUEST,
            );
        }
        patch.prompt = String(body.prompt).trim();
    }
    for (const key of [
        'option_a',
        'option_b',
        'option_c',
        'option_d',
    ] as const) {
        if (body[key] !== undefined) {
            if (!String(body[key]).trim()) {
                throw new CustomError(
                    `${key} cannot be empty`,
                    StatusCodes.BAD_REQUEST,
                );
            }
            patch[key] = String(body[key]).trim();
        }
    }
    if (body.correct_index !== undefined) {
        const ci = Number(body.correct_index);
        if (!Number.isInteger(ci) || ci < 0 || ci > 3) {
            throw new CustomError(
                'correct_index must be 0–3',
                StatusCodes.BAD_REQUEST,
            );
        }
        patch.correct_index = ci;
    }
    if (body.difficulty !== undefined) {
        if (!validDifficulty(body.difficulty)) {
            throw new CustomError(
                'Invalid difficulty',
                StatusCodes.BAD_REQUEST,
            );
        }
        patch.difficulty = body.difficulty;
    }
    if (body.sort_order !== undefined) {
        patch.sort_order = Number(body.sort_order);
    }
    validateQuestionMatchesCategory(metric.category, {
        prompt:
            body.prompt !== undefined
                ? String(body.prompt)
                : String(q.get('prompt') || ''),
        option_a:
            body.option_a !== undefined
                ? String(body.option_a)
                : String(q.get('option_a') || ''),
        option_b:
            body.option_b !== undefined
                ? String(body.option_b)
                : String(q.get('option_b') || ''),
        option_c:
            body.option_c !== undefined
                ? String(body.option_c)
                : String(q.get('option_c') || ''),
        option_d:
            body.option_d !== undefined
                ? String(body.option_d)
                : String(q.get('option_d') || ''),
    });
    await q.update(patch);
    return getProblemMetricAdminService(problem_metric_id);
};

export const deleteProblemMetricQuestionService = async (
    problem_metric_id: string,
    question_id: string,
) => {
    const q = await DB.ProblemMetricQuestions.findOne({
        where: { question_id, problem_metric_id },
    });
    if (!q) {
        throw new CustomError('Question not found', StatusCodes.NOT_FOUND);
    }
    await q.destroy();
    return getProblemMetricAdminService(problem_metric_id);
};

export const listPublishedProblemMetricsService = async () => {
    const rows = await DB.ProblemMetrics.findAll({
        where: { published: true },
        attributes: [
            'problem_metric_id',
            'title',
            'description',
            'category',
            'updated_at',
        ],
        include: [
            {
                model: DB.ProblemMetricQuestions,
                as: 'questions',
                attributes: ['question_id'],
            },
        ],
        order: [['title', 'ASC']],
    });
    return rows.map(r => {
        const plain = r.get({ plain: true }) as any;
        return {
            problem_metric_id: plain.problem_metric_id,
            title: plain.title,
            description: plain.description,
            category: plain.category,
            question_count: plain.questions?.length ?? 0,
            updated_at: plain.updated_at,
        };
    });
};

export const getPublishedProblemMetricForAttemptService = async (
    problem_metric_id: string,
) => {
    const metric = await DB.ProblemMetrics.findOne({
        where: { problem_metric_id, published: true },
        include: [
            {
                model: DB.ProblemMetricQuestions,
                as: 'questions',
                separate: true,
                order: [
                    ['sort_order', 'ASC'],
                    ['created_at', 'ASC'],
                ],
                attributes: [
                    'question_id',
                    'prompt',
                    'option_a',
                    'option_b',
                    'option_c',
                    'option_d',
                    'difficulty',
                    'sort_order',
                ],
            },
        ],
    });
    if (!metric) {
        throw new CustomError(
            'Problem metric not found or not published',
            StatusCodes.NOT_FOUND,
        );
    }
    const plain = metric.get({ plain: true }) as any;
    if (!plain.questions?.length) {
        throw new CustomError(
            'This problem metric has no questions yet',
            StatusCodes.BAD_REQUEST,
        );
    }
    return {
        problem_metric_id: plain.problem_metric_id,
        title: plain.title,
        description: plain.description,
        category: plain.category,
        questions: plain.questions,
    };
};

export const submitProblemMetricAttemptService = async (
    user_id: string,
    problem_metric_id: string,
    answers: Record<string, number>,
) => {
    const metric = await DB.ProblemMetrics.findOne({
        where: { problem_metric_id, published: true },
        include: [
            {
                model: DB.ProblemMetricQuestions,
                as: 'questions',
            },
        ],
    });
    if (!metric) {
        throw new CustomError(
            'Problem metric not found or not published',
            StatusCodes.NOT_FOUND,
        );
    }
    const questions = (metric as any).questions as Array<{
        question_id: string;
        correct_index: number;
    }>;
    if (!questions?.length) {
        throw new CustomError(
            'This problem metric has no questions',
            StatusCodes.BAD_REQUEST,
        );
    }

    const qIds = new Set(questions.map(q => q.question_id));
    for (const id of qIds) {
        if (!(id in answers)) {
            throw new CustomError(
                'Answer every question',
                StatusCodes.BAD_REQUEST,
            );
        }
        const idx = Number(answers[id]);
        if (!Number.isInteger(idx) || idx < 0 || idx > 3) {
            throw new CustomError(
                `Invalid answer for question ${id}`,
                StatusCodes.BAD_REQUEST,
            );
        }
    }
    for (const k of Object.keys(answers)) {
        if (!qIds.has(k)) {
            throw new CustomError(
                `Unknown question ${k}`,
                StatusCodes.BAD_REQUEST,
            );
        }
    }

    let correct = 0;
    for (const q of questions) {
        if (Number(answers[q.question_id]) === Number(q.correct_index)) {
            correct += 1;
        }
    }

    const max_score = questions.length;
    const score = correct;

    await DB.UserTests.create({
        user_id,
        problem_metric_id,
        test_name: metric.get('title') as string,
        score,
        max_score,
        taken_at: new Date(),
    });

    await calculateTrustScoreService(user_id);

    return {
        score,
        max_score,
        percentage:
            max_score > 0 ? Math.round((score / max_score) * 10000) / 100 : 0,
        problem_metric_id,
        title: metric.get('title'),
    };
};

export const getMyProblemMetricAttemptHistoryService = async (
    user_id: string,
) => {
    const rows = await DB.UserTests.findAll({
        where: { user_id, problem_metric_id: { [DB.Sequelize.Op.ne]: null } },
        include: [
            {
                model: DB.ProblemMetrics,
                as: 'problemMetric',
                attributes: ['problem_metric_id', 'title', 'category'],
                required: false,
            },
        ],
        order: [
            ['taken_at', 'DESC'],
            ['created_at', 'DESC'],
        ],
    });

    return rows.map((r: any) => {
        const score = Number(r.score) || 0;
        const max = Number(r.max_score) || 0;
        const percentage =
            max > 0 ? Math.round((score / max) * 10000) / 100 : 0;
        const metric = r.problemMetric;
        return {
            test_id: r.test_id,
            problem_metric_id: r.problem_metric_id,
            title:
                metric?.title ||
                r.test_name ||
                `Problem metric ${String(r.problem_metric_id || '').slice(
                    0,
                    8,
                )}`,
            category: metric?.category || 'other',
            score,
            max_score: max,
            percentage,
            taken_at: r.taken_at || r.created_at,
        };
    });
};
