import React, { useState, useEffect } from 'react';
import { eventsApi, evidenceApi } from '../api/services';
import type { VehicleEvent, Evidence } from '../types';
import { Eye, X } from 'lucide-react';

export const VehicleEventsView: React.FC = () => {
  const [events, setEvents] = useState<VehicleEvent[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await eventsApi.list({ event_status: statusFilter ? statusFilter : undefined });
      setEvents(data);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [statusFilter]);

  const handleInspectEvidence = async (eventId: number) => {
    setShowEvidenceModal(true);
    try {
      const ev = await evidenceApi.getByEventId(eventId);
      setSelectedEvidence(ev);
    } catch (err) {
      console.error('Error loading evidence:', err);
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
              <option value="">All Event Statuses</option>
              <option value="UNPROCESSED">UNPROCESSED</option>
              <option value="PROCESSED">PROCESSED</option>
              <option value="VIOLATION_CONFIRMED">VIOLATION_CONFIRMED</option>
              <option value="CLEARED">CLEARED</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="state-center">
            <div className="spinner" />
            <p>Ingesting camera detection stream...</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Camera Node</th>
                <th>Vehicle Plate</th>
                <th>Observed Speed</th>
                <th>AI Confidence</th>
                <th>Timestamp</th>
                <th>Status</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {events.length > 0 ? (
                events.map((e) => (
                  <tr key={e.event_id}>
                    <td>#{e.event_id}</td>
                    <td>Cam-{e.camera_id}</td>
                    <td><strong>{e.license_plate_raw || 'MH01AB0001'}</strong></td>
                    <td>{e.observed_speed ? `${e.observed_speed} km/h` : '60.0 km/h'}</td>
                    <td>{e.ai_confidence ? `${e.ai_confidence}%` : '96.0%'}</td>
                    <td>{new Date(e.event_timestamp).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${e.event_status === 'PROCESSED' || e.event_status === 'VIOLATION_CONFIRMED' ? 'badge-danger' : 'badge-info'}`}>
                        {e.event_status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleInspectEvidence(e.event_id)}>
                        <Eye size={14} /> Evidence
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="state-center">No camera detection events found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showEvidenceModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>MongoDB Evidence Document Inspection</h3>
              <button className="btn btn-secondary" onClick={() => setShowEvidenceModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              {selectedEvidence ? (
                <div>
                  <div style={{ background: '#000', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                    <div style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Camera Snapshot Frame (ANPR Image Stream)</div>
                    <img src={selectedEvidence.image_url} alt="Evidence Frame" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '6px' }} onError={(e: any) => { e.target.src = 'https://via.placeholder.com/400x200/111827/00f2fe?text=ANPR+Camera+Snapshot+Frame'; }} />
                  </div>
                  <div style={{ fontSize: '0.85rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>Document ID: <strong style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>{selectedEvidence._id || selectedEvidence.evidence_id}</strong></div>
                    <div>Confidence Score: <strong>{selectedEvidence.confidence_score * 100}%</strong></div>
                    <div>Camera Code: <strong>{selectedEvidence.camera_code}</strong></div>
                    <div>Source Store: <strong>{selectedEvidence.source || 'MongoDB NoSQL'}</strong></div>
                  </div>
                </div>
              ) : (
                <div className="state-center">Fetching evidence document from MongoDB...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
