import {NextFunction, Request, Response} from 'express';
import {AuthService} from '../services/AuthService';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        username: string;
        role: 'admin' | 'developer' | 'viewer';
    };
}

export class AuthController {
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const {email, username, password, fullName} = req.body;

            if (!email || !username || !password) {
                res.status(400).json({
                    error: 'Email, username, and password are required',
                });
                return;
            }

            const result = await this.authService.register({
                email,
                username,
                password,
                fullName,
            });

            res.status(201).json({
                message: 'Registration successful',
                user: result.user,
                tokens: result.tokens,
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({error: error.message});
            } else {
                next(error);
            }
        }
    }

    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const {emailOrUsername, password} = req.body;

            if (!emailOrUsername || !password) {
                res.status(400).json({
                    error: 'Email/username and password are required',
                });
                return;
            }

            const result = await this.authService.login({
                emailOrUsername,
                password,
            });

            res.status(200).json({
                message: 'Login successful',
                user: result.user,
                tokens: result.tokens,
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(401).json({error: error.message});
            } else {
                next(error);
            }
        }
    }

    async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Client should remove tokens from storage
            // Optionally, we could maintain a token blacklist in Redis
            res.json({
                message: 'Logged out successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const {refreshToken} = req.body;

            if (!refreshToken) {
                res.status(400).json({
                    error: 'Refresh token is required',
                });
                return;
            }

            const tokens = await this.authService.refreshToken(refreshToken);

            res.status(200).json({
                message: 'Token refreshed successfully',
                tokens,
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(401).json({error: error.message});
            } else {
                next(error);
            }
        }
    }

    async getCurrentUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            // This requires authentication middleware to set req.user
            if (!req.user) {
                res.status(401).json({
                    error: 'Not authenticated',
                });
                return;
            }

            const user = await this.authService.getCurrentUser(req.user.userId);

            res.status(200).json({
                user,
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({error: error.message});
            } else {
                next(error);
            }
        }
    }

    async changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    error: 'Not authenticated',
                });
                return;
            }

            const {oldPassword, newPassword} = req.body;

            if (!oldPassword || !newPassword) {
                res.status(400).json({
                    error: 'Old password and new password are required',
                });
                return;
            }

            await this.authService.changePassword(req.user.userId, oldPassword, newPassword);

            res.status(200).json({
                message: 'Password changed successfully',
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({error: error.message});
            } else {
                next(error);
            }
        }
    }

    async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const {email} = req.body;

            if (!email) {
                res.status(400).json({
                    error: 'Email is required',
                });
                return;
            }

            const message = await this.authService.resetPassword(email);

            res.status(200).json({
                message,
            });
        } catch (error) {
            next(error);
        }
    }

    async confirmPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const {token, newPassword} = req.body;

            if (!token || !newPassword) {
                res.status(400).json({
                    error: 'Token and new password are required',
                });
                return;
            }

            await this.authService.confirmPasswordReset(token, newPassword);

            res.status(200).json({
                message: 'Password reset successful',
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({error: error.message});
            } else {
                next(error);
            }
        }
    }
}