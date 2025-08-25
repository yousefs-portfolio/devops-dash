import {Request, Response, NextFunction} from 'express';

export interface ApiError extends Error {
    status?: number;
    code?: string;
}

export const errorHandler = (
    err: ApiError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    const code = err.code || 'INTERNAL_ERROR';

    // Log error details
    console.error(`[${new Date().toISOString()}] Error ${status}: ${message}`, {
        url: req.url,
        method: req.method,
        ip: req.ip,
        error: err.stack,
    });

    // Send error response
    res.status(status).json({
        error: {
            code,
            message,
            status,
            timestamp: new Date().toISOString(),
        },
    });
};