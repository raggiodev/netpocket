import React from 'react';
import { Search, X } from 'lucide-react';
import { useSettings } from '../i18n';
import { haptic } from '../utils/clipboard';

export interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  autoFocus = false,
}) => {
  const { t } = useSettings();

  return (
    <div
      className={`relative flex items-center bg-surface border border-line rounded-xl px-3 py-2 transition-all duration-150 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/40 ${className}`}
    >
      <Search className="w-4 h-4 text-muted shrink-0 mr-2" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full bg-transparent text-sm text-fg placeholder:text-muted/60 focus:outline-none"
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={() => {
            haptic(20);
            onChange('');
          }}
          title={t.common.clearSearch}
          aria-label={t.common.clearSearch}
          className="p-1 text-muted hover:text-fg hover:bg-elevated rounded-md transition-colors shrink-0 ml-1"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
