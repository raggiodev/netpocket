import React from 'react';
import { ShieldAlert, Terminal, Globe } from 'lucide-react';
import { SegmentedControl, type SegmentOption } from '../components/SegmentedControl';
import { EventIds } from './guard/EventIds';
import { Chmod } from './guard/Chmod';
import { HttpCodes } from './guard/HttpCodes';
import { useSettings } from '../i18n';
import { useLocalStorage, oneOf } from '../hooks/useLocalStorage';

export type GuardSubtool = 'events' | 'chmod' | 'http';

const isGuardSubtool = oneOf<GuardSubtool>('events', 'chmod', 'http');

export const Guard: React.FC = () => {
  const { t } = useSettings();
  const [subtool, setSubtool] = useLocalStorage<GuardSubtool>('guard:active_tool', 'events', isGuardSubtool);

  const options: SegmentOption<GuardSubtool>[] = [
    {
      id: 'events',
      label: t.guard.tools.events,
      icon: <ShieldAlert className="w-4 h-4" />,
    },
    {
      id: 'chmod',
      label: t.guard.tools.chmod,
      icon: <Terminal className="w-4 h-4" />,
    },
    {
      id: 'http',
      label: t.guard.tools.http,
      icon: <Globe className="w-4 h-4" />,
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-3.5 sm:px-4 pt-2.5 pb-24 space-y-3 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-0.5">
        <h1 className="text-lg font-bold tracking-tight text-fg">
          {t.guard.title}
        </h1>
        <p className="text-xs sm:text-sm text-muted leading-relaxed">
          {t.guard.subtitle}
        </p>
      </div>

      {/* Sub-tool Selector */}
      <div
        style={{ top: 'var(--topbar-h, 52px)' }}
        className="sticky z-20 bg-bg/95 backdrop-blur-md py-1.5 -mx-3.5 px-3.5 sm:-mx-4 sm:px-4"
      >
        <SegmentedControl
          options={options}
          value={subtool}
          onChange={setSubtool}
          size="md"
        />
      </div>

      {/* Sub-modules: kept mounted to preserve filters, searches, and expanded states */}
      <div className={subtool === 'events' ? 'block' : 'hidden'} role="tabpanel">
        <EventIds />
      </div>

      <div className={subtool === 'chmod' ? 'block' : 'hidden'} role="tabpanel">
        <Chmod />
      </div>

      <div className={subtool === 'http' ? 'block' : 'hidden'} role="tabpanel">
        <HttpCodes />
      </div>
    </div>
  );
};
