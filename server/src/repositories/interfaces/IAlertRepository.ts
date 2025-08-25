import {Alert, AlertSeverity, AlertStatus} from '../../entities/Alert';

export interface CreateAlertDTO {
    projectId: string;
    name: string;
    description?: string;
    severity: AlertSeverity;
    metricType: string;
    condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
    threshold: number;
    durationSeconds?: number;
    notificationChannels?: string[];
    metadata?: Record<string, any>;
}

export interface UpdateAlertDTO extends Partial<CreateAlertDTO> {
    id: string;
    status?: AlertStatus;
    triggeredAt?: Date;
    acknowledgedAt?: Date;
    resolvedAt?: Date;
    acknowledgedBy?: string;
}

export interface AlertFilters {
    projectId?: string;
    status?: AlertStatus;
    severity?: AlertSeverity;
    startDate?: Date;
    endDate?: Date;
}

export interface IAlertRepository {
    create(data: CreateAlertDTO): Promise<Alert>;

    findById(id: string): Promise<Alert | null>;

    findAll(filters?: AlertFilters): Promise<Alert[]>;

    findActive(projectId: string): Promise<Alert[]>;

    update(data: UpdateAlertDTO): Promise<Alert | null>;

    delete(id: string): Promise<boolean>;

    acknowledge(id: string, userId: string): Promise<Alert | null>;

    resolve(id: string): Promise<Alert | null>;

    trigger(id: string): Promise<Alert | null>;

    countByStatus(projectId?: string): Promise<Record<AlertStatus, number>>;
}