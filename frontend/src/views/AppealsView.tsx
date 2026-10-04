import React, { useState, useEffect } from 'react';
import { appealsApi } from '../api/services';
import type { Appeal } from '../types';
import { Check, X, Eye } from 'lucide-react';

export const AppealsView: React.FC = () => {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewerRemarks, setReviewerRemarks] = useState('Camera view obstruction verified.');
  const [reviewMsg, setReviewMsg] = useState('');

  const fetchAppeals = async () => {
    setLoading(true);
    try {
      const data = await appealsApi.list({
        status: statusFilter ? statusFilter : undefined
      });
      setAppeals(data);
    } catch (err) {
      console.error('Error fetching appeals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppeals();
  }, [statusFilter]);

  const handleOpenReview = (appeal: Appeal) => {
    setSelectedAppeal(appeal);
    setReviewMsg('');
    setShowReviewModal(true);
  };

  const handleAdjudicate = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!selectedAppeal) return;
    try {
      await appealsApi.review(selectedAppeal.appeal_id, {
        status: decision,
        reviewer_remarks: reviewerRemarks
      });
      setReviewMsg(`Appeal ${decision}! ${decision === 'APPROVED' ? 'Associated fine has been WAIVED.' : ''}`);
      setTimeout(() => {
        setShowReviewModal(false);
        fetchAppeals();
      }, 1500);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Adjudication failed.');
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
              <option value="">All Appeal Statuses</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="state-center">
            <div className="spinner" />
            <p>Loading violation appeals queue...</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Appeal ID</th>
                <th>Violation ID</th>
                <th>Appellant ID</th>
                <th>Filing Date</th>
                <th>Reason Summary</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {appeals.length > 0 ? (
                appeals.map((a) => (
                  <tr key={a.appeal_id}>
                    <td>#{a.appeal_id}</td>
                    <td>#Violation-{a.violation_id}</td>
                    <td>Owner #{a.appellant_id}</td>
                    <td>{new Date(a.appeal_date).toLocaleDateString()}</td>
                    <td><span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{a.reason}</span></td>
                    <td>
                      <span className={`badge ${a.status === 'APPROVED' ? 'badge-success' : a.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem' }} onClick={() => handleOpenReview(a)}>
                        <Eye size={14} /> Review
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="state-center">No appeal records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showReviewModal && selectedAppeal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Adjudicate Violation Appeal #{selectedAppeal.appeal_id}</h3>
              <button className="btn btn-secondary" onClick={() => setShowReviewModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              {reviewMsg && <div style={{ color: 'var(--accent-emerald)', marginBottom: '1rem', fontSize: '0.85rem' }}>{reviewMsg}</div>}
              
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
                <div>Violation ID: <strong>#{selectedAppeal.violation_id}</strong></div>
                <div>Appellant ID: <strong>Owner #{selectedAppeal.appellant_id}</strong></div>
                <div style={{ marginTop: '0.5rem' }}>
                  <span className="form-label">Appellant Reason:</span>
                  <p style={{ fontSize: '0.88rem', color: '#fff', background: 'rgba(255,255,255,0.05)', padding: '0.6rem', borderRadius: '6px' }}>
                    "{selectedAppeal.reason}"
                  </p>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reviewer Adjudication Remarks</label>
                <input type="text" className="form-control" value={reviewerRemarks} onChange={(e) => setReviewerRemarks(e.target.value)} />
              </div>

              {selectedAppeal.status === 'SUBMITTED' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-primary" onClick={() => handleAdjudicate('APPROVED')}>
                    <Check size={16} /> Approve & Waive Fine
                  </button>
                  <button type="button" className="btn btn-danger" onClick={() => handleAdjudicate('REJECTED')}>
                    <X size={16} /> Reject Appeal
                  </button>
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  This appeal has already been adjudicated as <strong style={{ color: 'var(--accent-cyan)' }}>{selectedAppeal.status}</strong>.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
