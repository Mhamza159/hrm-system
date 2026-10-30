/**
 * @file PunchMap.jsx
 * @description Interactive Leaflet Map rendering daily punch pins and office geofence perimeters.
 *
 * SPECIFICATION:
 * - Module M14 (BUILD-GUIDE Section 17 · Row 14.7)
 */

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon URLs
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

export const PunchMap = ({ punches = [], officeGeofences = [], height = '500px' }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default center: First geofence or Karachi center
      const defaultCenter = officeGeofences[0]
        ? [officeGeofences[0].latitude, officeGeofences[0].longitude]
        : [24.8607, 67.0011];

      const map = L.map(mapContainerRef.current).setView(defaultCenter, 14);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update layers when punches or geofences change
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    const bounds = [];

    // 1. Render Office Geofences
    officeGeofences.forEach((fence) => {
      if (typeof fence.latitude === 'number' && typeof fence.longitude === 'number') {
        const circle = L.circle([fence.latitude, fence.longitude], {
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.15,
          weight: 2,
          radius: fence.radiusMeters || 100
        });

        circle.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px;">
            <strong style="color: #065f46; font-size: 13px;">🏢 ${fence.name}</strong><br/>
            <span>Authorized Geofence Perimeter</span><br/>
            <span>Radius: <strong>${fence.radiusMeters || 100}m</strong></span>
          </div>
        `);

        layerGroup.addLayer(circle);
        bounds.push([fence.latitude, fence.longitude]);
      }
    });

    // 2. Render Punch Coordinates
    punches.forEach((punch) => {
      if (typeof punch.latitude === 'number' && typeof punch.longitude === 'number') {
        let pinColor = '#10b981'; // Green for normal inside fence
        let pinTitle = 'Normal Punch';

        if (punch.isClientVisit) {
          pinColor = '#2563eb'; // Blue for client site
          pinTitle = 'Client Site Punch';
        } else if (punch.isFlagged) {
          pinColor = '#ef4444'; // Red for flagged / out of bounds
          pinTitle = `Flagged: ${punch.flagReason || 'Violation'}`;
        }

        const marker = L.circleMarker([punch.latitude, punch.longitude], {
          radius: 8,
          fillColor: pinColor,
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.85
        });

        const checkInTime = punch.checkIn
          ? new Date(punch.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'N/A';

        const distanceText = punch.distanceFromOfficeMeters
          ? `${Math.round(punch.distanceFromOfficeMeters)}m from office`
          : 'N/A';

        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; min-width: 170px;">
            <strong style="font-size: 13px; color: #1e293b;">${punch.employeeName}</strong>
            <div style="color: #64748b; font-size: 11px;">${punch.employeeCode || ''}</div>
            <hr style="margin: 6px 0; border: none; border-top: 1px solid #e2e8f0;"/>
            <div>🕒 <strong>Time:</strong> ${checkInTime}</div>
            <div>📍 <strong>Distance:</strong> ${distanceText}</div>
            ${punch.isClientVisit ? `<div style="color: #2563eb;">💼 <strong>Client:</strong> ${punch.clientName || 'On-Field'}</div>` : ''}
            ${punch.isFlagged ? `<div style="color: #ef4444; font-weight: bold;">⚠️ ${pinTitle}</div>` : ''}
          </div>
        `);

        layerGroup.addLayer(marker);
        bounds.push([punch.latitude, punch.longitude]);
      }
    });

    // Fit map view to display all points
    if (bounds.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [punches, officeGeofences]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height, width: '100%' }}
      className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner overflow-hidden z-0"
    />
  );
};
