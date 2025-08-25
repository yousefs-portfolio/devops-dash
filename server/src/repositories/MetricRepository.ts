import {db} from '../database/connection';
import {Metric, MetricEntity, MetricType} from '../entities/Metric';
import {
    IMetricRepository,
    CreateMetricDTO,
    MetricFilters,
    MetricAggregation,
} from './interfaces/IMetricRepository';

export class MetricRepository implements IMetricRepository {
    private table = 'metrics';

    async create(data: CreateMetricDTO): Promise<Metric> {
        const [created] = await db(this.table)
            .insert({
                project_id: data.projectId,
                type: data.type,
                value: data.value,
                unit: data.unit,
                metadata: JSON.stringify(data.metadata || {}),
                tags: JSON.stringify(data.tags || []),
                timestamp: data.timestamp || new Date(),
            })
            .returning('*');

        return this.mapToEntity(created);
    }

    async createBatch(data: CreateMetricDTO[]): Promise<Metric[]> {
        const insertData = data.map(item => ({
            project_id: item.projectId,
            type: item.type,
            value: item.value,
            unit: item.unit,
            metadata: JSON.stringify(item.metadata || {}),
            tags: JSON.stringify(item.tags || []),
            timestamp: item.timestamp || new Date(),
        }));

        const created = await db(this.table)
            .insert(insertData)
            .returning('*');

        return created.map(this.mapToEntity);
    }

    async findById(id: string): Promise<Metric | null> {
        const result = await db(this.table).where({id}).first();
        return result ? this.mapToEntity(result) : null;
    }

    async findAll(filters?: MetricFilters, limit = 1000): Promise<Metric[]> {
        let query = db(this.table);

        if (filters) {
            if (filters.projectId) {
                query = query.where({project_id: filters.projectId});
            }
            if (filters.type) {
                query = query.where({type: filters.type});
            }
            if (filters.startDate) {
                query = query.where('timestamp', '>=', filters.startDate);
            }
            if (filters.endDate) {
                query = query.where('timestamp', '<=', filters.endDate);
            }
            if (filters.tags && filters.tags.length > 0) {
                query = query.whereRaw('tags::jsonb \\?| array[?]', [filters.tags]);
            }
        }

        const results = await query
            .orderBy('timestamp', 'desc')
            .limit(limit);

        return results.map(this.mapToEntity);
    }

    async findLatest(projectId: string, type: MetricType): Promise<Metric | null> {
        const result = await db(this.table)
            .where({project_id: projectId, type})
            .orderBy('timestamp', 'desc')
            .first();

        return result ? this.mapToEntity(result) : null;
    }

    async aggregate(
        projectId: string,
        type: MetricType,
        startDate: Date,
        endDate: Date
    ): Promise<MetricAggregation | null> {
        const [result] = await db(this.table)
            .where({project_id: projectId, type})
            .whereBetween('timestamp', [startDate, endDate])
            .select(
                db.raw('? as type', [type]),
                db.raw('AVG(value) as avg'),
                db.raw('MIN(value) as min'),
                db.raw('MAX(value) as max'),
                db.raw('COUNT(*) as count'),
                db.raw('SUM(value) as sum')
            );

        if (!result || result.count === 0) {
            return null;
        }

        return {
            type,
            avg: parseFloat(result.avg) || 0,
            min: parseFloat(result.min) || 0,
            max: parseFloat(result.max) || 0,
            count: parseInt(result.count) || 0,
            sum: parseFloat(result.sum) || 0,
        };
    }

    async deleteOldMetrics(beforeDate: Date): Promise<number> {
        const deleted = await db(this.table)
            .where('timestamp', '<', beforeDate)
            .del();

        return deleted;
    }

    async getTimeSeries(
        projectId: string,
        type: MetricType,
        startDate: Date,
        endDate: Date,
        interval = '1 hour'
    ): Promise<Metric[]> {
        const results = await db(this.table)
            .where({project_id: projectId, type})
            .whereBetween('timestamp', [startDate, endDate])
            .select(
                db.raw(`date_trunc('${interval}', timestamp) as bucket`),
                db.raw('AVG(value) as value'),
                db.raw('MIN(value) as min_value'),
                db.raw('MAX(value) as max_value'),
                db.raw('COUNT(*) as count')
            )
            .groupByRaw(`date_trunc('${interval}', timestamp)`)
            .orderBy('bucket', 'asc');

        return results.map(row =>
            new MetricEntity({
                id: `aggregated-${row.bucket}`,
                project_id: projectId,
                type,
                value: parseFloat(row.value),
                unit: undefined,
                metadata: {
                    min: parseFloat(row.min_value),
                    max: parseFloat(row.max_value),
                    count: parseInt(row.count),
                },
                tags: [],
                timestamp: new Date(row.bucket),
            })
        );
    }

    private mapToEntity(row: any): Metric {
        const metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
        const tags = typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags;

        return new MetricEntity({
            id: row.id,
            project_id: row.project_id,
            type: row.type,
            value: parseFloat(row.value),
            unit: row.unit,
            metadata,
            tags,
            timestamp: row.timestamp,
            created_at: row.created_at,
            updated_at: row.updated_at,
        });
    }
}