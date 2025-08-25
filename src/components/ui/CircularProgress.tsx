import React from 'react';
import { motion } from 'framer-motion';

interface CircularProgressProps {
  value: number;
  maxValue?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  color?: 'critical' | 'warning' | 'success' | 'info';
  animated?: boolean;
  showValue?: boolean;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  maxValue = 100,
  size = 'md',
  strokeWidth = 8,
  label,
  sublabel,
  color = 'info',
  animated = true,
  showValue = true,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));
  
  const sizes = {
    sm: { width: 80, height: 80, fontSize: '0.875rem' },
    md: { width: 120, height: 120, fontSize: '1rem' },
    lg: { width: 160, height: 160, fontSize: '1.25rem' },
    xl: { width: 200, height: 200, fontSize: '1.5rem' },
  };
  
  const colors = {
    critical: '#FF0040',
    warning: '#39FF14',
    success: '#00D4FF',
    info: '#8B5CF6',
  };
  
  const sizeConfig = sizes[size];
  const radius = (sizeConfig.width - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="relative inline-flex flex-col items-center">
      <div className="relative">
        <svg
          width={sizeConfig.width}
          height={sizeConfig.height}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={sizeConfig.width / 2}
            cy={sizeConfig.height / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          
          {/* Progress circle */}
          <motion.circle
            cx={sizeConfig.width / 2}
            cy={sizeConfig.height / 2}
            r={radius}
            stroke={colors[color]}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={animated ? { strokeDashoffset: circumference } : {}}
            animate={{ strokeDashoffset }}
            transition={{
              duration: animated ? 1.5 : 0,
              ease: 'easeInOut',
            }}
            style={{
              filter: `drop-shadow(0 0 10px ${colors[color]}66)`,
            }}
          />
        </svg>
        
        {/* Center content */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ fontSize: sizeConfig.fontSize }}
        >
          {showValue && (
            <div className="font-mono font-semibold text-white">
              {Math.round(percentage)}%
            </div>
          )}
          {label && (
            <div className="text-sm text-gray-400 mt-1">{label}</div>
          )}
        </div>
      </div>
      
      {sublabel && (
        <div className="text-sm text-gray-500 mt-2">{sublabel}</div>
      )}
    </div>
  );
};