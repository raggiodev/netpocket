import React, { useRef } from 'react';
import { ClipboardPaste, X } from 'lucide-react';
import { readClipboard, haptic } from '../utils/clipboard';
import { byteLength } from '../utils/encoding';
import { useSettings } from '../i18n';
import { useToast } from './Toast';

export interface TextAreaProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  mono?: boolean;
  className?: string;
  showCounters?: boolean;
  actionSlot?: React.ReactNode;
  maxLength?: number;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  mono = true,
  className = '',
  showCounters = true,
  actionSlot,
  maxLength = 262144,
}) => {
  const { t } = useSettings();
  const { showToast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handlePaste = async () => {
    haptic(30);
    const text = await readClipboard();
    if (text === null) {
      showToast(t.common.pasteFailed, 'warn');
    } else if (text === '') {
      showToast(t.common.pasteEmpty, 'info');
    } else {
      onChange(text);
      textareaRef.current?.focus();
    }
  };

  const handleClear = () => {
    haptic(25);
    onChange('');
    textareaRef.current?.focus();
  };

  const bytes = byteLength(value);
  const chars = value.length;

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        {label ? (
          <label className="text-xs font-semibold uppercase tracking-wider text-muted">
            {label}
          </label>
        ) : <div />}

        <div className="flex items-center gap-1.5">
          {actionSlot}
          {value.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              title={t.common.clear}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-muted hover:text-fg hover:bg-elevated transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>{t.common.clear}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePaste}
            title={t.common.paste}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-accent bg-accent/10 hover:bg-accent/20 transition-colors"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>{t.common.paste}</span>
          </button>
        </div>
      </div>

      <div className="relative bg-surface border border-line rounded-xl transition-all duration-150 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/40">
        <textarea
          ref={textareaRef}
          value={value}
          rows={rows}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-transparent p-3 text-xs sm:text-sm text-fg placeholder:text-muted/60 focus:outline-none resize-y min-h-[96px] ${
            mono ? 'font-mono tracking-tight leading-relaxed' : ''
          }`}
        />

        {showCounters && (
          <div className="flex items-center justify-end gap-3 px-3 py-1.5 border-t border-line/40 text-[11px] font-mono text-muted bg-elevated/40 rounded-b-xl">
            <span>
              {chars} <span className="opacity-70">{t.common.chars}</span>
            </span>
            <span>•</span>
            <span>
              {bytes} <span className="opacity-70">{t.common.bytes}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
