import React from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'bordered';
  glow?: 'critical' | 'warning' | 'success' | 'info' | 'none';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  variant = 'default',
  glow = 'none',
  padding = 'md',
  hover = true,
  ...props
}) => {
  const baseClasses = 'glass-card transition-all duration-300';
  
  const variantClasses = {
    default: 'bg-white/5',
    elevated: 'bg-white/8 shadow-xl',
    bordered: 'bg-white/3 border-2',
  };
  
  const glowClasses = {
    critical: 'glow-critical',
    warning: 'glow-warning',
    success: 'glow-success',
    info: 'glow-info',
    none: '',
  };
  
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };
  
  const hoverClasses = hover
    ? 'hover:bg-white/7 hover:scale-[1.02] hover:shadow-2xl'
    : '';
  
  const classes = twMerge(
    clsx(
      baseClasses,
      variantClasses[variant],
      glowClasses[glow],
      paddingClasses[padding],
      hoverClasses,
      className
    )
  );
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={classes}
      {...props}
    >
      {children}
    </motion.div>
  );
};