import {AlertRepository} from '../AlertRepository';
import {Alert} from '../../domain/entities/Alert';
import {db} from '../../db';

// Mock the database
jest.mock('../../db');

describe('AlertRepository', () => {
    let repository: AlertRepository;
    let mockDb: any;

    beforeEach(() => {
        mockDb = {
            select: jest.fn().mockReturnThis(),
            from: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
            returning: jest.fn().mockReturnThis(),
            first: jest.fn(),
            then: jest.fn(),
        };

        (db as jest.Mock).mockReturnValue(mockDb);
        repository = new AlertRepository();
    });

    describe('create', () => {
        it('should create a new alert', async () => {
            const alertData = {
                projectId: 1,
                name: 'High CPU Usage',
                description: 'Alert when CPU exceeds 80%',
                metricType: 'cpu' as const,
                condition: 'greater_than' as const,
                threshold: 80,
                severity: 'warning' as const,
                enabled: true,
            };

            mockDb.returning.mockResolvedValue([{
                id: 1,
                ...alertData,
                created_at: new Date(),
                updated_at: new Date(),
            }]);

            const alert = await repository.create(alertData);

            expect(alert).toBeInstanceOf(Alert);
            expect(alert.id).toBe(1);
            expect(alert.name).toBe('High CPU Usage');
            expect(db).toHaveBeenCalledWith('alerts');
            expect(mockDb.insert).toHaveBeenCalled();
        });

        it('should handle creation errors', async () => {
            mockDb.returning.mockRejectedValue(new Error('Database error'));

            await expect(repository.create({
                projectId: 1,
                name: 'Test Alert',
                description: 'Test',
                metricType: 'cpu' as const,
                condition: 'greater_than' as const,
                threshold: 80,
                severity: 'warning' as const,
                enabled: true,
            })).rejects.toThrow('Database error');
        });
    });

    describe('findById', () => {
        it('should find an alert by id', async () => {
            const alertData = {
                id: 1,
                project_id: 1,
                name: 'High CPU Usage',
                description: 'Alert when CPU exceeds 80%',
                metric_type: 'cpu',
                condition: 'greater_than',
                threshold: 80,
                severity: 'warning',
                enabled: true,
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockDb.first.mockResolvedValue(alertData);

            const alert = await repository.findById(1);

            expect(alert).toBeInstanceOf(Alert);
            expect(alert?.id).toBe(1);
            expect(db).toHaveBeenCalledWith('alerts');
            expect(mockDb.where).toHaveBeenCalledWith({id: 1});
        });

        it('should return null for non-existent alert', async () => {
            mockDb.first.mockResolvedValue(null);

            const alert = await repository.findById(999);

            expect(alert).toBeNull();
        });
    });

    describe('findByProject', () => {
        it('should find alerts by project id', async () => {
            const alertsData = [
                {
                    id: 1,
                    project_id: 1,
                    name: 'High CPU Usage',
                    description: 'Alert when CPU exceeds 80%',
                    metric_type: 'cpu',
                    condition: 'greater_than',
                    threshold: 80,
                    severity: 'warning',
                    enabled: true,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    id: 2,
                    project_id: 1,
                    name: 'Low Memory',
                    description: 'Alert when memory drops below 10%',
                    metric_type: 'memory',
                    condition: 'less_than',
                    threshold: 10,
                    severity: 'critical',
                    enabled: true,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ];

            mockDb.orderBy.mockResolvedValue(alertsData);

            const alerts = await repository.findByProject(1);

            expect(alerts).toHaveLength(2);
            expect(alerts[0]).toBeInstanceOf(Alert);
            expect(db).toHaveBeenCalledWith('alerts');
            expect(mockDb.where).toHaveBeenCalledWith({project_id: 1});
        });

        it('should filter by enabled status', async () => {
            mockDb.orderBy.mockResolvedValue([]);

            await repository.findByProject(1, true);

            expect(mockDb.where).toHaveBeenCalledWith({
                project_id: 1,
                enabled: true,
            });
        });
    });

    describe('findEnabledByProject', () => {
        it('should find only enabled alerts', async () => {
            const alertsData = [
                {
                    id: 1,
                    project_id: 1,
                    name: 'High CPU Usage',
                    description: 'Alert when CPU exceeds 80%',
                    metric_type: 'cpu',
                    condition: 'greater_than',
                    threshold: 80,
                    severity: 'warning',
                    enabled: true,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ];

            mockDb.orderBy.mockResolvedValue(alertsData);

            const alerts = await repository.findEnabledByProject(1);

            expect(alerts).toHaveLength(1);
            expect(alerts[0].enabled).toBe(true);
            expect(mockDb.where).toHaveBeenCalledWith({
                project_id: 1,
                enabled: true,
            });
        });
    });

    describe('findByMetricType', () => {
        it('should find alerts by metric type', async () => {
            const alertsData = [
                {
                    id: 1,
                    project_id: 1,
                    name: 'High CPU Usage',
                    description: 'Alert when CPU exceeds 80%',
                    metric_type: 'cpu',
                    condition: 'greater_than',
                    threshold: 80,
                    severity: 'warning',
                    enabled: true,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ];

            mockDb.orderBy.mockResolvedValue(alertsData);

            const alerts = await repository.findByMetricType(1, 'cpu');

            expect(alerts).toHaveLength(1);
            expect(alerts[0].metricType).toBe('cpu');
            expect(mockDb.where).toHaveBeenCalledWith({
                project_id: 1,
                metric_type: 'cpu',
            });
        });
    });

    describe('update', () => {
        it('should update an alert', async () => {
            const updatedData = {
                threshold: 90,
                severity: 'critical' as const,
            };

            mockDb.returning.mockResolvedValue([{
                id: 1,
                project_id: 1,
                name: 'High CPU Usage',
                description: 'Alert when CPU exceeds 90%',
                metric_type: 'cpu',
                condition: 'greater_than',
                threshold: 90,
                severity: 'critical',
                enabled: true,
                created_at: new Date(),
                updated_at: new Date(),
            }]);

            const alert = await repository.update(1, updatedData);

            expect(alert).toBeInstanceOf(Alert);
            expect(alert.threshold).toBe(90);
            expect(alert.severity).toBe('critical');
            expect(mockDb.update).toHaveBeenCalled();
            expect(mockDb.where).toHaveBeenCalledWith({id: 1});
        });

        it('should handle update errors', async () => {
            mockDb.returning.mockRejectedValue(new Error('Database error'));

            await expect(repository.update(1, {threshold: 90}))
                .rejects.toThrow('Database error');
        });
    });

    describe('enable/disable', () => {
        it('should enable an alert', async () => {
            mockDb.returning.mockResolvedValue([{
                id: 1,
                project_id: 1,
                name: 'High CPU Usage',
                description: 'Alert when CPU exceeds 80%',
                metric_type: 'cpu',
                condition: 'greater_than',
                threshold: 80,
                severity: 'warning',
                enabled: true,
                created_at: new Date(),
                updated_at: new Date(),
            }]);

            const alert = await repository.enable(1);

            expect(alert.enabled).toBe(true);
            expect(mockDb.update).toHaveBeenCalledWith({
                enabled: true,
                updated_at: expect.any(Date),
            });
        });

        it('should disable an alert', async () => {
            mockDb.returning.mockResolvedValue([{
                id: 1,
                project_id: 1,
                name: 'High CPU Usage',
                description: 'Alert when CPU exceeds 80%',
                metric_type: 'cpu',
                condition: 'greater_than',
                threshold: 80,
                severity: 'warning',
                enabled: false,
                created_at: new Date(),
                updated_at: new Date(),
            }]);

            const alert = await repository.disable(1);

            expect(alert.enabled).toBe(false);
            expect(mockDb.update).toHaveBeenCalledWith({
                enabled: false,
                updated_at: expect.any(Date),
            });
        });
    });

    describe('delete', () => {
        it('should delete an alert', async () => {
            mockDb.then.mockResolvedValue(1);

            const result = await repository.delete(1);

            expect(result).toBe(true);
            expect(db).toHaveBeenCalledWith('alerts');
            expect(mockDb.where).toHaveBeenCalledWith({id: 1});
            expect(mockDb.delete).toHaveBeenCalled();
        });

        it('should return false if alert not found', async () => {
            mockDb.then.mockResolvedValue(0);

            const result = await repository.delete(999);

            expect(result).toBe(false);
        });
    });

    describe('getTriggeredAlerts', () => {
        it('should get recently triggered alerts', async () => {
            const alertsData = [
                {
                    id: 1,
                    project_id: 1,
                    name: 'High CPU Usage',
                    description: 'Alert when CPU exceeds 80%',
                    metric_type: 'cpu',
                    condition: 'greater_than',
                    threshold: 80,
                    severity: 'warning',
                    enabled: true,
                    last_triggered: new Date(),
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ];

            mockDb.orderBy.mockResolvedValue(alertsData);

            const alerts = await repository.getTriggeredAlerts(1, 24);

            expect(alerts).toHaveLength(1);
            expect(mockDb.where).toHaveBeenCalled();
        });
    });

    describe('recordTrigger', () => {
        it('should record alert trigger', async () => {
            mockDb.returning.mockResolvedValue([{id: 1}]);

            await repository.recordTrigger(1, 1, 85.5);

            expect(db).toHaveBeenCalledWith('alert_history');
            expect(mockDb.insert).toHaveBeenCalledWith({
                alert_id: 1,
                metric_id: 1,
                triggered_value: 85.5,
                triggered_at: expect.any(Date),
            });
        });
    });
});