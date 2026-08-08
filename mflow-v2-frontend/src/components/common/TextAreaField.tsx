import React from 'react';

export interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextAreaField = React.forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ label, error, helperText, required, className = '', id, rows = 3, ...props }, ref) => {
    const textId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="space-y-1 w-full">
        {label && (
          <label htmlFor={textId} className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}

        <textarea
          id={textId}
          ref={ref}
          rows={rows}
          required={required}
          className={`w-full bg-slate-50 border rounded-xl py-2 px-3 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white transition-all shadow-2xs ${
            error
              ? 'border-rose-400 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
              : 'border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500'
          } ${className}`}
          {...props}
        />

        {error && <p className="text-[11px] font-semibold text-rose-600 mt-0.5">{error}</p>}
        {!error && helperText && <p className="text-[11px] text-slate-400 mt-0.5">{helperText}</p>}
      </div>
    );
  }
);

TextAreaField.displayName = 'TextAreaField';
