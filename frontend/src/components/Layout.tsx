import React, { useState } from 'react';
import { Sidebar, navItems } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: (activeTab: string, setActiveTab: (tab: string) => void) => React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const currentNav = navItems.find((item) => item.id === activeTab);
  const activeTabLabel = currentNav ? currentNav.label : 'Dashboard';

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-content">
        <Header activeTabLabel={activeTabLabel} />
        <main className="content-body">
          {children(activeTab, setActiveTab)}
        </main>
      </div>
    </div>
  );
};
