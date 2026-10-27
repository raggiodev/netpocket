import React from 'react';
import { SearchX } from 'lucide-react';
import { useSettings } from '../i18n';

export interface EmptyStateProps {
  title?: string;
  hint?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  hint,
  icon,
  action,
  className = '',
}) => {
  const { t } = useSettings();

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-line/60 bg-surface/40 my-4 ${className}`}
    >
      <div className="p-3 rounded-full bg-elevated text-muted mb-3">
        {icon ?? <SearchX className="w-6 h-6 stroke-[1.75]" />}
      </div>
      <h3 className="text-sm font-semibold text-fg mb-1">
        {title ?? t.common.noResults}
      </h3>
      <p className="text-xs text-muted max-w-xs mb-4">
        {hint ?? t.common.noResultsHint}
      </p>
      {action}
    </div>
  );
};
