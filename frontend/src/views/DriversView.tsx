import React, { useState, useEffect } from 'react';
import { driversApi, licensesApi } from '../api/services';
import type { Driver, License } from '../types';
import { Plus, X } from 'lucide-react';

export const DriversView: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('1995-01-01');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const fetchDriversAndLicenses = async () => {
    setLoading(true);
    try {
      const [dData, lData] = await Promise.all([
        driversApi.list(),
        licensesApi.list()
      ]);
      setDrivers(dData);
      setLicenses(lData);
    } catch (err) {
      console.error('Error fetching drivers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriversAndLicenses();
  }, []);

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await driversApi.create({
        full_name: fullName,
        dob,
        blood_group: bloodGroup,
        phone,
        email: email || undefined
      });
      setShowAddModal(false);
      fetchDriversAndLicenses();
      setFullName('');
      setPhone('');
    } catch (err) {
      alert('Failed to register driver.');
    }
  };

  return (
    <div>
      <div className="table-card">
        <div className="table-toolbar">
          <h3 className="chart-title">Registered Traffic Drivers & Demerit System</h3>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Register Driver
          </button>
        </div>

        {loading ? (
          <div className="state-center">
            <div className="spinner" />
            <p>Loading driver registry...</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Driver ID</th>
                <th>Full Name</th>
                <th>Date of Birth</th>
                <th>Blood Group</th>
                <th>Phone</th>
                <th>License Number</th>
                <th>Demerit Points</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {drivers.length > 0 ? (
                drivers.map((d) => {
                  const lic = licenses.find((l) => l.driver_id === d.driver_id);
                  return (
                    <tr key={d.driver_id}>
                      <td>#{d.driver_id}</td>
                      <td><strong>{d.full_name}</strong></td>
                      <td>{d.dob}</td>
                      <td>{d.blood_group || 'O+'}</td>
                      <td>{d.phone}</td>
                      <td>{lic ? lic.license_number : 'NOT_ISSUED'}</td>
                      <td>
                        <span className={`badge ${lic && lic.demerit_points > 5 ? 'badge-danger' : 'badge-info'}`}>
                          {lic ? `${lic.demerit_points} Pts` : '0 Pts'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${lic && lic.status === 'VALID' ? 'badge-success' : 'badge-warning'}`}>
                          {lic ? lic.status : 'UNLICENSED'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="state-center">No driver records found.</td>
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
              <h3>Register New Driver</h3>
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleAddDriver} className="modal-body">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-control" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input type="date" className="form-control" required value={dob} onChange={(e) => setDob(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select className="form-control" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                    <option value="O+">O+</option>
                    <option value="A+">A+</option>
                    <option value="B+">B+</option>
                    <option value="AB+">AB+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="text" className="form-control" required value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email (Optional)</label>
                  <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Register Driver</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
