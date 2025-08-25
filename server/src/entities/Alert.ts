export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'silenced';
export type AlertType = 
  | 'threshold_breach'
  | 'service_down'
  | 'deployment_failed'
  | 'security_issue'
  | 'performance_degradation'
  | 'error_spike'
  | 'custom';

export interface Alert {
  id: string;
  project_id: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description: string;
  metric_type?: string;
  metric_value?: number;
  threshold_value?: number;
  triggered_at: Date;
  acknowledged_at?: Date;
  resolved_at?: Date;
  resolved_by?: string;
  acknowledged_by?: string;
  silence_until?: Date;
  tags?: string[];
    metadata?: Record<string, unknown>;
  affected_services?: string[];
  runbook_url?: string;
  notification_sent: boolean;
  notification_channels?: string[];
}

export interface AlertRule {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  enabled: boolean;
  type: AlertType;
  severity: AlertSeverity;
  condition: AlertCondition;
  notification_channels: string[];
  cooldown_minutes?: number;
  auto_resolve?: boolean;
  auto_resolve_minutes?: number;
  created_at: Date;
  updated_at: Date;
}

export interface AlertCondition {
  metric_type: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
  threshold: number;
  duration_seconds?: number;
  aggregation?: 'avg' | 'min' | 'max' | 'sum';
  window_seconds?: number;
}

export interface AlertNotification {
  id: string;
  alert_id: string;
  channel: string;
  sent_at: Date;
  status: 'pending' | 'sent' | 'failed';
  error?: string;
  retry_count: number;
  next_retry?: Date;
}

export class AlertEntity implements Alert {
  id: string;
  project_id: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description: string;
  metric_type?: string;
  metric_value?: number;
  threshold_value?: number;
  triggered_at: Date;
  acknowledged_at?: Date;
  resolved_at?: Date;
  resolved_by?: string;
  acknowledged_by?: string;
  silence_until?: Date;
  tags?: string[];
    metadata?: Record<string, unknown>;
  affected_services?: string[];
  runbook_url?: string;
  notification_sent: boolean;
  notification_channels?: string[];

  constructor(data: Partial<Alert>) {
    this.id = data.id || '';
    this.project_id = data.project_id || '';
    this.type = data.type || 'custom';
    this.severity = data.severity || 'info';
    this.status = data.status || 'active';
    this.title = data.title || '';
    this.description = data.description || '';
    this.metric_type = data.metric_type;
    this.metric_value = data.metric_value;
    this.threshold_value = data.threshold_value;
    this.triggered_at = data.triggered_at || new Date();
    this.acknowledged_at = data.acknowledged_at;
    this.resolved_at = data.resolved_at;
    this.resolved_by = data.resolved_by;
    this.acknowledged_by = data.acknowledged_by;
    this.silence_until = data.silence_until;
    this.tags = data.tags || [];
    this.metadata = data.metadata || {};
    this.affected_services = data.affected_services || [];
    this.runbook_url = data.runbook_url;
    this.notification_sent = data.notification_sent || false;
    this.notification_channels = data.notification_channels || [];
  }

  validate(): string[] {
    const errors: string[] = [];
    
    if (!this.project_id) {
      errors.push('Project ID is required');
    }
    
    if (!this.title || this.title.trim().length === 0) {
      errors.push('Alert title is required');
    }
    
    if (this.title && this.title.length > 200) {
      errors.push('Alert title must be less than 200 characters');
    }
    
    if (!this.description || this.description.trim().length === 0) {
      errors.push('Alert description is required');
    }
    
    if (this.silence_until && this.silence_until < new Date()) {
      errors.push('Silence until date must be in the future');
    }
    
    return errors;
  }

  acknowledge(userId: string): void {
    if (this.status !== 'active') {
      throw new Error('Only active alerts can be acknowledged');
    }
    
    this.status = 'acknowledged';
    this.acknowledged_at = new Date();
    this.acknowledged_by = userId;
  }

  resolve(userId: string): void {
    if (this.status === 'resolved') {
      throw new Error('Alert is already resolved');
    }
    
    this.status = 'resolved';
    this.resolved_at = new Date();
    this.resolved_by = userId;
  }

  silence(until: Date): void {
    if (until <= new Date()) {
      throw new Error('Silence until date must be in the future');
    }
    
    this.status = 'silenced';
    this.silence_until = until;
  }

  isActive(): boolean {
    return this.status === 'active' && !this.isSilenced();
  }

  isSilenced(): boolean {
    return this.silence_until ? this.silence_until > new Date() : false;
  }

  getSeverityScore(): number {
    const scores: Record<AlertSeverity, number> = {
      critical: 5,
      high: 4,
      medium: 3,
      low: 2,
      info: 1,
    };
    
    return scores[this.severity];
  }
}

export class AlertRuleEvaluator {
  static evaluate(rule: AlertRule, metricValue: number): boolean {
    const { condition } = rule;
    
    switch (condition.operator) {
      case 'gt':
        return metricValue > condition.threshold;
      case 'gte':
        return metricValue >= condition.threshold;
      case 'lt':
        return metricValue < condition.threshold;
      case 'lte':
        return metricValue <= condition.threshold;
      case 'eq':
        return metricValue === condition.threshold;
      case 'neq':
        return metricValue !== condition.threshold;
      default:
        return false;
    }
  }
  
  static shouldTrigger(
    rule: AlertRule,
    metrics: number[],
    existingAlerts: Alert[]
  ): boolean {
    if (!rule.enabled) return false;
    
    // Check cooldown period
    if (rule.cooldown_minutes) {
      const recentAlert = existingAlerts.find(alert => 
        alert.triggered_at > new Date(Date.now() - rule.cooldown_minutes! * 60 * 1000)
      );
      
      if (recentAlert) return false;
    }
    
    // Evaluate condition
    const aggregatedValue = this.aggregate(metrics, rule.condition.aggregation || 'avg');
    return this.evaluate(rule, aggregatedValue);
  }
  
  private static aggregate(values: number[], method: 'avg' | 'min' | 'max' | 'sum'): number {
    if (values.length === 0) return 0;
    
    switch (method) {
      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      default:
        return 0;
    }
  }
}