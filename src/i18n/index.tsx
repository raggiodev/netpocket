import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import type { L10n, L10nList, Lang, Theme } from '../types';
import { en, type Dictionary } from './en';
import { es } from './es';
import { pt } from './pt';
import { oneOf, useLocalStorage } from '../hooks/useLocalStorage';

export const DICTIONARIES: Record<Lang, Dictionary> = { en, es, pt };
export const LANGS: Lang[] = ['en', 'es', 'pt'];
export const LOCALES: Record<Lang, string> = { en: 'en-US', es: 'es-ES', pt: 'pt-BR' };

const isLang = oneOf<Lang>('en', 'es', 'pt');
const isTheme = oneOf<Theme>('dark', 'light');

/** Replaces `{name}` placeholders with values. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

function detectInitialLang(): Lang {
  const nav = (typeof navigator !== 'undefined' ? navigator.language : 'en').slice(0, 2).toLowerCase();
  return isLang(nav) ? nav : 'en';
}

interface SettingsContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: Theme;
  toggleTheme: () => void;
  t: Dictionary;
  locale: string;
  /** Picks the active-language value from a localized record. */
  tr: (v: L10n) => string;
  trList: (v: L10nList) => string[];
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useLocalStorage<Lang>('lang', detectInitialLang(), isLang);
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'dark', isTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0B0F19' : '#F8FAFC');
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleTheme = useCallback(() => setTheme((p) => (p === 'dark' ? 'light' : 'dark')), [setTheme]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      lang,
      setLang,
      theme,
      toggleTheme,
      t: DICTIONARIES[lang],
      locale: LOCALES[lang],
      tr: (v) => v[lang] ?? v.en,
      trList: (v) => v[lang] ?? v.en,
    }),
    [lang, setLang, theme, toggleTheme],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}
