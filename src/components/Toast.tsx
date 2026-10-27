import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

export type ToastType = 'success' | 'warn' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  text: string;
}

interface ToastContextValue {
  showToast: (text: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none w-[90%] max-w-sm"
      >
        {toasts.map((toast) => {
          let icon = <Info className="w-4 h-4 text-accent shrink-0" />;
          let borderClasses = 'border-line bg-surface text-fg';

          if (toast.type === 'success') {
            icon = <CheckCircle2 className="w-4 h-4 text-safe shrink-0" />;
            borderClasses = 'border-safe-line bg-surface text-safe';
          } else if (toast.type === 'warn' || toast.type === 'error') {
            icon = <AlertCircle className="w-4 h-4 text-danger shrink-0" />;
            borderClasses = 'border-danger-line bg-surface text-danger';
          }

          return (
            <div
              key={toast.id}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border shadow-lg text-xs font-medium animate-pop-in pointer-events-auto backdrop-blur-md ${borderClasses}`}
            >
              {icon}
              <span className="flex-1 leading-snug">{toast.text}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
