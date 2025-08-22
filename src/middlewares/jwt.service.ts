import jwt from "jsonwebtoken";
import { JWTInterface } from "@/interfaces/user.interfaces";
import { JWT_ACCESS_TOKEN_SECRET } from "@/config";

export const generateJWT = (userObj: JWTInterface) => {
    return jwt.sign(
        { userID: userObj.user_id, role: userObj.role },
        JWT_ACCESS_TOKEN_SECRET as string,
        { expiresIn: '1h' }
    );
}

export const verifyJWT = async (
  token: string,
  secretKey: string
): Promise<jwt.JwtPayload> => {
  try {
    const data = jwt.verify(token, secretKey);

    if (typeof data === "string") {
      throw new Error("Invalid token payload");
    }

    return data as jwt.JwtPayload;
  } catch (error: any) {
    throw new Error(error.message);
  }
};
