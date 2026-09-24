import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
} from '../../src/middlewares/jwt.service';

jest.mock('jsonwebtoken', () => ({
    __esModule: true,
    default: {
        sign: jest.fn(),
        verify: jest.fn(),
    },
}));

describe('JWT Service', () => {
    const payload = { user_id: '123', role: 'student' };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('generateAccessToken should sign a token with the access secret', () => {
        (jwt.sign as jest.Mock).mockReturnValue('mockedAccessToken');

        const token = generateAccessToken(payload);

        expect(jwt.sign).toHaveBeenCalledWith(
            payload,
            expect.any(String),
            { expiresIn: '15m' },
        );
        expect(token).toBe('mockedAccessToken');
    });

    it('generateRefreshToken should sign a token with the refresh secret', () => {
        (jwt.sign as jest.Mock).mockReturnValue('mockedRefreshToken');

        const token = generateRefreshToken(payload);

        expect(jwt.sign).toHaveBeenCalledWith(
            payload,
            expect.any(String),
            { expiresIn: '7d' },
        );
        expect(token).toBe('mockedRefreshToken');
    });

    it('verifyAccessToken should return the decoded payload for a valid token', () => {
        (jwt.verify as jest.Mock).mockReturnValue(payload);

        const result = verifyAccessToken('validToken');

        expect(jwt.verify).toHaveBeenCalledWith('validToken', expect.any(String));
        expect(result).toEqual(payload);
    });

    it('verifyRefreshToken should return the decoded payload for a valid token', () => {
        (jwt.verify as jest.Mock).mockReturnValue(payload);

        const result = verifyRefreshToken('validRefreshToken');

        expect(jwt.verify).toHaveBeenCalledWith('validRefreshToken', expect.any(String));
        expect(result).toEqual(payload);
    });

    it('verifyAccessToken should throw if the token is invalid', () => {
        (jwt.verify as jest.Mock).mockImplementation(() => {
            throw new Error('Invalid token');
        });

        expect(() => verifyAccessToken('invalidToken')).toThrow('Invalid token');
    });
});
