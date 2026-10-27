import React from 'react';
import { haptic } from '../utils/clipboard';

export interface ChipProps {
  label: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  count?: number;
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  active = false,
  onClick,
  icon,
  count,
  className = '',
}) => {
  const handleClick = () => {
    haptic(25);
    onClick?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all select-none active:scale-95 border ${
        active
          ? 'bg-accent/15 text-accent border-accent shadow-sm'
          : 'bg-surface text-muted border-line hover:border-muted/40 hover:text-fg'
      } ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{label}</span>
      {typeof count === 'number' && (
        <span
          className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
            active ? 'bg-accent/25 text-accent' : 'bg-elevated text-muted'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
};
