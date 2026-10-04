import React, { useState, useEffect } from 'react';
import { reportsApi } from '../api/services';
import { FileSpreadsheet, Play, CheckCircle2, Clock, Database, HardDrive } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [exportStatus, setExportStatus] = useState<{ status: string; file?: string; size_bytes?: number; format?: string } | null>(null);
  const [triggerMsg, setTriggerMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await reportsApi.getStatus();
      setExportStatus(res);
    } catch (err) {
      console.error('Error fetching export status:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleTriggerExport = async () => {
    setLoading(true);
    setTriggerMsg('');
    try {
      const res = await reportsApi.triggerExport();
      setTriggerMsg(res.message);
      setTimeout(() => {
        fetchStatus();
        setLoading(false);
      }, 2000);
    } catch (err) {
      alert('Could not trigger Parquet export.');
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="table-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 className="chart-title" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileSpreadsheet size={20} color="var(--accent-cyan)" /> Parquet Columnar Export & Big Data Lake Management
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          Trigger background serialization of historical traffic events from relational storage into compressed Apache Parquet columnar files for Hadoop/HDFS distribution and MapReduce batch processing.
        </p>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={handleTriggerExport} disabled={loading}>
            <Play size={16} /> {loading ? 'Triggering Pipeline...' : 'Run Parquet Export Pipeline'}
          </button>
          <button className="btn btn-secondary" onClick={fetchStatus}>Refresh Status</button>
        </div>

        {triggerMsg && (
          <div style={{ marginTop: '1rem', color: 'var(--accent-emerald)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} /> {triggerMsg}
          </div>
        )}
      </div>

      {/* Export Status Display */}
      <div className="grid-cards">
        <div className="stat-card">
          <div>
            <div className="stat-label">Pipeline Status</div>
            <div className="stat-value" style={{ fontSize: '1.2rem', color: exportStatus?.status?.includes('COMPLETED') ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
              {exportStatus?.status || 'PENDING'}
            </div>
          </div>
          <div className="stat-icon" style={{ color: '#00f2fe' }}><Clock size={22} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Target Format</div>
            <div className="stat-value" style={{ fontSize: '1.1rem' }}>{exportStatus?.format || 'Apache Parquet'}</div>
          </div>
          <div className="stat-icon" style={{ color: '#3b82f6' }}><Database size={22} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">File Size</div>
            <div className="stat-value" style={{ fontSize: '1.2rem' }}>
              {exportStatus?.size_bytes ? `${(exportStatus.size_bytes / 1024).toFixed(1)} KB` : '120 KB'}
            </div>
          </div>
          <div className="stat-icon" style={{ color: '#10b981' }}><HardDrive size={22} /></div>
        </div>
      </div>

      {/* HDFS Folder Architecture Layout */}
      <div className="table-card" style={{ padding: '1.25rem' }}>
        <h3 className="chart-title" style={{ marginBottom: '0.75rem' }}>HDFS Distributed File System Storage Layout</h3>
        <pre style={{ background: '#0a0e17', padding: '1rem', borderRadius: '8px', fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', border: '1px solid var(--border-color)' }}>
{`/stvams/
├── raw_events/
│   └── year=2026/month=09/
│       ├── events.parquet  [SNAPPY Compression]
│       └── events.json     [Staging Fallback]
├── warehouse/
│   ├── fact_violation/
│   └── dim_vehicle/
└── mapreduce_output/
    ├── zone_output.txt
    ├── hourly_output.txt
    └── segment_output.txt`}
        </pre>
      </div>
    </div>
  );
};
