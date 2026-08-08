import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: SelectOption[];
  helperText?: string;
}

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, options = [], helperText, required, children, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="space-y-1 w-full">
        {label && (
          <label htmlFor={selectId} className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}

        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            required={required}
            className={`w-full bg-slate-50 border rounded-xl py-2 px-3 pr-8 text-xs font-semibold text-slate-900 appearance-none focus:outline-none focus:bg-white transition-all shadow-2xs ${
              error
                ? 'border-rose-400 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                : 'border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500'
            } ${className}`}
            {...props}
          >
            {children
              ? children
              : options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>

        {error && <p className="text-[11px] font-semibold text-rose-600 mt-0.5">{error}</p>}
        {!error && helperText && <p className="text-[11px] text-slate-400 mt-0.5">{helperText}</p>}
      </div>
    );
  }
);

SelectField.displayName = 'SelectField';
