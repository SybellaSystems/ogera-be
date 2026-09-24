import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// import { Request, Response, NextFunction } from 'express';
// import { signUpController, signInController } from '../../../src/modules/auth/auth.controller';
// import { signUpService, signInService } from '../../../src/modules/auth/auth.service';

// jest.mock('../../../src/modules/auth/auth.service', () => ({
//     signUpService: jest.fn(),
//     signInService: jest.fn(),
// }));

// beforeEach(() => {
//     jest.clearAllMocks(); 
// });

// describe('signUpController', () => {
//     let req: Partial<Request>;
//     let res: Partial<Response>;
//     let next: NextFunction;

//     beforeEach(() => {
//         req = { body: { email: 'new@example.com', password: 'password' } };
//         res = {
//             status: jest.fn().mockReturnThis(),
//             json: jest.fn(),
//         };
//         next = jest.fn();
//     });

//     it('should return 201 and response data on successful sign-up', async () => {
//         const mockUser = { id: 1, email: 'new@example.com', username: 'newuser' };
//         (signUpService as jest.Mock).mockResolvedValue({ user: mockUser });

//         await signUpController(req as Request, res as Response, next);

//         expect(signUpService).toHaveBeenCalledWith(req.body);
//         expect(res.status).toHaveBeenCalledWith(201);
//         expect(res.json).toHaveBeenCalledWith({
//             message: 'Successfully signed up',
//             data: mockUser,
//         });
//     });

//     it('should call next with error if service throws an error', async () => {
//         const error = new Error('Service error');
//         (signUpService as jest.Mock).mockRejectedValue(error);

//         await signUpController(req as Request, res as Response, next);

//         expect(next).toHaveBeenCalledWith(error);
//     });
// });

// describe('signInController', () => {
//     let req: Partial<Request>;
//     let res: Partial<Response>;
//     let next: NextFunction;

//     beforeEach(() => {
//         req = { body: { email: 'test@example.com', password: 'password' } };
//         res = {
//             status: jest.fn().mockReturnThis(),
//             json: jest.fn(),
//         };
//         next = jest.fn();
//     });

//     it('should return 200 and response data on successful sign-in', async () => {
//         const mockResponse = {
//             user: { id: 1, email: 'test@example.com', username: 'testuser' },
//             accessToken: 'mocked_access_token',
//         };
//         (signInService as jest.Mock).mockResolvedValue(mockResponse);

//         await signInController(req as Request, res as Response, next);

//         expect(signInService).toHaveBeenCalledWith(req.body);
//         expect(res.status).toHaveBeenCalledWith(200);
//         expect(res.json).toHaveBeenCalledWith({
//             message: 'Successfully signed in',
//             data: mockResponse,
//         });
//     });

//     it('should call next with error if service throws an error', async () => {
//         const error = new Error('Invalid credentials');
//         (signInService as jest.Mock).mockRejectedValue(error);

//         await signInController(req as Request, res as Response, next);

//         expect(next).toHaveBeenCalledWith(error);
//     });
// });


import { Request, Response , NextFunction  } from 'express';
import { StatusCodes } from 'http-status-codes';

import { register, login } from '../../../src/modules/auth/auth.controller';
import { registerUser, loginUser } from '../../../src/modules/auth/auth.service';

jest.mock('../../../src/modules/auth/auth.service', () => ({
    registerUser: jest.fn(),
    loginUser: jest.fn(),
}));

jest.mock('../../../src/utils/authCookies', () => ({
    clearAuthCookies: jest.fn(),
    setIsLoggedInCookie: jest.fn(),
    setRefreshTokenCookie: jest.fn(),
}));

jest.mock('../../../src/exception/responseFormat', () => ({
    ResponseFormat: jest.fn().mockImplementation(() => ({
        response: jest.fn(),
        errorResponse: jest.fn(),
    })),
}));

const mockedRegisterUser = registerUser as jest.MockedFunction<
    typeof registerUser
>;

