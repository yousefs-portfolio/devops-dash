export interface Project {
  id: string;
  name: string;
  description?: string;
  repository_url?: string;
  github_owner?: string;
  github_repo?: string;
  docker_image?: string;
  environment: 'development' | 'staging' | 'production';
  status: 'active' | 'inactive' | 'archived';
  health_status: 'healthy' | 'degraded' | 'critical' | 'unknown';
  created_at: Date;
  updated_at: Date;
  last_deployment?: Date;
  webhook_secret?: string;
  alert_channels?: string[];
  team_members?: string[];
  tags?: string[];
  settings?: ProjectSettings;
}

export interface ProjectSettings {
  monitoring_enabled: boolean;
  alert_thresholds: AlertThresholds;
  deployment_config?: DeploymentConfig;
  notification_preferences?: NotificationPreferences;
}

export interface AlertThresholds {
  cpu_percent?: number;
  memory_percent?: number;
  disk_percent?: number;
  response_time_ms?: number;
  error_rate_percent?: number;
  uptime_percent?: number;
}

export interface DeploymentConfig {
  auto_deploy: boolean;
  branch: string;
  deploy_on_push: boolean;
  rollback_on_failure: boolean;
  health_check_url?: string;
  pre_deploy_hooks?: string[];
  post_deploy_hooks?: string[];
}

export interface NotificationPreferences {
  email: boolean;
  slack: boolean;
  webhook: boolean;
  severity_filter: ('critical' | 'high' | 'medium' | 'low')[];
}

export class ProjectEntity implements Project {
  id: string;
  name: string;
  description?: string;
  repository_url?: string;
  github_owner?: string;
  github_repo?: string;
  docker_image?: string;
  environment: 'development' | 'staging' | 'production';
  status: 'active' | 'inactive' | 'archived';
  health_status: 'healthy' | 'degraded' | 'critical' | 'unknown';
  created_at: Date;
  updated_at: Date;
  last_deployment?: Date;
  webhook_secret?: string;
  alert_channels?: string[];
  team_members?: string[];
  tags?: string[];
  settings?: ProjectSettings;

  constructor(data: Partial<Project>) {
    this.id = data.id || '';
    this.name = data.name || '';
    this.description = data.description;
    this.repository_url = data.repository_url;
    this.github_owner = data.github_owner;
    this.github_repo = data.github_repo;
    this.docker_image = data.docker_image;
    this.environment = data.environment || 'development';
    this.status = data.status || 'active';
    this.health_status = data.health_status || 'unknown';
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
    this.last_deployment = data.last_deployment;
    this.webhook_secret = data.webhook_secret;
    this.alert_channels = data.alert_channels || [];
    this.team_members = data.team_members || [];
    this.tags = data.tags || [];
    this.settings = data.settings || {
      monitoring_enabled: true,
      alert_thresholds: {
        cpu_percent: 80,
        memory_percent: 80,
        disk_percent: 90,
        response_time_ms: 1000,
        error_rate_percent: 5,
        uptime_percent: 99.9,
      },
    };
  }

  validate(): string[] {
    const errors: string[] = [];
    
    if (!this.name || this.name.trim().length === 0) {
      errors.push('Project name is required');
    }
    
    if (this.name && this.name.length > 100) {
      errors.push('Project name must be less than 100 characters');
    }
    
    if (this.repository_url && !this.isValidUrl(this.repository_url)) {
      errors.push('Invalid repository URL');
    }
    
    if (this.settings?.alert_thresholds) {
      const thresholds = this.settings.alert_thresholds;
      
      if (thresholds.cpu_percent && (thresholds.cpu_percent < 0 || thresholds.cpu_percent > 100)) {
        errors.push('CPU threshold must be between 0 and 100');
      }
      
      if (thresholds.memory_percent && (thresholds.memory_percent < 0 || thresholds.memory_percent > 100)) {
        errors.push('Memory threshold must be between 0 and 100');
      }
      
      if (thresholds.disk_percent && (thresholds.disk_percent < 0 || thresholds.disk_percent > 100)) {
        errors.push('Disk threshold must be between 0 and 100');
      }
      
      if (thresholds.error_rate_percent && (thresholds.error_rate_percent < 0 || thresholds.error_rate_percent > 100)) {
        errors.push('Error rate threshold must be between 0 and 100');
      }
    }
    
    return errors;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}