import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Camera, TrafficZone, Violation } from '../types';

interface InteractiveMapProps {
  cameras?: Camera[];
  zones?: TrafficZone[];
  violations?: Violation[];
  onSelectCamera?: (camera: Camera) => void;
  onSelectViolation?: (violation: Violation) => void;
  height?: string;
  center?: [number, number];
  zoom?: number;
}

// Known coordinates for road segments defined in DBMS database seed
const SEGMENT_COORDINATES: Record<number, [number, number]> = {
  1: [18.9438, 72.8232], // Marine Drive Expressway
  2: [18.9667, 72.8083], // Pedder Road
  3: [19.0657, 72.8687], // BKC Main Avenue
  4: [28.5672, 77.2100], // South Delhi Ring Road AIIMS Flyover
  5: [12.9172, 77.6228], // Outer Ring Road Silk Board Bengaluru
};

// Known coordinates for traffic zones
const ZONE_METADATA: Record<string, { lat: number; lng: number; radius: number; risk: string }> = {
  'Z-MUM-01': { lat: 18.9438, lng: 72.8232, radius: 1200, risk: 'HIGH' },
  'Z-MUM-02': { lat: 19.0657, lng: 72.8687, radius: 1400, risk: 'MEDIUM' },
  'Z-MUM-03': { lat: 19.1197, lng: 72.8464, radius: 1600, risk: 'MEDIUM' },
  'Z-DEL-01': { lat: 28.6315, lng: 77.2167, radius: 1300, risk: 'CRITICAL' },
  'Z-DEL-02': { lat: 28.5672, lng: 77.2100, radius: 1500, risk: 'HIGH' },
  'Z-BLR-01': { lat: 12.9716, lng: 77.5946, radius: 1200, risk: 'MEDIUM' },
  'Z-BLR-02': { lat: 12.9172, lng: 77.6228, radius: 1800, risk: 'CRITICAL' },
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  cameras = [],
  zones = [],
  violations = [],
  onSelectCamera,
  onSelectViolation,
  height = '390px',
  center = [19.0760, 72.8777],
  zoom = 11
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layer Visibility State
  const [showCameras, setShowCameras] = useState<boolean>(true);
  const [showZones, setShowZones] = useState<boolean>(true);
  const [showViolations, setShowViolations] = useState<boolean>(true);
  const [activeCity, setActiveCity] = useState<'ALL' | 'MUM' | 'DEL' | 'BLR'>('MUM');

  // Helper to determine camera position
  const getCameraLatLng = (cam: Camera, idx: number): [number, number] => {
    if (SEGMENT_COORDINATES[cam.segment_id]) {
      return SEGMENT_COORDINATES[cam.segment_id];
    }
    const baseLat = 18.9500 + (idx * 0.015);
    const baseLng = 72.8300 + (idx * 0.012);
    return [baseLat, baseLng];
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: true
    });

    mapInstanceRef.current = map;

    // Custom Zoom Control at Top-Left
    L.control.zoom({ position: 'topleft' }).addTo(map);

    // Standard OpenStreetMap Tile Layer (Clean natural rendering)
    const tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });
    tileLayer.addTo(map);

    // Layers
    const zonesGroup = L.layerGroup().addTo(map);
    const camerasGroup = L.layerGroup().addTo(map);
    const violationsGroup = L.layerGroup().addTo(map);

    const allLatLngs: [number, number][] = [];

    // 1. Render Traffic Zones
    if (showZones) {
      zones.forEach((z) => {
        const meta = ZONE_METADATA[z.zone_code];
        const riskLevel = z.risk_level || meta?.risk || 'MEDIUM';
        const lat = meta?.lat || (z.city_id === 1 ? 18.9438 : z.city_id === 2 ? 28.5672 : 12.9172);
        const lng = meta?.lng || (z.city_id === 1 ? 72.8232 : z.city_id === 2 ? 77.2100 : 77.6228);

        allLatLngs.push([lat, lng]);

        let color = '#0057d2'; // SAP Blue / Medium
        if (riskLevel === 'CRITICAL') color = '#c92a2a'; // Danger
        else if (riskLevel === 'HIGH') color = '#b26b00'; // Warning
        else if (riskLevel === 'LOW') color = '#107e3e'; // Success

        const circle = L.circle([lat, lng], {
          color,
          fillColor: color,
          fillOpacity: 0.14,
          weight: 2,
          radius: meta?.radius || 1200
        }).addTo(zonesGroup);

        circle.bindTooltip(`
          <div style="font-family:'Source Sans 3',Inter,sans-serif; font-size:12px; color:#223548;">
            <strong style="color:#000000;">Zone: ${z.zone_name}</strong><br/>
            Code: <b>${z.zone_code}</b> | Risk: <b style="color:${color}">${riskLevel}</b>
          </div>
        `, { sticky: true, className: 'map-custom-tooltip' });
      });
    }

    // 2. Render Cameras
    if (showCameras) {
      cameras.forEach((cam, idx) => {
        const [lat, lng] = getCameraLatLng(cam, idx);
        allLatLngs.push([lat, lng]);

        const isOnline = cam.status === 'ONLINE' || cam.status === 'ACTIVE';
        const isMaint = cam.status === 'MAINTENANCE';
        const badgeColor = isOnline ? '#107e3e' : isMaint ? '#b26b00' : '#c92a2a';

        const customIcon = L.divIcon({
          className: 'custom-map-node-wrapper',
          html: `
            <div class="custom-map-node ${isOnline ? 'online' : 'offline'}" style="border-color:${badgeColor}; font-family:'Source Sans 3',Inter,sans-serif;">
              <span style="width:7px; height:7px; border-radius:50%; background:${badgeColor}; display:inline-block;"></span>
              <span class="marker-code" style="color:#223548;">${cam.camera_code}</span>
            </div>
          `,
          iconSize: [85, 26],
          iconAnchor: [42, 13]
        });

        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(camerasGroup);

        const popupHtml = `
          <div style="font-family:'Source Sans 3',Inter,sans-serif; min-width:210px; color:#223548; padding:4px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; border-bottom:1px solid #dbe2e8; padding-bottom:4px;">
              <strong style="color:#000000; font-size:14px;">${cam.camera_code}</strong>
              <span style="font-size:11px; font-weight:700; color:${badgeColor}; text-transform:uppercase;">
                ${cam.status}
              </span>
            </div>
            <div style="font-size:12px; margin-bottom:3px;">Type: <strong style="color:#000;">${cam.camera_type || 'ANPR Ultra 4K'}</strong></div>
            <div style="font-size:12px; margin-bottom:3px;">Segment: <strong style="color:#0057d2;">#${cam.segment_id}</strong></div>
            <div style="font-size:12px; margin-bottom:8px;">Orientation: ${cam.direction || 'BOTHWAYS'}</div>
            <button id="cam-inspect-${cam.camera_id}" style="width:100%; height:32px; background:#0057d2; color:#fff; border:none; border-radius:8px; font-weight:600; font-size:12px; cursor:pointer;">
              Inspect Telemetry
            </button>
          </div>
        `;

        marker.bindPopup(popupHtml, { className: 'custom-map-popup' });
        marker.on('popupopen', () => {
          const btn = document.getElementById(`cam-inspect-${cam.camera_id}`);
          if (btn) {
            btn.onclick = () => onSelectCamera?.(cam);
          }
        });
      });
    }

    // 3. Render Violations
    if (showViolations) {
      violations.slice(0, 30).forEach((v, vIdx) => {
        let baseCoords: [number, number] = [18.9438, 72.8232];
        if (v.camera_id) {
          const matchedCam = cameras.find((c) => c.camera_id === v.camera_id);
          if (matchedCam) baseCoords = getCameraLatLng(matchedCam, 0);
        }

        const jitterLat = baseCoords[0] + (vIdx * 0.0025 - 0.005);
        const jitterLng = baseCoords[1] + (vIdx * 0.0025 - 0.005);

        const incidentIcon = L.divIcon({
          className: 'leaflet-incident-marker-wrapper',
          html: `
            <div style="width:20px; height:20px; border-radius:50%; background:rgba(201,42,42,0.18); border:2px solid #c92a2a; display:flex; align-items:center; justify-content:center;" title="Violation #${v.violation_id}">
              <div style="width:8px; height:8px; border-radius:50%; background:#c92a2a;"></div>
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const incidentMarker = L.marker([jitterLat, jitterLng], { icon: incidentIcon }).addTo(violationsGroup);

        const vPopup = `
          <div style="font-family:'Source Sans 3',Inter,sans-serif; min-width:190px; color:#223548; padding:4px;">
            <div style="font-weight:700; font-size:14px; color:#c92a2a; margin-bottom:4px; display:flex; justify-content:space-between;">
              <span>Violation #${v.violation_id}</span>
              <span style="font-size:11px; padding:2px 6px; border-radius:8px; background:#fce8e6; color:#c92a2a;">
                ${v.status}
              </span>
            </div>
            <div style="font-size:12px; margin-bottom:2px;">Reg No: <strong style="color:#000;">${v.vehicle_reg_no || `Vehicle #${v.vehicle_id}`}</strong></div>
            <div style="font-size:12px; margin-bottom:2px;">Camera: <strong style="color:#0057d2;">${v.camera_code || `Cam-${v.camera_id}`}</strong></div>
            <div style="font-size:12px; margin-bottom:2px;">Fine: <strong style="color:#107e3e;">₹${v.fine_amount ? v.fine_amount.toLocaleString() : '1,500'}</strong></div>
            <div style="font-size:11px; color:#475e75; margin-bottom:8px;">Time: ${new Date(v.violation_dt).toLocaleString()}</div>
            <button id="vio-btn-${v.violation_id}" style="width:100%; height:32px; background:#c92a2a; color:#fff; border:none; border-radius:8px; font-weight:600; font-size:12px; cursor:pointer;">
              View Details
            </button>
          </div>
        `;

        incidentMarker.bindPopup(vPopup, { className: 'custom-map-popup' });
        incidentMarker.on('popupopen', () => {
          const btn = document.getElementById(`vio-btn-${v.violation_id}`);
          if (btn) {
            btn.onclick = () => onSelectViolation?.(v);
          }
        });
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [cameras, zones, violations, showCameras, showZones, showViolations, center, zoom, onSelectCamera, onSelectViolation]);

  // City view presets
  const focusCity = (city: 'ALL' | 'MUM' | 'DEL' | 'BLR') => {
    setActiveCity(city);
    if (!mapInstanceRef.current) return;
    if (city === 'MUM') {
      mapInstanceRef.current.setView([18.9600, 72.8350], 12);
    } else if (city === 'DEL') {
      mapInstanceRef.current.setView([28.6000, 77.2150], 12);
    } else if (city === 'BLR') {
      mapInstanceRef.current.setView([12.9450, 77.6100], 12);
    } else {
      mapInstanceRef.current.setView([20.5937, 78.9629], 5);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height, borderRadius: 'var(--rounded-lg)', overflow: 'hidden', border: '1px solid var(--colors-hairline-subtle)', backgroundColor: 'var(--colors-chrome)' }}>
      {/* Top Floating Controls Bar */}
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1000,
        display: 'flex',
        gap: '4px',
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(4px)',
        padding: '4px 6px',
        borderRadius: 'var(--rounded-md)',
        border: '1px solid var(--colors-hairline-subtle)',
        boxShadow: '0 2px 6px rgba(34, 53, 72, 0.1)'
      }}>
        {/* City Focus Buttons */}
        {(['MUM', 'DEL', 'BLR', 'ALL'] as const).map((city) => (
          <button
            key={city}
            onClick={() => focusCity(city)}
            style={{
              padding: '4px 9px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: 'var(--rounded-sm)',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeCity === city ? 'var(--colors-primary)' : 'transparent',
              color: activeCity === city ? '#ffffff' : 'var(--colors-ink-body)',
              transition: 'all 0.15s ease'
            }}
          >
            {city === 'MUM' ? 'Mumbai' : city === 'DEL' ? 'Delhi' : city === 'BLR' ? 'Bengaluru' : 'Fit All'}
          </button>
        ))}
      </div>

      {/* Layer Toggles at Top Left */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 48,
        zIndex: 1000,
        display: 'flex',
        gap: '12px',
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(4px)',
        padding: '5px 12px',
        borderRadius: 'var(--rounded-md)',
        border: '1px solid var(--colors-hairline-subtle)',
        fontSize: '12px',
        color: 'var(--colors-ink-body)',
        fontWeight: 500,
        boxShadow: '0 2px 6px rgba(34, 53, 72, 0.1)'
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showCameras}
            onChange={(e) => setShowCameras(e.target.checked)}
            style={{ accentColor: 'var(--colors-primary)' }}
          />
          <span>Cameras ({cameras.length})</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showZones}
            onChange={(e) => setShowZones(e.target.checked)}
            style={{ accentColor: 'var(--colors-primary-deep)' }}
          />
          <span>Zones ({zones.length})</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showViolations}
            onChange={(e) => setShowViolations(e.target.checked)}
            style={{ accentColor: 'var(--colors-status-danger)' }}
          />
          <span>Violations ({violations.length})</span>
        </label>
      </div>

      {/* Map Canvas */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Bottom Compact Legend */}
      <div style={{
        position: 'absolute',
        bottom: 8,
        left: 10,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(4px)',
        padding: '4px 10px',
        borderRadius: 'var(--rounded-md)',
        border: '1px solid var(--colors-hairline-subtle)',
        fontSize: '11px',
        color: 'var(--colors-ink-meta)',
        fontWeight: 500,
        boxShadow: '0 2px 6px rgba(34, 53, 72, 0.1)'
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#107e3e', display: 'inline-block' }} />
          Online Cam
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#b26b00', display: 'inline-block' }} />
          Maintenance
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#c92a2a', display: 'inline-block' }} />
          Violation Pin
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(201,42,42,0.3)', border: '1px solid #c92a2a', display: 'inline-block' }} />
          High Risk Zone
        </span>
      </div>
    </div>
  );
};
