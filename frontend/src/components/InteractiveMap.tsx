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
    const code = cam.camera_code.toUpperCase();
    if (code.includes('MUM')) return [18.9438 + (idx * 0.02) % 0.1, 72.8232 + (idx * 0.015) % 0.08];
    if (code.includes('DEL')) return [28.5672 + (idx * 0.02) % 0.1, 77.2100 + (idx * 0.015) % 0.08];
    if (code.includes('BLR')) return [12.9172 + (idx * 0.02) % 0.1, 77.6228 + (idx * 0.015) % 0.08];
    return [center[0] + (idx * 0.01 - 0.03), center[1] + (idx * 0.01 - 0.03)];
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

    // Standard OpenStreetMap Tile Layer
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

        let color = '#3b82f6'; // MEDIUM
        if (riskLevel === 'CRITICAL') color = '#f43f5e';
        else if (riskLevel === 'HIGH') color = '#f59e0b';
        else if (riskLevel === 'LOW') color = '#10b981';

        const circle = L.circle([lat, lng], {
          color,
          fillColor: color,
          fillOpacity: 0.12,
          radius: meta?.radius || 1400,
          weight: 1.5
        });

        circle.bindTooltip(
          `<div style="font-family:system-ui; font-size:0.75rem; font-weight:600; color:#fff;">
            Zone ${z.zone_code}: ${z.zone_name}
            <div style="font-size:0.7rem; color:${color}; margin-top:2px;">Risk Level: ${riskLevel}</div>
           </div>`,
          { direction: 'top', className: 'map-custom-tooltip' }
        );

        circle.addTo(zonesGroup);
      });
    }

    // 2. Render Camera Nodes
    const cameraCoordsMap: Record<number, [number, number]> = {};
    if (showCameras) {
      cameras.forEach((cam, idx) => {
        const [lat, lng] = getCameraLatLng(cam, idx);
        cameraCoordsMap[cam.camera_id] = [lat, lng];
        allLatLngs.push([lat, lng]);

        const isActive = cam.status === 'ACTIVE';
        const isMaint = cam.status === 'MAINTENANCE';
        const statusColor = isActive ? '#00f2fe' : isMaint ? '#f59e0b' : '#f43f5e';

        const customIcon = L.divIcon({
          className: 'leaflet-camera-marker-wrapper',
          html: `
            <div class="custom-map-node ${isActive ? 'online' : 'offline'}" style="border-color:${statusColor}; color:${statusColor};" title="${cam.camera_code}">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                <circle cx="12" cy="13" r="3"/>
              </svg>
              <span class="marker-code">${cam.camera_code.replace('CAM-', '')}</span>
            </div>
          `,
          iconSize: [68, 22],
          iconAnchor: [34, 11]
        });

        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(camerasGroup);

        const popupHtml = `
          <div style="font-family:system-ui,sans-serif; min-width:190px; color:#f3f4f6;">
            <div style="font-weight:700; font-size:0.85rem; color:#00f2fe; margin-bottom:4px; display:flex; justify-content:space-between; align-items:center;">
              <span>${cam.camera_code}</span>
              <span style="font-size:0.65rem; padding:1px 5px; border-radius:4px; background:${statusColor}22; color:${statusColor}; border:1px solid ${statusColor}55;">
                ${cam.status}
              </span>
            </div>
            <div style="font-size:0.75rem; color:#9ca3af; margin-bottom:2px;">Type: <strong style="color:#fff">${cam.camera_type}</strong></div>
            <div style="font-size:0.75rem; color:#9ca3af; margin-bottom:2px;">Orientation: <strong style="color:#fff">${cam.direction || 'NORTHBOUND'}</strong></div>
            <div style="font-size:0.75rem; color:#9ca3af; margin-bottom:2px;">Segment ID: <strong style="color:#fff">#${cam.segment_id}</strong></div>
            <div style="font-size:0.75rem; color:#9ca3af; margin-bottom:6px;">IP Address: <code style="color:#00f2fe">${cam.ip_address || '192.168.1.10'}</code></div>
            <button id="cam-btn-${cam.camera_id}" style="width:100%; padding:4px 8px; font-size:0.72rem; font-weight:600; background:#00f2fe; color:#000; border:none; border-radius:4px; cursor:pointer;">
              View Camera Record
            </button>
          </div>
        `;

        marker.bindPopup(popupHtml, { className: 'custom-map-popup' });
        marker.on('popupopen', () => {
          const btn = document.getElementById(`cam-btn-${cam.camera_id}`);
          if (btn) {
            btn.onclick = () => onSelectCamera?.(cam);
          }
        });
      });
    }

    // 3. Render Violation Incident Hotspots
    if (showViolations && violations.length > 0) {
      violations.forEach((v, vIdx) => {
        let baseCoords = cameraCoordsMap[v.camera_id];
        if (!baseCoords) {
          const matchedCam = cameras.find((c) => c.camera_id === v.camera_id);
          if (matchedCam) baseCoords = getCameraLatLng(matchedCam, 0);
          else baseCoords = [18.9438, 72.8232];
        }

        // Slight micro-offset for incident markers to prevent exact visual overlap
        const jitterLat = baseCoords[0] + (vIdx * 0.003 - 0.006);
        const jitterLng = baseCoords[1] + (vIdx * 0.003 - 0.006);

        const incidentIcon = L.divIcon({
          className: 'leaflet-incident-marker-wrapper',
          html: `
            <div style="width:20px; height:20px; border-radius:50%; background:rgba(244,63,94,0.25); border:2px solid #f43f5e; display:flex; align-items:center; justify-content:center; box-shadow:0 0 10px rgba(244,63,94,0.6);" title="Violation #${v.violation_id}">
              <div style="width:8px; height:8px; border-radius:50%; background:#f43f5e;"></div>
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const incidentMarker = L.marker([jitterLat, jitterLng], { icon: incidentIcon }).addTo(violationsGroup);

        const vPopup = `
          <div style="font-family:system-ui,sans-serif; min-width:180px; color:#f3f4f6;">
            <div style="font-weight:700; font-size:0.85rem; color:#f43f5e; margin-bottom:4px; display:flex; justify-content:space-between;">
              <span>Violation #${v.violation_id}</span>
              <span style="font-size:0.65rem; padding:1px 5px; border-radius:4px; background:#f43f5e22; color:#f43f5e; border:1px solid #f43f5e55;">
                ${v.status}
              </span>
            </div>
            <div style="font-size:0.75rem; color:#9ca3af; margin-bottom:2px;">Reg No: <strong style="color:#fff">${v.vehicle_reg_no || `Vehicle #${v.vehicle_id}`}</strong></div>
            <div style="font-size:0.75rem; color:#9ca3af; margin-bottom:2px;">Camera: <strong style="color:#00f2fe">${v.camera_code || `Cam-${v.camera_id}`}</strong></div>
            <div style="font-size:0.75rem; color:#9ca3af; margin-bottom:2px;">Fine: <strong style="color:#10b981">₹${v.fine_amount ? v.fine_amount.toLocaleString() : '1,500'}</strong></div>
            <div style="font-size:0.72rem; color:#9ca3af; margin-bottom:6px;">Time: ${new Date(v.violation_dt).toLocaleString()}</div>
            <button id="vio-btn-${v.violation_id}" style="width:100%; padding:4px 8px; font-size:0.72rem; font-weight:600; background:#f43f5e; color:#fff; border:none; border-radius:4px; cursor:pointer;">
              View Violation Details
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
    <div style={{ position: 'relative', width: '100%', height, borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Top Floating Controls Bar */}
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1000,
        display: 'flex',
        gap: '0.4rem',
        background: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(8px)',
        padding: '0.35rem 0.5rem',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.12)',
        fontSize: '0.72rem'
      }}>
        {/* City Focus Buttons */}
        <button
          className={`btn-tag ${activeCity === 'MUM' ? 'active' : ''}`}
          onClick={() => focusCity('MUM')}
          style={{ padding: '2px 7px', fontSize: '0.7rem', borderRadius: '4px', border: 'none', cursor: 'pointer', background: activeCity === 'MUM' ? '#00f2fe' : 'rgba(255,255,255,0.08)', color: activeCity === 'MUM' ? '#000' : '#fff', fontWeight: 600 }}
        >
          Mumbai
        </button>
        <button
          className={`btn-tag ${activeCity === 'DEL' ? 'active' : ''}`}
          onClick={() => focusCity('DEL')}
          style={{ padding: '2px 7px', fontSize: '0.7rem', borderRadius: '4px', border: 'none', cursor: 'pointer', background: activeCity === 'DEL' ? '#00f2fe' : 'rgba(255,255,255,0.08)', color: activeCity === 'DEL' ? '#000' : '#fff', fontWeight: 600 }}
        >
          Delhi
        </button>
        <button
          className={`btn-tag ${activeCity === 'BLR' ? 'active' : ''}`}
          onClick={() => focusCity('BLR')}
          style={{ padding: '2px 7px', fontSize: '0.7rem', borderRadius: '4px', border: 'none', cursor: 'pointer', background: activeCity === 'BLR' ? '#00f2fe' : 'rgba(255,255,255,0.08)', color: activeCity === 'BLR' ? '#000' : '#fff', fontWeight: 600 }}
        >
          Bengaluru
        </button>
        <button
          className={`btn-tag ${activeCity === 'ALL' ? 'active' : ''}`}
          onClick={() => focusCity('ALL')}
          style={{ padding: '2px 7px', fontSize: '0.7rem', borderRadius: '4px', border: 'none', cursor: 'pointer', background: activeCity === 'ALL' ? '#00f2fe' : 'rgba(255,255,255,0.08)', color: activeCity === 'ALL' ? '#000' : '#fff', fontWeight: 600 }}
        >
          Fit All
        </button>
      </div>

      {/* Layer Toggles at Top Left */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 48,
        zIndex: 1000,
        display: 'flex',
        gap: '0.5rem',
        background: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(8px)',
        padding: '0.35rem 0.6rem',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.12)',
        fontSize: '0.72rem',
        color: '#e5e7eb'
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showCameras}
            onChange={(e) => setShowCameras(e.target.checked)}
            style={{ accentColor: '#00f2fe' }}
          />
          <span>Cameras ({cameras.length})</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showZones}
            onChange={(e) => setShowZones(e.target.checked)}
            style={{ accentColor: '#3b82f6' }}
          />
          <span>Zones ({zones.length})</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showViolations}
            onChange={(e) => setShowViolations(e.target.checked)}
            style={{ accentColor: '#f43f5e' }}
          />
          <span>Violations ({violations.length})</span>
        </label>
      </div>

      {/* Map Element */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Bottom Compact Legend */}
      <div style={{
        position: 'absolute',
        bottom: 8,
        left: 10,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        background: 'rgba(15, 23, 42, 0.90)',
        backdropFilter: 'blur(8px)',
        padding: '0.3rem 0.65rem',
        borderRadius: '6px',
        border: '1px solid rgba(255,255,255,0.1)',
        fontSize: '0.68rem',
        color: '#9ca3af'
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00f2fe', display: 'inline-block' }} />
          Online Cam
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
          Maintenance
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f43f5e', display: 'inline-block' }} />
          Violation Pin
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(244,63,94,0.4)', border: '1px solid #f43f5e', display: 'inline-block' }} />
          Critical Zone
        </span>
      </div>
    </div>
  );
};
