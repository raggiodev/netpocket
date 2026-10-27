import React from 'react';
import { SettingsProvider } from './i18n';
import { ToastProvider } from './components/Toast';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { Inspector } from './modules/Inspector';
import { Networks } from './modules/Networks';
import { Ports } from './modules/Ports';
import { Guard } from './modules/Guard';
import { useLocalStorage, oneOf } from './hooks/useLocalStorage';
import type { TabId } from './types';

const isTabId = oneOf<TabId>('inspector', 'networks', 'ports', 'guard');

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useLocalStorage<TabId>('app:active_tab', 'inspector', isTabId);

  return (
    <div className="min-h-screen flex flex-col bg-bg text-fg select-text">
      {/* Top Bar with brand, offline badge modal trigger, language selector and theme toggle */}
      <TopBar />

      {/* Main Content Area: all 4 modules remain mounted to preserve volatile state */}
      <main className="flex-1 w-full">
        <div className={activeTab === 'inspector' ? 'block' : 'hidden'} role="tabpanel" id="tab-inspector">
          <Inspector />
        </div>

        <div className={activeTab === 'networks' ? 'block' : 'hidden'} role="tabpanel" id="tab-networks">
          <Networks />
        </div>

        <div className={activeTab === 'ports' ? 'block' : 'hidden'} role="tabpanel" id="tab-ports">
          <Ports />
        </div>

        <div className={activeTab === 'guard' ? 'block' : 'hidden'} role="tabpanel" id="tab-guard">
          <Guard />
        </div>
      </main>

      {/* Fixed Ergonomic 4-tab Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <SettingsProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </SettingsProvider>
  );
};

export default App;
