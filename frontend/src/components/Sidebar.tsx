import React from 'react';
import {
  LayoutDashboard, Car, Users, UserCheck, Camera, Radio, AlertTriangle,
  Receipt, CreditCard, ShieldAlert, BadgeCheck, Search, BarChart3, FileSpreadsheet, X, Gauge
} from 'lucide-react';

export interface NavItemConfig {
  id: string;
  label: string;
  category: string;
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
}

export const navItems: NavItemConfig[] = [
  { id: 'dashboard', label: 'Dashboard', category: 'Overview', icon: LayoutDashboard },
  { id: 'vehicles', label: 'Vehicles', category: 'Registry', icon: Car },
  { id: 'owners', label: 'Owners', category: 'Registry', icon: Users },
  { id: 'drivers', label: 'Drivers', category: 'Registry', icon: UserCheck },
  { id: 'cameras', label: 'Cameras', category: 'Surveillance', icon: Camera },
  { id: 'radar', label: 'Speed Radar & ANPR', category: 'Surveillance', icon: Gauge },
  { id: 'events', label: 'Vehicle Events', category: 'Surveillance', icon: Radio },
  { id: 'violations', label: 'Violations', category: 'Enforcement', icon: AlertTriangle },
  { id: 'fines', label: 'Fines', category: 'Financials', icon: Receipt },
  { id: 'payments', label: 'Payments', category: 'Financials', icon: CreditCard },
  { id: 'appeals', label: 'Appeals', category: 'Legal & Tribunal', icon: ShieldAlert },
  { id: 'officers', label: 'Officers', category: 'Fleet & Personnel', icon: BadgeCheck },
  { id: 'search', label: 'Search', category: 'Global Directory', icon: Search },
  { id: 'analytics', label: 'Analytics', category: 'Intelligence Hub', icon: BarChart3 },
  { id: 'reports', label: 'Reports', category: 'Compliance & Export', icon: FileSpreadsheet },
];

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, mobileOpen, onClose }) => {
  if (!mobileOpen) return null;

  // Group nav items by category
  const categories = Array.from(new Set(navItems.map((i) => i.category)));

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(34, 53, 72, 0.45)',
          zIndex: 90,
          backdropFilter: 'blur(2px)'
        }}
        aria-label="Close Catalogue Drawer"
      />

      {/* Slide-out Drawer */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          width: '320px',
          maxWidth: '85vw',
          backgroundColor: 'var(--colors-chrome)',
          borderRight: '1px solid var(--colors-hairline-subtle)',
          zIndex: 95,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '4px 0 24px rgba(34, 53, 72, 0.15)'
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            height: '60px',
            padding: '0 20px',
            backgroundColor: 'var(--colors-canvas)',
            borderBottom: '1px solid var(--colors-hairline-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="sap-logo-box">SAP</div>
            <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--colors-ink)' }}>
              Operations Catalogue
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--colors-ink-meta)',
              padding: '6px'
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Categories & Navigation */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {categories.map((cat) => (
            <div key={cat} style={{ marginBottom: '18px' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: 'var(--colors-ink-meta)',
                  letterSpacing: '0.06em',
                  padding: '4px 12px 6px'
                }}
              >
                {cat}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {navItems
                  .filter((item) => item.category === cat)
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          onClose?.();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '14px',
                          fontWeight: isActive ? 600 : 400,
                          backgroundColor: isActive ? 'var(--colors-band-blue)' : 'transparent',
                          color: isActive ? 'var(--colors-primary)' : 'var(--colors-ink-body)',
                          borderLeft: isActive ? '3px solid var(--colors-primary)' : '3px solid transparent',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Icon size={16} color={isActive ? 'var(--colors-primary)' : 'var(--colors-ink-nav)'} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
};
