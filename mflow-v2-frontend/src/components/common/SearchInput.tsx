import React from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onSearchChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onSearchChange,
  placeholder = 'Search...',
  className = '',
  ...props
}) => {
  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 px-4 pl-10 pr-9 text-slate-900 text-xs font-semibold focus:outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-2xs"
        {...props}
      />
      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />

      {value && (
        <button
          onClick={() => onSearchChange('')}
          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
