import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { StatusCodes } from 'http-status-codes';
import { getUserProfileService } from '../../../src/modules/auth/auth.service';
import repo from '../../../src/modules/auth/auth.repo';
import { CustomError } from '../../../src/utils/custom-error';

jest.mock('../../../src/modules/auth/auth.repo', () => ({
    __esModule: true,
    default: {
        findUserProfileById: jest.fn(),
    },
}));

describe('getUserProfileService', () => {
    const mockUserId = 'user123';
    const mockUser = {
        user_id: mockUserId,
        email: 'user@example.com',
        full_name: 'Test User',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the user profile when the user exists', async () => {
        (repo.findUserProfileById as any).mockResolvedValue(mockUser);

        const result = await getUserProfileService(mockUserId);

        expect(repo.findUserProfileById).toHaveBeenCalledWith(mockUserId);
        expect(result).toEqual(mockUser);
    });

    it('should throw a not found error when the user does not exist', async () => {
        (repo.findUserProfileById as any).mockResolvedValue(null);

        await expect(getUserProfileService(mockUserId)).rejects.toThrow(
            new CustomError('User not found', StatusCodes.NOT_FOUND),
        );

        expect(repo.findUserProfileById).toHaveBeenCalledWith(mockUserId);
    });
});
