import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
  gap?: 'sm' | 'md' | 'lg';
}

export const BentoGrid: React.FC<BentoGridProps> = ({
  children,
  className,
  gap = 'md',
}) => {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };
  
  return (
    <div
      className={twMerge(
        clsx('bento-grid', gapClasses[gap], className)
      )}
    >
      {children}
    </div>
  );
};

interface BentoItemProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6;
  rowSpan?: 1 | 2 | 3;
}

export const BentoItem: React.FC<BentoItemProps> = ({
  children,
  className,
  colSpan = 1,
  rowSpan = 1,
}) => {
  const colSpanClasses = {
    1: '',
    2: 'bento-span-2',
    3: 'bento-span-3',
    4: 'bento-span-4',
    5: 'col-span-5',
    6: 'col-span-6',
  };
  
  const rowSpanClasses = {
    1: '',
    2: 'bento-row-span-2',
    3: 'bento-row-span-3',
  };
  
  return (
    <div
      className={twMerge(
        clsx(
          colSpanClasses[colSpan],
          rowSpanClasses[rowSpan],
          className
        )
      )}
    >
      {children}
    </div>
  );
};