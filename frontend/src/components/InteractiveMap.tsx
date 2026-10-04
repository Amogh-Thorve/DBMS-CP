import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Camera, TrafficZone } from '../types';

interface InteractiveMapProps {
  cameras?: Camera[];
  zones?: TrafficZone[];
  onSelectCamera?: (camera: Camera) => void;
  height?: string;
  center?: [number, number];
  zoom?: number;
}

// Map zone codes to accurate lat/lng locations & risk radius
const ZONE_METADATA: Record<string, { lat: number; lng: number; radius: number; risk: string }> = {
  'Z-MUM-01': { lat: 18.9438, lng: 72.8232, radius: 1200, risk: 'HIGH' },      // Marine Drive
  'Z-MUM-02': { lat: 19.0600, lng: 72.8685, radius: 1500, risk: 'CRITICAL' },  // BKC
  'Z-MUM-03': { lat: 19.1197, lng: 72.8464, radius: 1800, risk: 'MEDIUM' },    // Andheri
  'Z-DEL-01': { lat: 28.6315, lng: 77.2167, radius: 1400, risk: 'CRITICAL' },  // Connaught Place
  'Z-DEL-02': { lat: 28.5672, lng: 77.2100, radius: 1600, risk: 'HIGH' },      // Ring Road
  'Z-BLR-01': { lat: 12.9716, lng: 77.5946, radius: 1300, risk: 'MEDIUM' },    // MG Road
  'Z-BLR-02': { lat: 12.9172, lng: 77.6228, radius: 2000, risk: 'CRITICAL' },  // Silk Board
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  cameras = [],
  zones = [],
  onSelectCamera,
  height = '420px',
  center = [19.0760, 72.8777],
  zoom = 10
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy existing Leaflet map instance if present
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize Leaflet Map
    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: true,
      attributionControl: true
    });

    mapInstanceRef.current = map;

    // Standard OpenStreetMap Tile Layer - 100% Free & Open Source, ZERO API Key required
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Layer groups for dynamic markers & circles
    const markersGroup = L.layerGroup().addTo(map);

    // 1. Render Zone Risk Circles
    zones.forEach((z) => {
      const meta = ZONE_METADATA[z.zone_code];
      const riskLevel = z.risk_level || meta?.risk || 'MEDIUM';
      const lat = meta?.lat || (z.city_id === 1 ? 19.076 : z.city_id === 2 ? 28.6315 : 12.9716);
      const lng = meta?.lng || (z.city_id === 1 ? 72.877 : z.city_id === 2 ? 77.2167 : 77.5946);

      let color = '#3b82f6'; // MEDIUM
      if (riskLevel === 'CRITICAL') color = '#f43f5e';
      else if (riskLevel === 'HIGH') color = '#f59e0b';
      else if (riskLevel === 'LOW') color = '#10b981';

      const circle = L.circle([lat, lng], {
        color: color,
        fillColor: color,
        fillOpacity: 0.15,
        radius: meta?.radius || 1500,
        weight: 1.5
      });

      circle.bindTooltip(
        `<div style="font-weight:600; font-size:0.78rem;">Zone ${z.zone_code}: ${z.zone_name}</div>
         <div style="font-size:0.72rem; color:${color}; margin-top:2px;">Risk: ${riskLevel}</div>`,
        { permanent: false, direction: 'top', className: 'map-custom-tooltip' }
      );

      circle.addTo(markersGroup);
    });

    // 2. Plot Camera Markers
    cameras.forEach((cam, idx) => {
      // Determine lat/lng from camera code or segment index
      let lat = 19.0760;
      let lng = 72.8777;

      const codeUpper = cam.camera_code.toUpperCase();
      if (codeUpper.includes('MUM')) {
        lat = 18.9438 + (idx * 0.035) % 0.18;
        lng = 72.8232 + (idx * 0.025) % 0.12;
      } else if (codeUpper.includes('DEL')) {
        lat = 28.6315 + (idx * 0.03) % 0.15;
        lng = 77.2167 + (idx * 0.02) % 0.10;
      } else if (codeUpper.includes('BLR')) {
        lat = 12.9716 + (idx * 0.025) % 0.12;
        lng = 77.5946 + (idx * 0.02) % 0.09;
      } else {
        // Spread cleanly across default center
        lat = center[0] + (idx * 0.02 - 0.08);
        lng = center[1] + (idx * 0.02 - 0.08);
      }

      const isActive = cam.status === 'ACTIVE';
      const isMaint = cam.status === 'MAINTENANCE';
      const statusColor = isActive ? '#00f2fe' : isMaint ? '#f59e0b' : '#f43f5e';

      // Custom Leaflet DivIcon with pulsing neon styling
      const customIcon = L.divIcon({
        className: 'leaflet-camera-marker-wrapper',
        html: `
          <div class="custom-map-node ${isActive ? 'online' : 'offline'}" style="border-color: ${statusColor}; color: ${statusColor};">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
              <circle cx="12" cy="13" r="3"/>
            </svg>
            <span class="marker-code">${cam.camera_code}</span>
          </div>
        `,
        iconSize: [64, 24],
        iconAnchor: [32, 12]
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(markersGroup);

      // Popup Content Card
      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; min-width: 180px; color: #f3f4f6;">
          <div style="font-weight: 700; font-size: 0.9rem; color: #00f2fe; margin-bottom: 4px; display: flex; align-items: center; justify-content: space-between;">
            <span>${cam.camera_code}</span>
            <span style="font-size:0.68rem; padding: 2px 6px; border-radius: 4px; background: ${statusColor}22; color: ${statusColor}; border: 1px solid ${statusColor}55;">
              ${cam.status}
            </span>
          </div>
          <div style="font-size: 0.75rem; color: #9ca3af; margin-bottom: 2px;">Type: <strong style="color:#fff">${cam.camera_type}</strong></div>
          <div style="font-size: 0.75rem; color: #9ca3af; margin-bottom: 2px;">Direction: <strong style="color:#fff">${cam.direction || 'NORTH'}</strong></div>
          <div style="font-size: 0.75rem; color: #9ca3af; margin-bottom: 2px;">IP: <code style="color:#00f2fe">${cam.ip_address || '192.168.1.10'}</code></div>
          <div style="font-size: 0.75rem; color: #9ca3af;">Segment ID: <strong style="color:#fff">#${cam.segment_id}</strong></div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'custom-map-popup'
      });

      marker.on('click', () => {
        if (onSelectCamera) {
          onSelectCamera(cam);
        }
      });
    });

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [cameras, zones, center, zoom, onSelectCamera]);

  return (
    <div style={{ position: 'relative', width: '100%', height, borderRadius: '12px', overflow: 'hidden' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};
