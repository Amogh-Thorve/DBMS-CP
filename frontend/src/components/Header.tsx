import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { healthApi } from '../api/services';
import { UserCircle } from 'lucide-react';

interface HeaderProps {
  activeTabLabel: string;
}

export const Header: React.FC<HeaderProps> = ({ activeTabLabel }) => {
  const { user, switchRole } = useAuth();
  const [dbStatus, setDbStatus] = useState<string>('CONNECTING');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await healthApi.getCore();
        setDbStatus(res.status);
      } catch (err) {
        setDbStatus('OFFLINE');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="top-header">
      <div className="header-title">
        <h2>{activeTabLabel}</h2>
      </div>
      <div className="header-controls">
        <div className="health-pill">
          <span className={`health-dot ${dbStatus === 'HEALTHY' || dbStatus === 'CONNECTED' ? '' : 'bg-rose'}`} />
          <span>API: {dbStatus}</span>
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
          title="Quick Switch Role"
        >
          <option value="admin">Switch: ADMIN</option>
          <option value="officer">Switch: OFFICER</option>
          <option value="analyst">Switch: ANALYST</option>
          <option value="operator">Switch: OPERATOR</option>
        </select>
      </div>
    </header>
  );
};
