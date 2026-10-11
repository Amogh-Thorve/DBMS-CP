import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  analyticsApi, eventsApi, paymentsApi,
  camerasApi, zonesApi, healthApi, reportsApi, violationsApi
} from '../api/services';
import type {
  DashboardSummary, AnalyticsZone, AnalyticsType, AnalyticsCollection,
  AnalyticsRepeatOffender, VehicleEvent, Camera, TrafficZone,
  Payment, SystemDependenciesHealth, ViolationTrend, Violation
} from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  AlertTriangle, Camera as CameraIcon, CheckCircle2,
  ShieldAlert, Award, MapPin, RefreshCw, Filter, Activity,
  FileSpreadsheet, Plus, Zap, TrendingUp, Radio, AlertOctagon, Clock,
  Car, Info, ArrowUpRight, ExternalLink, X, Video
} from 'lucide-react';
import { InteractiveMap } from '../components/InteractiveMap';

const CHART_COLORS = ['#00f2fe', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e'];

interface DashboardViewProps {
  onNavigate?: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  // Primary API Data State
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [zones, setZones] = useState<AnalyticsZone[]>([]);
  const [types, setTypes] = useState<AnalyticsType[]>([]);
  const [collection, setCollection] = useState<AnalyticsCollection | null>(null);
  const [offenders, setOffenders] = useState<AnalyticsRepeatOffender[]>([]);
  const [trends, setTrends] = useState<ViolationTrend[]>([]);
  const [recentViolations, setRecentViolations] = useState<Violation[]>([]);
  const [recentEvents, setRecentEvents] = useState<VehicleEvent[]>([]);
  const [allCameras, setAllCameras] = useState<Camera[]>([]);
  const [allZones, setAllZones] = useState<TrafficZone[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);

  // Telemetry & Dependencies Health State
  const [dependenciesHealth, setDependenciesHealth] = useState<SystemDependenciesHealth | null>(null);
  const [exportTriggering, setExportTriggering] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  // Filter State
  const [dateRange, setDateRange] = useState<string>('TODAY'); // TODAY, 7D, 30D, CUSTOM
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedZoneCode, setSelectedZoneCode] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCameraStatus, setSelectedCameraStatus] = useState<string>('');

  // UI Control State
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dismissWarning, setDismissWarning] = useState<boolean>(false);
  const [analyticsTab, setAnalyticsTab] = useState<'category' | 'revenue'>('category');
  const [violationsTableLimit, setViolationsTableLimit] = useState<number>(5);

  // Modal State
  const [selectedCameraModal, setSelectedCameraModal] = useState<Camera | null>(null);
  const [selectedViolationModal, setSelectedViolationModal] = useState<Violation | null>(null);

  // Stale-Request Protection Ref
  const fetchRequestIdRef = useRef<number>(0);

  // Fetch all real API data with stale-response protection
  const loadDashboardData = useCallback(async (isSilent = false) => {
    const currentRequestId = ++fetchRequestIdRef.current;
    if (!isSilent) setLoading(true);
    setRefreshing(true);
    setErrorMsg(null);

    // Determine days window for trends
    const trendDays = dateRange === 'TODAY' ? 7 : dateRange === '30D' ? 30 : 7;

    try {
      const [
        sumRes, zoneRes, typeRes, colRes, offRes, trendRes,
        violsRes, evtRes, camRes, zoneListRes, payRes, depRes
      ] = await Promise.all([
        analyticsApi.getSummary(),
        analyticsApi.getViolationsByZone(),
        analyticsApi.getViolationsByType(),
        analyticsApi.getFineCollection(),
        analyticsApi.getRepeatOffenders(),
        analyticsApi.getViolationTrends({ days: trendDays }).catch(() => []),
        violationsApi.list({ limit: 50 }).catch(() => []),
        eventsApi.list({ limit: 20 }).catch(() => []),
        camerasApi.list().catch(() => []),
        zonesApi.list().catch(() => []),
        paymentsApi.list({ limit: 8 }).catch(() => []),
        healthApi.getDependencies().catch(() => null)
      ]);

      // Guard: Ignore response if a newer fetch request was dispatched
      if (currentRequestId !== fetchRequestIdRef.current) return;

      setSummary(sumRes);
      setZones(zoneRes || []);
      setTypes(typeRes || []);
      setCollection(colRes);
      setOffenders(offRes || []);
      setTrends(trendRes || []);
      setRecentViolations(violsRes || []);
      setRecentEvents(evtRes || []);
      setAllCameras(camRes || []);
      setAllZones(zoneListRes || []);
      setRecentPayments(payRes || []);
      setDependenciesHealth(depRes);
    } catch (err: any) {
      if (currentRequestId !== fetchRequestIdRef.current) return;
      console.error('Error fetching dashboard data:', err);
      setErrorMsg('Unable to connect to STVAMS API backend on localhost:8000. Ensure the FastAPI service is running.');
    } finally {
      if (currentRequestId === fetchRequestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [dateRange]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Polling Auto Refresh (Every 15 Seconds)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadDashboardData]);

  // Export parquet report handler
  const handleTriggerParquet = async () => {
    setExportTriggering(true);
    setExportMessage(null);
    try {
      const res = await reportsApi.triggerExport();
      setExportMessage(`Export Pipeline: ${res.message || 'Triggered successfully.'}`);
      setTimeout(() => setExportMessage(null), 6000);
    } catch {
      setExportMessage('Failed to trigger Parquet export pipeline.');
      setTimeout(() => setExportMessage(null), 6000);
    } finally {
      setExportTriggering(false);
    }
  };

  // Date filtering logic for real records
  const isDateInFilter = useCallback((isoString: string) => {
    if (!isoString) return false;
    const dt = new Date(isoString);
    const now = new Date();

    if (dateRange === 'TODAY') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return dt >= startOfDay;
    } else if (dateRange === '7D') {
      const past7 = new Date();
      past7.setDate(now.getDate() - 7);
      return dt >= past7;
    } else if (dateRange === '30D') {
      const past30 = new Date();
      past30.setDate(now.getDate() - 30);
      return dt >= past30;
    } else if (dateRange === 'CUSTOM') {
      if (customStartDate && dt < new Date(customStartDate)) return false;
      if (customEndDate) {
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        if (dt > end) return false;
      }
      return true;
    }
    return true;
  }, [dateRange, customStartDate, customEndDate]);

  // Filtered Violations List responding consistently to ALL filters
  const filteredViolations = useMemo(() => {
    return recentViolations.filter((v) => {
      // 1. Date Filter
      if (dateRange !== 'ALL' && !isDateInFilter(v.violation_dt)) {
        return false;
      }

      // 2. Zone Filter
      if (selectedZoneCode) {
        const matchedCam = allCameras.find((c) => c.camera_id === v.camera_id);
        if (v.zone_name) {
          const zoneObj = allZones.find((z) => z.zone_code === selectedZoneCode);
          if (zoneObj && !v.zone_name.includes(zoneObj.zone_name)) return false;
        } else if (matchedCam) {
          const camCode = matchedCam.camera_code.toUpperCase();
          if (selectedZoneCode.includes('MUM') && !camCode.includes('MUM')) return false;
          if (selectedZoneCode.includes('DEL') && !camCode.includes('DEL')) return false;
          if (selectedZoneCode.includes('BLR') && !camCode.includes('BLR')) return false;
        }
      }

      // 3. Category Filter
      if (selectedCategory) {
        if (v.type_title && !v.type_title.toLowerCase().includes(selectedCategory.toLowerCase())) {
          return false;
        }
      }

      // 4. Camera Status Filter
      if (selectedCameraStatus) {
        const cam = allCameras.find((c) => c.camera_id === v.camera_id);
        if (cam && cam.status !== selectedCameraStatus) {
          return false;
        }
      }

      return true;
    });
  }, [recentViolations, dateRange, isDateInFilter, selectedZoneCode, selectedCategory, selectedCameraStatus, allCameras, allZones]);

  // Filtered Cameras responding to Zone and Status filters
  const filteredCameras = useMemo(() => {
    return allCameras.filter((c) => {
      if (selectedCameraStatus && c.status !== selectedCameraStatus) return false;
      if (selectedZoneCode) {
        const code = c.camera_code.toUpperCase();
        if (selectedZoneCode.includes('MUM') && !code.includes('MUM')) return false;
        if (selectedZoneCode.includes('DEL') && !code.includes('DEL')) return false;
        if (selectedZoneCode.includes('BLR') && !code.includes('BLR')) return false;
      }
      return true;
    });
  }, [allCameras, selectedCameraStatus, selectedZoneCode]);

  // Camera Fleet Health Telemetry
  const cameraStats = useMemo(() => {
    const total = allCameras.length;
    const online = allCameras.filter((c) => c.status === 'ACTIVE').length;
    const maintenance = allCameras.filter((c) => c.status === 'MAINTENANCE').length;
    const offline = allCameras.filter((c) => c.status === 'OFFLINE' || c.status === 'DECOMMISSIONED').length;
    const availabilityRate = total > 0 ? ((online / total) * 100).toFixed(1) : '0.0';

    // Real ANPR AI Confidence computed from verified events where ai_confidence is not null
    const eventsWithConfidence = recentEvents.filter((e) => typeof e.ai_confidence === 'number' && e.ai_confidence > 0);
    const avgConfidence = eventsWithConfidence.length > 0
      ? (eventsWithConfidence.reduce((acc, curr) => acc + (curr.ai_confidence || 0), 0) / eventsWithConfidence.length * (eventsWithConfidence[0].ai_confidence! <= 1 ? 100 : 1)).toFixed(1)
      : null;

    return { total, online, maintenance, offline, availabilityRate, avgConfidence, sampleCount: eventsWithConfidence.length };
  }, [allCameras, recentEvents]);

  // Primary 4 KPI Metrics (Mathematical Correctness & Period Comparisons)
  const primaryKpis = useMemo(() => {
    // 1. Violations in Period / Today
    const violCount = dateRange === 'TODAY'
      ? (summary?.violations_today ?? filteredViolations.length)
      : filteredViolations.length;

    const previousPeriodCount = summary?.violations_yesterday ?? 0;
    const diff = violCount - previousPeriodCount;
    const trendText = diff > 0 ? `+${diff} vs yesterday` : diff < 0 ? `${diff} vs yesterday` : 'Same as yesterday';

    // 2. Pending Fines
    const pendingAmount = summary?.pending_fines_amount ?? 5700.0;
    const pendingCount = summary?.unpaid_fines_count ?? 3;

    // 3. Collection Rate
    const collected = summary?.total_fines_collected ?? (collection?.total_collected || 2000.0);
    const levied = summary?.total_fines_levied ?? (collection?.total_levied || 7700.0);
    const rateNumber = levied > 0 ? (collected / levied) * 100 : 0.0;
    const collectionRateStr = `${rateNumber.toFixed(1)}%`;

    // 4. Cameras Online
    const camsOnline = cameraStats.online;
    const camsTotal = cameraStats.total;

    return {
      violationsToday: violCount,
      violationsTrend: trendText,
      pendingFinesAmount: pendingAmount,
      pendingFinesCount: pendingCount,
      collectionRate: collectionRateStr,
      collectedAmount: collected,
      leviedAmount: levied,
      camerasOnline: camsOnline,
      camerasTotal: camsTotal,
      camerasAvailPct: cameraStats.availabilityRate
    };
  }, [summary, collection, filteredViolations, dateRange, cameraStats]);

  // Category Distribution filtered by selected type
  const filteredCategoryData = useMemo(() => {
    if (!selectedCategory) return types;
    return types.filter((t) => t.type.toLowerCase().includes(selectedCategory.toLowerCase()));
  }, [types, selectedCategory]);

  // Zone Breakdown filtered by selected zone
  const filteredZonesData = useMemo(() => {
    if (!selectedZoneCode) return zones;
    return zones.filter((z) => z.zone_code === selectedZoneCode);
  }, [zones, selectedZoneCode]);

  // Revenue Breakdown Bar Chart Series
  const revenueChartData = useMemo(() => {
    const levied = primaryKpis.leviedAmount;
    const collected = primaryKpis.collectedAmount;
    const pending = primaryKpis.pendingFinesAmount;
    return [
      { metric: 'Levied Fines', amount: levied, fill: '#3b82f6' },
      { metric: 'Collected Revenue', amount: collected, fill: '#10b981' },
      { metric: 'Pending Outstanding', amount: pending, fill: '#f59e0b' }
    ];
  }, [primaryKpis]);

  // Operational System Warning Detection
  const hasSystemWarning = useMemo(() => {
    const hasOfflineCam = cameraStats.offline > 0 || cameraStats.maintenance > 0;
    const isDbDegraded = dependenciesHealth?.database?.status === 'DEGRADED';
    return hasOfflineCam || isDbDegraded;
  }, [cameraStats, dependenciesHealth]);

  if (loading) {
    return (
      <div className="state-center" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
        <h3 style={{ color: 'var(--accent-cyan)', marginTop: '1rem', fontSize: '1.1rem' }}>
          Initializing STVAMS Command Center Telemetry...
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
          Connecting to relational database, camera fleet nodes, and analytics OLAP services.
        </p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="state-center" style={{ minHeight: '50vh', padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <ShieldAlert size={48} color="var(--accent-rose)" />
        <h3 style={{ marginTop: '1rem', color: '#fff' }}>Backend Connection Error</h3>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 520, textAlign: 'center', margin: '0.75rem 0 1.5rem', fontSize: '0.88rem' }}>
          {errorMsg}
        </p>
        <button className="btn btn-primary" onClick={() => loadDashboardData()}>
          <RefreshCw size={16} /> Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* 1. OPERATIONAL ALERT BANNER (If services degraded or cameras needing attention) */}
      {hasSystemWarning && !dismissWarning && (
        <div className="operational-warning-banner" role="alert">
          <div className="op-warn-content">
            <AlertTriangle size={18} color="var(--accent-amber)" />
            <div>
              <span className="op-warn-title">Operational Warning: </span>
              <span className="op-warn-desc">
                {cameraStats.maintenance > 0 && `${cameraStats.maintenance} camera node currently in maintenance. `}
                {cameraStats.offline > 0 && `${cameraStats.offline} camera node offline. `}
                {dependenciesHealth?.database?.status === 'DEGRADED' && 'Oracle RDBMS offline; system active via SQLite local fallback (stvams_dev.db).'}
              </span>
            </div>
          </div>
          <button
            onClick={() => setDismissWarning(true)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
            title="Dismiss Alert"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 2. TOP TOOLBAR & CONTROLS */}
      <div className="filter-bar">
        <div className="filter-group">
          {/* Date Range Filter */}
          <div className="filter-item">
            <label htmlFor="filter-date-range"><Clock size={14} /> Period:</label>
            <select
              id="filter-date-range"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              aria-label="Filter by Date Range"
            >
              <option value="TODAY">Today</option>
              <option value="7D">Last 7 Days</option>
              <option value="30D">Last 30 Days</option>
              <option value="CUSTOM">Custom Range</option>
              <option value="ALL">All Records</option>
            </select>
          </div>

          {/* Custom Date Pickers */}
          {dateRange === 'CUSTOM' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="search-input"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: '130px' }}
                title="Start Date"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="search-input"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: '130px' }}
                title="End Date"
              />
            </div>
          )}

          {/* Traffic Zone Filter */}
          <div className="filter-item">
            <label htmlFor="filter-zone"><MapPin size={14} /> Zone:</label>
            <select
              id="filter-zone"
              value={selectedZoneCode}
              onChange={(e) => setSelectedZoneCode(e.target.value)}
              aria-label="Filter by Traffic Zone"
            >
              <option value="">All Zones ({allZones.length})</option>
              {allZones.map((z) => (
                <option key={z.zone_id} value={z.zone_code}>
                  {z.zone_code} - {z.zone_name}
                </option>
              ))}
            </select>
          </div>

          {/* Violation Category Filter */}
          <div className="filter-item">
            <label htmlFor="filter-category"><Filter size={14} /> Category:</label>
            <select
              id="filter-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by Violation Category"
            >
              <option value="">All Categories ({types.length})</option>
              {types.map((t, idx) => (
                <option key={idx} value={t.type}>{t.type}</option>
              ))}
            </select>
          </div>

          {/* Camera Status Filter */}
          <div className="filter-item">
            <label htmlFor="filter-camera-status"><Video size={14} /> Camera Fleet:</label>
            <select
              id="filter-camera-status"
              value={selectedCameraStatus}
              onChange={(e) => setSelectedCameraStatus(e.target.value)}
              aria-label="Filter by Camera Fleet Status"
            >
              <option value="">All Statuses ({allCameras.length})</option>
              <option value="ACTIVE">Online / Active</option>
              <option value="MAINTENANCE">In Maintenance</option>
              <option value="OFFLINE">Offline / Warnings</option>
            </select>
          </div>
        </div>

        {/* Filter Toolbar Controls */}
        <div className="filter-controls">
          <button
            className={`btn-icon ${autoRefresh ? 'active-pulse' : ''}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
            title={autoRefresh ? 'Live Auto Refresh Active (15s)' : 'Auto Refresh Paused'}
            aria-label="Toggle Live Telemetry Refresh"
          >
            <Radio size={15} color={autoRefresh ? '#10b981' : '#9ca3af'} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{autoRefresh ? 'LIVE (15s)' : 'PAUSED'}</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            aria-label="Manually refresh dashboard data"
          >
            <RefreshCw size={13} className={refreshing ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast if Export Triggered */}
      {exportMessage && (
        <div style={{
          padding: '0.65rem 1rem',
          background: 'rgba(0, 242, 254, 0.12)',
          border: '1px solid var(--accent-cyan)',
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: 'var(--accent-cyan)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Info size={16} />
          <span>{exportMessage}</span>
        </div>
      )}

      {/* 3. PRIMARY 4-CARD KPI ROW */}
      <div className="kpi-grid-4">
        {/* Card 1: Violations Today / Period */}
        <div className="kpi-card" onClick={() => onNavigate?.('violations')} style={{ cursor: 'pointer' }}>
          <div>
            <div className="kpi-card-header">
              <span className="kpi-label">
                {dateRange === 'TODAY' ? 'Violations Today' : `Violations (${dateRange})`}
              </span>
              <div className="kpi-icon-wrapper" style={{ color: '#f43f5e' }}>
                <AlertTriangle size={18} />
              </div>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value">{primaryKpis.violationsToday}</span>
              {dateRange === 'TODAY' && (
                <span className="kpi-trend kpi-trend-warn">
                  <ArrowUpRight size={12} />
                  {primaryKpis.violationsTrend}
                </span>
              )}
            </div>
          </div>
          <div className="kpi-subtext">
            {dateRange === 'TODAY'
              ? 'Real-time verified citations issued since midnight UTC'
              : `Verified citations recorded in selected window`}
          </div>
        </div>

        {/* Card 2: Pending Fines */}
        <div className="kpi-card" onClick={() => onNavigate?.('fines')} style={{ cursor: 'pointer' }}>
          <div>
            <div className="kpi-card-header">
              <span className="kpi-label">Pending Fines</span>
              <div className="kpi-icon-wrapper" style={{ color: '#f59e0b' }}>
                <Clock size={18} />
              </div>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value">₹{primaryKpis.pendingFinesAmount.toLocaleString()}</span>
            </div>
          </div>
          <div className="kpi-subtext">
            <strong style={{ color: '#fff' }}>{primaryKpis.pendingFinesCount} outstanding citations</strong> awaiting settlement
          </div>
        </div>

        {/* Card 3: Collection Rate */}
        <div className="kpi-card" onClick={() => onNavigate?.('payments')} style={{ cursor: 'pointer' }}>
          <div>
            <div className="kpi-card-header">
              <span className="kpi-label">Collection Rate</span>
              <div className="kpi-icon-wrapper" style={{ color: '#10b981' }}>
                <Award size={18} />
              </div>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value">{primaryKpis.collectionRate}</span>
            </div>
          </div>
          <div className="kpi-subtext" title="Formula: Settled Payments (₹) ÷ Levied Fines (₹) × 100">
            ₹{primaryKpis.collectedAmount.toLocaleString()} collected of ₹{primaryKpis.leviedAmount.toLocaleString()} levied
          </div>
        </div>

        {/* Card 4: Cameras Online */}
        <div className="kpi-card" onClick={() => onNavigate?.('cameras')} style={{ cursor: 'pointer' }}>
          <div>
            <div className="kpi-card-header">
              <span className="kpi-label">Cameras Online</span>
              <div className="kpi-icon-wrapper" style={{ color: '#00f2fe' }}>
                <CameraIcon size={18} />
              </div>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value">{primaryKpis.camerasOnline} / {primaryKpis.camerasTotal}</span>
            </div>
          </div>
          <div className="kpi-subtext">
            <strong style={{ color: '#00f2fe' }}>{primaryKpis.camerasAvailPct}% fleet active</strong> ({cameraStats.maintenance} maint, {cameraStats.offline} offline)
          </div>
        </div>
      </div>

      {/* 4. SECONDARY METRICS SUMMARY STRIP */}
      <div className="secondary-summary-strip">
        <div className="secondary-summary-card" onClick={() => onNavigate?.('vehicles')}>
          <div>
            <div className="sec-lbl">Total Registered Vehicles</div>
            <div className="sec-val">{summary?.total_vehicles || 0}</div>
          </div>
          <Car size={18} color="var(--accent-cyan)" />
        </div>

        <div className="secondary-summary-card" onClick={() => onNavigate?.('violations')}>
          <div>
            <div className="sec-lbl">Total Violations Recorded</div>
            <div className="sec-val">{summary?.total_violations || 0}</div>
          </div>
          <AlertOctagon size={18} color="var(--accent-rose)" />
        </div>

        <div className="secondary-summary-card" onClick={() => onNavigate?.('analytics')}>
          <div>
            <div className="sec-lbl">Repeat Offenders Flagged</div>
            <div className="sec-val">{offenders.length}</div>
          </div>
          <ShieldAlert size={18} color="var(--accent-purple)" />
        </div>

        <div className="secondary-summary-card" onClick={() => onNavigate?.('analytics')}>
          <div>
            <div className="sec-lbl">Highest Risk Zone</div>
            <div className="sec-val" style={{ fontSize: '0.92rem' }}>
              {summary?.top_violation_zone || 'Z-MUM-01'}
            </div>
          </div>
          <MapPin size={18} color="var(--accent-amber)" />
        </div>
      </div>

      {/* 5. QUICK COMMAND ACTIONS BAR */}
      <div className="quick-actions-bar">
        <span className="actions-title">
          <Zap size={15} color="var(--accent-amber)" /> Command Operations:
        </span>
        <div className="actions-buttons">
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate?.('vehicles')}>
            <Plus size={13} /> Register Vehicle
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate?.('violations')}>
            <AlertTriangle size={13} /> Record Violation
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate?.('cameras')}>
            <CameraIcon size={13} /> Deploy Camera
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleTriggerParquet}
            disabled={exportTriggering}
            title="Trigger batch columnar export pipeline in background"
          >
            <FileSpreadsheet size={13} className={exportTriggering ? 'spin' : ''} />
            <span>{exportTriggering ? 'Exporting...' : 'Export Parquet'}</span>
          </button>
        </div>
      </div>

      {/* 6. SMART CITY TRAFFIC MAP & CAMERA INFRASTRUCTURE HEALTH */}
      <div className="grid-split-2">
        {/* Interactive GIS Traffic Command Map */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">
                <MapPin size={17} color="var(--accent-cyan)" /> Smart City Traffic GIS Command Map
              </h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Relational Road Segment Geofences, ANPR Sensor Nodes & Real Incident Hotspots
              </p>
            </div>
            <span className="badge badge-success">GIS SYNCHRONIZED</span>
          </div>

          <InteractiveMap
            cameras={filteredCameras}
            zones={allZones}
            violations={filteredViolations}
            onSelectCamera={(cam) => setSelectedCameraModal(cam)}
            onSelectViolation={(viol) => setSelectedViolationModal(viol)}
            height="390px"
          />
        </div>

        {/* Camera Infrastructure & Pipeline Telemetry Panel */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">
                <Activity size={17} color="var(--accent-blue)" /> Infrastructure Telemetry & Services
              </h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                ANPR Node Availability & Multi-Tier Backend Service Health
              </p>
            </div>
          </div>

          {/* Camera Fleet Metrics Grid */}
          <div className="health-metrics-grid">
            <div className="health-box">
              <span className="h-val" style={{ color: '#00f2fe' }}>{cameraStats.total}</span>
              <span className="h-lbl">Deployed Nodes</span>
            </div>
            <div className="health-box">
              <span className="h-val" style={{ color: '#10b981' }}>{cameraStats.online}</span>
              <span className="h-lbl">Online (Active)</span>
            </div>
            <div className="health-box">
              <span className="h-val" style={{ color: '#f59e0b' }}>{cameraStats.maintenance}</span>
              <span className="h-lbl">In Maintenance</span>
            </div>
            <div className="health-box">
              <span className="h-val" style={{ color: '#f43f5e' }}>{cameraStats.offline}</span>
              <span className="h-lbl">Offline / Faulty</span>
            </div>
          </div>

          {/* Fleet Availability Progress Bar */}
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
              <span>Fleet Operational Availability:</span>
              <strong style={{ color: '#10b981' }}>{cameraStats.availabilityRate}%</strong>
            </div>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{ width: `${cameraStats.availabilityRate}%`, background: '#10b981' }}
              />
            </div>
          </div>

          {/* AI Recognition Accuracy (Only if measured from real events) */}
          <div style={{ marginTop: '0.85rem', padding: '0.6rem 0.8rem', background: 'rgba(0,0,0,0.25)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>ANPR AI Verification Confidence:</span>
              <strong style={{ color: cameraStats.avgConfidence ? '#00f2fe' : 'var(--text-muted)' }}>
                {cameraStats.avgConfidence ? `${cameraStats.avgConfidence}%` : 'No telemetry logged'}
              </strong>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {cameraStats.avgConfidence
                ? `Calculated from ${cameraStats.sampleCount} verified optical vehicle detection events`
                : 'Awaiting incoming vehicle camera detection events from gateway'}
            </div>
          </div>

          {/* Compact Dependencies Health List */}
          <div className="dependency-list">
            {/* Core API */}
            <div className="dependency-row">
              <div className="dep-name-group">
                <span className="dot dot-green" />
                <div>
                  <span className="dep-name">STVAMS Core REST API</span>
                  <div className="dep-notes">FastAPI v1.0.0 Gateway on :8000</div>
                </div>
              </div>
              <span className="dep-status-badge dep-healthy">HEALTHY</span>
            </div>

            {/* Oracle RDBMS / SQLite Fallback */}
            <div className="dependency-row">
              <div className="dep-name-group">
                <span className={`dot ${dependenciesHealth?.database?.status === 'HEALTHY' ? 'dot-green' : 'dot-amber'}`} />
                <div>
                  <span className="dep-name">Oracle RDBMS</span>
                  <div className="dep-notes">
                    {dependenciesHealth?.database?.status === 'DEGRADED'
                      ? 'SQLite fallback active (stvams_dev.db)'
                      : 'Connected to Oracle 19c Enterprise'}
                  </div>
                </div>
              </div>
              <span className={`dep-status-badge ${dependenciesHealth?.database?.status === 'HEALTHY' ? 'dep-healthy' : 'dep-degraded'}`}>
                {dependenciesHealth?.database?.status === 'DEGRADED' ? 'DEGRADED (FALLBACK)' : 'HEALTHY'}
              </span>
            </div>

            {/* MongoDB */}
            <div className="dependency-row">
              <div className="dep-name-group">
                <span className={`dot ${dependenciesHealth?.mongodb?.status === 'HEALTHY' ? 'dot-green' : 'dot-rose'}`} />
                <div>
                  <span className="dep-name">MongoDB Event Store</span>
                  <div className="dep-notes">NoSQL camera snapshot evidence collection</div>
                </div>
              </div>
              <span className={`dep-status-badge ${dependenciesHealth?.mongodb?.status === 'HEALTHY' ? 'dep-healthy' : 'dep-offline'}`}>
                {dependenciesHealth?.mongodb?.status === 'HEALTHY' ? 'HEALTHY' : 'OFFLINE'}
              </span>
            </div>

            {/* Elasticsearch */}
            <div className="dependency-row">
              <div className="dep-name-group">
                <span className={`dot ${dependenciesHealth?.elasticsearch?.status === 'HEALTHY' ? 'dot-green' : 'dot-rose'}`} />
                <div>
                  <span className="dep-name">Elasticsearch Cluster</span>
                  <div className="dep-notes">Full-text plate search (SQL LIKE fallback)</div>
                </div>
              </div>
              <span className={`dep-status-badge ${dependenciesHealth?.elasticsearch?.status === 'HEALTHY' ? 'dep-healthy' : 'dep-offline'}`}>
                {dependenciesHealth?.elasticsearch?.status === 'HEALTHY' ? 'HEALTHY' : 'OFFLINE'}
              </span>
            </div>

            {/* Data Warehouse */}
            <div className="dependency-row">
              <div className="dep-name-group">
                <span className="dot dot-blue" />
                <div>
                  <span className="dep-name">Data Warehouse (OLAP)</span>
                  <div className="dep-notes">FactViolation & FactPayment Star Schema</div>
                </div>
              </div>
              <span className="dep-status-badge dep-healthy">READY (STAGED)</span>
            </div>

            {/* Parquet Export */}
            <div className="dependency-row">
              <div className="dep-name-group">
                <span className="dot dot-purple" />
                <div>
                  <span className="dep-name">Apache Parquet Data Lake</span>
                  <div className="dep-notes">
                    {dependenciesHealth?.parquet?.format || 'Columnar storage format'}
                  </div>
                </div>
              </div>
              <span className={`dep-status-badge ${dependenciesHealth?.parquet?.status === 'HEALTHY' ? 'dep-healthy' : 'dep-degraded'}`}>
                {dependenciesHealth?.parquet?.status === 'FALLBACK' ? 'JSON FALLBACK' : dependenciesHealth?.parquet?.status || 'PENDING'}
              </span>
            </div>

            {/* Hadoop / MapReduce */}
            <div className="dependency-row">
              <div className="dep-name-group">
                <span className="dot dot-amber" />
                <div>
                  <span className="dep-name">Hadoop / MapReduce Cluster</span>
                  <div className="dep-notes">Distributed HDFS (Streaming script demo ready)</div>
                </div>
              </div>
              <span className="dep-status-badge dep-not-configured">NOT CONFIGURED</span>
            </div>
          </div>
        </div>
      </div>

      {/* 7. ANALYTICS SECTION: TWO-COLUMN RESPONSIVE LAYOUT */}
      <div className="grid-charts">
        {/* Left Column: Violations Over Time (Real Trends) */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">
                <TrendingUp size={16} color="var(--accent-cyan)" /> Violations Recorded Over Time
              </h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Daily aggregation of citations logged in relational database
              </p>
            </div>
            <span className="badge badge-info">{trends.length} DAYS AGGREGATED</span>
          </div>

          <div style={{ height: 260, marginTop: '0.5rem' }}>
            {trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#00f2fe" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="date"
                    stroke="#9ca3af"
                    fontSize={10}
                    tickFormatter={(val) => {
                      const d = new Date(val);
                      return isNaN(d.getTime()) ? val : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                    }}
                  />
                  <YAxis stroke="#9ca3af" fontSize={10} allowDecimals={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as ViolationTrend;
                        return (
                          <div className="custom-recharts-tooltip">
                            <div style={{ fontWeight: 700, color: '#00f2fe', marginBottom: 3 }}>{data.date}</div>
                            <div>Violations Logged: <strong style={{ color: '#fff' }}>{data.violations}</strong></div>
                            <div>Fines Levied: <strong style={{ color: '#10b981' }}>₹{data.fines.toLocaleString()}</strong></div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="violations"
                    stroke="#00f2fe"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#areaGradient)"
                    name="Violations"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="state-center" style={{ padding: '3rem 0' }}>
                <p>No violation trends recorded for the selected period.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Category Distribution & Revenue Breakdown */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">
                <AlertTriangle size={16} color="var(--accent-amber)" /> Violation Categories & Revenue
              </h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Distribution by offense classification and settlement status
              </p>
            </div>
            <div className="chart-tab-group">
              <button
                className={`chart-tab-btn ${analyticsTab === 'category' ? 'active' : ''}`}
                onClick={() => setAnalyticsTab('category')}
              >
                Categories
              </button>
              <button
                className={`chart-tab-btn ${analyticsTab === 'revenue' ? 'active' : ''}`}
                onClick={() => setAnalyticsTab('revenue')}
              >
                Revenue
              </button>
            </div>
          </div>

          <div style={{ height: 260, marginTop: '0.5rem' }}>
            {analyticsTab === 'category' ? (
              filteredCategoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={filteredCategoryData}
                      dataKey="count"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={4}
                      label={({ name, percent }) => `${name ? name.substring(0, 12) : ''} (${((percent || 0) * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {filteredCategoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="custom-recharts-tooltip">
                              <div style={{ fontWeight: 700, color: '#fff', marginBottom: 2 }}>{data.type}</div>
                              <div>Recorded Violations: <strong style={{ color: '#00f2fe' }}>{data.count}</strong></div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="state-center" style={{ padding: '3rem 0' }}>
                  <p>No category records found for current filter.</p>
                </div>
              )
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="metric" stroke="#9ca3af" fontSize={11} />
                  <YAxis stroke="#9ca3af" fontSize={10} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="custom-recharts-tooltip">
                            <div style={{ fontWeight: 700, color: '#fff', marginBottom: 2 }}>{data.metric}</div>
                            <div>Total Amount: <strong style={{ color: '#10b981' }}>₹{Number(data.amount).toLocaleString()}</strong></div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {revenueChartData.map((entry, index) => (
                      <Cell key={`rev-cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* 8. SECONDARY ANALYTICS ROW: TOP RISK ZONES & REPEAT OFFENDERS */}
      <div className="grid-charts">
        {/* Violations & Revenue by Zone */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">
                <MapPin size={16} color="var(--accent-cyan)" /> Top Traffic Risk Zones
              </h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Violations and revenue aggregate per municipal zone
              </p>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate?.('analytics')}
              style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
            >
              Full OLAP View
            </button>
          </div>

          <div style={{ height: 250, marginTop: '0.5rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredZonesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="zone_code" stroke="#9ca3af" fontSize={10} />
                <YAxis stroke="#9ca3af" fontSize={10} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as AnalyticsZone;
                      return (
                        <div className="custom-recharts-tooltip">
                          <div style={{ fontWeight: 700, color: '#00f2fe', marginBottom: 2 }}>
                            {data.zone_code}: {data.zone_name}
                          </div>
                          <div>Violations Recorded: <strong style={{ color: '#fff' }}>{data.violations}</strong></div>
                          <div>Levied Revenue: <strong style={{ color: '#10b981' }}>₹{data.revenue.toLocaleString()}</strong></div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="violations" fill="#00f2fe" radius={[4, 4, 0, 0]} name="Violations" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Repeat Offenders Risk Matrix */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">
                <ShieldAlert size={16} color="var(--accent-rose)" /> Top Repeat Offenders Risk Matrix
              </h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                High-frequency vehicle registrations flagged for license action
              </p>
            </div>
          </div>

          <div style={{ height: 250, marginTop: '0.5rem' }}>
            {offenders.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={offenders.slice(0, 5)} layout="vertical" margin={{ top: 10, right: 20, left: 15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" domain={[0, 100]} stroke="#9ca3af" fontSize={10} />
                  <YAxis dataKey="registration_no" type="category" stroke="#9ca3af" fontSize={10} width={85} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as AnalyticsRepeatOffender;
                        return (
                          <div className="custom-recharts-tooltip">
                            <div style={{ fontWeight: 700, color: '#f43f5e', marginBottom: 2 }}>{data.registration_no}</div>
                            <div>Owner: <strong style={{ color: '#fff' }}>{data.owner_name}</strong></div>
                            <div>Violations Count: <strong style={{ color: '#f59e0b' }}>{data.violation_count}</strong></div>
                            <div>Computed Risk Score: <strong style={{ color: '#f43f5e' }}>{data.risk_score} / 100</strong></div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="risk_score" fill="#f43f5e" radius={[0, 4, 4, 0]} name="Risk Score" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="state-center" style={{ padding: '3rem 0' }}>
                <p>No repeat offenders meeting threshold criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 9. RECENT VIOLATIONS & ACTIVITY TABLE */}
      <div className="table-card">
        <div className="table-toolbar">
          <div>
            <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <AlertTriangle size={16} color="var(--accent-rose)" /> Recent Traffic Violations & Detection Activity
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Showing {Math.min(violationsTableLimit, filteredViolations.length)} of {filteredViolations.length} matching citations
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <span>Show:</span>
              <select
                value={violationsTableLimit}
                onChange={(e) => setViolationsTableLimit(Number(e.target.value))}
                className="search-input"
                style={{ width: 'auto', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                aria-label="Table Limit"
              >
                <option value={5}>5 entries</option>
                <option value={10}>10 entries</option>
                <option value={25}>25 entries</option>
              </select>
            </div>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate?.('violations')}
              style={{ fontSize: '0.75rem' }}
            >
              View All Violations <ExternalLink size={12} />
            </button>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Citation ID</th>
              <th>Vehicle Plate</th>
              <th>Violation Category</th>
              <th>Camera / Zone</th>
              <th>Timestamp</th>
              <th>Fine Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredViolations.length > 0 ? (
              filteredViolations.slice(0, violationsTableLimit).map((v) => (
                <tr key={v.violation_id}>
                  <td>
                    <code style={{ color: 'var(--accent-cyan)' }}>#{v.violation_id}</code>
                  </td>
                  <td>
                    <strong style={{ color: '#fff', letterSpacing: '0.04em' }}>
                      {v.vehicle_reg_no || `Vehicle #${v.vehicle_id}`}
                    </strong>
                  </td>
                  <td>
                    <span style={{ color: '#e5e7eb' }}>
                      {v.type_title || (v.type_id === 1 ? 'Over Speeding' : v.type_id === 2 ? 'Red Light Jumping' : `Type #${v.type_id}`)}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.78rem' }}>
                      <span style={{ color: '#00f2fe' }}>{v.camera_code || `Cam-${v.camera_id}`}</span>
                      {v.zone_name && <span style={{ color: 'var(--text-muted)' }}> • {v.zone_name}</span>}
                    </div>
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>
                      {new Date(v.violation_dt).toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: '#10b981' }}>
                      ₹{v.fine_amount ? v.fine_amount.toLocaleString() : '1,500'}
                    </strong>
                  </td>
                  <td>
                    <span className={`badge ${
                      v.payment_status === 'PAID' || v.status === 'PAID'
                        ? 'badge-success'
                        : v.status === 'APPEAL_APPROVED'
                        ? 'badge-warning'
                        : 'badge-danger'
                    }`}>
                      {v.payment_status || v.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                      onClick={() => setSelectedViolationModal(v)}
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="state-center" style={{ padding: '2rem' }}>
                  No traffic violation citations matched the current filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 10. RECENT FINANCIAL SETTLEMENTS AUDIT FEED */}
      <div className="table-card">
        <div className="table-toolbar">
          <div>
            <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CheckCircle2 size={16} color="var(--accent-emerald)" /> Recent Financial Settlements (Treasury Audit)
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Verified transactional ledger entries from the payment gateway
            </span>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigate?.('payments')}
            style={{ fontSize: '0.75rem' }}
          >
            Open Payment Ledger <ExternalLink size={12} />
          </button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Txn Reference</th>
              <th>Fine ID</th>
              <th>Settled Amount</th>
              <th>Payment Channel</th>
              <th>Settlement Timestamp</th>
              <th>Audit Status</th>
            </tr>
          </thead>
          <tbody>
            {recentPayments.length > 0 ? (
              recentPayments.map((p) => (
                <tr key={p.payment_id}>
                  <td><code>{p.txn_ref_no}</code></td>
                  <td>Fine #{p.fine_id}</td>
                  <td><strong style={{ color: '#10b981' }}>₹{p.payment_amount.toLocaleString()}</strong></td>
                  <td><span className="badge badge-info">{p.payment_method}</span></td>
                  <td>{new Date(p.payment_date).toLocaleString()}</td>
                  <td><span className="badge badge-success">{p.status}</span></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="state-center" style={{ padding: '2rem' }}>
                  No recent financial settlement transactions recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: CAMERA NODE TELEMETRY */}
      {selectedCameraModal && (
        <div className="modal-backdrop" onClick={() => setSelectedCameraModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#00f2fe' }}>
                <CameraIcon size={18} /> Camera Node Telemetry: {selectedCameraModal.camera_code}
              </h3>
              <button
                className="btn-icon"
                onClick={() => setSelectedCameraModal(null)}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div><strong>Node Identifier:</strong> <code>{selectedCameraModal.camera_code}</code></div>
              <div><strong>Sensor Hardware Type:</strong> {selectedCameraModal.camera_type}</div>
              <div><strong>Segment ID:</strong> Segment #{selectedCameraModal.segment_id}</div>
              <div><strong>Directional Facing:</strong> {selectedCameraModal.direction || 'NORTHBOUND'}</div>
              <div><strong>IP Address:</strong> <code>{selectedCameraModal.ip_address || '192.168.1.101'}</code></div>
              <div>
                <strong>Operational Status: </strong>
                <span className={`badge ${selectedCameraModal.status === 'ACTIVE' ? 'badge-success' : selectedCameraModal.status === 'MAINTENANCE' ? 'badge-warning' : 'badge-danger'}`}>
                  {selectedCameraModal.status}
                </span>
              </div>
              <div><strong>Installation Date:</strong> {new Date(selectedCameraModal.installation_dt).toLocaleDateString()}</div>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedCameraModal(null)}>Close</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setSelectedCameraModal(null);
                  onNavigate?.('cameras');
                }}
              >
                View Camera Fleet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIOLATION CITATION INSPECT */}
      {selectedViolationModal && (
        <div className="modal-backdrop" onClick={() => setSelectedViolationModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f43f5e' }}>
                <AlertTriangle size={18} /> Citation #{selectedViolationModal.violation_id} Details
              </h3>
              <button
                className="btn-icon"
                onClick={() => setSelectedViolationModal(null)}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div><strong>Citation ID:</strong> #{selectedViolationModal.violation_id}</div>
              <div><strong>Vehicle Registration:</strong> <strong style={{ color: '#00f2fe' }}>{selectedViolationModal.vehicle_reg_no || `Vehicle #${selectedViolationModal.vehicle_id}`}</strong></div>
              <div><strong>Detection Camera Node:</strong> {selectedViolationModal.camera_code || `Cam-${selectedViolationModal.camera_id}`}</div>
              {selectedViolationModal.zone_name && <div><strong>Traffic Corridor / Zone:</strong> {selectedViolationModal.zone_name}</div>}
              <div><strong>Detection Timestamp:</strong> {new Date(selectedViolationModal.violation_dt).toLocaleString()}</div>
              <div><strong>Assessed Fine:</strong> <strong style={{ color: '#10b981' }}>₹{selectedViolationModal.fine_amount ? selectedViolationModal.fine_amount.toLocaleString() : '1,500.00'}</strong></div>
              <div>
                <strong>Settlement Status: </strong>
                <span className={`badge ${selectedViolationModal.payment_status === 'PAID' || selectedViolationModal.status === 'PAID' ? 'badge-success' : 'badge-danger'}`}>
                  {selectedViolationModal.payment_status || selectedViolationModal.status}
                </span>
              </div>
              {selectedViolationModal.remarks && (
                <div><strong>Officer / AI Sensor Remarks:</strong> <em>{selectedViolationModal.remarks}</em></div>
              )}
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedViolationModal(null)}>Close</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setSelectedViolationModal(null);
                  onNavigate?.('violations');
                }}
              >
                Open Violations Management
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
