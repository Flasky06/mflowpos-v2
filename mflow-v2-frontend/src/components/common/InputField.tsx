import React from 'react';

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, helperText, icon, required, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="space-y-1 w-full">
        {label && (
          <label htmlFor={inputId} className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-2.5 text-slate-400 pointer-events-none">
              {icon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            required={required}
            className={`w-full bg-slate-50 border rounded-xl py-2 px-3 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white transition-all shadow-2xs ${
              icon ? 'pl-9' : ''
            } ${
              error
                ? 'border-rose-400 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                : 'border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500'
            } ${className}`}
            {...props}
          />
        </div>

        {error && <p className="text-[11px] font-semibold text-rose-600 mt-0.5">{error}</p>}
        {!error && helperText && <p className="text-[11px] text-slate-400 mt-0.5">{helperText}</p>}
      </div>
    );
  }
);

InputField.displayName = 'InputField';
