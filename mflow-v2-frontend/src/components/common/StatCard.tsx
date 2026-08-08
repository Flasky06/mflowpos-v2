import React from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  variant?: 'indigo' | 'emerald' | 'rose' | 'amber' | 'violet';
  subtitle?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  variant = 'indigo',
  subtitle,
  className = '',
}) => {
  const iconVariants = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
  };

  const textVariants = {
    indigo: 'text-indigo-600',
    emerald: 'text-emerald-600',
    rose: 'text-rose-600',
    amber: 'text-amber-600',
    violet: 'text-violet-600',
  };

  return (
    <div className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 ${className}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold shrink-0 ${iconVariants[variant]}`}>
        {icon}
      </div>
      <div className="truncate">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide truncate">{title}</p>
        <h3 className={`text-2xl font-extrabold mt-0.5 truncate ${textVariants[variant]}`}>{value}</h3>
        {subtitle && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{subtitle}</p>}
      </div>
    </div>
  );
};
