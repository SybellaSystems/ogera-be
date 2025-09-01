import { Response } from 'express';

export class ResponseFormat {
  public response(
    res: Response,
    success: boolean,
    status: number,
    data: object,
    message: string
  ): Response{
    return res.status(status).send({
      errorCode: !success ? status : null,
      status,
      message,
      success,
      data,
    });
  }

  public errorResponse(
    res: Response,
    status: number,
    success: boolean,
    message: string
  ): Response {
    return res.status(status).send({
      errorCode: status,
      success,
      message,
    });
  }
}