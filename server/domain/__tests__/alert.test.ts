import {Alert} from '../entities/Alert';
import {Metric} from '../entities/Metric';

describe('Alert Entity', () => {
    describe('constructor', () => {
        it('should create a valid alert', () => {
            const alert = new Alert({
                id: 1,
                projectId: 1,
                name: 'High CPU Usage',
                description: 'Alert when CPU exceeds 80%',
                metricType: 'cpu',
                condition: 'greater_than',
                threshold: 80,
                severity: 'warning',
                enabled: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            expect(alert.id).toBe(1);
            expect(alert.name).toBe('High CPU Usage');
            expect(alert.threshold).toBe(80);
            expect(alert.severity).toBe('warning');
            expect(alert.enabled).toBe(true);
        });

        it('should throw error for invalid condition', () => {
            expect(() => {
                new Alert({
                    id: 1,
                    projectId: 1,
                    name: 'Test Alert',
                    description: 'Test',
                    metricType: 'cpu',
                    condition: 'invalid' as any,
                    threshold: 80,
                    severity: 'warning',
                    enabled: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }).toThrow('Invalid alert condition');
        });

        it('should throw error for invalid severity', () => {
            expect(() => {
                new Alert({
                    id: 1,
                    projectId: 1,
                    name: 'Test Alert',
                    description: 'Test',
                    metricType: 'cpu',
                    condition: 'greater_than',
                    threshold: 80,
                    severity: 'invalid' as any,
                    enabled: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }).toThrow('Invalid alert severity');
        });

        it('should throw error for empty name', () => {
            expect(() => {
                new Alert({
                    id: 1,
                    projectId: 1,
                    name: '',
                    description: 'Test',
                    metricType: 'cpu',
                    condition: 'greater_than',
                    threshold: 80,
                    severity: 'warning',
                    enabled: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }).toThrow('Alert name is required');
        });
    });

    describe('evaluation', () => {
        let alert: Alert;

        beforeEach(() => {
            alert = new Alert({
                id: 1,
                projectId: 1,
                name: 'High CPU Usage',
                description: 'Alert when CPU exceeds 80%',
                metricType: 'cpu',
                condition: 'greater_than',
                threshold: 80,
                severity: 'warning',
                enabled: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        });

        it('should trigger for greater_than condition', () => {
            const metric = new Metric({
                id: 1,
                projectId: 1,
                metricType: 'cpu',
                value: 85,
                unit: '%',
                timestamp: new Date(),
            });

            expect(alert.shouldTrigger(metric)).toBe(true);
        });

        it('should not trigger when value is below threshold', () => {
            const metric = new Metric({
                id: 1,
                projectId: 1,
                metricType: 'cpu',
                value: 75,
                unit: '%',
                timestamp: new Date(),
            });

            expect(alert.shouldTrigger(metric)).toBe(false);
        });

        it('should trigger for less_than condition', () => {
            const lowAlert = new Alert({
                id: 2,
                projectId: 1,
                name: 'Low Uptime',
                description: 'Alert when uptime drops below 99%',
                metricType: 'uptime',
                condition: 'less_than',
                threshold: 99,
                severity: 'critical',
                enabled: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const metric = new Metric({
                id: 1,
                projectId: 1,
                metricType: 'uptime',
                value: 98.5,
                unit: '%',
                timestamp: new Date(),
            });

            expect(lowAlert.shouldTrigger(metric)).toBe(true);
        });

        it('should trigger for equals condition', () => {
            const equalAlert = new Alert({
                id: 3,
                projectId: 1,
                name: 'Status Check',
                description: 'Alert when status equals 0',
                metricType: 'status',
                condition: 'equals',
                threshold: 0,
                severity: 'info',
                enabled: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const metric = new Metric({
                id: 1,
                projectId: 1,
                metricType: 'status',
                value: 0,
                unit: 'code',
                timestamp: new Date(),
            });

            expect(equalAlert.shouldTrigger(metric)).toBe(true);
        });

        it('should not trigger when disabled', () => {
            alert.disable();

            const metric = new Metric({
                id: 1,
                projectId: 1,
                metricType: 'cpu',
                value: 85,
                unit: '%',
                timestamp: new Date(),
            });

            expect(alert.shouldTrigger(metric)).toBe(false);
        });

        it('should not trigger for different metric type', () => {
            const metric = new Metric({
                id: 1,
                projectId: 1,
                metricType: 'memory',
                value: 85,
                unit: '%',
                timestamp: new Date(),
            });

            expect(alert.shouldTrigger(metric)).toBe(false);
        });
    });

    describe('state management', () => {
        let alert: Alert;

        beforeEach(() => {
            alert = new Alert({
                id: 1,
                projectId: 1,
                name: 'Test Alert',
                description: 'Test',
                metricType: 'cpu',
                condition: 'greater_than',
                threshold: 80,
                severity: 'warning',
                enabled: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        });

        it('should enable alert', () => {
            alert.disable();
            expect(alert.enabled).toBe(false);

            alert.enable();
            expect(alert.enabled).toBe(true);
        });

        it('should disable alert', () => {
            alert.disable();
            expect(alert.enabled).toBe(false);
        });

        it('should update threshold', () => {
            alert.updateThreshold(90);
            expect(alert.threshold).toBe(90);
            expect(alert.updatedAt.getTime()).toBeGreaterThan(alert.createdAt.getTime());
        });

        it('should update severity', () => {
            alert.updateSeverity('critical');
            expect(alert.severity).toBe('critical');
        });
    });

    describe('cooldown', () => {
        it('should track last triggered time', () => {
            const alert = new Alert({
                id: 1,
                projectId: 1,
                name: 'Test Alert',
                description: 'Test',
                metricType: 'cpu',
                condition: 'greater_than',
                threshold: 80,
                severity: 'warning',
                enabled: true,
                cooldownMinutes: 5,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const metric = new Metric({
                id: 1,
                projectId: 1,
                metricType: 'cpu',
                value: 85,
                unit: '%',
                timestamp: new Date(),
            });

            // First trigger should work
            expect(alert.shouldTrigger(metric)).toBe(true);
            alert.markTriggered();

            // Second trigger within cooldown should not work
            expect(alert.shouldTrigger(metric)).toBe(false);
        });

        it('should allow trigger after cooldown period', () => {
            const alert = new Alert({
                id: 1,
                projectId: 1,
                name: 'Test Alert',
                description: 'Test',
                metricType: 'cpu',
                condition: 'greater_than',
                threshold: 80,
                severity: 'warning',
                enabled: true,
                cooldownMinutes: 5,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const metric = new Metric({
                id: 1,
                projectId: 1,
                metricType: 'cpu',
                value: 85,
                unit: '%',
                timestamp: new Date(),
            });

            alert.markTriggered();

            // Simulate time passing
            const pastTime = new Date();
            pastTime.setMinutes(pastTime.getMinutes() - 6);
            alert.lastTriggered = pastTime;

            expect(alert.shouldTrigger(metric)).toBe(true);
        });
    });

    describe('serialization', () => {
        it('should convert to JSON', () => {
            const now = new Date();
            const alert = new Alert({
                id: 1,
                projectId: 1,
                name: 'High CPU Usage',
                description: 'Alert when CPU exceeds 80%',
                metricType: 'cpu',
                condition: 'greater_than',
                threshold: 80,
                severity: 'warning',
                enabled: true,
                createdAt: now,
                updatedAt: now,
            });

            const json = alert.toJSON();
            expect(json).toEqual({
                id: 1,
                projectId: 1,
                name: 'High CPU Usage',
                description: 'Alert when CPU exceeds 80%',
                metricType: 'cpu',
                condition: 'greater_than',
                threshold: 80,
                severity: 'warning',
                enabled: true,
                cooldownMinutes: undefined,
                lastTriggered: undefined,
                createdAt: now.toISOString(),
                updatedAt: now.toISOString(),
            });
        });
    });
});