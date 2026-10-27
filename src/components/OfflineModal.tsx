import React, { useEffect, useRef } from 'react';
import { ShieldCheck, Lock, Radio, Cpu, HardDrive, X } from 'lucide-react';
import { useSettings } from '../i18n';
import { haptic } from '../utils/clipboard';

export interface OfflineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineModal: React.FC<OfflineModalProps> = ({ isOpen, onClose }) => {
  const { t } = useSettings();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
        haptic(25);
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  // Fallback for browsers without closedBy support (Modern Web Guidance compliance)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    const handleClick = (event: MouseEvent) => {
      if (!('closedBy' in HTMLDialogElement.prototype)) {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;

        if (!isDialogContent) {
          onClose();
        }
      }
    };

    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('click', handleClick);

    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('click', handleClick);
    };
  }, [onClose]);

  const icons = [
    <Lock key="lock" className="w-5 h-5 text-safe shrink-0" />,
    <Radio key="radio" className="w-5 h-5 text-safe shrink-0" />,
    <Cpu key="cpu" className="w-5 h-5 text-safe shrink-0" />,
    <HardDrive key="hd" className="w-5 h-5 text-safe shrink-0" />,
  ];

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby="offlineModalTitle"
      className="m-auto w-[92%] max-w-lg rounded-2xl bg-surface border border-line shadow-2xl p-0 overflow-hidden text-fg animate-pop-in"
    >
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-line bg-elevated/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-safe-bg border border-safe-line text-safe">
            <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 id="offlineModalTitle" className="text-sm sm:text-base font-bold text-fg">
              {t.offline.title}
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-safe font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse-dot" />
              {t.offline.pill}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            haptic(20);
            onClose();
          }}
          className="p-1.5 rounded-lg text-muted hover:text-fg hover:bg-elevated transition-colors"
          aria-label={t.common.close}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 sm:p-5 max-h-[75vh] overflow-y-auto flex flex-col gap-4 text-xs sm:text-sm">
        <p className="text-muted leading-relaxed">{t.offline.intro}</p>

        <div className="grid gap-3">
          {t.offline.points.map((pt, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 rounded-xl bg-elevated/50 border border-line/60"
            >
              <div className="mt-0.5">{icons[idx % icons.length]}</div>
              <div className="flex-1">
                <h4 className="font-semibold text-fg text-xs sm:text-sm mb-1">{pt.title}</h4>
                <p className="text-muted text-[11px] sm:text-xs leading-relaxed">{pt.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-mono">
          🔒 {t.offline.footer}
        </div>
      </div>

      <div className="p-3 sm:p-4 border-t border-line bg-elevated/20 flex justify-end">
        <button
          type="button"
          onClick={() => {
            haptic(25);
            onClose();
          }}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-accent text-bg font-semibold text-xs sm:text-sm hover:brightness-110 active:scale-95 transition-all shadow-sm"
        >
          {t.offline.ok}
        </button>
      </div>
    </dialog>
  );
};
