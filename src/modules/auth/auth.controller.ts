import { NextFunction, Request, Response } from 'express';
import { signUpService, signInService,generate2FAService,verify2FAService } from './auth.service';
import { ResponseFormat } from '@/exception/responseFormat';
import { Messages } from '@/utils/messages';
import { StatusCodes } from 'http-status-codes';

const response = new ResponseFormat();

export const signUpController = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const result = await signUpService(req.body);
        response.response(
            res,
            true,
            StatusCodes.CREATED,
            result.user,
            Messages.User.CREATE_USER,
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message || 'Internal Server Error',
        );
    }
};

export const signInController = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const result = await signInService(req.body);
        response.response(
            res,
            true,
            StatusCodes.OK,
            result,
            Messages.User.LOGGED_IN,
        );
    } catch (error: any) {
        response.errorResponse(
            res,
            error.status || StatusCodes.INTERNAL_SERVER_ERROR,
            false,
            error.message || 'Internal Server Error',
        );
    }
};
export const setup2FAController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id, email } = req.body;
    const result = await generate2FAService(user_id, email);
    response.response(res, true, StatusCodes.OK, result, Messages.User.TWO_FA_ENABLED);
  } catch (error: any) {
    response.errorResponse(
      res,
      error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      error.message || "Internal Server Error"
    );
  }
};

// 2FA Verify
export const verify2FAController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id, token } = req.body;
    const result = await verify2FAService(user_id, token);
    response.response(res, true, StatusCodes.OK, result, Messages.User.TWO_FA_ENABLED);
  } catch (error: any) {
    response.errorResponse(
      res,
      error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      false,
      error.message || "Internal Server Error"
    );
  }
};

