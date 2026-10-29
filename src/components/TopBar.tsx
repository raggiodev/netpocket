import React, { useState, useRef, useEffect } from 'react';
import { Shield, Sun, Moon, Lock } from 'lucide-react';
import { useSettings, LANGS } from '../i18n';
import { OfflineModal } from './OfflineModal';
import { haptic } from '../utils/clipboard';
import type { Lang } from '../types';

export const TopBar: React.FC = () => {
  const { lang, setLang, theme, toggleTheme, t } = useSettings();
  const [offlineModalOpen, setOfflineModalOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const updateHeight = () => {
      document.documentElement.style.setProperty('--topbar-h', `${el.offsetHeight}px`);
    };

    updateHeight();

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(updateHeight);
      ro.observe(el);
      return () => ro.disconnect();
    }

    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const handleLangChange = (l: Lang) => {
    haptic(20);
    setLang(l);
  };

  const handleThemeToggle = () => {
    haptic(25);
    toggleTheme();
  };

  const handleOfflineClick = () => {
    haptic(30);
    setOfflineModalOpen(true);
  };

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-40 w-full max-w-full bg-surface/95 backdrop-blur-md border-b border-line px-3 sm:px-4 pt-[max(0.5rem,env(safe-area-inset-top,0px))] pb-2 transition-colors"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 min-w-0">
          {/* Left: Compact Shield Logo + Stacked Title */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 shrink-0 rounded-lg bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
              <Shield className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold leading-none text-fg truncate">
                NetPocket
              </span>
              <span className="text-[9px] font-mono font-semibold tracking-widest text-accent leading-tight mt-0.5 truncate">
                CYBERSECURITY
              </span>
            </div>
          </div>

          {/* Right actions: Offline pill, Language switcher, Theme toggle */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Air-Gapped Shield Pill */}
            <button
              type="button"
              onClick={handleOfflineClick}
              title={t.offline.pillAria}
              aria-label={t.offline.pillAria}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-safe-bg border border-safe-line text-safe text-[10px] font-mono font-semibold leading-none transition-all duration-150 active:scale-95 hover:brightness-110 shadow-sm shrink-0"
            >
              <Lock className="w-3 h-3 stroke-[2.5] shrink-0" />
              <span>{t.offline.pill}</span>
            </button>

            {/* Language Selector */}
            <div
              role="group"
              aria-label={t.common.language}
              className="flex items-center bg-elevated border border-line rounded-lg p-0.5 shrink-0"
            >
              {LANGS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => handleLangChange(l)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase leading-tight transition-all ${lang === l
                    ? 'bg-surface text-accent shadow-xs border border-line/40'
                    : 'text-muted hover:text-fg'
                    }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={handleThemeToggle}
              title={theme === 'dark' ? t.common.switchToLight : t.common.switchToDark}
              aria-label={theme === 'dark' ? t.common.switchToLight : t.common.switchToDark}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-line bg-surface text-muted hover:text-fg hover:bg-elevated active:scale-95 transition-all shrink-0"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-warn" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-accent" />
              )}
            </button>
          </div>
        </div>
      </header>

      <OfflineModal
        isOpen={offlineModalOpen}
        onClose={() => setOfflineModalOpen(false)}
      />
    </>
  );
};

