import { CustomError } from '@/utils/custom-error';
import { StatusCodes } from 'http-status-codes';
import { DB } from '@/database';
import { Op, Sequelize } from 'sequelize';
import { calculateTrustScoreService } from '@/modules/trustScore/trustScore.service';
import type { CognitiveTestCategory } from '@/database/models/cognitiveTest.model';
import type { QuestionDifficulty } from '@/database/models/cognitiveQuestion.model';

const validCategory = (c: string): c is CognitiveTestCategory =>
    ['numerical', 'verbal', 'logical', 'mixed'].includes(c);

const validDifficulty = (d: string): d is QuestionDifficulty =>
    ['easy', 'medium', 'hard'].includes(d);

const CATEGORY_CONTENT_RULES: Record<
    Exclude<CognitiveTestCategory, 'mixed'>,
    { label: string; regex: RegExp }
> = {
    numerical: {
        label: 'numerical',
        regex: /\b(\d+|number|sum|total|difference|multiply|division|ratio|percent|percentage|equation|calculate|math|average|sequence)\b/i,
    },
    verbal: {
        label: 'verbal',
        regex: /\b(word|meaning|synonym|antonym|sentence|grammar|vocabulary|passage|reading|spelling|language|statement|paragraph)\b/i,
    },
    logical: {
        label: 'logical',
        regex: /\b(logic|logical|reason|reasoning|pattern|sequence|rule|arrangement|deduction|conclusion|inference|relationship)\b/i,
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
    category: CognitiveTestCategory,
    body: {
        prompt?: string;
        option_a?: string;
        option_b?: string;
        option_c?: string;
        option_d?: string;
    },
) => {
    if (category === 'mixed') return;

    const rule = CATEGORY_CONTENT_RULES[category];
    const text = buildQuestionText(body);
    if (!text || rule.regex.test(text)) return;

    throw new CustomError(
        `This ${rule.label} cognitive test only accepts ${rule.label} questions. Please enter a matching question.`,
        StatusCodes.BAD_REQUEST,
    );
};

export const getCognitiveTestAdminService = async (cognitive_test_id: string) => {
    const test = await DB.CognitiveTests.findByPk(cognitive_test_id, {
        include: [
            {
                model: DB.CognitiveQuestions,
                as: 'questions',
                separate: true,
                order: [
                    ['sort_order', 'ASC'],
                    ['created_at', 'ASC'],
                ],
            },
        ],
    });
    if (!test) {
        throw new CustomError('Cognitive test not found', StatusCodes.NOT_FOUND);
    }
    return test.get({ plain: true });
};

export const createCognitiveTestService = async (
    body: { title: string; description?: string; category?: string },
    created_by: string,
) => {
    const { title, description, category = 'numerical' } = body;
    if (!title?.trim()) {
        throw new CustomError('Title is required', StatusCodes.BAD_REQUEST);
    }
    if (!validCategory(category)) {
        throw new CustomError('Invalid category', StatusCodes.BAD_REQUEST);
    }
    const row = await DB.CognitiveTests.create({
        title: title.trim(),
        description: description?.trim() || null,
        category,
        published: false,
        created_by,
    });
    return getCognitiveTestAdminService(row.cognitive_test_id);
};

export const listCognitiveTestsAdminService = async ({
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
        where[Op.or] = [
            { title: { [Op.iLike]: `%${search.trim()}%` } },
            Sequelize.where(
                Sequelize.cast(Sequelize.col('category'), 'text'),
                { [Op.iLike]: `%${search.trim()}%` },
            ),
            { description: { [Op.iLike]: `%${search.trim()}%` } },
        ];
    }

    const { rows, count } = await DB.CognitiveTests.findAndCountAll({
        where,
        order: [['updated_at', 'DESC']],
        limit,
        offset: (page - 1) * limit,
        distinct: true,
        include: [
            {
                model: DB.CognitiveQuestions,
                as: 'questions',
                attributes: ['question_id'],
            },
        ],
    });
    const data = rows.map((r) => {
        const plain = r.get({ plain: true }) as any;
        return {
            cognitive_test_id: plain.cognitive_test_id,
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

export const updateCognitiveTestService = async (
    cognitive_test_id: string,
    body: {
        title?: string;
        description?: string | null;
        category?: string;
        published?: boolean;
    },
) => {
    const test = await DB.CognitiveTests.findByPk(cognitive_test_id);
    if (!test) {
        throw new CustomError('Cognitive test not found', StatusCodes.NOT_FOUND);
    }
    const patch: Record<string, unknown> = {};
    if (body.title !== undefined) {
        if (!String(body.title).trim()) {
            throw new CustomError('Title cannot be empty', StatusCodes.BAD_REQUEST);
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
        if (body.category !== 'mixed') {
            const questions = await DB.CognitiveQuestions.findAll({
                where: { cognitive_test_id },
                attributes: ['prompt', 'option_a', 'option_b', 'option_c', 'option_d'],
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
    await test.update(patch);
    return getCognitiveTestAdminService(cognitive_test_id);
};

export const deleteCognitiveTestService = async (cognitive_test_id: string) => {
    const test = await DB.CognitiveTests.findByPk(cognitive_test_id);
    if (!test) {
        throw new CustomError('Cognitive test not found', StatusCodes.NOT_FOUND);
    }
    await test.destroy();
    return { deleted: true };
};

export const addQuestionService = async (
    cognitive_test_id: string,
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
    const test = await DB.CognitiveTests.findByPk(cognitive_test_id);
    if (!test) {
        throw new CustomError('Cognitive test not found', StatusCodes.NOT_FOUND);
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
        throw new CustomError('correct_index must be 0–3', StatusCodes.BAD_REQUEST);
    }
    if (!validDifficulty(difficulty)) {
        throw new CustomError('Invalid difficulty', StatusCodes.BAD_REQUEST);
    }
    validateQuestionMatchesCategory(test.category, {
        prompt,
        option_a,
        option_b,
        option_c,
        option_d,
    });

    let order = sort_order;
    if (order === undefined || order === null) {
        const max = await DB.CognitiveQuestions.max('sort_order', {
            where: { cognitive_test_id },
        });
        order = (typeof max === 'number' ? max : 0) + 1;
    }

    await DB.CognitiveQuestions.create({
        cognitive_test_id,
        prompt: prompt.trim(),
        option_a: String(option_a).trim(),
        option_b: String(option_b).trim(),
        option_c: String(option_c).trim(),
        option_d: String(option_d).trim(),
        correct_index: ci,
        difficulty,
        sort_order: order,
    });

    return getCognitiveTestAdminService(cognitive_test_id);
};

export const updateQuestionService = async (
    cognitive_test_id: string,
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
    const q = await DB.CognitiveQuestions.findOne({
        where: { question_id, cognitive_test_id },
    });
    if (!q) {
        throw new CustomError('Question not found', StatusCodes.NOT_FOUND);
    }
    const test = await DB.CognitiveTests.findByPk(cognitive_test_id);
    if (!test) {
        throw new CustomError('Cognitive test not found', StatusCodes.NOT_FOUND);
    }
    const patch: Record<string, unknown> = {};
    if (body.prompt !== undefined) {
        if (!String(body.prompt).trim()) {
            throw new CustomError('Prompt cannot be empty', StatusCodes.BAD_REQUEST);
        }
        patch.prompt = String(body.prompt).trim();
    }
    for (const key of ['option_a', 'option_b', 'option_c', 'option_d'] as const) {
        if (body[key] !== undefined) {
            if (!String(body[key]).trim()) {
                throw new CustomError(`${key} cannot be empty`, StatusCodes.BAD_REQUEST);
            }
            patch[key] = String(body[key]).trim();
        }
    }
    if (body.correct_index !== undefined) {
        const ci = Number(body.correct_index);
        if (!Number.isInteger(ci) || ci < 0 || ci > 3) {
            throw new CustomError('correct_index must be 0–3', StatusCodes.BAD_REQUEST);
        }
        patch.correct_index = ci;
    }
    if (body.difficulty !== undefined) {
        if (!validDifficulty(body.difficulty)) {
            throw new CustomError('Invalid difficulty', StatusCodes.BAD_REQUEST);
        }
        patch.difficulty = body.difficulty;
    }
    if (body.sort_order !== undefined) {
        patch.sort_order = Number(body.sort_order);
    }
    validateQuestionMatchesCategory(test.category, {
        prompt:
            body.prompt !== undefined ? String(body.prompt) : String(q.get('prompt') || ''),
        option_a:
            body.option_a !== undefined ? String(body.option_a) : String(q.get('option_a') || ''),
        option_b:
            body.option_b !== undefined ? String(body.option_b) : String(q.get('option_b') || ''),
        option_c:
            body.option_c !== undefined ? String(body.option_c) : String(q.get('option_c') || ''),
        option_d:
            body.option_d !== undefined ? String(body.option_d) : String(q.get('option_d') || ''),
    });
    await q.update(patch);
    return getCognitiveTestAdminService(cognitive_test_id);
};

export const deleteQuestionService = async (
    cognitive_test_id: string,
    question_id: string,
) => {
    const q = await DB.CognitiveQuestions.findOne({
        where: { question_id, cognitive_test_id },
    });
    if (!q) {
        throw new CustomError('Question not found', StatusCodes.NOT_FOUND);
    }
    await q.destroy();
    return getCognitiveTestAdminService(cognitive_test_id);
};

/** Published tests for students — no correct answers. */
export const listPublishedCognitiveTestsService = async () => {
    const rows = await DB.CognitiveTests.findAll({
        where: { published: true },
        attributes: ['cognitive_test_id', 'title', 'description', 'category', 'updated_at'],
        include: [
            {
                model: DB.CognitiveQuestions,
                as: 'questions',
                attributes: ['question_id'],
            },
        ],
        order: [['title', 'ASC']],
    });
    return rows.map((r) => {
        const plain = r.get({ plain: true }) as any;
        return {
            cognitive_test_id: plain.cognitive_test_id,
            title: plain.title,
            description: plain.description,
            category: plain.category,
            question_count: plain.questions?.length ?? 0,
            updated_at: plain.updated_at,
        };
    });
};

export const getPublishedTestForAttemptService = async (cognitive_test_id: string) => {
    const test = await DB.CognitiveTests.findOne({
        where: { cognitive_test_id, published: true },
        include: [
            {
                model: DB.CognitiveQuestions,
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
    if (!test) {
        throw new CustomError('Test not found or not published', StatusCodes.NOT_FOUND);
    }
    const plain = test.get({ plain: true }) as any;
    if (!plain.questions?.length) {
        throw new CustomError('This test has no questions yet', StatusCodes.BAD_REQUEST);
    }
    return {
        cognitive_test_id: plain.cognitive_test_id,
        title: plain.title,
        description: plain.description,
        category: plain.category,
        questions: plain.questions,
    };
};

export const submitCognitiveAttemptService = async (
    user_id: string,
    cognitive_test_id: string,
    answers: Record<string, number>,
) => {
    const test = await DB.CognitiveTests.findOne({
        where: { cognitive_test_id, published: true },
        include: [
            {
                model: DB.CognitiveQuestions,
                as: 'questions',
            },
        ],
    });
    if (!test) {
        throw new CustomError('Test not found or not published', StatusCodes.NOT_FOUND);
    }
    const questions = (test as any).questions as Array<{
        question_id: string;
        correct_index: number;
    }>;
    if (!questions?.length) {
        throw new CustomError('This test has no questions', StatusCodes.BAD_REQUEST);
    }

    const qIds = new Set(questions.map((q) => q.question_id));
    for (const id of qIds) {
        if (!(id in answers)) {
            throw new CustomError('Answer every question', StatusCodes.BAD_REQUEST);
        }
        const idx = Number(answers[id]);
        if (!Number.isInteger(idx) || idx < 0 || idx > 3) {
            throw new CustomError(`Invalid answer for question ${id}`, StatusCodes.BAD_REQUEST);
        }
    }
    for (const k of Object.keys(answers)) {
        if (!qIds.has(k)) {
            throw new CustomError(`Unknown question ${k}`, StatusCodes.BAD_REQUEST);
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
        cognitive_test_id,
        score,
        max_score,
        taken_at: new Date(),
    });

    await calculateTrustScoreService(user_id);

    return {
        score,
        max_score,
        percentage: max_score > 0 ? Math.round((score / max_score) * 10000) / 100 : 0,
        cognitive_test_id,
        title: test.get('title'),
    };
};

export const getMyCognitiveAttemptHistoryService = async (user_id: string) => {
    const rows = await DB.UserTests.findAll({
        where: { user_id, cognitive_test_id: { [DB.Sequelize.Op.ne]: null } },
        include: [
            {
                model: DB.CognitiveTests,
                as: 'cognitiveTest',
                attributes: ['cognitive_test_id', 'title', 'category'],
                required: false,
            },
        ],
        order: [['taken_at', 'DESC'], ['created_at', 'DESC']],
    });

    return rows.map((r: any) => {
        const score = Number(r.score) || 0;
        const max = Number(r.max_score) || 0;
        const percentage = max > 0 ? Math.round((score / max) * 10000) / 100 : 0;
        const test = r.cognitiveTest;
        return {
            test_id: r.test_id,
            cognitive_test_id: r.cognitive_test_id,
            title:
                test?.title ||
                r.test_name ||
                `Cognitive test ${String(r.cognitive_test_id || '').slice(0, 8)}`,
            category: test?.category || 'mixed',
            score,
            max_score: max,
            percentage,
            taken_at: r.taken_at || r.created_at,
        };
    });
};
