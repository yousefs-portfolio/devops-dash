import {MetricRepository} from '../MetricRepository';
import {Metric} from '../../domain/entities/Metric';
import {db} from '../../db';

// Mock the database
jest.mock('../../db');

describe('MetricRepository', () => {
    let repository: MetricRepository;
    let mockDb: any;

    beforeEach(() => {
        mockDb = {
            select: jest.fn().mockReturnThis(),
            from: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            whereBetween: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
            returning: jest.fn().mockReturnThis(),
            first: jest.fn(),
            then: jest.fn(),
        };

        (db as jest.Mock).mockReturnValue(mockDb);
        repository = new MetricRepository();
    });

    describe('create', () => {
        it('should create a new metric', async () => {
            const metricData = {
                projectId: 1,
                metricType: 'cpu' as const,
                value: 75.5,
                unit: '%',
                timestamp: new Date(),
            };

            mockDb.returning.mockResolvedValue([{id: 1, ...metricData}]);

            const metric = await repository.create(metricData);

            expect(metric).toBeInstanceOf(Metric);
            expect(metric.id).toBe(1);
            expect(metric.value).toBe(75.5);
            expect(db).toHaveBeenCalledWith('metrics');
            expect(mockDb.insert).toHaveBeenCalled();
        });

        it('should handle creation errors', async () => {
            mockDb.returning.mockRejectedValue(new Error('Database error'));

            await expect(repository.create({
                projectId: 1,
                metricType: 'cpu' as const,
                value: 75.5,
                unit: '%',
                timestamp: new Date(),
            })).rejects.toThrow('Database error');
        });
    });

    describe('findById', () => {
        it('should find a metric by id', async () => {
            const metricData = {
                id: 1,
                project_id: 1,
                metric_type: 'cpu',
                value: 75.5,
                unit: '%',
                timestamp: new Date(),
            };

            mockDb.first.mockResolvedValue(metricData);

            const metric = await repository.findById(1);

            expect(metric).toBeInstanceOf(Metric);
            expect(metric?.id).toBe(1);
            expect(db).toHaveBeenCalledWith('metrics');
            expect(mockDb.where).toHaveBeenCalledWith({id: 1});
        });

        it('should return null for non-existent metric', async () => {
            mockDb.first.mockResolvedValue(null);

            const metric = await repository.findById(999);

            expect(metric).toBeNull();
        });
    });

    describe('findByProject', () => {
        it('should find metrics by project id', async () => {
            const metricsData = [
                {
                    id: 1,
                    project_id: 1,
                    metric_type: 'cpu',
                    value: 75.5,
                    unit: '%',
                    timestamp: new Date(),
                },
                {
                    id: 2,
                    project_id: 1,
                    metric_type: 'memory',
                    value: 60.2,
                    unit: '%',
                    timestamp: new Date(),
                },
            ];

            mockDb.orderBy.mockResolvedValue(metricsData);

            const metrics = await repository.findByProject(1);

            expect(metrics).toHaveLength(2);
            expect(metrics[0]).toBeInstanceOf(Metric);
            expect(db).toHaveBeenCalledWith('metrics');
            expect(mockDb.where).toHaveBeenCalledWith({project_id: 1});
        });

        it('should limit results when specified', async () => {
            mockDb.orderBy.mockResolvedValue([]);

            await repository.findByProject(1, 10);

            expect(mockDb.limit).toHaveBeenCalledWith(10);
        });
    });

    describe('findByProjectAndType', () => {
        it('should find metrics by project and type', async () => {
            const metricsData = [
                {
                    id: 1,
                    project_id: 1,
                    metric_type: 'cpu',
                    value: 75.5,
                    unit: '%',
                    timestamp: new Date(),
                },
            ];

            mockDb.orderBy.mockResolvedValue(metricsData);

            const metrics = await repository.findByProjectAndType(1, 'cpu');

            expect(metrics).toHaveLength(1);
            expect(metrics[0].metricType).toBe('cpu');
            expect(mockDb.where).toHaveBeenCalledWith({
                project_id: 1,
                metric_type: 'cpu',
            });
        });
    });

    describe('findByTimeRange', () => {
        it('should find metrics within time range', async () => {
            const startTime = new Date('2024-01-01');
            const endTime = new Date('2024-01-31');

            const metricsData = [
                {
                    id: 1,
                    project_id: 1,
                    metric_type: 'cpu',
                    value: 75.5,
                    unit: '%',
                    timestamp: new Date('2024-01-15'),
                },
            ];

            mockDb.orderBy.mockResolvedValue(metricsData);

            const metrics = await repository.findByTimeRange(1, startTime, endTime);

            expect(metrics).toHaveLength(1);
            expect(mockDb.where).toHaveBeenCalledWith({project_id: 1});
            expect(mockDb.whereBetween).toHaveBeenCalledWith('timestamp', [startTime, endTime]);
        });

        it('should filter by metric type if provided', async () => {
            const startTime = new Date('2024-01-01');
            const endTime = new Date('2024-01-31');

            mockDb.orderBy.mockResolvedValue([]);

            await repository.findByTimeRange(1, startTime, endTime, 'cpu');

            expect(mockDb.where).toHaveBeenCalledWith({
                project_id: 1,
                metric_type: 'cpu',
            });
        });
    });

    describe('getLatestMetrics', () => {
        it('should get latest metrics for each type', async () => {
            const metricsData = [
                {
                    metric_type: 'cpu',
                    id: 1,
                    project_id: 1,
                    value: 75.5,
                    unit: '%',
                    timestamp: new Date(),
                },
                {
                    metric_type: 'memory',
                    id: 2,
                    project_id: 1,
                    value: 60.2,
                    unit: '%',
                    timestamp: new Date(),
                },
            ];

            mockDb.then.mockResolvedValue(metricsData);

            const metrics = await repository.getLatestMetrics(1);

            expect(metrics).toHaveLength(2);
            expect(metrics.map(m => m.metricType)).toEqual(['cpu', 'memory']);
        });
    });

    describe('aggregateMetrics', () => {
        it('should aggregate metrics by hour', async () => {
            const aggregatedData = [
                {
                    hour: '2024-01-01T12:00:00Z',
                    avg_value: 75.5,
                    max_value: 80,
                    min_value: 70,
                },
            ];

            mockDb.then.mockResolvedValue(aggregatedData);

            const result = await repository.aggregateMetrics(
                1,
                'cpu',
                'hour',
                new Date('2024-01-01'),
                new Date('2024-01-02')
            );

            expect(result).toEqual(aggregatedData);
        });
    });

    describe('deleteOldMetrics', () => {
        it('should delete metrics older than specified date', async () => {
            const cutoffDate = new Date('2024-01-01');
            mockDb.then.mockResolvedValue(10);

            const count = await repository.deleteOldMetrics(cutoffDate);

            expect(count).toBe(10);
            expect(db).toHaveBeenCalledWith('metrics');
            expect(mockDb.where).toHaveBeenCalledWith('<', 'timestamp', cutoffDate);
            expect(mockDb.delete).toHaveBeenCalled();
        });

        it('should delete metrics for specific project if provided', async () => {
            const cutoffDate = new Date('2024-01-01');
            mockDb.then.mockResolvedValue(5);

            const count = await repository.deleteOldMetrics(cutoffDate, 1);

            expect(count).toBe(5);
            expect(mockDb.where).toHaveBeenCalledWith({project_id: 1});
        });
    });

    describe('bulkInsert', () => {
        it('should insert multiple metrics', async () => {
            const metricsData = [
                {
                    projectId: 1,
                    metricType: 'cpu' as const,
                    value: 75.5,
                    unit: '%',
                    timestamp: new Date(),
                },
                {
                    projectId: 1,
                    metricType: 'memory' as const,
                    value: 60.2,
                    unit: '%',
                    timestamp: new Date(),
                },
            ];

            mockDb.returning.mockResolvedValue(
                metricsData.map((m, i) => ({id: i + 1, ...m}))
            );

            const metrics = await repository.bulkInsert(metricsData);

            expect(metrics).toHaveLength(2);
            expect(metrics[0]).toBeInstanceOf(Metric);
            expect(mockDb.insert).toHaveBeenCalled();
        });
    });
});