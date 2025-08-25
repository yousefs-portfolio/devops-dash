import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'shimmer';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'shimmer',
}) => {
  const baseClasses = 'bg-white/5';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg',
  };
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse',
    shimmer: 'shimmer',
  };
  
  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1em' : '100%'),
  };
  
  return (
    <div
      className={twMerge(
        clsx(
          baseClasses,
          variantClasses[variant],
          animationClasses[animation],
          className
        )
      )}
      style={style}
    />
  );
};

interface SkeletonGroupProps {
  count?: number;
  className?: string;
  spacing?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

export const SkeletonGroup: React.FC<SkeletonGroupProps> = ({
  count = 3,
  className,
  spacing = 'md',
  children,
}) => {
  const spacingClasses = {
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
  };
  
  if (children) {
    return (
      <div className={twMerge(clsx(spacingClasses[spacing], className))}>
        {children}
      </div>
    );
  }
  
  return (
    <div className={twMerge(clsx(spacingClasses[spacing], className))}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} height={20} />
      ))}
    </div>
  );
};