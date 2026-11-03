/**
 * @file GeoFenceMapEditor.jsx
 * @description Interactive Leaflet Geo-Fence Map & Circular Radius Editor (Slice 2.8).
 */

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Compass, Layers, CheckCircle, Loader2, Search } from 'lucide-react';
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
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

  const hasInitializedRef = useRef(false);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  const [updateSetting, { isLoading }] = useUpdateSettingMutation();

  // Initialize once from initialData, avoiding clobbering active user edits on parent re-renders
  useEffect(() => {
    if (!hasInitializedRef.current && initialData && initialData.length > 0) {
      setFence(initialData[0]);
      hasInitializedRef.current = true;
    }
  }, [initialData]);

  // Reverse geocoding helper (Coordinates -> Address Name)
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      if (res.ok) {
        const data = await res.json();
        const road =
          data.address?.road ||
          data.address?.pedestrian ||
          data.address?.neighbourhood ||
          data.address?.suburb;
        const city = data.address?.city || data.address?.town || data.address?.county;
        const addressTitle = road
          ? city
            ? `${road}, ${city}`
            : road
          : data.display_name?.split(',').slice(0, 2).join(',') || null;

        if (addressTitle) {
          setFence((prev) => ({ ...prev, name: addressTitle }));
        }
      }
    } catch (_) {
      // Non-blocking network fallback
    }
  };

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = Number.isFinite(fence.latitude) ? fence.latitude : 33.6844;
      const initialLng = Number.isFinite(fence.longitude) ? fence.longitude : 73.0479;
      const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 16);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);

      const circle = L.circle([initialLat, initialLng], {
        color: '#00C471',
        fillColor: '#00C471',
        fillOpacity: 0.25,
        radius: fence.radiusMeters || 150
      }).addTo(map);

      // Event listener for marker drag -> update lat, lng AND address
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        const lat = parseFloat(pos.lat.toFixed(6));
        const lng = parseFloat(pos.lng.toFixed(6));
        setFence((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng
        }));
        circle.setLatLng(pos);
        reverseGeocode(lat, lng);
      });

      // Event listener for map click -> move pin, circle AND update lat, lng & address
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        const parsedLat = parseFloat(lat.toFixed(6));
        const parsedLng = parseFloat(lng.toFixed(6));
        setFence((prev) => ({
          ...prev,
          latitude: parsedLat,
          longitude: parsedLng
        }));
        marker.setLatLng([parsedLat, parsedLng]);
        circle.setLatLng([parsedLat, parsedLng]);
        reverseGeocode(parsedLat, parsedLng);
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

  // Sync marker and circle whenever fence coordinates change via input or search
  useEffect(() => {
    if (
      mapInstanceRef.current &&
      markerRef.current &&
      circleRef.current &&
      Number.isFinite(fence.latitude) &&
      Number.isFinite(fence.longitude)
    ) {
      const pos = [fence.latitude, fence.longitude];
      markerRef.current.setLatLng(pos);
      circleRef.current.setLatLng(pos);
      if (Number.isFinite(fence.radiusMeters)) {
        circleRef.current.setRadius(fence.radiusMeters);
      }
      mapInstanceRef.current.setView(pos);
    }
  }, [fence.latitude, fence.longitude, fence.radiusMeters]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let parsedValue = value;
    if (type === 'checkbox') {
      parsedValue = checked;
    } else if (type === 'number') {
      const parsed = parseFloat(value);
      parsedValue = isNaN(parsed) ? '' : parsed;
    }
    setFence((prev) => ({
      ...prev,
      [name]: parsedValue
    }));
  };

  // Forward Geocoding: Search coordinates by typed Location Name
  const handleSearchLocation = async (e) => {
    if (e) e.preventDefault();
    const query = fence.name?.trim();
    if (!query) {
      toast.error('Please enter a location name or address to search');
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      if (!res.ok) throw new Error('Search service unavailable');
      const data = await res.json();

      if (!data || data.length === 0) {
        toast.error(`No map coordinates found for "${query}". Please try a more specific area or city.`);
        return;
      }

      const found = data[0];
      const lat = parseFloat(parseFloat(found.lat).toFixed(6));
      const lng = parseFloat(parseFloat(found.lon).toFixed(6));

      // Update state with newly found coordinates
      setFence((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
        name: found.display_name?.split(',').slice(0, 3).join(',') || prev.name
      }));

      // Re-center and zoom map on found coordinates
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([lat, lng], 17);
      }

      toast.success(`Location coordinates updated to: ${lat}, ${lng}`);
    } catch (err) {
      toast.error(`Failed to geocode location: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  // GPS Geolocation: Get exact device GPS position
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsLocating(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        const accuracy = Math.round(pos.coords.accuracy || 0);
        setGpsAccuracy(accuracy);

        // Update exact coordinates
        setFence((prev) => ({ ...prev, latitude: lat, longitude: lng }));

        // Center map with building-level zoom for exact verification
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 18);
        }

        // Reverse-geocode to get exact street/city name
        await reverseGeocode(lat, lng);

        if (accuracy > 100) {
          toast.warning(`Position acquired (±${accuracy}m accuracy). Drag marker to exact office entrance.`);
        } else {
          toast.success(`Exact GPS coordinates updated (±${accuracy}m precision)`);
        }
      },
      (err) => {
        setIsLocating(false);
        toast.error(`Unable to retrieve GPS location: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!Number.isFinite(fence.latitude) || !Number.isFinite(fence.longitude)) {
      toast.error('Please enter valid numeric latitude and longitude');
      return;
    }

    try {
      await updateSetting({
        key: 'geoFences',
        value: [{
          ...fence,
          latitude: parseFloat(Number(fence.latitude).toFixed(6)),
          longitude: parseFloat(Number(fence.longitude).toFixed(6)),
          radiusMeters: parseInt(fence.radiusMeters, 10) || 150
        }],
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
              Type an address and click Search, drag the pin, or click anywhere on the map to set coordinates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {gpsAccuracy !== null && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg text-[11px] font-medium font-mono">
                <CheckCircle className="w-3 h-3" />
                Accuracy: ±{gpsAccuracy}m
              </span>
            )}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium transition-colors disabled:opacity-60"
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                  Acquiring GPS...
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5 text-emerald-500" />
                  Use Current Location
                </>
              )}
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="w-full h-80 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 relative shadow-inner z-0">
          <div ref={mapContainerRef} className="w-full h-full" />
        </div>

        {/* Coordinates and Radius Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4 pt-2">
          {/* Location Name with inline Search / Find button */}
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Location Name / Address *
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                name="name"
                required
                value={fence.name || ''}
                onChange={handleChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchLocation();
                  }
                }}
                placeholder="e.g. Blue Area, Islamabad"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleSearchLocation}
                disabled={isSearching}
                title="Search location on map to get exact latitude & longitude"
                className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium transition-colors shrink-0 disabled:opacity-60"
              >
                {isSearching ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Find</span>
                  </>
                )}
              </button>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Type address & press Find to auto-fill latitude & longitude.
            </span>
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Latitude *
            </label>
            <input
              type="number"
              step="0.000001"
              name="latitude"
              required
              value={fence.latitude !== undefined && fence.latitude !== null ? fence.latitude : ''}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Longitude *
            </label>
            <input
              type="number"
              step="0.000001"
              name="longitude"
              required
              value={fence.longitude !== undefined && fence.longitude !== null ? fence.longitude : ''}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
            />
          </div>

          <div className="md:col-span-2">
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
              value={fence.radiusMeters !== undefined && fence.radiusMeters !== null ? fence.radiusMeters : 150}
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
              checked={fence.isActive !== false}
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
