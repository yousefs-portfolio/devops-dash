import {Request, Response} from 'express';

export const notFoundHandler = (req: Request, res: Response): void => {
    res.status(404).json({
        error: {
            code: 'NOT_FOUND',
            message: `Resource not found: ${req.method} ${req.url}`,
            status: 404,
            timestamp: new Date().toISOString(),
        },
    });
};