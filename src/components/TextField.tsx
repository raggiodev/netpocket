import React, { useRef } from 'react';
import { ClipboardPaste, X } from 'lucide-react';
import { readClipboard, haptic } from '../utils/clipboard';
import { useSettings } from '../i18n';
import { useToast } from './Toast';

export interface TextFieldProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  mono?: boolean;
  type?: string;
  error?: string | null;
  helper?: string;
  className?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  actionSlot?: React.ReactNode;
  maxLength?: number;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  mono = true,
  type = 'text',
  error,
  helper,
  className = '',
  autoFocus = false,
  disabled = false,
  actionSlot,
  maxLength = 262144,
}) => {
  const { t } = useSettings();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePaste = async () => {
    haptic(30);
    const text = await readClipboard();
    if (text === null) {
      showToast(t.common.pasteFailed, 'warn');
    } else if (text === '') {
      showToast(t.common.pasteEmpty, 'info');
    } else {
      onChange(text);
      inputRef.current?.focus();
    }
  };

  const handleClear = () => {
    haptic(25);
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center justify-between">
          <span>{label}</span>
          {actionSlot}
        </label>
      )}

      <div
        className={`relative flex items-center bg-surface border rounded-xl transition-all duration-150 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/40 ${
          error ? 'border-danger-line' : 'border-line'
        }`}
      >
        <input
          ref={inputRef}
          type={type}
          value={value}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={disabled}
          className={`w-full bg-transparent px-3.5 py-2.5 text-sm text-fg placeholder:text-muted/60 focus:outline-none ${
            mono ? 'font-mono tracking-tight' : ''
          }`}
        />

        <div className="flex items-center gap-1 pr-2 shrink-0">
          {value.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              title={t.common.clear}
              aria-label={t.common.clear}
              className="p-1 rounded-md text-muted hover:text-fg hover:bg-elevated transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handlePaste}
            title={t.common.paste}
            aria-label={t.common.paste}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-muted hover:text-accent hover:bg-elevated transition-colors"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">{t.common.paste}</span>
          </button>
        </div>
      </div>

      {error ? (
        <p className="text-xs text-danger font-medium mt-0.5">{error}</p>
      ) : helper ? (
        <p className="text-xs text-muted mt-0.5">{helper}</p>
      ) : null}
    </div>
  );
};
