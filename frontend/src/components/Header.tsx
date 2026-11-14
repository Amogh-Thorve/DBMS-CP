import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { healthApi } from '../api/services';
import { navItems } from './Sidebar';
import {
  Search, Shield, Menu,
  ChevronRight, ArrowRight
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onToggleMobileMenu?: () => void;
  onQuickSearchJump?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onToggleMobileMenu
}) => {
  const { user, switchRole } = useAuth();
  const [coreStatus, setCoreStatus] = useState<string>('CHECKING');
  const [dbMode, setDbMode] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const [coreRes, dbRes] = await Promise.all([
          healthApi.getCore().catch(() => ({ status: 'OFFLINE' })),
          healthApi.getDb().catch(() => ({ status: 'OFFLINE', database: 'None' }))
        ]);
        if (!isMounted) return;
        setCoreStatus(coreRes.status);
        if (dbRes.status === 'DEGRADED') {
          setDbMode('SQLITE FALLBACK');
        } else if (dbRes.status === 'HEALTHY' || dbRes.status === 'CONNECTED') {
          setDbMode('ORACLE DB');
        } else {
          setDbMode('DB OFFLINE');
        }
      } catch {
        if (!isMounted) return;
        setCoreStatus('OFFLINE');
        setDbMode('UNREACHABLE');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const isDegraded = dbMode.includes('FALLBACK');
  const isHealthy = coreStatus === 'HEALTHY' && !isDegraded;
  const isOffline = coreStatus === 'OFFLINE';

  const currentNav = navItems.find((item) => item.id === activeTab) || navItems[0];
  const currentCategory = (currentNav as any).category || 'Operations';

  // Quick catalogue search filter
  const filteredNavs = searchQuery.trim()
    ? navItems.filter((i) =>
        i.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ((i as any).category && (i as any).category.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  return (
    <header style={{ width: '100%', position: 'sticky', top: 0, zIndex: 60 }}>
      {/* =====================================================================
          STOREY 1: 60px Global Bar in {colors.chrome} (#f5f6f7)
          ===================================================================== */}
      <div className="global-nav-bar">
        {/* Brand Lockup */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="btn-outline"
              style={{
                minHeight: '36px',
                height: '36px',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid var(--colors-hairline-subtle)'
              }}
              title="Catalogue Drawer"
              aria-label="Toggle Catalogue Drawer"
            >
              <Menu size={18} color="var(--colors-ink-body)" />
              <span style={{ fontSize: '13px', display: 'none' }} className="d-md-inline">Catalogue</span>
            </button>
          )}

          <div className="global-brand">
            <div className="sap-brand-badge">
              <div className="sap-logo-box">
                SAP
              </div>
              <div className="sap-brand-title">
                <span className="app-name">STVAMS</span>
                <span className="app-subtitle">Traffic Violation Management</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Catalogue Search */}
        <div className="global-search-container">
          <Search size={16} className="global-search-icon" />
          <input
            type="text"
            className="global-search-input"
            placeholder="Search catalogue (Vehicles, Fines, Cameras, Reports)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            onBlur={() => setTimeout(() => setShowSearchResults(false), 250)}
          />

          {showSearchResults && filteredNavs.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '42px',
                left: 0,
                right: 0,
                background: 'var(--colors-canvas)',
                border: '1px solid var(--colors-hairline-subtle)',
                borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(34, 53, 72, 0.14)',
                zIndex: 100,
                overflow: 'hidden'
              }}
            >
              {filteredNavs.map((nav) => (
                <div
                  key={nav.id}
                  style={{
                    padding: '8px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontSize: '13px',
                    borderBottom: '1px solid var(--colors-hairline-subtle)'
                  }}
                  onMouseDown={() => {
                    setActiveTab(nav.id);
                    setSearchQuery('');
                    setShowSearchResults(false);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <nav.icon size={15} color="var(--colors-primary)" />
                    <span style={{ fontWeight: 600, color: 'var(--colors-ink)' }}>{nav.label}</span>
                    <span style={{ fontSize: '11px', color: 'var(--colors-ink-meta)' }}>
                      {(nav as any).category}
                    </span>
                  </div>
                  <ArrowRight size={14} color="var(--colors-ink-meta)" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Global Controls: Status, User, Role */}
        <div className="global-actions">
          {/* Health Status Affordance */}
          <div
            className={`status-badge-sap ${isHealthy ? 'operational' : isDegraded ? 'degraded' : 'offline'}`}
            title={isDegraded ? 'Core API operational • SQLite Fallback' : 'System Operational'}
          >
            <span className="status-dot-sap" />
            <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '12px' }}>
              {isOffline ? 'OFFLINE' : isDegraded ? `OK • ${dbMode}` : 'OPERATIONAL'}
            </span>
          </div>

          {/* User & Role Affordance */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shield size={16} color="var(--colors-primary)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--colors-ink)' }}>
              {user?.username || 'admin'}
            </span>
            <select
              className="user-selector-sap"
              value={user?.username?.toLowerCase() || 'admin'}
              onChange={(e) => switchRole(e.target.value)}
              title="Operational Security Role"
            >
              <option value="admin">ADMIN</option>
              <option value="officer">OFFICER</option>
              <option value="analyst">ANALYST</option>
              <option value="operator">OPERATOR</option>
            </select>
          </div>
        </div>
      </div>

      {/* =====================================================================
          STOREY 2: Product Tab Rail with Breadcrumbs and Tabs
          ===================================================================== */}
      <div className="product-tab-rail">
        {/* Breadcrumb Trail (height 17-24px, {colors.ink-nav}, 15px 400) */}
        <div className="tab-rail-breadcrumb-row">
          <span className="breadcrumb-label">
            <span>Catalogue</span>
            <ChevronRight size={13} className="breadcrumb-separator" />
            <span>{currentCategory}</span>
            <ChevronRight size={13} className="breadcrumb-separator" />
            <span className="breadcrumb-current">{currentNav.label}</span>
          </span>
        </div>

        {/* Row of Product Tabs */}
        <div className="tab-rail-row">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={isActive ? 'product-tab-active' : 'product-tab'}
                onClick={() => setActiveTab(item.id)}
                role="tab"
                aria-selected={isActive}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
