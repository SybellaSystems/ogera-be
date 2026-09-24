import { DB } from '@/database';
import { CustomError } from '@/utils/custom-error';
import { StatusCodes } from 'http-status-codes';
import { deleteFile, saveFile } from '@/utils/storage.service';

const clampPercent = (value: number): number => {
    if (Number.isNaN(value)) return 0;
    if (value < 0) return 0;
    if (value > 100) return 100;
    return value;
};

type AcademicRecordsTableShape = Record<string, unknown>;

let cachedAcademicRecordsShape: AcademicRecordsTableShape | null = null;

const getAcademicRecordsTableShape =
    async (): Promise<AcademicRecordsTableShape> => {
        if (cachedAcademicRecordsShape) return cachedAcademicRecordsShape;
        const queryInterface = DB.sequelize.getQueryInterface();
        const shape = await queryInterface.describeTable('academic_records');
        cachedAcademicRecordsShape = shape;
        return shape;
    };

const normalizeAcademicProfileFromLegacy = (
    classLevel?: string | null,
): 'schooling' | 'college' => {
    if (classLevel === '10' || classLevel === '12') return 'schooling';
    return 'college';
};

const mapProfileToLegacyEnum = (
    academicProfile: 'schooling' | 'college',
    className?: string | null,
): '10' | '12' | 'graduation' => {
    if (academicProfile === 'college') return 'graduation';
    return String(className || '').trim() === '12' ? '12' : '10';
};

const normalizeRecordForResponse = (row: any) => {
    const plain = row?.toJSON ? row.toJSON() : row;
    if (!plain) return plain;

    if (plain.academic_profile) return plain;

    const academic_profile = normalizeAcademicProfileFromLegacy(
        plain.class_level || null,
    );
    return {
        ...plain,
        academic_profile,
        class_name:
            academic_profile === 'schooling'
                ? plain.class_name || plain.class_level || null
                : null,
        certificate_path: plain.certificate_path || plain.certificate || null,
    };
};

export const addAcademicRecordService = async (
    user_id: string,
    payload: {
        academic_profile: 'schooling' | 'college';
        class_name?: string;
        board?: string;
        degree?: string;
        university?: string;
        percentage: number;
        grade?: string;
        file?: Express.Multer.File;
    },
) => {
    if (!payload.file) {
        throw new CustomError(
            'Certificate upload is required',
            StatusCodes.BAD_REQUEST,
        );
    }

    const percentage = clampPercent(Number(payload.percentage));
    if (!Number.isFinite(percentage)) {
        throw new CustomError(
            'Percentage must be a valid number',
            StatusCodes.BAD_REQUEST,
        );
    }

    if (payload.academic_profile === 'schooling') {
        if (!payload.class_name || !payload.board) {
            throw new CustomError(
                'For schooling profile, class and board are required',
                StatusCodes.BAD_REQUEST,
            );
        }
    }

    if (payload.academic_profile === 'college') {
        if (!payload.degree || !payload.university) {
            throw new CustomError(
                'For college profile, degree and university are required',
                StatusCodes.BAD_REQUEST,
            );
        }
    }

    let certificate_path: string | null = null;
    let storage_type: 'local' | 's3' | null = null;
    if (payload.file) {
        const saved = await saveFile(payload.file, 'academic-certificates');
        certificate_path = saved.path;
        storage_type = saved.storageType as 'local' | 's3';
    }

    const tableShape = await getAcademicRecordsTableShape();
    const isLegacySchema =
        Boolean(tableShape.class_level) &&
        !Boolean(tableShape.academic_profile);

    const createData: Record<string, unknown> = {
        user_id,
        percentage,
        grade: payload.grade || null,
    };

    if (isLegacySchema) {
        // Backward compatibility for DBs that still use old class_level enum values.
        const mappedClassLevel = mapProfileToLegacyEnum(
            payload.academic_profile,
            payload.class_name,
        );
        createData.class_level = mappedClassLevel;
        if (tableShape.certificate) {
            createData.certificate = certificate_path;
        }
    } else {
        createData.academic_profile = payload.academic_profile;
        createData.class_name =
            payload.academic_profile === 'schooling'
                ? payload.class_name || null
                : null;
        createData.board =
            payload.academic_profile === 'schooling'
                ? payload.board || null
                : null;
        createData.degree =
            payload.academic_profile === 'college'
                ? payload.degree || null
                : null;
        createData.university =
            payload.academic_profile === 'college'
                ? payload.university || null
                : null;
        createData.certificate_path = certificate_path;
    }

    if (tableShape.storage_type) {
        createData.storage_type = storage_type;
    }

    try {
        const created = await DB.AcademicRecords.create(createData as any);
        return normalizeRecordForResponse(created);
    } catch (error: any) {
        // Some databases are in a transitional state:
        // column renamed to academic_profile, but enum type still has legacy values.
        const msg = String(error?.message || '');
        const isLegacyEnumValueError =
            msg.includes('enum_academic_records_class_level') &&
            (msg.includes('"schooling"') || msg.includes('"college"'));

        if (!isLegacyEnumValueError) {
            throw error;
        }

        const retryData = { ...createData } as Record<string, unknown>;
        retryData.academic_profile = mapProfileToLegacyEnum(
            payload.academic_profile,
            payload.class_name,
        );
        if (!retryData.class_level) {
            retryData.class_level = retryData.academic_profile;
        }

        const created = await DB.AcademicRecords.create(retryData as any);
        return normalizeRecordForResponse(created);
    }
};

export const getMyAcademicRecordsService = async (user_id: string) => {
    const rows = await DB.AcademicRecords.findAll({
        where: { user_id },
        order: [['created_at', 'DESC']],
    });
    return rows.map(normalizeRecordForResponse);
};

export const getAcademicRecordsByUserService = async (user_id: string) => {
    const rows = await DB.AcademicRecords.findAll({
        where: { user_id },
        order: [['created_at', 'DESC']],
    });
    return rows.map(normalizeRecordForResponse);
};

export const getAllAcademicRecordsService = async () => {
    const rows = await DB.AcademicRecords.findAll({
        include: [
            {
                model: DB.Users,
                as: 'user',
                attributes: ['user_id', 'full_name', 'email'],
            },
        ],
        order: [['created_at', 'DESC']],
    });
    return rows.map(normalizeRecordForResponse);
};

export const getAcademicRecordByIdService = async (record_id: string) => {
    const row = await DB.AcademicRecords.findOne({ where: { record_id } });
    if (!row) {
        throw new CustomError(
            'Academic record not found',
            StatusCodes.NOT_FOUND,
        );
    }
    return normalizeRecordForResponse(row);
};

export const deleteAcademicRecordService = async (
    record_id: string,
    requester: { user_id: string; role?: string },
) => {
    const row = await DB.AcademicRecords.findOne({ where: { record_id } });
    if (!row) {
        throw new CustomError(
            'Academic record not found',
            StatusCodes.NOT_FOUND,
        );
    }

    const record = normalizeRecordForResponse(row) as any;
    const role = String(requester.role || '').toLowerCase();
    const isSuperadmin = role === 'superadmin';

    if (!isSuperadmin && record.user_id !== requester.user_id) {
        throw new CustomError(
            'You can only delete your own academic records',
            StatusCodes.FORBIDDEN,
        );
    }

    const filePath = record.certificate_path || record.certificate || null;
    const storageType = record.storage_type || 'local';
    if (filePath) {
        try {
            await deleteFile(filePath, storageType);
        } catch {
            // continue delete even if file cleanup fails
        }
    }

    await DB.AcademicRecords.destroy({ where: { record_id } });
    return { record_id };
};
