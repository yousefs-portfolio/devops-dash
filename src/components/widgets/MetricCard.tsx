import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Skeleton } from '../ui/Skeleton';
import { clsx } from 'clsx';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  status?: 'success' | 'warning' | 'critical' | 'info';
  loading?: boolean;
  sparklineData?: number[];
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  change,
  changeLabel,
  icon,
  status = 'info',
  loading = false,
  sparklineData,
  className,
}) => {
  const getTrendIcon = () => {
    if (change === undefined || change === 0) {
      return <Minus className="w-4 h-4" />;
    }
    return change > 0 ? (
      <TrendingUp className="w-4 h-4" />
    ) : (
      <TrendingDown className="w-4 h-4" />
    );
  };
  
  const getChangeColor = () => {
    if (change === undefined) return 'text-gray-400';
    if (change > 0) return 'text-success';
    if (change < 0) return 'text-critical';
    return 'text-gray-400';
  };
  
  const statusColors = {
    success: 'border-success/50',
    warning: 'border-warning/50',
    critical: 'border-critical/50',
    info: 'border-info/50',
  };
  
  const statusGlow = {
    success: 'success',
    warning: 'warning',
    critical: 'critical',
    info: 'info',
  } as const;
  
  if (loading) {
    return (
      <GlassCard className={className}>
        <div className="flex justify-between items-start mb-4">
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="circular" width={40} height={40} />
        </div>
        <Skeleton variant="text" width="80%" height={32} />
        <Skeleton variant="text" width="40%" height={16} className="mt-2" />
      </GlassCard>
    );
  }
  
  return (
    <GlassCard
      className={clsx(
        'relative overflow-hidden border-l-4',
        statusColors[status],
        className
      )}
      glow={statusGlow[status]}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
          {title}
        </h3>
        {icon && (
          <div className="text-gray-500">
            {icon}
          </div>
        )}
      </div>
      
      <div className="flex items-baseline space-x-2">
        <motion.span
          className="text-3xl font-bold font-mono"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {value}
        </motion.span>
        {unit && (
          <span className="text-lg text-gray-400">{unit}</span>
        )}
      </div>
      
      {(change !== undefined || changeLabel) && (
        <div className={clsx('flex items-center mt-3 space-x-1', getChangeColor())}>
          {getTrendIcon()}
          {change !== undefined && (
            <span className="text-sm font-medium">
              {change > 0 ? '+' : ''}{change}%
            </span>
          )}
          {changeLabel && (
            <span className="text-sm text-gray-400">{changeLabel}</span>
          )}
        </div>
      )}
      
      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-4">
          <Sparkline data={sparklineData} color={status} />
        </div>
      )}
    </GlassCard>
  );
};

interface SparklineProps {
  data: number[];
  color: 'success' | 'warning' | 'critical' | 'info';
  height?: number;
}

const Sparkline: React.FC<SparklineProps> = ({ data, color, height = 40 }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  
  const colors = {
    success: '#00D4FF',
    warning: '#39FF14',
    critical: '#FF0040',
    info: '#8B5CF6',
  };
  
  return (
    <svg width="100%" height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colors[color]} stopOpacity="0.3" />
          <stop offset="100%" stopColor={colors[color]} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={colors[color]}
        strokeWidth="2"
        points={points}
        vectorEffect="non-scaling-stroke"
      />
      <polygon
        fill={`url(#gradient-${color})`}
        points={`${points} 100,${height} 0,${height}`}
      />
    </svg>
  );
};