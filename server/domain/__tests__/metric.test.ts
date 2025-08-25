import {Metric} from '../entities/Metric';

describe('Metric Entity', () => {
    describe('constructor', () => {
        it('should create a valid metric', () => {
            const metric = new Metric({
                id: 1,
                projectId: 1,
                metricType: 'cpu',
                value: 75.5,
                unit: '%',
                timestamp: new Date(),
                tags: {environment: 'production'},
            });

            expect(metric.id).toBe(1);
            expect(metric.metricType).toBe('cpu');
            expect(metric.value).toBe(75.5);
            expect(metric.unit).toBe('%');
        });

        it('should throw error for invalid metric type', () => {
            expect(() => {
                new Metric({
                    id: 1,
                    projectId: 1,
                    metricType: 'invalid' as any,
                    value: 75.5,
                    unit: '%',
                    timestamp: new Date(),
                });
            }).toThrow('Invalid metric type');
        });

        it('should throw error for negative value when not allowed', () => {
            expect(() => {
                new Metric({
                    id: 1,
                    projectId: 1,
                    metricType: 'cpu',
                    value: -10,
                    unit: '%',
                    timestamp: new Date(),
                });
            }).toThrow('CPU metric value cannot be negative');
        });

        it('should throw error for percentage over 100', () => {
            expect(() => {
                new Metric({
                    id: 1,
                    projectId: 1,
                    metricType: 'memory',
                    value: 150,
                    unit: '%',
                    timestamp: new Date(),
                });
            }).toThrow('Percentage value cannot exceed 100');
        });
    });

    describe('validation', () => {
        it('should validate CPU metrics', () => {
            const metric = new Metric({
                id: 1,
                projectId: 1,
                metricType: 'cpu',
                value: 75.5,
                unit: '%',
                timestamp: new Date(),
            });

            expect(metric.isValid()).toBe(true);
        });

        it('should validate response time metrics', () => {
            const metric = new Metric({
                id: 1,
                projectId: 1,
                metricType: 'response_time',
                value: 250,
                unit: 'ms',
                timestamp: new Date(),
            });

            expect(metric.isValid()).toBe(true);
        });

        it('should validate network metrics', () => {
            const metric = new Metric({
                id: 1,
                projectId: 1,
                metricType: 'network',
                value: 1024,
                unit: 'MB',
                timestamp: new Date(),
            });

            expect(metric.isValid()).toBe(true);
        });
    });

    describe('threshold checking', () => {
        it('should check if metric exceeds threshold', () => {
            const metric = new Metric({
                id: 1,
                projectId: 1,
                metricType: 'cpu',
                value: 85,
                unit: '%',
                timestamp: new Date(),
            });

            expect(metric.exceedsThreshold(80)).toBe(true);
            expect(metric.exceedsThreshold(90)).toBe(false);
        });

        it('should check if metric is below threshold', () => {
            const metric = new Metric({
                id: 1,
                projectId: 1,
                metricType: 'memory',
                value: 45,
                unit: '%',
                timestamp: new Date(),
            });

            expect(metric.isBelowThreshold(50)).toBe(true);
            expect(metric.isBelowThreshold(40)).toBe(false);
        });
    });

    describe('aggregation', () => {
        it('should calculate average of metrics', () => {
            const metrics = [
                new Metric({
                    id: 1,
                    projectId: 1,
                    metricType: 'cpu',
                    value: 60,
                    unit: '%',
                    timestamp: new Date(),
                }),
                new Metric({
                    id: 2,
                    projectId: 1,
                    metricType: 'cpu',
                    value: 70,
                    unit: '%',
                    timestamp: new Date(),
                }),
                new Metric({
                    id: 3,
                    projectId: 1,
                    metricType: 'cpu',
                    value: 80,
                    unit: '%',
                    timestamp: new Date(),
                }),
            ];

            const average = Metric.calculateAverage(metrics);
            expect(average).toBe(70);
        });

        it('should find max value', () => {
            const metrics = [
                new Metric({
                    id: 1,
                    projectId: 1,
                    metricType: 'response_time',
                    value: 100,
                    unit: 'ms',
                    timestamp: new Date(),
                }),
                new Metric({
                    id: 2,
                    projectId: 1,
                    metricType: 'response_time',
                    value: 250,
                    unit: 'ms',
                    timestamp: new Date(),
                }),
                new Metric({
                    id: 3,
                    projectId: 1,
                    metricType: 'response_time',
                    value: 150,
                    unit: 'ms',
                    timestamp: new Date(),
                }),
            ];

            const max = Metric.findMax(metrics);
            expect(max.value).toBe(250);
        });

        it('should find min value', () => {
            const metrics = [
                new Metric({
                    id: 1,
                    projectId: 1,
                    metricType: 'error_rate',
                    value: 2.5,
                    unit: '%',
                    timestamp: new Date(),
                }),
                new Metric({
                    id: 2,
                    projectId: 1,
                    metricType: 'error_rate',
                    value: 1.0,
                    unit: '%',
                    timestamp: new Date(),
                }),
                new Metric({
                    id: 3,
                    projectId: 1,
                    metricType: 'error_rate',
                    value: 3.5,
                    unit: '%',
                    timestamp: new Date(),
                }),
            ];

            const min = Metric.findMin(metrics);
            expect(min.value).toBe(1.0);
        });
    });

    describe('formatting', () => {
        it('should format value with unit', () => {
            const metric = new Metric({
                id: 1,
                projectId: 1,
                metricType: 'cpu',
                value: 75.5,
                unit: '%',
                timestamp: new Date(),
            });

            expect(metric.formatValue()).toBe('75.5%');
        });

        it('should format response time', () => {
            const metric = new Metric({
                id: 1,
                projectId: 1,
                metricType: 'response_time',
                value: 1250,
                unit: 'ms',
                timestamp: new Date(),
            });

            expect(metric.formatValue()).toBe('1250ms');
            expect(metric.formatValueHuman()).toBe('1.25s');
        });

        it('should format network data', () => {
            const metric = new Metric({
                id: 1,
                projectId: 1,
                metricType: 'network',
                value: 2048,
                unit: 'MB',
                timestamp: new Date(),
            });

            expect(metric.formatValue()).toBe('2048MB');
            expect(metric.formatValueHuman()).toBe('2.00GB');
        });
    });

    describe('serialization', () => {
        it('should convert to JSON', () => {
            const timestamp = new Date();
            const metric = new Metric({
                id: 1,
                projectId: 1,
                metricType: 'cpu',
                value: 75.5,
                unit: '%',
                timestamp: timestamp,
                tags: {environment: 'production'},
            });

            const json = metric.toJSON();
            expect(json).toEqual({
                id: 1,
                projectId: 1,
                metricType: 'cpu',
                value: 75.5,
                unit: '%',
                timestamp: timestamp.toISOString(),
                tags: {environment: 'production'},
            });
        });
    });
});