import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../api/services';
import type { AnalyticsZone, AnalyticsType, AnalyticsCollection, AnalyticsRepeatOffender } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, Award, ShieldAlert, Zap } from 'lucide-react';

const COLORS = ['#00f2fe', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e'];

export const AnalyticsView: React.FC = () => {
  const [zones, setZones] = useState<AnalyticsZone[]>([]);
  const [types, setTypes] = useState<AnalyticsType[]>([]);
  const [collection, setCollection] = useState<AnalyticsCollection | null>(null);
  const [offenders, setOffenders] = useState<AnalyticsRepeatOffender[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [zData, tData, cData, oData] = await Promise.all([
          analyticsApi.getViolationsByZone(),
          analyticsApi.getViolationsByType(),
          analyticsApi.getFineCollection(),
          analyticsApi.getRepeatOffenders()
        ]);
        setZones(zData);
        setTypes(tData);
        setCollection(cData);
        setOffenders(oData);
      } catch (err) {
        console.error('Analytics load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="state-center">
        <div className="spinner" />
        <p>Executing Data Warehouse OLAP Aggregations...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Revenue Summary Row */}
      <div className="grid-cards" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div>
            <div className="stat-label">Total Levied Fines</div>
            <div className="stat-value">₹{(collection?.total_levied || 0).toLocaleString()}</div>
          </div>
          <div className="stat-icon" style={{ color: '#f43f5e' }}><TrendingUp size={22} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Total Collected Revenue</div>
            <div className="stat-value">₹{(collection?.total_collected || 0).toLocaleString()}</div>
          </div>
          <div className="stat-icon" style={{ color: '#10b981' }}><Award size={22} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Overall Collection Rate</div>
            <div className="stat-value">{collection?.collection_rate || '0%'}</div>
          </div>
          <div className="stat-icon" style={{ color: '#00f2fe' }}><Zap size={22} /></div>
        </div>
      </div>

      <div className="grid-charts">
        {/* Zone Hotspot Violations & Revenue */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Zone Traffic Hotspots & Revenue (₹)</h3>
          </div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zones}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="zone_code" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip contentStyle={{ background: '#111827', borderColor: '#374151' }} />
                <Bar dataKey="violations" fill="#00f2fe" name="Violations" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue (₹)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Violation Distribution by Category */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Violation Category Distribution</h3>
          </div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={types} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={95} label>
                  {types.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#111827', borderColor: '#374151' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Repeat Offenders Analytics Table */}
      <div className="table-card">
        <div className="table-toolbar">
          <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={18} color="var(--accent-rose)" /> Repeat Offenders & Driver Risk Scoring
          </h3>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Registration No</th>
              <th>Registered Owner</th>
              <th>Total Violation Count</th>
              <th>Calculated Risk Score</th>
              <th>Risk Tier</th>
            </tr>
          </thead>
          <tbody>
            {offenders.length > 0 ? (
              offenders.map((o, idx) => (
                <tr key={o.registration_no}>
                  <td>#{idx + 1}</td>
                  <td><strong>{o.registration_no}</strong></td>
                  <td>{o.owner_name}</td>
                  <td><strong style={{ color: 'var(--accent-rose)' }}>{o.violation_count} Violations</strong></td>
                  <td>{o.risk_score} / 100</td>
                  <td>
                    <span className={`badge ${o.risk_score >= 75 ? 'badge-danger' : 'badge-warning'}`}>
                      {o.risk_score >= 75 ? 'HIGH RISK' : 'MODERATE RISK'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="state-center">No repeat offender profiles recorded.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
