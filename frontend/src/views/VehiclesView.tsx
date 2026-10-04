import React, { useState, useEffect } from 'react';
import { vehiclesApi, ownersApi, violationsApi } from '../api/services';
import type { Vehicle, Owner, Violation } from '../types';
import { Plus, Eye, Trash2, X } from 'lucide-react';

export const VehiclesView: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [ownerInfo, setOwnerInfo] = useState<Owner | null>(null);
  const [history, setHistory] = useState<Violation[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Form fields for registration
  const [regNo, setRegNo] = useState('');
  const [ownerId, setOwnerId] = useState(1);
  const [vClass, setVClass] = useState('PRIVATE');
  const [make, setMake] = useState('Honda');
  const [model, setModel] = useState('City');
  const [fuelType, setFuelType] = useState('PETROL');
  const [mfgYear, setMfgYear] = useState(2023);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const data = await vehiclesApi.list({
        registration_no: searchTerm ? searchTerm : undefined,
        status: statusFilter ? statusFilter : undefined
      });
      setVehicles(data);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [searchTerm, statusFilter]);

  const handleInspect = async (veh: Vehicle) => {
    setSelectedVehicle(veh);
    setShowModal(true);
    try {
      const [ownRes, violRes] = await Promise.all([
        ownersApi.getById(veh.owner_id).catch(() => null),
        violationsApi.list({ vehicle_id: veh.vehicle_id }).catch(() => [])
      ]);
      setOwnerInfo(ownRes);
      setHistory(violRes);
    } catch (err) {
      console.error('Error fetching vehicle details:', err);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await vehiclesApi.create({
        registration_no: regNo.toUpperCase(),
        owner_id: ownerId,
        vehicle_class: vClass,
        make,
        model,
        fuel_type: fuelType,
        mfg_year: mfgYear
      });
      setShowAddModal(false);
      fetchVehicles();
      setRegNo('');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Registration failed.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to deregister this vehicle?')) {
      try {
        await vehiclesApi.delete(id);
        fetchVehicles();
      } catch (err) {
        alert('Could not delete vehicle.');
      }
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
              placeholder="Search by registration number (e.g. MH01AB0001)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="search-input"
              style={{ width: '150px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="SCRAPPED">SCRAPPED</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Register Vehicle
          </button>
        </div>

        {loading ? (
          <div className="state-center">
            <div className="spinner" />
            <p>Loading vehicle registry...</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Reg Number</th>
                <th>Owner ID</th>
                <th>Class</th>
                <th>Make & Model</th>
                <th>Fuel Type</th>
                <th>Year</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.length > 0 ? (
                vehicles.map((v) => (
                  <tr key={v.vehicle_id}>
                    <td><strong>{v.registration_no}</strong></td>
                    <td>#{v.owner_id}</td>
                    <td>{v.vehicle_class}</td>
                    <td>{v.make} {v.model}</td>
                    <td>{v.fuel_type}</td>
                    <td>{v.mfg_year}</td>
                    <td>
                      <span className={`badge ${v.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                        {v.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleInspect(v)}>
                          <Eye size={14} /> View
                        </button>
                        <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleDelete(v.vehicle_id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="state-center">No vehicle records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Vehicle Details Modal */}
      {showModal && selectedVehicle && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Vehicle Details: {selectedVehicle.registration_no}</h3>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <div className="stat-label">Registration No</div>
                  <div style={{ fontWeight: 700 }}>{selectedVehicle.registration_no}</div>
                </div>
                <div>
                  <div className="stat-label">Make & Model</div>
                  <div>{selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.mfg_year})</div>
                </div>
                <div>
                  <div className="stat-label">Owner Name</div>
                  <div>{ownerInfo?.full_name || `Owner #${selectedVehicle.owner_id}`}</div>
                </div>
                <div>
                  <div className="stat-label">Owner Contact</div>
                  <div>{ownerInfo?.phone || 'N/A'} ({ownerInfo?.email || 'N/A'})</div>
                </div>
              </div>

              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--accent-cyan)' }}>Violation History</h4>
              {history.length > 0 ? (
                <ul style={{ fontSize: '0.85rem', paddingLeft: '1.2rem' }}>
                  {history.map((vh) => (
                    <li key={vh.violation_id} style={{ marginBottom: '0.4rem' }}>
                      Violation #{vh.violation_id} - Date: {new Date(vh.violation_dt).toLocaleDateString()} ({vh.status})
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No violations recorded for this vehicle.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Register Vehicle Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Register New Vehicle</h3>
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleRegister} className="modal-body">
              {errorMsg && <div style={{ color: 'var(--accent-rose)', marginBottom: '1rem', fontSize: '0.85rem' }}>{errorMsg}</div>}
              <div className="form-group">
                <label className="form-label">Registration Number</label>
                <input type="text" className="form-control" required placeholder="e.g. MH01AB9999" value={regNo} onChange={(e) => setRegNo(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Owner ID</label>
                  <input type="number" className="form-control" required value={ownerId} onChange={(e) => setOwnerId(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Class</label>
                  <select className="form-control" value={vClass} onChange={(e) => setVClass(e.target.value)}>
                    <option value="PRIVATE">PRIVATE</option>
                    <option value="COMMERCIAL">COMMERCIAL</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Make</label>
                  <input type="text" className="form-control" required value={make} onChange={(e) => setMake(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Model</label>
                  <input type="text" className="form-control" required value={model} onChange={(e) => setModel(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Fuel Type</label>
                  <select className="form-control" value={fuelType} onChange={(e) => setFuelType(e.target.value)}>
                    <option value="PETROL">PETROL</option>
                    <option value="DIESEL">DIESEL</option>
                    <option value="ELECTRIC">ELECTRIC</option>
                    <option value="CNG">CNG</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Manufacturing Year</label>
                  <input type="number" className="form-control" value={mfgYear} onChange={(e) => setMfgYear(Number(e.target.value))} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Submit Registration</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
