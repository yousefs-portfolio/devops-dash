import {Knex} from 'knex';

export async function seed(knex: Knex): Promise<void> {
    // Clear existing data
    await knex('webhook_events').del();
    await knex('alerts').del();
    await knex('metrics').del();
    await knex('projects').del();
    await knex('users').del();

    // Insert users
    const users = await knex('users')
        .insert([
            {
                id: 1,
                email: 'admin@devops-dash.com',
                password_hash: '$2b$10$X4kv7j5ZcG39WgogSl16peyvt5CUOVoTkXRlaIBLFqKONbFAF.4wS', // password: admin123
                name: 'Admin User',
                role: 'admin',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 2,
                email: 'dev@devops-dash.com',
                password_hash: '$2b$10$X4kv7j5ZcG39WgogSl16peyvt5CUOVoTkXRlaIBLFqKONbFAF.4wS', // password: admin123
                name: 'Developer User',
                role: 'developer',
                created_at: new Date(),
                updated_at: new Date(),
            },
        ])
        .returning('id');

    // Insert projects
    const projects = await knex('projects')
        .insert([
            {
                id: 1,
                name: 'E-Commerce Platform',
                description: 'Main e-commerce application',
                github_repo: 'org/ecommerce-platform',
                docker_image: 'org/ecommerce:latest',
                status: 'active',
                created_by: users[0].id,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 2,
                name: 'Payment Service',
                description: 'Microservice for payment processing',
                github_repo: 'org/payment-service',
                docker_image: 'org/payment:latest',
                status: 'active',
                created_by: users[0].id,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 3,
                name: 'Analytics Dashboard',
                description: 'Internal analytics dashboard',
                github_repo: 'org/analytics-dashboard',
                docker_image: 'org/analytics:latest',
                status: 'active',
                created_by: users[1].id,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 4,
                name: 'Mobile App API',
                description: 'REST API for mobile applications',
                github_repo: 'org/mobile-api',
                docker_image: 'org/mobile-api:latest',
                status: 'maintenance',
                created_by: users[1].id,
                created_at: new Date(),
                updated_at: new Date(),
            },
        ])
        .returning('id');

    // Insert metrics
    const metricsData = [];
    const metricTypes = ['cpu', 'memory', 'network', 'disk', 'response_time', 'error_rate'];

    // Generate metrics for last 7 days
    for (const project of projects) {
        for (let day = 0; day < 7; day++) {
            for (let hour = 0; hour < 24; hour++) {
                for (const metricType of metricTypes) {
                    const timestamp = new Date();
                    timestamp.setDate(timestamp.getDate() - day);
                    timestamp.setHours(hour, 0, 0, 0);

                    let value;
                    switch (metricType) {
                        case 'cpu':
                            value = 20 + Math.random() * 60; // 20-80%
                            break;
                        case 'memory':
                            value = 30 + Math.random() * 50; // 30-80%
                            break;
                        case 'network':
                            value = Math.random() * 1000; // 0-1000 MB
                            break;
                        case 'disk':
                            value = 40 + Math.random() * 40; // 40-80%
                            break;
                        case 'response_time':
                            value = 50 + Math.random() * 450; // 50-500ms
                            break;
                        case 'error_rate':
                            value = Math.random() * 5; // 0-5%
                            break;
                        default:
                            value = Math.random() * 100;
                    }

                    metricsData.push({
                        project_id: project.id,
                        metric_type: metricType,
                        value: value,
                        unit: metricType === 'network' ? 'MB' :
                            metricType === 'response_time' ? 'ms' : '%',
                        timestamp: timestamp,
                        created_at: timestamp,
                    });
                }
            }
        }
    }

    // Insert metrics in batches
    const batchSize = 500;
    for (let i = 0; i < metricsData.length; i += batchSize) {
        await knex('metrics').insert(metricsData.slice(i, i + batchSize));
    }

    // Insert alerts
    await knex('alerts').insert([
        {
            project_id: projects[0].id,
            name: 'High CPU Usage',
            description: 'Alert when CPU usage exceeds 80%',
            metric_type: 'cpu',
            condition: 'greater_than',
            threshold: 80,
            severity: 'warning',
            enabled: true,
            created_at: new Date(),
            updated_at: new Date(),
        },
        {
            project_id: projects[0].id,
            name: 'Critical Memory Usage',
            description: 'Alert when memory usage exceeds 90%',
            metric_type: 'memory',
            condition: 'greater_than',
            threshold: 90,
            severity: 'critical',
            enabled: true,
            created_at: new Date(),
            updated_at: new Date(),
        },
        {
            project_id: projects[1].id,
            name: 'High Response Time',
            description: 'Alert when response time exceeds 1000ms',
            metric_type: 'response_time',
            condition: 'greater_than',
            threshold: 1000,
            severity: 'warning',
            enabled: true,
            created_at: new Date(),
            updated_at: new Date(),
        },
        {
            project_id: projects[1].id,
            name: 'Error Rate Spike',
            description: 'Alert when error rate exceeds 5%',
            metric_type: 'error_rate',
            condition: 'greater_than',
            threshold: 5,
            severity: 'critical',
            enabled: true,
            created_at: new Date(),
            updated_at: new Date(),
        },
        {
            project_id: projects[2].id,
            name: 'Low Disk Space',
            description: 'Alert when disk usage exceeds 85%',
            metric_type: 'disk',
            condition: 'greater_than',
            threshold: 85,
            severity: 'warning',
            enabled: true,
            created_at: new Date(),
            updated_at: new Date(),
        },
    ]);

    // Insert webhook events
    const webhookEvents = [];
    const eventTypes = ['push', 'pull_request', 'deployment', 'release', 'workflow_run'];
    const eventStatuses = ['success', 'failure', 'pending', 'cancelled'];

    for (const project of projects) {
        for (let i = 0; i < 20; i++) {
            const timestamp = new Date();
            timestamp.setHours(timestamp.getHours() - Math.floor(Math.random() * 168)); // Random time in last week

            webhookEvents.push({
                project_id: project.id,
                event_type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
                payload: JSON.stringify({
                    repository: `org/${project.name.toLowerCase().replace(/ /g, '-')}`,
                    action: 'completed',
                    sender: {
                        login: `user${Math.floor(Math.random() * 10)}`,
                        avatar_url: `https://github.com/user${Math.floor(Math.random() * 10)}.png`,
                    },
                    head_commit: {
                        id: Math.random().toString(36).substring(7),
                        message: `Update ${Math.random().toString(36).substring(7)}`,
                        timestamp: timestamp.toISOString(),
                    },
                }),
                status: eventStatuses[Math.floor(Math.random() * eventStatuses.length)],
                created_at: timestamp,
            });
        }
    }

    await knex('webhook_events').insert(webhookEvents);

    console.log('Database seeded successfully!');
}