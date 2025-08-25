import cron from 'node-cron';
import {AlertRepository} from '../repositories/AlertRepository';
import {MetricRepository} from '../repositories/MetricRepository';
import {Server} from 'socket.io';
import {Alert, AlertStatus} from '../entities/Alert';
import {MetricType} from '../entities/Metric';

export class AlertEvaluatorService {
    private alertRepo: AlertRepository;
    private metricRepo: MetricRepository;
    private io: Server | null = null;
    private evaluationTask: cron.ScheduledTask | null = null;
    private alertStates: Map<string, { triggered: boolean; since: Date }> = new Map();

    constructor(io?: Server) {
        this.alertRepo = new AlertRepository();
        this.metricRepo = new MetricRepository();
        this.io = io || null;
    }

    startEvaluation(interval = '*/1 * * * *'): void {
        if (this.evaluationTask) {
            this.evaluationTask.stop();
        }

        this.evaluationTask = cron.schedule(interval, async () => {
            await this.evaluateAllAlerts();
        });

        this.evaluationTask.start();
        console.log(`Started alert evaluation with interval: ${interval}`);
    }

    stopEvaluation(): void {
        if (this.evaluationTask) {
            this.evaluationTask.stop();
            this.evaluationTask = null;
            console.log('Stopped alert evaluation');
        }
    }

    async evaluateAllAlerts(): Promise<void> {
        try {
            const activeAlerts = await this.alertRepo.findAll({status: 'active'});

            for (const alert of activeAlerts) {
                await this.evaluateAlert(alert);
            }
        } catch (error) {
            console.error('Failed to evaluate alerts:', error);
        }
    }

    async evaluateAlert(alert: Alert): Promise<void> {
        try {
            // Get latest metric for this alert
            const latestMetric = await this.metricRepo.findLatest(
                alert.project_id,
                alert.metric_type as MetricType
            );

            if (!latestMetric) {
                return; // No metrics to evaluate
            }

            // Check if metric is stale (older than 10 minutes)
            const metricAge = Date.now() - new Date(latestMetric.timestamp).getTime();
            if (metricAge > 10 * 60 * 1000) {
                return; // Metric too old, skip evaluation
            }

            const conditionMet = this.checkCondition(
                latestMetric.value,
                alert.condition.type,
                alert.condition.threshold
            );

            const alertStateKey = alert.id;
            const currentState = this.alertStates.get(alertStateKey);

            if (conditionMet) {
                if (!currentState || !currentState.triggered) {
                    // New alert trigger
                    this.alertStates.set(alertStateKey, {
                        triggered: true,
                        since: new Date(),
                    });

                    // Check if duration requirement is met
                    setTimeout(async () => {
                        const state = this.alertStates.get(alertStateKey);
                        if (state && state.triggered) {
                            const duration = Date.now() - state.since.getTime();
                            if (duration >= (alert.condition.duration_seconds || 60) * 1000) {
                                await this.triggerAlert(alert, latestMetric.value);
                            }
                        }
                    }, (alert.condition.duration_seconds || 60) * 1000);
                }
            } else {
                // Condition not met, clear alert state
                if (currentState && currentState.triggered) {
                    this.alertStates.delete(alertStateKey);
                    await this.resolveAlert(alert);
                }
            }
        } catch (error) {
            console.error(`Failed to evaluate alert ${alert.id}:`, error);
        }
    }

    private checkCondition(value: number, condition: string, threshold: number): boolean {
        switch (condition) {
            case 'greater_than':
                return value > threshold;
            case 'less_than':
                return value < threshold;
            case 'equals':
                return Math.abs(value - threshold) < 0.001;
            case 'not_equals':
                return Math.abs(value - threshold) >= 0.001;
            default:
                return false;
        }
    }

    private async triggerAlert(alert: Alert, currentValue: number): Promise<void> {
        try {
            // Update alert status
            await this.alertRepo.trigger(alert.id);

            // Send notifications
            await this.sendNotifications(alert, currentValue);

            // Emit WebSocket event
            if (this.io) {
                const notification = {
                    alertId: alert.id,
                    projectId: alert.project_id,
                    name: alert.name,
                    severity: alert.severity,
                    message: `Alert triggered: ${alert.name}. Current value: ${currentValue}, Threshold: ${alert.condition.threshold}`,
                    timestamp: new Date(),
                };

                this.io.to(`project-${alert.project_id}`).emit('alert:triggered', notification);
                this.io.emit('alert:triggered', notification); // Global notification
            }

            console.log(`Alert triggered: ${alert.name} (ID: ${alert.id})`);
        } catch (error) {
            console.error(`Failed to trigger alert ${alert.id}:`, error);
        }
    }

    private async resolveAlert(alert: Alert): Promise<void> {
        try {
            // Only resolve if alert was triggered
            if (alert.status === 'active' && alert.triggered_at) {
                await this.alertRepo.resolve(alert.id);

                // Emit WebSocket event
                if (this.io) {
                    const notification = {
                        alertId: alert.id,
                        projectId: alert.project_id,
                        name: alert.name,
                        message: `Alert resolved: ${alert.name}`,
                        timestamp: new Date(),
                    };

                    this.io.to(`project-${alert.project_id}`).emit('alert:resolved', notification);
                    this.io.emit('alert:resolved', notification); // Global notification
                }

                console.log(`Alert resolved: ${alert.name} (ID: ${alert.id})`);
            }
        } catch (error) {
            console.error(`Failed to resolve alert ${alert.id}:`, error);
        }
    }

    private async sendNotifications(alert: Alert, currentValue: number): Promise<void> {
        // Iterate through notification channels
        for (const channel of alert.notification_channels) {
            switch (channel) {
                case 'email':
                    await this.sendEmailNotification(alert, currentValue);
                    break;
                case 'slack':
                    await this.sendSlackNotification(alert, currentValue);
                    break;
                case 'webhook':
                    await this.sendWebhookNotification(alert, currentValue);
                    break;
                default:
                    console.warn(`Unknown notification channel: ${channel}`);
            }
        }
    }

    private async sendEmailNotification(alert: Alert, currentValue: number): Promise<void> {
        // TODO: Implement email notification
        console.log(`Email notification would be sent for alert: ${alert.name}`);
    }

    private async sendSlackNotification(alert: Alert, currentValue: number): Promise<void> {
        // TODO: Implement Slack notification
        console.log(`Slack notification would be sent for alert: ${alert.name}`);
    }

    private async sendWebhookNotification(alert: Alert, currentValue: number): Promise<void> {
        // TODO: Implement webhook notification
        console.log(`Webhook notification would be sent for alert: ${alert.name}`);
    }
}