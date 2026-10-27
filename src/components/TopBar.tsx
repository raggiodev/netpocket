import React, { useState } from 'react';
import { Shield, Sun, Moon, Lock } from 'lucide-react';
import { useSettings, LANGS } from '../i18n';
import { OfflineModal } from './OfflineModal';
import { haptic } from '../utils/clipboard';
import type { Lang } from '../types';

export const TopBar: React.FC = () => {
  const { lang, setLang, theme, toggleTheme, t } = useSettings();
  const [offlineModalOpen, setOfflineModalOpen] = useState(false);

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
      <header className="sticky top-0 z-40 w-full bg-surface/90 backdrop-blur-md border-b border-line px-3 sm:px-4 py-2.5 transition-colors">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-accent/15 border border-accent/30 text-accent">
              <Shield className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-base sm:text-lg tracking-tight text-fg">
                {t.app.name}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-accent/20 text-accent border border-accent/40 uppercase">
                {t.app.badge}
              </span>
            </div>
          </div>

          {/* Right actions: Offline pill, Language switcher, Theme toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Air-Gapped Shield Pill */}
            <button
              type="button"
              onClick={handleOfflineClick}
              title={t.offline.pillAria}
              aria-label={t.offline.pillAria}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-safe-bg border border-safe-line text-safe text-[11px] font-mono font-semibold transition-all duration-150 active:scale-95 hover:brightness-110 shadow-sm"
            >
              <Lock className="w-3 h-3 stroke-[2.5]" />
              <span className="hidden xs:inline">{t.offline.pill}</span>
            </button>

            {/* Language Selector */}
            <div
              role="group"
              aria-label={t.common.language}
              className="flex items-center bg-elevated border border-line rounded-lg p-0.5"
            >
              {LANGS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => handleLangChange(l)}
                  className={`px-1.5 sm:px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase transition-all ${
                    lang === l
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
              className="p-1.5 rounded-lg border border-line bg-surface text-muted hover:text-fg hover:bg-elevated active:scale-95 transition-all"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-warn" />
              ) : (
                <Moon className="w-4 h-4 text-accent" />
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
