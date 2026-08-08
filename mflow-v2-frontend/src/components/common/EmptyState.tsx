import React from 'react';
import { PackageOpen } from 'lucide-react';

export interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No items found',
  message = 'There are no records matching your request.',
  icon = <PackageOpen className="w-8 h-8 text-slate-400" />,
  action,
  className = '',
}) => {
  return (
    <div className={`py-12 px-4 text-center flex flex-col items-center justify-center space-y-3 ${className}`}>
      <div className="p-3 bg-slate-100 rounded-2xl text-slate-500 border border-slate-200">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
        <p className="text-xs text-slate-500 max-w-sm mt-0.5">{message}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};
