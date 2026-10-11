import React, { useState } from 'react';
import { Sidebar, navItems } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: (activeTab: string, setActiveTab: (tab: string) => void) => React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const currentNav = navItems.find((item) => item.id === activeTab);
  const activeTabLabel = currentNav ? currentNav.label : 'Dashboard';

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div className="main-content">
        <Header
          activeTabLabel={activeTabLabel}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        <main className="content-body">
          {children(activeTab, setActiveTab)}
        </main>
      </div>
    </div>
  );
};
