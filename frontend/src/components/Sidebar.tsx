import React from 'react';
import {
  LayoutDashboard, Car, Users, UserCheck, Camera, Radio, AlertTriangle,
  Receipt, CreditCard, ShieldAlert, BadgeCheck, Search, BarChart3, FileSpreadsheet, X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileOpen?: boolean;
  onClose?: () => void;
}

export const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'vehicles', label: 'Vehicles', icon: Car },
  { id: 'owners', label: 'Owners', icon: Users },
  { id: 'drivers', label: 'Drivers', icon: UserCheck },
  { id: 'cameras', label: 'Cameras', icon: Camera },
  { id: 'events', label: 'Vehicle Events', icon: Radio },
  { id: 'violations', label: 'Violations', icon: AlertTriangle },
  { id: 'fines', label: 'Fines', icon: Receipt },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'appeals', label: 'Appeals', icon: ShieldAlert },
  { id: 'officers', label: 'Officers', icon: BadgeCheck },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, mobileOpen, onClose }) => {
  return (
    <>
      {mobileOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            zIndex: 45,
            backdropFilter: 'blur(4px)'
          }}
        />
      )}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="brand-icon">
              <span>ST</span>
            </div>
            <div className="brand-text">
              <h1>STVAMS</h1>
              <p>Traffic Control</p>
            </div>
          </div>
          {mobileOpen && (
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose?.();
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
