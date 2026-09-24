import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { registerUser, loginUser } from '../../../src/modules/auth/auth.service';
import repo from '../../../src/modules/auth/auth.repo';
import { DB } from '../../../src/database';
import { compareSync, hash } from 'bcrypt';

jest.mock('../../../src/modules/auth/auth.repo');

jest.mock('../../../src/database', () => ({
    DB: {
        Roles: { findOne: jest.fn() },
        UserExtendedProfiles: { create: jest.fn() },
        ActivityLogs: { create: jest.fn() },
        UserSkills: { create: jest.fn() },
        Users: { findOne: jest.fn(), create: jest.fn() },
        sequelize: {
            close: jest.fn(),
            authenticate: jest.fn(),
        },
    },
}));

jest.mock('bcrypt', () => ({
    hash: jest.fn(async () => 'hashedPassword'),
    compareSync: jest.fn(() => true),
}));

jest.mock('../../../src/services/email/email.service', () => ({
    sendWelcomeEmail: jest.fn(),
}));

jest.mock('../../../src/modules/badge/badge.service', () => ({
    assignFreeBadgeOnRegistration: jest.fn(async () => null),
}));

jest.mock('../../../src/modules/trustScore/trustScore.service', () => ({
    calculateTrustScoreService: jest.fn(),
}));

jest.mock('../../../src/modules/session/session.service', () => ({
    parseDeviceType: jest.fn(() => 'desktop'),
}));

jest.mock('../../../src/modules/session/session.repo', () => ({
    __esModule: true,
    default: {
        createSession: jest.fn(),
    },
}));

jest.mock('../../../src/utils/captcha', () => ({
    verifyCaptcha: jest.fn(),
}));

jest.mock('../../../src/middlewares/jwt.service', () => ({
    generateAccessToken: jest.fn(() => 'access-token'),
    generateRefreshToken: jest.fn(() => 'refresh-token'),
    verifyRefreshToken: jest.fn(),
}));

describe('auth service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('registerUser', () => {
        it('should throw if email already exists', async () => {
            const payload = {
                email: 'existing@example.com',
                full_name: 'Existing User',
                password: 'Password123!',
                terms: true,
                privacy: true,
                role: 'student',
            };

            (repo.findUserByEmail as any).mockResolvedValue({
                user_id: 'user-1',
                email: 'existing@example.com',
            });

            await expect(registerUser(payload as any)).rejects.toThrow(
                'Email already exists',
            );
        });

        it('should register a new user successfully', async () => {
            const payload = {
                email: 'new@example.com',
                full_name: 'New User',
                password: 'Password123!',
                terms: true,
                privacy: true,
                role: 'student',
            };

            const createdUser = {
                user_id: 'user-1',
                full_name: 'New User',
                email: 'new@example.com',
                password_hash: 'hashedPassword',
                role_id: 'role-1',
                role_type: 'student',
                terms_accepted: true,
                privacy_accepted: true,
                created_at: new Date(),
                updated_at: new Date(),
            };

            (repo.findUserByEmail as any).mockResolvedValue(null);
            (DB.Roles.findOne as any).mockResolvedValue({
                id: 'role-1',
                roleName: 'student',
                roleType: 'student',
            });
            (hash as any).mockResolvedValue('hashedPassword');
            (repo.createUser as any).mockResolvedValue(createdUser);

            const result = await registerUser(payload as any);

            expect(repo.findUserByEmail).toHaveBeenCalledWith('new@example.com');
            expect(hash).toHaveBeenCalledWith('Password123!', 10);
            expect(result.user).toMatchObject({
                user_id: 'user-1',
                email: 'new@example.com',
                full_name: 'New User',
            });
        });
    });

    describe('loginUser', () => {
        it('should return access token for valid credentials', async () => {
            const user = {
                user_id: 'user-1',
                email: 'test@example.com',
                full_name: 'Test User',
                password_hash: 'hashedPassword',
                role_id: 'role-1',
                role_type: 'student',
                two_fa_enabled: false,
                created_at: new Date(),
                updated_at: new Date(),
            };

            (repo.findUserByEmail as any).mockResolvedValue(user);
            (compareSync as any).mockReturnValue(true);
            (DB.Roles.findOne as any).mockResolvedValue({
                id: 'role-1',
                roleName: 'student',
            });

            const result = await loginUser({
                email: 'test@example.com',
                password: 'Password123!',
            } as any);

            expect(repo.findUserByEmail).toHaveBeenCalledWith('test@example.com');
            expect(compareSync).toHaveBeenCalledWith(
                'Password123!',
                'hashedPassword',
            );
            expect(result).toMatchObject({
                user: expect.objectContaining({ user_id: 'user-1' }),
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
            });
        });

        it('should throw when password is invalid', async () => {
            const user = {
                user_id: 'user-1',
                email: 'test@example.com',
                full_name: 'Test User',
                password_hash: 'hashedPassword',
                role_id: 'role-1',
                role_type: 'student',
                two_fa_enabled: false,
                created_at: new Date(),
                updated_at: new Date(),
            };

            (repo.findUserByEmail as any).mockResolvedValue(user);
            (compareSync as any).mockReturnValue(false);

            await expect(
                loginUser({
                    email: 'test@example.com',
                    password: 'wrong-password',
                } as any),
            ).rejects.toThrow('Invalid credentials');
        });
    });
});
