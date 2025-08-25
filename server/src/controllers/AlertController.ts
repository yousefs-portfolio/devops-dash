import {NextFunction, Request, Response} from 'express';
import {AlertRepository} from '../repositories/AlertRepository';
import {Server} from 'socket.io';
import {AlertSeverity, AlertStatus} from '../entities/Alert';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        username: string;
        role: 'admin' | 'developer' | 'viewer';
    };
}

export class AlertController {
    private alertRepo: AlertRepository;

    constructor() {
        this.alertRepo = new AlertRepository();
    }

    async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const filters = {
                projectId: req.query.projectId as string,
                status: req.query.status as AlertStatus | undefined,
                severity: req.query.severity as AlertSeverity | undefined,
                startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
            };

            const alerts = await this.alertRepo.findAll(filters);

            res.json({
                data: alerts,
                meta: {
                    count: alerts.length,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const alert = await this.alertRepo.findById(req.params.id);

            if (!alert) {
                res.status(404).json({
                    error: {
                        code: 'ALERT_NOT_FOUND',
                        message: 'Alert not found',
                        status: 404,
                    },
                });
                return;
            }

            res.json({data: alert});
        } catch (error) {
            next(error);
        }
    }

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const alert = await this.alertRepo.create(req.body);

            // Emit real-time update via WebSocket
            const io = req.app.get('io') as Server;
            io.to(`project-${alert.project_id}`).emit('alert:created', alert);
            io.emit('alert:created', alert); // Global notification

            res.status(201).json({data: alert});
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const alert = await this.alertRepo.update({
                id: req.params.id,
                ...req.body,
            });

            if (!alert) {
                res.status(404).json({
                    error: {
                        code: 'ALERT_NOT_FOUND',
                        message: 'Alert not found',
                        status: 404,
                    },
                });
                return;
            }

            // Emit real-time update via WebSocket
            const io = req.app.get('io') as Server;
            io.to(`project-${alert.project_id}`).emit('alert:updated', alert);

            res.json({data: alert});
        } catch (error) {
            next(error);
        }
    }

    async acknowledge(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            // Get user ID from auth middleware
            if (!req.user) {
                res.status(401).json({
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required',
                        status: 401,
                    },
                });
                return;
            }

            const alert = await this.alertRepo.acknowledge(req.params.id, req.user.userId);

            if (!alert) {
                res.status(404).json({
                    error: {
                        code: 'ALERT_NOT_FOUND',
                        message: 'Alert not found',
                        status: 404,
                    },
                });
                return;
            }

            // Emit real-time update via WebSocket
            const io = req.app.get('io') as Server;
            io.to(`project-${alert.project_id}`).emit('alert:acknowledged', alert);

            res.json({data: alert});
        } catch (error) {
            next(error);
        }
    }

    async resolve(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const alert = await this.alertRepo.resolve(req.params.id);

            if (!alert) {
                res.status(404).json({
                    error: {
                        code: 'ALERT_NOT_FOUND',
                        message: 'Alert not found',
                        status: 404,
                    },
                });
                return;
            }

            // Emit real-time update via WebSocket
            const io = req.app.get('io') as Server;
            io.to(`project-${alert.project_id}`).emit('alert:resolved', alert);

            res.json({data: alert});
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const deleted = await this.alertRepo.delete(req.params.id);

            if (!deleted) {
                res.status(404).json({
                    error: {
                        code: 'ALERT_NOT_FOUND',
                        message: 'Alert not found',
                        status: 404,
                    },
                });
                return;
            }

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const projectId = req.query.projectId as string;
            const stats = await this.alertRepo.countByStatus(projectId);

            res.json({data: stats});
        } catch (error) {
            next(error);
        }
    }
}