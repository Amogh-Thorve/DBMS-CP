import React, { useState, useEffect } from 'react';
import { officersApi } from '../api/services';
import type { Officer } from '../types';
import { Plus, X } from 'lucide-react';

export const OfficersView: React.FC = () => {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [badgeNumber, setBadgeNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [rankTitle, setRankTitle] = useState('INSPECTOR');
  const [zoneId, setZoneId] = useState(1);
  const [phone, setPhone] = useState('');

  const fetchOfficers = async () => {
    setLoading(true);
    try {
      const data = await officersApi.list({ status: statusFilter ? statusFilter : undefined });
      setOfficers(data);
    } catch (err) {
      console.error('Error fetching officers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficers();
  }, [statusFilter]);

  const handleAddOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await officersApi.create({
        badge_number: badgeNumber,
        full_name: fullName,
        rank_title: rankTitle,
        zone_id: zoneId,
        phone,
        status: 'ACTIVE'
      });
      setShowAddModal(false);
      fetchOfficers();
      setBadgeNumber('');
      setFullName('');
    } catch (err) {
      alert('Failed to register officer.');
    }
  };

  return (
    <div>
      <div className="table-card">
        <div className="table-toolbar">
          <div style={{ display: 'flex', gap: '0.75rem', flex: 1 }}>
            <select
              className="search-input"
              style={{ width: '180px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Roster Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="ON_LEAVE">ON_LEAVE</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Register Traffic Officer
          </button>
        </div>

        {loading ? (
          <div className="state-center">
            <div className="spinner" />
            <p>Loading traffic officer roster...</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Officer ID</th>
                <th>Badge Number</th>
                <th>Full Name</th>
                <th>Rank Title</th>
                <th>Assigned Zone</th>
                <th>Phone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {officers.length > 0 ? (
                officers.map((o) => (
                  <tr key={o.officer_id}>
                    <td>#{o.officer_id}</td>
                    <td><strong style={{ fontFamily: 'var(--font-mono)' }}>{o.badge_number}</strong></td>
                    <td>{o.full_name}</td>
                    <td><span className="badge badge-info">{o.rank_title}</span></td>
                    <td>Zone #{o.zone_id || 1}</td>
                    <td>{o.phone || '9876543210'}</td>
                    <td>
                      <span className={`badge ${o.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="state-center">No traffic officer records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Register New Traffic Officer</h3>
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleAddOfficer} className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Badge Number</label>
                  <input type="text" className="form-control" required placeholder="e.g. BADGE_888" value={badgeNumber} onChange={(e) => setBadgeNumber(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-control" required placeholder="e.g. Insp. Vikram Verma" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Rank Title</label>
                  <select className="form-control" value={rankTitle} onChange={(e) => setRankTitle(e.target.value)}>
                    <option value="INSPECTOR">INSPECTOR</option>
                    <option value="SUB_INSPECTOR">SUB_INSPECTOR</option>
                    <option value="CONSTABLE">CONSTABLE</option>
                    <option value="SERGEANT">SERGEANT</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Assigned Zone ID</label>
                  <input type="number" className="form-control" required value={zoneId} onChange={(e) => setZoneId(Number(e.target.value))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input type="text" className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Register Officer</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
