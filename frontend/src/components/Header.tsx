import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { healthApi } from '../api/services';
import { UserCircle, Menu } from 'lucide-react';

interface HeaderProps {
  activeTabLabel: string;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTabLabel, onToggleMobileMenu }) => {
  const { user, switchRole } = useAuth();
  const [coreStatus, setCoreStatus] = useState<string>('CHECKING');
  const [dbMode, setDbMode] = useState<string>('');

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

  return (
    <header className="top-header">
      <div className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '4px'
            }}
            aria-label="Toggle Navigation Sidebar"
          >
            <Menu size={22} />
          </button>
        )}
        <div>
          <h2>{activeTabLabel === 'Dashboard' ? 'STVAMS Command Center Dashboard' : activeTabLabel}</h2>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Smart Traffic Violation & Vehicle Analytics Management System
          </span>
        </div>
      </div>
      <div className="header-controls">
        <div
          className="health-pill"
          style={{
            background: isHealthy ? 'rgba(16, 185, 129, 0.1)' : isDegraded ? 'rgba(245, 158, 11, 0.12)' : 'rgba(244, 63, 94, 0.12)',
            borderColor: isHealthy ? 'rgba(16, 185, 129, 0.3)' : isDegraded ? 'rgba(245, 158, 11, 0.35)' : 'rgba(244, 63, 94, 0.35)',
            color: isHealthy ? 'var(--accent-emerald)' : isDegraded ? 'var(--accent-amber)' : 'var(--accent-rose)'
          }}
          title={isDegraded ? 'Core API healthy, operational database running via SQLite local fallback' : 'All services connected'}
        >
          <span
            className="health-dot"
            style={{
              background: isHealthy ? 'var(--accent-emerald)' : isDegraded ? 'var(--accent-amber)' : 'var(--accent-rose)',
              boxShadow: isHealthy ? '0 0 8px var(--accent-emerald)' : isDegraded ? '0 0 8px var(--accent-amber)' : '0 0 8px var(--accent-rose)'
            }}
          />
          <span>
            {isOffline ? 'SYSTEM: OFFLINE' : isDegraded ? `API OK • ${dbMode}` : 'SYSTEM: OPERATIONAL'}
          </span>
        </div>

        <div className="user-badge">
          <UserCircle size={18} />
          <span>{user?.username || 'admin'}</span>
          <span className="role-tag">{user?.role || 'ADMIN'}</span>
        </div>

        <select
          className="search-input"
          style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
          value={user?.username?.toLowerCase() || 'admin'}
          onChange={(e) => switchRole(e.target.value)}
          title="Switch Active Operational Role"
        >
          <option value="admin">Role: ADMIN</option>
          <option value="officer">Role: OFFICER</option>
          <option value="analyst">Role: ANALYST</option>
          <option value="operator">Role: OPERATOR</option>
        </select>
      </div>
    </header>
  );
};
