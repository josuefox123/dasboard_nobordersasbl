import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-slate-200/70 via-slate-100 to-slate-200/70 rounded-2xl ${className}`}
      {...props}
    />
  );
};
