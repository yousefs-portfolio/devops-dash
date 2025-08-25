import nodemailer from 'nodemailer';
import axios from 'axios';
import {Alert} from '../entities/Alert';

interface EmailConfig {
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    };
    from: string;
}

// interface SlackConfig {
//     webhookUrl: string;
//     channel?: string;
//     username?: string;
//     iconEmoji?: string;
// }

interface NotificationContext {
    alert: Alert;
    currentValue: number;
    threshold: number;
    timestamp: Date;
    projectName?: string;
}

export class NotificationService {
    private emailTransporter: nodemailer.Transporter | null = null;
    private slackWebhookUrl: string | null = null;
    private notificationWebhooks: Map<string, string> = new Map();

    constructor() {
        this.initializeEmailTransporter();
        this.initializeSlackWebhook();
    }

    private initializeEmailTransporter(): void {
        const emailEnabled = process.env.EMAIL_ENABLED === 'true';

        if (!emailEnabled) {
            console.log('Email notifications disabled');
            return;
        }

        const config: EmailConfig = {
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER || '',
                pass: process.env.EMAIL_PASS || '',
            },
            from: process.env.EMAIL_FROM || 'DevOps Dashboard <noreply@devops.local>',
        };

        if (!config.auth.user || !config.auth.pass) {
            console.log('Email credentials not configured');
            return;
        }

