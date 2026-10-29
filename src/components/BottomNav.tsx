import React from 'react';
import { Terminal, Network, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { TabId } from '../types';
import { useSettings } from '../i18n';
import { haptic } from '../utils/clipboard';

export interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const { t } = useSettings();

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    {
      id: 'inspector',
      label: t.nav.inspector,
      icon: <Terminal className="w-4 h-4 stroke-[2.2]" />,
    },
    {
      id: 'networks',
      label: t.nav.networks,
      icon: <Network className="w-4 h-4 stroke-[2.2]" />,
    },
    {
      id: 'ports',
      label: t.nav.ports,
      icon: <ShieldAlert className="w-4 h-4 stroke-[2.2]" />,
    },
    {
      id: 'guard',
      label: t.nav.guard,
      icon: <ShieldCheck className="w-4 h-4 stroke-[2.2]" />,
    },
  ];

  const handleSelect = (id: TabId) => {
    if (id !== activeTab) {
      haptic(30);
      onTabChange(id);
    }
  };

  return (
    <nav
      aria-label={t.nav.label}
      className="fixed bottom-0 left-0 right-0 z-40 w-full max-w-full bg-surface/95 backdrop-blur-md border-t border-line px-2 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom,0px))] transition-colors"
    >
      <div className="max-w-md mx-auto grid grid-cols-4 gap-1 h-14 items-center">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelect(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 active:scale-95 select-none min-w-0 ${isActive
                ? 'text-accent font-semibold'
                : 'text-muted hover:text-fg'
                }`}
            >
              <div
                className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-accent/15' : 'bg-transparent'
                  }`}
              >
                {tab.icon}
              </div>
              <span className="text-[11px] leading-tight mt-0.5 tracking-tight truncate max-w-full">
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-accent mt-0.5 animate-pop-in" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

