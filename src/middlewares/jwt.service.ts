import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWT_ACCESS_TOKEN_SECRET, JWT_REFRESH_TOKEN_SECRET } from '@/config';

// Generate short-lived access token (15m)
export const generateAccessToken = (payload: any): string => {
    return jwt.sign(payload, JWT_ACCESS_TOKEN_SECRET as string, {
        expiresIn: '15m', // Changed from 1m to 15m for easier testing
    });
};

// Generate long-lived refresh token (7 days)
export const generateRefreshToken = (payload: any): string => {
    return jwt.sign(payload, JWT_REFRESH_TOKEN_SECRET as string, {
        expiresIn: '7d',
    });
};

// Verify Access Token
export const verifyAccessToken = (token: string): JwtPayload => {
    return jwt.verify(token, JWT_ACCESS_TOKEN_SECRET as string) as JwtPayload;
};

// Verify Refresh Token (used for refresh endpoint)
export const verifyRefreshToken = (token: string): JwtPayload => {
    return jwt.verify(token, JWT_REFRESH_TOKEN_SECRET as string) as JwtPayload;
};
