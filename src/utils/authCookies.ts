import { CookieOptions, Response } from 'express';
import { NODE_ENV } from '@/config';

const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** Cross-origin frontends (Vercel) + API (Render) require SameSite=None. */
const isProduction = NODE_ENV === 'production';

const baseCookieOptions = (): CookieOptions => ({
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    path: '/',
});

export const refreshTokenCookieOptions = (): CookieOptions => ({
    ...baseCookieOptions(),
    httpOnly: true,
});

export const isLoggedInCookieOptions = (): CookieOptions => ({
    ...baseCookieOptions(),
    httpOnly: false,
});

export const setRefreshTokenCookie = (res: Response, token: string): void => {
    res.cookie('refreshToken', token, refreshTokenCookieOptions());
};

export const setIsLoggedInCookie = (res: Response): void => {
    res.cookie('isLoggedIn', 'true', isLoggedInCookieOptions());
};

const clearCookieOptions = (options: CookieOptions): CookieOptions => {
    const { maxAge: _maxAge, expires: _expires, ...rest } = options;
    return rest;
};

export const clearAuthCookies = (res: Response): void => {
    res.clearCookie(
        'refreshToken',
        clearCookieOptions(refreshTokenCookieOptions()),
    );
    res.clearCookie(
        'isLoggedIn',
        clearCookieOptions(isLoggedInCookieOptions()),
    );
};
