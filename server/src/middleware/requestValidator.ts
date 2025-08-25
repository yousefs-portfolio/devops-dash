import {Request, Response, NextFunction} from 'express';
import {validationResult} from 'express-validator';

export const requestValidator = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400).json({
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid request parameters',
                status: 400,
                details: errors.array(),
                timestamp: new Date().toISOString(),
            },
        });
        return;
    }

    next();
};