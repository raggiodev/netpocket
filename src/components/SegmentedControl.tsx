import React from 'react';
import { haptic } from '../utils/clipboard';

export interface SegmentOption<T extends string> {
  id: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
  size = 'md',
}: SegmentedControlProps<T>) {
  const pad = size === 'sm' ? 'py-1 text-xs' : 'py-1.5 text-xs sm:text-sm';

  return (
    <div
      role="tablist"
      className={`inline-flex w-full bg-elevated p-1 rounded-xl border border-line select-none ${className}`}
    >
      {options.map((opt) => {
        const selected = opt.id === value;
        return (
          <button
            key={opt.id}
            role="tab"
            aria-selected={selected}
            type="button"
            onClick={() => {
              if (!selected) {
                haptic(25);
                onChange(opt.id);
              }
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 font-medium rounded-lg transition-all duration-150 active:scale-95 ${pad} ${
              selected
                ? 'bg-surface text-fg font-semibold shadow-sm border border-line/60'
                : 'text-muted hover:text-fg'
            }`}
          >
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span className="truncate">{opt.label}</span>
            {opt.badge && <span className="shrink-0">{opt.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}
