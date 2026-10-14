/**
 * @file GeoFenceMapEditor.jsx
 * @description Interactive Leaflet Geo-Fence Map & Circular Radius Editor (Slice 2.8).
 */

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Compass, Layers, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useUpdateSettingMutation } from '../settingsApi.js';

// Fix default marker icon asset URLs in Vite / Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

export function GeoFenceMapEditor({ initialData = [], onSaved }) {
  const defaultFence = initialData && initialData.length > 0 ? initialData[0] : {
    name: 'Headquarters (Islamabad)',
    latitude: 33.6844,
    longitude: 73.0479,
    radiusMeters: 150,
    isActive: true
  };

  const [fence, setFence] = useState(defaultFence);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  const [updateSetting, { isLoading }] = useUpdateSettingMutation();

  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setFence(initialData[0]);
    }
  }, [initialData]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([fence.latitude, fence.longitude], 16);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const marker = L.marker([fence.latitude, fence.longitude], { draggable: true }).addTo(map);

      const circle = L.circle([fence.latitude, fence.longitude], {
        color: '#00C471',
        fillColor: '#00C471',
        fillOpacity: 0.25,
        radius: fence.radiusMeters
      }).addTo(map);

      // Event listener for marker drag
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setFence((prev) => ({
          ...prev,
          latitude: parseFloat(pos.lat.toFixed(6)),
          longitude: parseFloat(pos.lng.toFixed(6))
        }));
        circle.setLatLng(pos);
      });

      // Event listener for map click
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        setFence((prev) => ({
          ...prev,
          latitude: parseFloat(lat.toFixed(6)),
          longitude: parseFloat(lng.toFixed(6))
        }));
        marker.setLatLng([lat, lng]);
        circle.setLatLng([lat, lng]);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Sync marker and circle whenever fence coordinates change via input
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && circleRef.current) {
      const pos = [fence.latitude, fence.longitude];
      markerRef.current.setLatLng(pos);
      circleRef.current.setLatLng(pos);
      circleRef.current.setRadius(fence.radiusMeters);
      mapInstanceRef.current.setView(pos);
    }
  }, [fence.latitude, fence.longitude, fence.radiusMeters]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFence((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setFence((prev) => ({ ...prev, latitude: lat, longitude: lng }));
        toast.success('Centered on current device GPS location');
      },
      (err) => {
        toast.error(`Unable to retrieve GPS location: ${err.message}`);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateSetting({
        key: 'geoFences',
        value: [fence],
        description: 'Updated office geo-fence coordinates and radius'
      }).unwrap();

      toast.success('Office geo-fence boundaries saved successfully');
      if (onSaved) onSaved();
    } catch (err) {
      toast.error(err.data?.message || 'Failed to update geo-fence');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" />
              Office Geo-Fence & Spatial Boundary
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Click anywhere on the map or drag the pin to set the official office location.
            </p>
          </div>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium transition-colors"
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-500" />
            Use Current Location
          </button>
        </div>

        {/* Map Container */}
        <div className="w-full h-80 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 relative shadow-inner z-0">
          <div ref={mapContainerRef} className="w-full h-full" />
        </div>

        {/* Coordinates and Radius Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Location Name *
            </label>
            <input
              type="text"
              name="name"
              required
              value={fence.name}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Latitude *
            </label>
            <input
              type="number"
              step="0.000001"
              name="latitude"
              required
              value={fence.latitude}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Longitude *
            </label>
            <input
              type="number"
              step="0.000001"
              name="longitude"
              required
              value={fence.longitude}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Radius (Meters) *
            </label>
            <input
              type="number"
              min="10"
              max="5000"
              step="10"
              name="radiusMeters"
              required
              value={fence.radiusMeters}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="pt-1">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="isActive"
              checked={fence.isActive}
              onChange={handleChange}
              className="w-4 h-4 rounded-md text-emerald-500 focus:ring-emerald-400 border-slate-300 dark:border-slate-700"
            />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Enable GPS boundary verification for mobile/web punches
            </span>
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#00C471] hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
        >
          {isLoading ? 'Saving Geo-Fence...' : 'Save Geo-Fence Location'}
        </button>
      </div>
    </form>
  );
}
