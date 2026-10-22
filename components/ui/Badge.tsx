import React from 'react';

interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral' | 'info';
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  dot = false,
  children,
  className = '',
}) => {
  const styles = {
    primary: {
      badge: 'bg-[#E8F8F5] text-[#1F6F5C] border-[#26B997]/30',
      dot: 'bg-[#26B997]',
    },
    secondary: {
      badge: 'bg-amber-50 text-amber-900 border-amber-200/80',
      dot: 'bg-amber-500',
    },
    success: {
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
      dot: 'bg-emerald-500',
    },
    warning: {
      badge: 'bg-amber-50/80 text-amber-800 border-amber-300/80',
      dot: 'bg-amber-500',
    },
    error: {
      badge: 'bg-rose-50 text-rose-800 border-rose-200/80',
      dot: 'bg-rose-500',
    },
    neutral: {
      badge: 'bg-slate-100 text-slate-700 border-slate-200/80',
      dot: 'bg-slate-400',
    },
    info: {
      badge: 'bg-sky-50 text-sky-800 border-sky-200/80',
      dot: 'bg-sky-500',
    },
  }[variant];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide border transition-all ${styles.badge} ${className}`}
    >
      {dot && (
        <span className="flex h-1.5 w-1.5 relative mr-1.5 shrink-0">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${styles.dot}`} />
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${styles.dot}`} />
        </span>
      )}
      {children}
    </span>
  );
};
