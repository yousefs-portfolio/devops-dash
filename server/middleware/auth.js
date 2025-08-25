import { AuthService } from '../src/services/AuthService';
export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        if (!token) {
            res.status(401).json({ error: 'Access token required' });
            return;
        }
        const authService = new AuthService();
        const payload = await authService.verifyToken(token);
        req.user = {
            userId: payload.userId,
            email: payload.email,
            username: payload.username,
            role: payload.role,
        };
        next();
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.message.includes('expired')) {
                res.status(401).json({ error: 'Token expired' });
            }
            else if (error.message.includes('Invalid')) {
                res.status(403).json({ error: 'Invalid token' });
            }
            else {
                res.status(500).json({ error: 'Authentication error' });
            }
        }
        else {
            res.status(500).json({ error: 'Authentication error' });
        }
    }
};
export const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
        }
        next();
    };
};
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            const authService = new AuthService();
            const payload = await authService.verifyToken(token);
            req.user = {
                userId: payload.userId,
                email: payload.email,
                username: payload.username,
                role: payload.role,
            };
        }
        next();
    }
    catch (error) {
        // Continue without authentication
        next();
    }
};
//# sourceMappingURL=auth.js.map