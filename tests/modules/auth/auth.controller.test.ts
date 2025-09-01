import { Request, Response, NextFunction } from 'express';
import { register, login } from '../../../src/modules/auth/auth.controller';
import { registerUser, loginUser } from '../../../src/modules/auth/auth.service';

jest.mock('../../../src/modules/auth/auth.service', () => ({
    registerUser: jest.fn(),
    loginUser: jest.fn(),
}));

beforeEach(() => {
    jest.clearAllMocks(); 
});

describe('register', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = { body: { email: 'new@example.com', password: 'password' } };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    it('should return 201 and response data on successful sign-up', async () => {
        const mockUser = { id: 1, email: 'new@example.com', username: 'newuser' };
        (registerUser as jest.Mock).mockResolvedValue({ user: mockUser });

        await register(req as Request, res as Response, next);

        expect(registerUser).toHaveBeenCalledWith(req.body);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Successfully signed up',
            data: mockUser,
        });
    });

    it('should call next with error if service throws an error', async () => {
        const error = new Error('Service error');
        (registerUser as jest.Mock).mockRejectedValue(error);

        await register(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledWith(error);
    });
});

describe('login', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = { body: { email: 'test@example.com', password: 'password' } };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    it('should return 200 and response data on successful sign-in', async () => {
        const mockResponse = {
            user: { id: 1, email: 'test@example.com', username: 'testuser' },
            accessToken: 'mocked_access_token',
        };
        (loginUser as jest.Mock).mockResolvedValue(mockResponse);

        await login(req as Request, res as Response, next);

        expect(loginUser).toHaveBeenCalledWith(req.body);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Successfully signed in',
            data: mockResponse,
        });
    });

    it('should call next with error if service throws an error', async () => {
        const error = new Error('Invalid credentials');
        (loginUser as jest.Mock).mockRejectedValue(error);

        await login(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledWith(error);
    });
});