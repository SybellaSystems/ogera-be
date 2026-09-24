import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { getUserProfile } from '../../../src/modules/auth/auth.controller';
import { getUserProfileService } from '../../../src/modules/auth/auth.service';
import { CustomError } from '../../../src/utils/custom-error';

jest.mock('../../../src/modules/auth/auth.service', () => ({
    getUserProfileService: jest.fn(),
}));

describe('getUserProfile', () => {
    let req: Partial<Request> & { user?: { user_id: string; role: string } };
    let res: Partial<Response> & {
        status: jest.Mock;
        send: jest.Mock;
    };

    beforeEach(() => {
        req = {
            user: { user_id: 'user-123', role: 'student' },
        };

        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        } as any;

        jest.clearAllMocks();
    });

    it('should return the authenticated user profile', async () => {
        const mockUser = {
            user_id: 'user-123',
            email: 'user@example.com',
            full_name: 'Test User',
        };

        (getUserProfileService as any).mockResolvedValue(mockUser);

        await getUserProfile(req as Request, res as Response);

        expect(getUserProfileService).toHaveBeenCalledWith('user-123');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
            errorCode: null,
            status: 200,
            message: 'User profile retrieved successfully',
            success: true,
            data: mockUser,
        });
    });

    it('should return 401 when the user is not authenticated', async () => {
        req = {};

        await getUserProfile(req as Request, res as Response);

        expect(getUserProfileService).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
            errorCode: 401,
            success: false,
            message: 'User not authenticated',
        });
    });

    it('should pass through service errors with their status code', async () => {
        const error = new CustomError('User not found', 404);
        (getUserProfileService as any).mockRejectedValue(error);

        await getUserProfile(req as Request, res as Response);

        expect(getUserProfileService).toHaveBeenCalledWith('user-123');
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({
            errorCode: 404,
            success: false,
            message: 'User not found',
        });
    });
});
