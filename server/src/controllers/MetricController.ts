import {Request, Response, NextFunction} from 'express';
import {MetricRepository} from '../repositories/MetricRepository';
import {Server} from 'socket.io';
import {MetricType} from '../entities/Metric';

export class MetricController {
    private metricRepo: MetricRepository;

    constructor() {
        this.metricRepo = new MetricRepository();
    }

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const metric = await this.metricRepo.create(req.body);

            // Emit real-time update via WebSocket
            const io = req.app.get('io') as Server;
            io.to(`project-${metric.project_id}`).emit('metric:created', metric);

            res.status(201).json({data: metric});
        } catch (error) {
            next(error);
        }
    }

    async createBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const metrics = await this.metricRepo.createBatch(req.body.metrics);

            // Emit real-time updates via WebSocket
            const io = req.app.get('io') as Server;
            const projectIds = [...new Set(metrics.map(m => m.project_id))];

            projectIds.forEach(projectId => {
                const projectMetrics = metrics.filter(m => m.project_id === projectId);
                io.to(`project-${projectId}`).emit('metrics:created', projectMetrics);
            });

            res.status(201).json({
                data: metrics,
                meta: {
                    count: metrics.length,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const filters = {
                projectId: req.query.projectId as string,
                type: req.query.type as MetricType,
                startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
            };

            const limit = parseInt(req.query.limit as string) || 100;
            const metrics = await this.metricRepo.findAll(filters, limit);

            res.json({
                data: metrics,
                meta: {
                    count: metrics.length,
                    limit,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    async getAggregated(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const {projectId, type, startDate, endDate} = req.query;

            const aggregation = await this.metricRepo.aggregate(
                projectId as string,
                type as MetricType,
                new Date(startDate as string),
                new Date(endDate as string)
            );

            if (!aggregation) {
                res.status(404).json({
                    error: {
                        code: 'NO_METRICS_FOUND',
                        message: 'No metrics found for the specified criteria',
                        status: 404,
                    },
                });
                return;
            }

            res.json({data: aggregation});
        } catch (error) {
            next(error);
        }
    }

    async getTimeSeries(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const {projectId, type, startDate, endDate, interval} = req.query;

            const timeSeries = await this.metricRepo.getTimeSeries(
                projectId as string,
                type as MetricType,
                new Date(startDate as string),
                new Date(endDate as string),
                interval as string
            );

            res.json({
                data: timeSeries,
                meta: {
                    count: timeSeries.length,
                    interval: interval || '1 hour',
                },
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteOld(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const beforeDate = new Date(req.query.beforeDate as string);
            const deletedCount = await this.metricRepo.deleteOldMetrics(beforeDate);

            res.json({
                message: `Successfully deleted ${deletedCount} old metrics`,
                meta: {
                    deletedCount,
                    beforeDate,
                },
            });
        } catch (error) {
            next(error);
        }
    }
}