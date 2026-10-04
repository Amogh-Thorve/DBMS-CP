import React, { useState } from 'react';
import { searchApi } from '../api/services';
import type { SearchResult } from '../types';
import { Search as SearchIcon } from 'lucide-react';

export const SearchView: React.FC = () => {
  const [q, setQ] = useState('');
  const [regNo, setRegNo] = useState('');
  const [status, setStatus] = useState('');
  const [minSpeed, setMinSpeed] = useState('');
  const [maxSpeed, setMaxSpeed] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExecuteSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await searchApi.search({
        q: q || undefined,
        status: status || undefined,
        registration_no: regNo || undefined,
        min_speed: minSpeed ? Number(minSpeed) : undefined,
        max_speed: maxSpeed ? Number(maxSpeed) : undefined,
      });
      setResult(res);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="table-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <h3 className="chart-title" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <SearchIcon size={18} color="var(--accent-cyan)" /> Elasticsearch & RDBMS Sub-second Multidimensional Search
        </h3>
        <form onSubmit={handleExecuteSearch}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search keyword (e.g., Overspeeding, South Mumbai, MH01AB0001)..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label className="form-label">Registration No</label>
              <input type="text" className="form-control" placeholder="MH01AB0001" value={regNo} onChange={(e) => setRegNo(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Any Status</option>
                <option value="FINE_GENERATED">FINE_GENERATED</option>
                <option value="PAID">PAID</option>
                <option value="APPEAL_APPROVED">APPEAL_APPROVED</option>
              </select>
            </div>
            <div>
              <label className="form-label">Min Speed (km/h)</label>
              <input type="number" className="form-control" placeholder="60" value={minSpeed} onChange={(e) => setMinSpeed(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Max Speed (km/h)</label>
              <input type="number" className="form-control" placeholder="150" value={maxSpeed} onChange={(e) => setMaxSpeed(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            <SearchIcon size={16} /> Execute Search Engine Query
          </button>
        </form>
      </div>

      {loading && (
        <div className="state-center">
          <div className="spinner" />
          <p>Querying Elasticsearch Inverted Index & RDBMS Database...</p>
        </div>
      )}

      {result && !loading && (
        <div className="table-card">
          <div className="table-toolbar">
            <div>
              <span className="badge badge-info" style={{ marginRight: '0.5rem' }}>Engine: {result.source}</span>
              <span>Total Hits Found: <strong style={{ color: 'var(--accent-cyan)' }}>{result.total}</strong></span>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Record ID</th>
                <th>Vehicle / Plate</th>
                <th>Type / Code</th>
                <th>Camera / Zone</th>
                <th>Status</th>
                <th>Details / Remarks</th>
              </tr>
            </thead>
            <tbody>
              {result.results.length > 0 ? (
                result.results.map((r, idx) => (
                  <tr key={r.violation_id || r.event_id || idx}>
                    <td>#{r.violation_id || r.event_id || idx + 1}</td>
                    <td><strong>{r.registration_no || r.license_plate_raw || `Vehicle #${r.vehicle_id}`}</strong></td>
                    <td>{r.type_id ? `Type #${r.type_id}` : 'ANPR Event'}</td>
                    <td>{r.camera_id ? `Cam-${r.camera_id}` : 'Zone Alpha'}</td>
                    <td>
                      <span className="badge badge-warning">{r.status || r.event_status || 'RECORDED'}</span>
                    </td>
                    <td>{r.remarks || 'Matches search criteria.'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="state-center">No search hits matching query filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
