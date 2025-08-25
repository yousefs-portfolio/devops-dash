import {db} from '../database/connection';
import {Alert, AlertEntity, AlertStatus} from '../entities/Alert';
import {AlertFilters, CreateAlertDTO, IAlertRepository, UpdateAlertDTO,} from './interfaces/IAlertRepository';

export class AlertRepository implements IAlertRepository {
    private table = 'alerts';

    async create(data: CreateAlertDTO): Promise<Alert> {
        const [created] = await db(this.table)
            .insert({
                project_id: data.projectId,
                name: data.name,
                description: data.description,
                severity: data.severity,
                status: 'active',
                metric_type: data.metricType,
                condition: data.condition,
                threshold: data.threshold,
                duration_seconds: data.durationSeconds || 60,
                notification_channels: JSON.stringify(data.notificationChannels || []),
                metadata: JSON.stringify(data.metadata || {}),
            })
            .returning('*');

        return this.mapToEntity(created);
    }

    async findById(id: string): Promise<Alert | null> {
        const result = await db(this.table).where({id}).first();
        return result ? this.mapToEntity(result) : null;
    }

    async findAll(filters?: AlertFilters): Promise<Alert[]> {
        let query = db(this.table);

        if (filters) {
            if (filters.projectId) {
                query = query.where({project_id: filters.projectId});
            }
            if (filters.status) {
                query = query.where({status: filters.status});
            }
            if (filters.severity) {
                query = query.where({severity: filters.severity});
            }
            if (filters.startDate) {
                query = query.where('created_at', '>=', filters.startDate);
            }
            if (filters.endDate) {
                query = query.where('created_at', '<=', filters.endDate);
            }
        }

        const results = await query.orderBy('created_at', 'desc');
        return results.map(this.mapToEntity);
    }

    async findActive(projectId: string): Promise<Alert[]> {
        const results = await db(this.table)
            .where({project_id: projectId, status: 'active'})
            .orderBy('severity', 'asc')
            .orderBy('created_at', 'desc');

        return results.map(this.mapToEntity);
    }

    async update(data: UpdateAlertDTO): Promise<Alert | null> {
        const updateData: Record<string, unknown> = {};

        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.severity !== undefined) updateData.severity = data.severity;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.metricType !== undefined) updateData.metric_type = data.metricType;
        if (data.condition !== undefined) updateData.condition = data.condition;
        if (data.threshold !== undefined) updateData.threshold = data.threshold;
        if (data.durationSeconds !== undefined) updateData.duration_seconds = data.durationSeconds;
        if (data.notificationChannels !== undefined) {
            updateData.notification_channels = JSON.stringify(data.notificationChannels);
        }
        if (data.metadata !== undefined) {
            updateData.metadata = JSON.stringify(data.metadata);
        }
        if (data.triggeredAt !== undefined) updateData.triggered_at = data.triggeredAt;
        if (data.acknowledgedAt !== undefined) updateData.acknowledged_at = data.acknowledgedAt;
        if (data.resolvedAt !== undefined) updateData.resolved_at = data.resolvedAt;
        if (data.acknowledgedBy !== undefined) updateData.acknowledged_by = data.acknowledgedBy;

        updateData.updated_at = new Date();

        const [updated] = await db(this.table)
            .where({id: data.id})
            .update(updateData)
            .returning('*');

        return updated ? this.mapToEntity(updated) : null;
    }

    async delete(id: string): Promise<boolean> {
        const deleted = await db(this.table).where({id}).del();
        return deleted > 0;
    }

    async acknowledge(id: string, userId: string): Promise<Alert | null> {
        const [updated] = await db(this.table)
            .where({id})
            .update({
                status: 'acknowledged',
                acknowledged_at: new Date(),
                acknowledged_by: userId,
                updated_at: new Date(),
            })
            .returning('*');

        return updated ? this.mapToEntity(updated) : null;
    }

    async resolve(id: string): Promise<Alert | null> {
        const [updated] = await db(this.table)
            .where({id})
            .update({
                status: 'resolved',
                resolved_at: new Date(),
                updated_at: new Date(),
            })
            .returning('*');

        return updated ? this.mapToEntity(updated) : null;
    }

    async trigger(id: string): Promise<Alert | null> {
        const [updated] = await db(this.table)
            .where({id})
            .update({
                status: 'active',
                triggered_at: new Date(),
                updated_at: new Date(),
            })
            .returning('*');

        return updated ? this.mapToEntity(updated) : null;
    }

    async countByStatus(projectId?: string): Promise<Record<AlertStatus, number>> {
        let query = db(this.table)
            .select('status')
            .count('* as count')
            .groupBy('status');

        if (projectId) {
            query = query.where({project_id: projectId});
        }

        const results = await query;

        const counts: Record<AlertStatus, number> = {
            active: 0,
            inactive: 0,
            acknowledged: 0,
            resolved: 0,
        };

        results.forEach(row => {
            counts[row.status as AlertStatus] = parseInt(row.count as string, 10);
        });

        return counts;
    }

    private mapToEntity(row: Record<string, unknown>): Alert {
        const notificationChannels = typeof row.notification_channels === 'string'
            ? JSON.parse(row.notification_channels)
            : row.notification_channels;
        const metadata = typeof row.metadata === 'string'
            ? JSON.parse(row.metadata)
            : row.metadata;

        return new AlertEntity({
            id: row.id,
            project_id: row.project_id,
            name: row.name,
            description: row.description,
            severity: row.severity,
            status: row.status,
            metric_type: row.metric_type,
            condition: {
                type: row.condition,
                threshold: parseFloat(row.threshold),
                duration_seconds: row.duration_seconds,
            },
            notification_channels: notificationChannels,
            metadata,
            triggered_at: row.triggered_at,
            acknowledged_at: row.acknowledged_at,
            resolved_at: row.resolved_at,
            acknowledged_by: row.acknowledged_by,
            created_at: row.created_at,
            updated_at: row.updated_at,
        });
    }
}