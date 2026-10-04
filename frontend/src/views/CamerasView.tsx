import React, { useState, useEffect } from 'react';
import { camerasApi, zonesApi } from '../api/services';
import type { Camera, TrafficZone } from '../types';
import { Camera as CameraIcon, Plus, X, MapPin, LayoutGrid } from 'lucide-react';
import { InteractiveMap } from '../components/InteractiveMap';

export const CamerasView: React.FC = () => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [zones, setZones] = useState<TrafficZone[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<'SPLIT' | 'GRID' | 'MAP'>('SPLIT');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [cameraCode, setCameraCode] = useState('');
  const [cameraType, setCameraType] = useState('ANPR');
  const [segmentId, setSegmentId] = useState(1);
  const [direction, setDirection] = useState('NORTH');
  const [ipAddress, setIpAddress] = useState('192.168.1.100');

  const fetchCameras = async () => {
    setLoading(true);
    try {
      const [camData, zoneData] = await Promise.all([
        camerasApi.list({ status: statusFilter ? statusFilter : undefined }),
        zonesApi.list().catch(() => [])
      ]);
      setCameras(camData);
      setZones(zoneData);
    } catch (err) {
      console.error('Error fetching cameras:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCameras();
  }, [statusFilter]);

  const handleAddCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await camerasApi.create({
        camera_code: cameraCode,
        camera_type: cameraType,
        segment_id: segmentId,
        direction,
        ip_address: ipAddress,
        status: 'ACTIVE'
      });
      setShowAddModal(false);
      fetchCameras();
      setCameraCode('');
    } catch (err) {
      alert('Failed to register camera node.');
    }
  };

  return (
    <div>
      <div className="table-card" style={{ marginBottom: '1.5rem' }}>
        <div className="table-toolbar">
          <div style={{ display: 'flex', gap: '0.75rem', flex: 1, alignItems: 'center' }}>
            <select
              className="search-input"
              style={{ width: '180px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Camera Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
              <option value="OFFLINE">OFFLINE</option>
            </select>

            <div style={{ display: 'flex', gap: '0.35rem', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <button
                className={`btn btn-sm ${viewMode === 'SPLIT' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setViewMode('SPLIT')}
                title="Split View (Map + Cards)"
              >
                Split
              </button>
              <button
                className={`btn btn-sm ${viewMode === 'MAP' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setViewMode('MAP')}
                title="Full Map View"
              >
                <MapPin size={14} /> Map
              </button>
              <button
                className={`btn btn-sm ${viewMode === 'GRID' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setViewMode('GRID')}
                title="Grid View"
              >
                <LayoutGrid size={14} /> Grid
              </button>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Deploy Camera Node
          </button>
        </div>
      </div>

      {loading ? (
        <div className="state-center">
          <div className="spinner" />
          <p>Polling camera nodes status...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {(viewMode === 'SPLIT' || viewMode === 'MAP') && (
            <div className="chart-card">
              <div className="chart-header">
                <h3 className="chart-title"><MapPin size={18} color="var(--accent-cyan)" /> ANPR Deployment GIS Map</h3>
                <span className="badge badge-success">{cameras.length} NODES TRACKED</span>
              </div>
              <InteractiveMap cameras={cameras} zones={zones} height={viewMode === 'MAP' ? '560px' : '360px'} />
            </div>
          )}

          {(viewMode === 'SPLIT' || viewMode === 'GRID') && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {cameras.length > 0 ? (
                cameras.map((c) => (
                  <div key={c.camera_id} className="stat-card" style={{ flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="stat-icon" style={{ color: '#00f2fe' }}><CameraIcon size={20} /></div>
                        <div>
                          <strong style={{ fontSize: '1rem' }}>{c.camera_code}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Segment #{c.segment_id} ({c.direction || 'NORTH'})</div>
                        </div>
                      </div>
                      <span className={`badge ${c.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                        {c.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                      <div>Type: <span style={{ color: '#fff' }}>{c.camera_type}</span></div>
                      <div>IP: <span style={{ color: 'var(--font-mono)' }}>{c.ip_address || '192.168.1.10'}</span></div>
                      <div>Installed: <span style={{ color: '#fff' }}>{c.installation_dt}</span></div>
                      <div>Health: <span style={{ color: 'var(--accent-emerald)' }}>99.8%</span></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="state-center" style={{ gridColumn: '1 / -1' }}>No camera nodes deployed yet.</div>
              )}
            </div>
          )}
        </div>
      )}


      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Deploy New Camera Node</h3>
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleAddCamera} className="modal-body">
              <div className="form-group">
                <label className="form-label">Camera Code</label>
                <input type="text" className="form-control" required placeholder="e.g. CAM-MUM-99" value={cameraCode} onChange={(e) => setCameraCode(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-control" value={cameraType} onChange={(e) => setCameraType(e.target.value)}>
                    <option value="ANPR">ANPR</option>
                    <option value="SPEED">SPEED RADAR</option>
                    <option value="RED_LIGHT">RED LIGHT</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Segment ID</label>
                  <input type="number" className="form-control" required value={segmentId} onChange={(e) => setSegmentId(Number(e.target.value))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Direction</label>
                  <select className="form-control" value={direction} onChange={(e) => setDirection(e.target.value)}>
                    <option value="NORTH">NORTH</option>
                    <option value="SOUTH">SOUTH</option>
                    <option value="EAST">EAST</option>
                    <option value="WEST">WEST</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">IP Address</label>
                  <input type="text" className="form-control" value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Deploy Node</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
