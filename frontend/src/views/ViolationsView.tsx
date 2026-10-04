import React, { useState, useEffect } from 'react';
import { violationsApi, finesApi } from '../api/services';
import type { Violation, Fine } from '../types';
import { Plus, Eye, X } from 'lucide-react';

export const ViolationsView: React.FC = () => {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedViol, setSelectedViol] = useState<Violation | null>(null);
  const [selectedFine, setSelectedFine] = useState<Fine | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Registration form states
  const [vehicleId, setVehicleId] = useState(1);
  const [typeId, setTypeId] = useState(1);
  const [cameraId, setCameraId] = useState(1);
  const [remarks, setRemarks] = useState('Overspeeding capture on highway');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchViolationsAndFines = async () => {
    setLoading(true);
    try {
      const [vData, fData] = await Promise.all([
        violationsApi.list({ status: statusFilter ? statusFilter : undefined }),
        finesApi.list()
      ]);
      setViolations(vData);
      setFines(fData);
    } catch (err) {
      console.error('Error fetching violations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViolationsAndFines();
  }, [statusFilter]);

  const handleInspect = async (viol: Violation) => {
    setSelectedViol(viol);
    setShowDetailModal(true);
    const fine = fines.find((f) => f.violation_id === viol.violation_id);
    setSelectedFine(fine || null);
  };

  const handleCreateViolation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await violationsApi.create({
        vehicle_id: vehicleId,
        type_id: typeId,
        camera_id: cameraId,
        remarks
      });
      setShowAddModal(false);
      fetchViolationsAndFines();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to issue violation.');
    }
  };

  return (
    <div>
      <div className="table-card">
        <div className="table-toolbar">
          <div style={{ display: 'flex', gap: '0.75rem', flex: 1 }}>
            <select
              className="search-input"
              style={{ width: '220px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Violation Statuses</option>
              <option value="FINE_GENERATED">FINE_GENERATED</option>
              <option value="PAID">PAID</option>
              <option value="APPEAL_APPROVED">APPEAL_APPROVED</option>
              <option value="APPEAL_REJECTED">APPEAL_REJECTED</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Issue Violation & Fine
          </button>
        </div>

        {loading ? (
          <div className="state-center">
            <div className="spinner" />
            <p>Loading traffic violation records...</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Violation ID</th>
                <th>Vehicle ID</th>
                <th>Category Type</th>
                <th>Camera Node</th>
                <th>Violation Date</th>
                <th>Fine Amount</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {violations.length > 0 ? (
                violations.map((v) => {
                  const fine = fines.find((f) => f.violation_id === v.violation_id);
                  return (
                    <tr key={v.violation_id}>
                      <td>#{v.violation_id}</td>
                      <td>Vehicle #{v.vehicle_id}</td>
                      <td>Type #{v.type_id}</td>
                      <td>Cam-{v.camera_id}</td>
                      <td>{new Date(v.violation_dt).toLocaleString()}</td>
                      <td><strong>₹{fine ? fine.total_amount : '1500.00'}</strong></td>
                      <td>
                        <span className={`badge ${v.status === 'PAID' ? 'badge-success' : v.status === 'APPEAL_APPROVED' ? 'badge-warning' : 'badge-danger'}`}>
                          {v.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleInspect(v)}>
                          <Eye size={14} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="state-center">No traffic violation records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showDetailModal && selectedViol && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Violation Record #{selectedViol.violation_id}</h3>
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>Violation Status: <strong style={{ color: 'var(--accent-cyan)' }}>{selectedViol.status}</strong></div>
                <div>Issued Date: <strong>{new Date(selectedViol.violation_dt).toLocaleString()}</strong></div>
                <div>Vehicle ID: <strong>#{selectedViol.vehicle_id}</strong></div>
                <div>Camera ID: <strong>Cam-{selectedViol.camera_id}</strong></div>
                <div>Associated Fine ID: <strong>{selectedFine ? `#${selectedFine.fine_id}` : 'N/A'}</strong></div>
                <div>Fine Total Amount: <strong>₹{selectedFine ? selectedFine.total_amount : '1500.00'}</strong></div>
              </div>
              <div className="form-group">
                <label className="form-label">Officer Remarks</label>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                  {selectedViol.remarks || 'Standard automated ANPR speed violation capture.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Register Violation & Issue Fine</h3>
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateViolation} className="modal-body">
              {errorMsg && <div style={{ color: 'var(--accent-rose)', marginBottom: '1rem', fontSize: '0.85rem' }}>{errorMsg}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Vehicle ID</label>
                  <input type="number" className="form-control" required value={vehicleId} onChange={(e) => setVehicleId(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Violation Type ID</label>
                  <input type="number" className="form-control" required value={typeId} onChange={(e) => setTypeId(Number(e.target.value))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Camera Node ID</label>
                <input type="number" className="form-control" required value={cameraId} onChange={(e) => setCameraId(Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label className="form-label">Remarks</label>
                <input type="text" className="form-control" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Issue Violation & Fine</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
