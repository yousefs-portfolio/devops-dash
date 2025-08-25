import {Metric, MetricType} from '../../entities/Metric';

export interface CreateMetricDTO {
    projectId: string;
    type: MetricType;
    value: number;
    unit?: string;
    metadata?: Record<string, unknown>;
    tags?: string[];
    timestamp?: Date;
}

export interface MetricFilters {
    projectId?: string;
    type?: MetricType;
    startDate?: Date;
    endDate?: Date;
    tags?: string[];
}

export interface MetricAggregation {
    type: MetricType;
    avg: number;
    min: number;
    max: number;
    count: number;
    sum: number;
}

export interface IMetricRepository {
    create(data: CreateMetricDTO): Promise<Metric>;

    createBatch(data: CreateMetricDTO[]): Promise<Metric[]>;

    findById(id: string): Promise<Metric | null>;

    findAll(filters?: MetricFilters, limit?: number): Promise<Metric[]>;

    findLatest(projectId: string, type: MetricType): Promise<Metric | null>;

    aggregate(projectId: string, type: MetricType, startDate: Date, endDate: Date): Promise<MetricAggregation | null>;

    deleteOldMetrics(beforeDate: Date): Promise<number>;

    getTimeSeries(projectId: string, type: MetricType, startDate: Date, endDate: Date, interval?: string): Promise<Metric[]>;
}