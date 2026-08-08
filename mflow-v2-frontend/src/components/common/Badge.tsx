import React from 'react';

export interface BadgeProps {
  variant?: 'emerald' | 'rose' | 'amber' | 'indigo' | 'violet' | 'slate';
  size?: 'xs' | 'sm';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'emerald',
  size = 'xs',
  children,
  className = '',
}) => {
  const variantStyles = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const sizeStyles = {
    xs: 'px-2.5 py-0.5 text-[10px]',
    sm: 'px-3 py-1 text-xs',
  };

  return (
    <span
      className={`inline-block font-extrabold uppercase rounded-full border tracking-wide select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};
