import React, { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { writeClipboard, haptic } from '../utils/clipboard';
import { useSettings } from '../i18n';

export interface CopyCardProps {
  label?: string;
  value: string;
  displayValue?: React.ReactNode;
  hint?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  mono?: boolean;
}

export const CopyCard: React.FC<CopyCardProps> = ({
  label,
  value,
  displayValue,
  hint,
  badge,
  icon,
  className = '',
  mono = true,
}) => {
  const { t } = useSettings();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!value) return;
    haptic(35);
    const success = await writeClipboard(value);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 600);
    }
  }, [value]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`${label ? label + ': ' : ''}${value} - ${t.common.tapToCopy}`}
      className={`group relative w-full text-left p-3.5 rounded-xl border bg-surface transition-all duration-150 select-none active:scale-[0.99] cursor-pointer ${
        copied
          ? 'border-flash shadow-flash'
          : 'border-line hover:border-accent/50 hover:bg-surface/80'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          {icon && <span className="text-muted shrink-0">{icon}</span>}
          {label && (
            <span className="text-xs font-semibold uppercase tracking-wider text-muted truncate">
              {label}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {badge}
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-medium transition-all duration-200 ${
              copied
                ? 'bg-safe-bg text-safe border border-safe-line scale-105'
                : 'text-muted group-hover:text-accent opacity-75 group-hover:opacity-100'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-safe shrink-0 stroke-[2.5]" />
                <span>{t.common.copied}</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 shrink-0" />
                <span className="hidden sm:inline text-[10px]">{t.common.tapToCopy}</span>
              </>
            )}
          </span>
        </div>
      </div>

      <div
        className={`text-sm break-all leading-relaxed text-fg select-all ${
          mono ? 'font-mono tracking-tight font-medium' : ''
        }`}
      >
        {displayValue ?? value}
      </div>

      {hint && <p className="mt-1 text-[11px] text-muted leading-tight">{hint}</p>}
    </button>
  );
};
