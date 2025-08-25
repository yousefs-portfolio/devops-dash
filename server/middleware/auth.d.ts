import { NextFunction, Request, Response } from 'express';
export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        username: string;
        role: 'admin' | 'developer' | 'viewer';
    };
}
export declare const authenticateToken: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (roles: Array<"admin" | "developer" | "viewer">) => (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const optionalAuth: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map