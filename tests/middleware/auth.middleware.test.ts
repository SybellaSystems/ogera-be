import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../../src/middlewares/auth.middleware';
import { verifyAccessToken } from '../../src/middlewares/jwt.service';
import { CustomError } from '../../src/utils/custom-error';

jest.mock('../../src/middlewares/jwt.service', () => ({
    verifyAccessToken: jest.fn(),
}));

describe('authMiddleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = {
            method: 'GET',
            url: '/api/protected-route',
            headers: {},
        };
        res = {};
        next = jest.fn();
    });

    it('should throw if Authorization header is missing', () => {
        expect(() => authMiddleware(req as Request, res as Response, next)).toThrow(
            new CustomError('Access denied. No token provided', 401),
        );
    });

    it('should set req.user and call next when token is valid', () => {
        req.headers = {
            authorization: 'Bearer validToken',
        };

        (verifyAccessToken as jest.Mock).mockReturnValue({
            user_id: '123',
            role: 'student',
        });

        authMiddleware(req as Request, res as Response, next);

        expect(req.user).toEqual({
            user_id: '123',
            role: 'student',
        });
        expect(next).toHaveBeenCalledTimes(1);
    });

    it('should throw a generic auth error if the token payload is invalid', () => {
        req.headers = {
            authorization: 'Bearer validToken',
        };

        (verifyAccessToken as jest.Mock).mockReturnValue({
            user_id: '123',
        });

        expect(() => authMiddleware(req as Request, res as Response, next)).toThrow(
            'Invalid or expired access token',
        );
    });

    it('should throw if the token is invalid or expired', () => {
        req.headers = {
            authorization: 'Bearer invalidToken',
        };

        (verifyAccessToken as jest.Mock).mockImplementation(() => {
            throw new Error('Invalid token');
        });

        expect(() => authMiddleware(req as Request, res as Response, next)).toThrow(
            new CustomError('Invalid or expired access token', 401),
        );
    });
});