        try {
            this.emailTransporter = nodemailer.createTransporter({
                host: config.host,
                port: config.port,
                secure: config.secure,
                auth: config.auth,
            });

            // Verify connection
            this.emailTransporter.verify((error) => {
                if (error) {
                    console.error('Email transporter verification failed:', error);
                    this.emailTransporter = null;
                } else {
                    console.log('Email notification service ready');
                }
            });
        } catch (error) {
            console.error('Failed to initialize email transporter:', error);
        }
    }

    private initializeSlackWebhook(): void {
        this.slackWebhookUrl = process.env.SLACK_WEBHOOK_URL || null;

        if (!this.slackWebhookUrl) {
            console.log('Slack webhook URL not configured');
        } else {
            console.log('Slack notification service ready');
        }
    }

    async sendEmailNotification(context: NotificationContext, recipients: string[]): Promise<void> {
        if (!this.emailTransporter) {
            console.warn('Email transporter not configured, skipping email notification');
            return;
        }

        const {alert, currentValue, threshold, timestamp, projectName} = context;

        const subject = `[Alert] ${alert.severity.toUpperCase()}: ${alert.name}`;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .alert-container { 
                        border: 2px solid ${this.getSeverityColor(alert.severity)}; 
                        border-radius: 8px; 
                        padding: 20px;
                        margin: 20px 0;
                    }
                    .severity { 
                        color: ${this.getSeverityColor(alert.severity)}; 
                        font-weight: bold;
                        text-transform: uppercase;
                    }
                    .metric { 
                        background: #f5f5f5; 
                        padding: 10px; 
                        border-radius: 4px;
                        margin: 10px 0;
                    }
                    .footer { 
                        margin-top: 30px; 
                        padding-top: 20px; 
                        border-top: 1px solid #ccc;
                        font-size: 12px;
                        color: #666;
                    }
                </style>
            </head>
            <body>
                <div class="alert-container">
                    <h2>Alert Triggered: ${alert.name}</h2>
                    <p><span class="severity">${alert.severity}</span> Alert</p>
                    ${projectName ? `<p><strong>Project:</strong> ${projectName}</p>` : ''}
                    ${alert.description ? `<p><strong>Description:</strong> ${alert.description}</p>` : ''}
                    
                    <div class="metric">
                        <p><strong>Metric Type:</strong> ${alert.metric_type}</p>
                        <p><strong>Current Value:</strong> ${currentValue.toFixed(2)}</p>
                        <p><strong>Threshold:</strong> ${threshold.toFixed(2)}</p>
                        <p><strong>Condition:</strong> ${alert.condition.type.replace('_', ' ')}</p>
                    </div>
                    
                    <p><strong>Triggered at:</strong> ${timestamp.toLocaleString()}</p>
                    
                    <div class="footer">
                        <p>This is an automated notification from DevOps Dashboard.</p>
                        <p>To manage alert settings, visit your dashboard.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const text = `
Alert Triggered: ${alert.name}
Severity: ${alert.severity.toUpperCase()}
${projectName ? `Project: ${projectName}` : ''}
${alert.description ? `Description: ${alert.description}` : ''}

Metric Type: ${alert.metric_type}
Current Value: ${currentValue.toFixed(2)}
Threshold: ${threshold.toFixed(2)}
Condition: ${alert.condition.type.replace('_', ' ')}

Triggered at: ${timestamp.toLocaleString()}

This is an automated notification from DevOps Dashboard.
        `.trim();

        try {
            await this.emailTransporter.sendMail({
                from: process.env.EMAIL_FROM || 'DevOps Dashboard <noreply@devops.local>',
                to: recipients.join(', '),
                subject,
                text,
                html,
            });

            console.log(`Email notification sent for alert: ${alert.name} to ${recipients.length} recipients`);
        } catch (error) {
            console.error('Failed to send email notification:', error);
            throw new Error(`Email notification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async sendSlackNotification(context: NotificationContext): Promise<void> {
        if (!this.slackWebhookUrl) {
            console.warn('Slack webhook not configured, skipping Slack notification');
            return;
        }

        const {alert, currentValue, threshold, timestamp, projectName} = context;

        const color = this.getSeverityColor(alert.severity);
        const emoji = this.getSeverityEmoji(alert.severity);

        const payload = {
            channel: process.env.SLACK_CHANNEL,
            username: process.env.SLACK_USERNAME || 'DevOps Dashboard',
            icon_emoji: process.env.SLACK_ICON || ':warning:',
            attachments: [
                {
                    color,
                    title: `${emoji} Alert: ${alert.name}`,
                    text: alert.description || '',
                    fields: [
                        {
                            title: 'Severity',
                            value: alert.severity.toUpperCase(),
                            short: true,
                        },
                        {
                            title: 'Project',
                            value: projectName || 'N/A',
                            short: true,
                        },
                        {
                            title: 'Metric Type',
                            value: alert.metric_type,
                            short: true,
                        },
                        {
                            title: 'Current Value',
                            value: currentValue.toFixed(2),
                            short: true,
                        },
                        {
                            title: 'Threshold',
                            value: threshold.toFixed(2),
                            short: true,
                        },
                        {
                            title: 'Condition',
                            value: alert.condition.type.replace('_', ' '),
                            short: true,
                        },
                    ],
                    footer: 'DevOps Dashboard',
                    ts: Math.floor(timestamp.getTime() / 1000),
                },
            ],
        };

        try {
            const response = await axios.post(this.slackWebhookUrl, payload);

            if (response.status === 200) {
                console.log(`Slack notification sent for alert: ${alert.name}`);
            } else {
                throw new Error(`Unexpected response status: ${response.status}`);
            }
        } catch (error) {
            console.error('Failed to send Slack notification:', error);
            throw new Error(`Slack notification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async sendWebhookNotification(context: NotificationContext, webhookUrl: string): Promise<void> {
        const {alert, currentValue, threshold, timestamp, projectName} = context;

        const payload = {
            event: 'alert.triggered',
            timestamp: timestamp.toISOString(),
            alert: {
                id: alert.id,
                name: alert.name,
                description: alert.description,
                severity: alert.severity,
                metric_type: alert.metric_type,
                project_id: alert.project_id,
                project_name: projectName,
            },
            condition: {
                type: alert.condition.type,
                threshold: threshold,
                current_value: currentValue,
                duration_seconds: alert.condition.duration_seconds,
            },
            metadata: {
                source: 'devops-dashboard',
                version: '1.0.0',
            },
        };

        try {
            const response = await axios.post(webhookUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'DevOps-Dashboard/1.0',
                },
                timeout: 10000, // 10 second timeout
            });

            if (response.status >= 200 && response.status < 300) {
                console.log(`Webhook notification sent for alert: ${alert.name} to ${webhookUrl}`);
            } else {
                throw new Error(`Webhook returned status ${response.status}`);
            }
        } catch (error) {
            console.error('Failed to send webhook notification:', error);

            if (axios.isAxiosError(error)) {
                if (error.response) {
                    throw new Error(`Webhook failed with status ${error.response.status}: ${error.response.data}`);
                } else if (error.request) {
                    throw new Error('Webhook request failed: No response received');
                } else {
                    throw new Error(`Webhook request setup failed: ${error.message}`);
                }
            }

            throw new Error(`Webhook notification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async sendTestNotification(channel: 'email' | 'slack' | 'webhook', config?: Record<string, unknown>): Promise<boolean> {
        const testAlert: Alert = {
            id: 'test-alert',
            project_id: 'test-project',
            name: 'Test Alert',
            description: 'This is a test notification',
            metric_type: 'cpu_usage',
            condition: {
                type: 'greater_than',
                threshold: 80,
                duration_seconds: 60,
            },
            severity: 'info',
            status: 'active',
            notification_channels: [channel],
            notification_config: config || {},
            triggered_count: 0,
            created_at: new Date(),
            updated_at: new Date(),
        } as Alert;

        const context: NotificationContext = {
            alert: testAlert,
            currentValue: 85,
            threshold: 80,
            timestamp: new Date(),
            projectName: 'Test Project',
        };

        try {
            switch (channel) {
                case 'email':
                    if (!config?.recipients || !Array.isArray(config.recipients)) {
                        throw new Error('Email recipients required for test');
                    }
                    await this.sendEmailNotification(context, config.recipients);
                    break;

                case 'slack':
                    await this.sendSlackNotification(context);
                    break;

                case 'webhook':
                    if (!config?.url) {
                        throw new Error('Webhook URL required for test');
                    }
                    await this.sendWebhookNotification(context, config.url);
                    break;

                default:
                    throw new Error(`Unknown notification channel: ${channel}`);
            }

            return true;
        } catch (error) {
            console.error(`Test notification failed for ${channel}:`, error);
            return false;
        }
    }

    private getSeverityColor(severity: string): string {
        switch (severity) {
            case 'critical':
                return '#FF0000';
            case 'high':
                return '#FF6B00';
            case 'medium':
                return '#FFA500';
            case 'low':
                return '#FFD700';
            case 'info':
                return '#00BFFF';
            default:
                return '#808080';
        }
    }

    private getSeverityEmoji(severity: string): string {
        switch (severity) {
            case 'critical':
                return '🚨';
            case 'high':
                return '⚠️';
            case 'medium':
                return '⚡';
            case 'low':
                return '📊';
            case 'info':
                return 'ℹ️';
            default:
                return '📌';
        }
    }
}