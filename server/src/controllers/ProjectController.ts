import {NextFunction, Request, Response} from 'express';
import {ProjectRepository} from '../repositories/ProjectRepository';
import {MetricRepository} from '../repositories/MetricRepository';
import {AlertRepository} from '../repositories/AlertRepository';
import {Server} from 'socket.io';
import {MetricType} from '../entities/Metric';
import {AlertStatus} from '../entities/Alert';

export class ProjectController {
    private projectRepo: ProjectRepository;
    private metricRepo: MetricRepository;
    private alertRepo: AlertRepository;

    constructor() {
        this.projectRepo = new ProjectRepository();
        this.metricRepo = new MetricRepository();
        this.alertRepo = new AlertRepository();
    }

    async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const filters = {
                status: req.query.status as 'active' | 'inactive' | 'archived' | undefined,
                search: req.query.search as string,
            };

            const projects = await this.projectRepo.findAll(filters);
            const count = await this.projectRepo.count(filters);

            res.json({
                data: projects,
                meta: {
                    total: count,
                    count: projects.length,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const project = await this.projectRepo.findById(req.params.id);

            if (!project) {
                res.status(404).json({
                    error: {
                        code: 'PROJECT_NOT_FOUND',
                        message: 'Project not found',
                        status: 404,
                    },
                });
                return;
            }

            res.json({data: project});
        } catch (error) {
            next(error);
        }
    }

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const project = await this.projectRepo.create(req.body);

            // Emit event via WebSocket
            const io = req.app.get('io') as Server;
            io.emit('project:created', project);

            res.status(201).json({data: project});
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const project = await this.projectRepo.update({
                id: req.params.id,
                ...req.body,
            });

            if (!project) {
                res.status(404).json({
                    error: {
                        code: 'PROJECT_NOT_FOUND',
                        message: 'Project not found',
                        status: 404,
                    },
                });
                return;
            }

            // Emit event via WebSocket
            const io = req.app.get('io') as Server;
            io.to(`project-${project.id}`).emit('project:updated', project);

            res.json({data: project});
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const deleted = await this.projectRepo.delete(req.params.id);

            if (!deleted) {
                res.status(404).json({
                    error: {
                        code: 'PROJECT_NOT_FOUND',
                        message: 'Project not found',
                        status: 404,
                    },
                });
                return;
            }

            // Emit event via WebSocket
            const io = req.app.get('io') as Server;
            io.emit('project:deleted', {id: req.params.id});

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    async getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const filters = {
                projectId: req.params.id,
                type: req.query.type as MetricType | undefined,
                startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
            };

            const metrics = await this.metricRepo.findAll(filters);

            res.json({
                data: metrics,
                meta: {
                    count: metrics.length,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    async getAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const filters = {
                projectId: req.params.id,
                status: req.query.status as AlertStatus | undefined,
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
}