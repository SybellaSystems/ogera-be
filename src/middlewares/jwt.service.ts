import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWTInterface } from '@/interfaces/user.interfaces';
import { JWT_ACCESS_TOKEN_SECRET } from '@/config';

export const generateJWT = (userObj: JWTInterface): string => {
    return jwt.sign(
        { user_id: userObj.user_id, role: userObj.role },
        JWT_ACCESS_TOKEN_SECRET as string,
        { expiresIn: '1h' },
    );
};

export const verifyJWT = async (
    token: string,
    secretKey: string,
): Promise<JwtPayload> => {
    try {
        const data = jwt.verify(token, secretKey);

        if (typeof data === 'string') {
            throw new Error('Invalid token payload');
        }

        return data as JwtPayload;
    } catch (error: any) {
        throw new Error(error.message);
    }
};
