import React, { useState, useEffect } from 'react';
import { ownersApi } from '../api/services';
import type { Owner } from '../types';
import { Plus, X } from 'lucide-react';

export const OwnersView: React.FC = () => {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [nationalIdSearch, setNationalIdSearch] = useState('');
  const [emailSearch, setEmailSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [nationalId, setNationalId] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [ownerType, setOwnerType] = useState('INDIVIDUAL');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchOwners = async () => {
    setLoading(true);
    try {
      const data = await ownersApi.list({
        national_id: nationalIdSearch ? nationalIdSearch : undefined,
        email: emailSearch ? emailSearch : undefined
      });
      setOwners(data);
    } catch (err) {
      console.error('Error fetching owners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, [nationalIdSearch, emailSearch]);

  const handleAddOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await ownersApi.create({
        national_id: nationalId,
        full_name: fullName,
        email,
        phone,
        address,
        owner_type: ownerType
      });
      setShowAddModal(false);
      fetchOwners();
      setNationalId('');
      setFullName('');
      setEmail('');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Owner registration failed.');
    }
  };

  return (
    <div>
      <div className="table-card">
        <div className="table-toolbar">
          <div style={{ display: 'flex', gap: '0.75rem', flex: 1 }}>
            <input
              type="text"
              className="search-input"
              placeholder="Search by National ID (e.g. NATID_TEST_99)..."
              value={nationalIdSearch}
              onChange={(e) => setNationalIdSearch(e.target.value)}
            />
            <input
              type="text"
              className="search-input"
              placeholder="Search by Email..."
              value={emailSearch}
              onChange={(e) => setEmailSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Register Owner
          </button>
        </div>

        {loading ? (
          <div className="state-center">
            <div className="spinner" />
            <p>Loading owner directory...</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Owner ID</th>
                <th>National ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {owners.length > 0 ? (
                owners.map((o) => (
                  <tr key={o.owner_id}>
                    <td>#{o.owner_id}</td>
                    <td><strong>{o.national_id}</strong></td>
                    <td>{o.full_name}</td>
                    <td>{o.email}</td>
                    <td>{o.phone}</td>
                    <td>{o.address}</td>
                    <td>
                      <span className="badge badge-info">{o.owner_type}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="state-center">No owner records found.</td>
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
              <h3>Register New Vehicle Owner</h3>
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleAddOwner} className="modal-body">
              {errorMsg && <div style={{ color: 'var(--accent-rose)', marginBottom: '1rem', fontSize: '0.85rem' }}>{errorMsg}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">National ID</label>
                  <input type="text" className="form-control" required placeholder="e.g. NATID998877" value={nationalId} onChange={(e) => setNationalId(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-control" required placeholder="e.g. Ramesh Sharma" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" required placeholder="email@domain.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="text" className="form-control" required placeholder="9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input type="text" className="form-control" required placeholder="Full residential / corporate address" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Owner Type</label>
                <select className="form-control" value={ownerType} onChange={(e) => setOwnerType(e.target.value)}>
                  <option value="INDIVIDUAL">INDIVIDUAL</option>
                  <option value="CORPORATE">CORPORATE</option>
                  <option value="GOVERNMENT">GOVERNMENT</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Register Owner</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