const mockedLoginUser = loginUser as jest.MockedFunction<typeof loginUser>;

describe('Auth Controller', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            body: {},
            headers: {},
        };

        res = {
            status: jest.fn().mockReturnThis() as any,
            json: jest.fn() as any,
            cookie: jest.fn() as any,
            clearCookie: jest.fn() as any,
        } as Partial<Response>;
    });

    describe('register', () => {
        it('should register a user successfully', async () => {
            const mockResult = {
                user: {
                    user_id: 'user-1',
                    email: 'new@example.com',
                    full_name: 'New User',
                },
            };

            req.body = {
                email: 'new@example.com',
                password: 'password',
                terms: true,
                privacy: true,
            };

            req.headers = {
                origin: 'http://localhost:5173',
            };

            mockedRegisterUser.mockResolvedValue(mockResult as any);

            await register(req as Request, res as Response);

            expect(mockedRegisterUser).toHaveBeenCalledWith(
                req.body,
                'http://localhost:5173',
            );
        });

        it('should use the referer origin when origin header is not available', async () => {
            const mockResult = {
                user: {
                    user_id: 'user-1',
                    email: 'new@example.com',
                },
            };

            req.body = {
                email: 'new@example.com',
                password: 'password',
                terms: true,
                privacy: true,
            };

            req.headers = {
                referer: 'http://localhost:5173/register',
            };

            mockedRegisterUser.mockResolvedValue(mockResult as any);

            await register(req as Request, res as Response);

            expect(mockedRegisterUser).toHaveBeenCalledWith(
                req.body,
                'http://localhost:5173',
            );
        });

        it('should reject registration when terms are not accepted', async () => {
            req.body = {
                email: 'new@example.com',
                password: 'password',
                terms: false,
                privacy: true,
            };

            await register(req as Request, res as Response);

            expect(mockedRegisterUser).not.toHaveBeenCalled();
        });

        it('should reject registration when privacy policy is not accepted', async () => {
            req.body = {
                email: 'new@example.com',
                password: 'password',
                terms: true,
                privacy: false,
            };

            await register(req as Request, res as Response);

            expect(mockedRegisterUser).not.toHaveBeenCalled();
        });

        it('should handle registration service errors', async () => {
            const error = new Error('Registration failed');

            req.body = {
                email: 'new@example.com',
                password: 'password',
                terms: true,
                privacy: true,
            };

            mockedRegisterUser.mockRejectedValue(error);

            await register(req as Request, res as Response);

            expect(mockedRegisterUser).toHaveBeenCalled();
        });
    });

    describe('login', () => {
        it('should login successfully and set authentication cookies', async () => {
            const mockResult = {
                user: {
                    user_id: 'user-1',
                    email: 'test@example.com',
                    full_name: 'Test User',
                },
                accessToken: 'mocked_access_token',
                refreshToken: 'mocked_refresh_token',
            };

            req.body = {
                email: 'test@example.com',
                password: 'password',
            };

            mockedLoginUser.mockResolvedValue(mockResult as any);

            await login(req as Request, res as Response);

            expect(mockedLoginUser).toHaveBeenCalledWith(req.body, req);
        });

        it('should return the 2FA response when 2FA is required', async () => {
            const mockResult = {
                requires2FA: true,
                twoFactorToken: 'two-factor-token',
                user: {
                    user_id: 'user-1',
                    email: 'test@example.com',
                },
            };

            req.body = {
                email: 'test@example.com',
                password: 'password',
            };

            mockedLoginUser.mockResolvedValue(mockResult as any);

            await login(req as Request, res as Response);

            expect(mockedLoginUser).toHaveBeenCalledWith(req.body, req);
        });

        it('should handle login service errors', async () => {
            const error = new Error('Invalid credentials');

            req.body = {
                email: 'test@example.com',
                password: 'password',
            };

            mockedLoginUser.mockRejectedValue(error);

            await login(req as Request, res as Response);

            expect(mockedLoginUser).toHaveBeenCalledWith(req.body, req);
        });
    });
});