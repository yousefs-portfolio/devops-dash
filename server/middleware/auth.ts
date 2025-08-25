import {Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import {User} from '../domain/entities/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface AuthRequest extends Request {
    user?: User;
    userId?: number;
}

export const generateToken = (user: User): string => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
        },
        JWT_SECRET,
        {
            expiresIn: JWT_EXPIRES_IN,
        }
    );
};

export const verifyToken = (token: string): any => {
    return jwt.verify(token, JWT_SECRET);
};

export const authenticateToken = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            res.status(401).json({error: 'Access token required'});
            return;
        }

        const decoded = verifyToken(token);
        req.userId = decoded.id;
        req.user = decoded;

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({error: 'Token expired'});
        } else if (error instanceof jwt.JsonWebTokenError) {
            res.status(403).json({error: 'Invalid token'});
        } else {
            res.status(500).json({error: 'Authentication error'});
        }
    }
};

export const requireRole = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            res.status(401).json({error: 'Authentication required'});
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({error: 'Insufficient permissions'});
            return;
        }

        next();
    };
};

export const optionalAuth = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = verifyToken(token);
            req.userId = decoded.id;
            req.user = decoded;
        }

        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};

// Refresh token functionality
export const generateRefreshToken = (user: User): string => {
    return jwt.sign(
        {id: user.id, type: 'refresh'},
        JWT_SECRET,
        {expiresIn: '7d'}
    );
};

export const refreshAccessToken = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const {refreshToken} = req.body;

        if (!refreshToken) {
            res.status(401).json({error: 'Refresh token required'});
            return;
        }

        const decoded = verifyToken(refreshToken);

        if (decoded.type !== 'refresh') {
            res.status(403).json({error: 'Invalid refresh token'});
            return;
        }

        // In production, verify the user still exists and is active
        const newAccessToken = jwt.sign(
            {id: decoded.id},
            JWT_SECRET,
            {expiresIn: JWT_EXPIRES_IN}
        );

        res.json({accessToken: newAccessToken});
    } catch (error) {
        res.status(403).json({error: 'Invalid or expired refresh token'});
    }
};