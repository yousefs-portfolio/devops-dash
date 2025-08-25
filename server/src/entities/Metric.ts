export type MetricType = 
  | 'cpu_usage'
  | 'memory_usage'
  | 'disk_usage'
  | 'network_in'
  | 'network_out'
  | 'response_time'
  | 'error_rate'
  | 'request_count'
  | 'active_connections'
  | 'deployment_frequency'
  | 'lead_time'
  | 'mttr' // Mean Time To Recovery
  | 'change_failure_rate'
  | 'uptime'
  | 'custom';

export interface Metric {
  id: string;
  project_id: string;
  type: MetricType;
  name: string;
  value: number;
  unit?: string;
  timestamp: Date;
  tags?: Record<string, string>;
    metadata?: Record<string, unknown>;
  source?: string;
  environment?: string;
  aggregation_period?: number; // in seconds
}

export interface MetricAggregation {
  project_id: string;
  type: MetricType;
  period: 'minute' | 'hour' | 'day' | 'week' | 'month';
  timestamp: Date;
  min: number;
  max: number;
  avg: number;
  sum: number;
  count: number;
  p50?: number;
  p90?: number;
  p95?: number;
  p99?: number;
}

export interface MetricQuery {
  project_id?: string;
  types?: MetricType[];
  start_time?: Date;
  end_time?: Date;
  environment?: string;
  tags?: Record<string, string>;
  aggregation?: 'none' | 'minute' | 'hour' | 'day';
  limit?: number;
  order?: 'asc' | 'desc';
}

export class MetricEntity implements Metric {
  id: string;
  project_id: string;
  type: MetricType;
  name: string;
  value: number;
  unit?: string;
  timestamp: Date;
  tags?: Record<string, string>;
    metadata?: Record<string, unknown>;
  source?: string;
  environment?: string;
  aggregation_period?: number;

  constructor(data: Partial<Metric>) {
    this.id = data.id || '';
    this.project_id = data.project_id || '';
    this.type = data.type || 'custom';
    this.name = data.name || '';
    this.value = data.value ?? 0;
    this.unit = data.unit;
    this.timestamp = data.timestamp || new Date();
    this.tags = data.tags || {};
    this.metadata = data.metadata || {};
    this.source = data.source;
    this.environment = data.environment;
    this.aggregation_period = data.aggregation_period;
  }

  validate(): string[] {
    const errors: string[] = [];
    
    if (!this.project_id) {
      errors.push('Project ID is required');
    }
    
    if (!this.name || this.name.trim().length === 0) {
      errors.push('Metric name is required');
    }
    
    if (typeof this.value !== 'number' || isNaN(this.value)) {
      errors.push('Metric value must be a valid number');
    }
    
    if (this.value < 0 && !this.isNegativeAllowed()) {
      errors.push(`Negative values are not allowed for metric type: ${this.type}`);
    }
    
    if (this.isPercentageMetric() && (this.value < 0 || this.value > 100)) {
      errors.push(`Percentage metrics must be between 0 and 100`);
    }
    
    return errors;
  }

  private isNegativeAllowed(): boolean {
    const negativeAllowedTypes = ['custom', 'network_in', 'network_out'];
    return negativeAllowedTypes.includes(this.type);
  }

  private isPercentageMetric(): boolean {
    const percentageTypes = ['cpu_usage', 'memory_usage', 'disk_usage', 'error_rate', 'uptime', 'change_failure_rate'];
    return percentageTypes.includes(this.type) && this.unit === '%';
  }

  toAggregation(period: 'minute' | 'hour' | 'day' | 'week' | 'month'): Partial<MetricAggregation> {
    return {
      project_id: this.project_id,
      type: this.type,
      period,
      timestamp: this.timestamp,
      min: this.value,
      max: this.value,
      avg: this.value,
      sum: this.value,
      count: 1,
    };
  }
}

export class MetricAggregator {
  static aggregate(metrics: Metric[]): MetricAggregation | null {
    if (metrics.length === 0) return null;
    
    const values = metrics.map(m => m.value).sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);
    
    return {
      project_id: metrics[0].project_id,
      type: metrics[0].type,
      period: 'hour',
      timestamp: new Date(),
      min: Math.min(...values),
      max: Math.max(...values),
      avg: sum / values.length,
      sum,
      count: values.length,
      p50: this.percentile(values, 50),
      p90: this.percentile(values, 90),
      p95: this.percentile(values, 95),
      p99: this.percentile(values, 99),
    };
  }
  
  private static percentile(sortedValues: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedValues.length - 1);
    
    if (Math.floor(index) === index) {
      return sortedValues[index];
    }
    
    const lower = sortedValues[Math.floor(index)];
    const upper = sortedValues[Math.ceil(index)];
    const weight = index % 1;
    
    return lower + (upper - lower) * weight;
  }
}