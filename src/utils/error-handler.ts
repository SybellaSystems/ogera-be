import { Request, Response, NextFunction } from "express";
import logger from "./logger";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = (req as any).requestId || 'unknown';
  const userId = (req as any).user?.id || (req as any).user?.userId || undefined;
  
  // Determine status code from error or response
  const statusCode = (err as any).statusCode || 
                     (err as any).status || 
                     (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

  // Log error with full context
  logger.error('Error Handler', {
    type: 'ERROR_HANDLER',
    requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    statusCode,
    userId,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      ...(err as any).details && { details: (err as any).details },
    },
    request: {
      query: req.query,
      body: req.body,
      params: req.params,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    },
    timestamp: new Date().toISOString(),
  });

  // Send error response
  res.status(statusCode).json({
    status: "error",
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV !== 'production' && { 
      stack: err.stack,
      requestId,
    }),
  });
};
