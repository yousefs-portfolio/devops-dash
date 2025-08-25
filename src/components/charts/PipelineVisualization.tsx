import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, PlayCircle, PauseCircle, RotateCw } from 'lucide-react';
import { clsx } from 'clsx';

export type PipelineStageStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped' | 'cancelled';

export interface PipelineStage {
  id: string;
  name: string;
  status: PipelineStageStatus;
  duration?: number;
  startTime?: Date;
  endTime?: Date;
  jobs?: PipelineJob[];
}

export interface PipelineJob {
  id: string;
  name: string;
  status: PipelineStageStatus;
  duration?: number;
  logs?: string[];
}

interface PipelineVisualizationProps {
  stages: PipelineStage[];
  orientation?: 'horizontal' | 'vertical';
  showDetails?: boolean;
  onStageClick?: (stage: PipelineStage) => void;
  className?: string;
}

export const PipelineVisualization: React.FC<PipelineVisualizationProps> = ({
  stages,
  orientation = 'horizontal',
  showDetails = true,
  onStageClick,
  className,
}) => {
  const statusConfig = {
    pending: {
      icon: <Clock size={20} />,
      color: 'text-gray-400',
      bgColor: 'bg-gray-400/10',
      borderColor: 'border-gray-400/50',
      animation: false,
    },
    running: {
      icon: <PlayCircle size={20} />,
      color: 'text-info',
      bgColor: 'bg-info/10',
      borderColor: 'border-info/50',
      animation: true,
    },
    success: {
      icon: <CheckCircle size={20} />,
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/50',
      animation: false,
    },
    failed: {
      icon: <XCircle size={20} />,
      color: 'text-critical',
      bgColor: 'bg-critical/10',
      borderColor: 'border-critical/50',
      animation: false,
    },
    skipped: {
      icon: <PauseCircle size={20} />,
      color: 'text-gray-500',
      bgColor: 'bg-gray-500/10',
      borderColor: 'border-gray-500/50',
      animation: false,
    },
    cancelled: {
      icon: <XCircle size={20} />,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/50',
      animation: false,
    },
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '--';
    
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const containerClass = clsx(
    'flex gap-4',
    orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
    className
  );

  return (
    <div className={containerClass}>
      {stages.map((stage, index) => {
        const config = statusConfig[stage.status];
        const isLast = index === stages.length - 1;

        return (
          <div
            key={stage.id}
            className={clsx(
              'flex items-center',
              orientation === 'vertical' ? 'w-full' : 'flex-1'
            )}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex-shrink-0"
            >
              <button
                onClick={() => onStageClick?.(stage)}
                className={clsx(
                  'relative p-4 rounded-lg border-2 transition-all',
                  config.bgColor,
                  config.borderColor,
                  'hover:scale-105 hover:shadow-lg',
                  onStageClick && 'cursor-pointer'
                )}
              >
                {/* Animated ring for running status */}
                {config.animation && (
                  <div className="absolute inset-0 rounded-lg">
                    <div className={clsx(
                      'absolute inset-0 rounded-lg animate-ping',
                      config.bgColor,
                      'opacity-75'
                    )} />
                  </div>
                )}

                <div className={clsx('relative z-10', config.color)}>
                  {config.icon}
                </div>

                {/* Stage details */}
                {showDetails && (
                  <div className="mt-2 text-center">
                    <div className="text-xs font-medium text-white">
                      {stage.name}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatDuration(stage.duration)}
                    </div>
                  </div>
                )}
              </button>
            </motion.div>

            {/* Connector */}
            {!isLast && (
              <div
                className={clsx(
                  'flex-1',
                  orientation === 'vertical' 
                    ? 'h-8 w-0.5 mx-auto my-2' 
                    : 'h-0.5 mx-2'
                )}
              >
                <div
                  className={clsx(
                    'h-full',
                    stage.status === 'success' 
                      ? 'bg-success/50' 
                      : 'bg-gray-600/50'
                  )}
                />
              </div>
            )}

            {/* Jobs dropdown */}
            {showDetails && stage.jobs && stage.jobs.length > 0 && (
              <div className="ml-4">
                <div className="text-xs text-gray-400 mb-2">Jobs:</div>
                <div className="space-y-1">
                  {stage.jobs.map((job) => (
                    <div
                      key={job.id}
                      className={clsx(
                        'flex items-center gap-2 px-2 py-1 rounded text-xs',
                        statusConfig[job.status].bgColor
                      )}
                    >
                      <span className={statusConfig[job.status].color}>
                        {statusConfig[job.status].icon}
                      </span>
                      <span className="text-gray-300">{job.name}</span>
                      {job.duration && (
                        <span className="text-gray-500 ml-auto">
                          {formatDuration(job.duration)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

interface PipelineHistoryProps {
  pipelines: {
    id: string;
    number: number;
    status: PipelineStageStatus;
    branch: string;
    commit: string;
    author: string;
    startTime: Date;
    duration?: number;
  }[];
  onPipelineClick?: (id: string) => void;
}

export const PipelineHistory: React.FC<PipelineHistoryProps> = ({
  pipelines,
  onPipelineClick,
}) => {
  const statusColors = {
    pending: 'text-gray-400',
    running: 'text-info',
    success: 'text-success',
    failed: 'text-critical',
    skipped: 'text-gray-500',
    cancelled: 'text-warning',
  };

  const statusIcons = {
    pending: <Clock size={16} />,
    running: <RotateCw size={16} className="animate-spin" />,
    success: <CheckCircle size={16} />,
    failed: <XCircle size={16} />,
    skipped: <PauseCircle size={16} />,
    cancelled: <XCircle size={16} />,
  };

  return (
    <div className="space-y-2">
      {pipelines.map((pipeline) => (
        <motion.div
          key={pipeline.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={clsx(
            'flex items-center justify-between p-3 rounded-lg',
            'bg-white/5 hover:bg-white/10 transition-colors',
            onPipelineClick && 'cursor-pointer'
          )}
          onClick={() => onPipelineClick?.(pipeline.id)}
        >
          <div className="flex items-center gap-3">
            <span className={statusColors[pipeline.status]}>
              {statusIcons[pipeline.status]}
            </span>
            <div>
              <div className="text-sm font-medium">
                #{pipeline.number} - {pipeline.branch}
              </div>
              <div className="text-xs text-gray-400">
                {pipeline.commit.substring(0, 7)} by {pipeline.author}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xs text-gray-400">
              {new Date(pipeline.startTime).toLocaleTimeString()}
            </div>
            {pipeline.duration && (
              <div className="text-xs text-gray-500">
                {Math.round(pipeline.duration / 60)}m
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};