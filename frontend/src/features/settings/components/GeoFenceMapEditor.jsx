/**
 * @file GeoFenceMapEditor.jsx
 * @description Multi-Branch Leaflet Geo-Fence Map & Spatial Perimeter Manager (Slice 2.8).
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Navigation,
  Compass,
  Layers,
  CheckCircle,
  Loader2,
  Search,
  Plus,
  Trash2,
  Building,
  CheckCircle2,
  Star,
  SlidersHorizontal,
  Info
} from 'lucide-react';
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

const DEFAULT_BRANCH = {
  id: 'branch-hq-isb',
  name: 'Headquarters (Islamabad)',
  branchCode: 'ISB-HQ',
  address: 'Plot 14, Sector I-9, Islamabad, Pakistan',
  latitude: 33.6844,
  longitude: 73.0479,
  radiusMeters: 150,
  isActive: true,
  isHeadquarters: true
};

export function GeoFenceMapEditor({ initialData = [], onSaved }) {
  const [fences, setFences] = useState(
    initialData && initialData.length > 0 ? initialData : [DEFAULT_BRANCH]
  );
  const [selectedBranchId, setSelectedBranchId] = useState(
    initialData && initialData.length > 0 ? (initialData[0].id || initialData[0].name) : DEFAULT_BRANCH.id
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  const [updateSetting, { isLoading }] = useUpdateSettingMutation();

  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setFences(initialData);
      if (!selectedBranchId || !initialData.some((f) => (f.id || f.name) === selectedBranchId)) {
        setSelectedBranchId(initialData[0].id || initialData[0].name);
      }
    }
  }, [initialData]);

  // Current active branch
  const activeBranchIndex = fences.findIndex((f) => (f.id || f.name) === selectedBranchId);
  const activeBranch = activeBranchIndex >= 0 ? fences[activeBranchIndex] : fences[0] || DEFAULT_BRANCH;

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
          handleActiveBranchChange('address', addressTitle);
        }
      }
    } catch (_) {
      // Non-blocking fallback
    }
  };

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = Number.isFinite(activeBranch.latitude) ? activeBranch.latitude : 33.6844;
      const initialLng = Number.isFinite(activeBranch.longitude) ? activeBranch.longitude : 73.0479;
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
        radius: activeBranch.radiusMeters || 150
      }).addTo(map);

      // Drag event
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        const lat = parseFloat(pos.lat.toFixed(6));
        const lng = parseFloat(pos.lng.toFixed(6));
        handleCoordinateUpdate(lat, lng);
        circle.setLatLng(pos);
        reverseGeocode(lat, lng);
      });

      // Click event
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        const parsedLat = parseFloat(lat.toFixed(6));
        const parsedLng = parseFloat(lng.toFixed(6));
        handleCoordinateUpdate(parsedLat, parsedLng);
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

  // Sync map center and marker when selected branch changes
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && circleRef.current && activeBranch) {
      const lat = Number.isFinite(activeBranch.latitude) ? activeBranch.latitude : 33.6844;
      const lng = Number.isFinite(activeBranch.longitude) ? activeBranch.longitude : 73.0479;
      const radius = activeBranch.radiusMeters || 150;

      markerRef.current.setLatLng([lat, lng]);
      circleRef.current.setLatLng([lat, lng]);
      circleRef.current.setRadius(radius);
      mapInstanceRef.current.panTo([lat, lng]);
    }
  }, [selectedBranchId]);

  const handleActiveBranchChange = (field, value) => {
    setFences((prev) => {
      const updated = [...prev];
      if (activeBranchIndex >= 0) {
        updated[activeBranchIndex] = {
          ...updated[activeBranchIndex],
          [field]: value
        };
      }
      return updated;
    });
  };

  const handleCoordinateUpdate = (lat, lng) => {
    setFences((prev) => {
      const updated = [...prev];
      if (activeBranchIndex >= 0) {
        updated[activeBranchIndex] = {
          ...updated[activeBranchIndex],
          latitude: lat,
          longitude: lng
        };
      }
      return updated;
    });
  };

  const handleAddBranch = () => {
    const newId = `branch-${Date.now()}`;
    const newBranch = {
      id: newId,
      name: `Branch Office ${fences.length + 1}`,
      branchCode: `BR-${fences.length + 1}`,
      address: 'Select location on map',
      latitude: 31.5204, // Lahore default
      longitude: 74.3587,
      radiusMeters: 150,
      isActive: true,
      isHeadquarters: false
    };

    setFences((prev) => [...prev, newBranch]);
    setSelectedBranchId(newId);
    toast.success('New branch location added. Reposition the map marker to set perimeter.');
  };

  const handleRemoveBranch = (branchId) => {
    if (fences.length <= 1) {
      toast.error('At least one office geo-fence location must remain active');
      return;
    }
    const filtered = fences.filter((f) => (f.id || f.name) !== branchId);
    setFences(filtered);
    setSelectedBranchId(filtered[0].id || filtered[0].name);
    toast.success('Branch location removed');
  };

  // Search geocode
  const handleSearchLocation = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      if (res.ok) {
        const results = await res.json();
        if (results.length > 0) {
          const lat = parseFloat(results[0].lat);
          const lon = parseFloat(results[0].lon);
          handleCoordinateUpdate(lat, lon);
          if (markerRef.current && circleRef.current && mapInstanceRef.current) {
            markerRef.current.setLatLng([lat, lon]);
            circleRef.current.setLatLng([lat, lon]);
            mapInstanceRef.current.setView([lat, lon], 17);
          }
          reverseGeocode(lat, lon);
          toast.success(`Positioned at: ${results[0].display_name.split(',').slice(0, 2).join(',')}`);
        } else {
          toast.error('Location not found. Try entering city and sector or landmark.');
        }
      }
    } catch (_) {
      toast.error('Failed to locate address via map search');
    } finally {
      setIsSearching(false);
    }
  };

  // GPS Locate Current Position
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        setGpsAccuracy(Math.round(position.coords.accuracy));
        handleCoordinateUpdate(lat, lng);

        if (mapInstanceRef.current && markerRef.current && circleRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          circleRef.current.setLatLng([lat, lng]);
          mapInstanceRef.current.setView([lat, lng], 17);
        }

        reverseGeocode(lat, lng);
        setIsLocating(false);
        toast.success(`GPS coordinates captured (Accuracy: ±${Math.round(position.coords.accuracy)}m)`);
      },
      (error) => {
        setIsLocating(false);
        toast.error(`Geolocation error: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateSetting({
        key: 'geoFences',
        value: fences,
        description: `Updated corporate geo-fences (${fences.length} locations configured)`
      }).unwrap();

      toast.success('Multi-branch geo-fence perimeters saved successfully');
      if (onSaved) onSaved();
    } catch (err) {
      toast.error(err.data?.message || 'Failed to save geo-fence locations');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" />
              Multi-Branch Geo-fencing & Spatial Perimeter Manager
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure GPS check-in boundaries across company headquarters, regional branches, and client sites.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddBranch}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Office Location
          </button>
        </div>

        {/* Master-Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          {/* Left Column: Branch Office Directory */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Configured Offices ({fences.length})
            </span>

            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {fences.map((branch, idx) => {
                const bId = branch.id || branch.name;
                const isSelected = bId === selectedBranchId;
                return (
                  <div
                    key={bId || idx}
                    onClick={() => setSelectedBranchId(bId)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 text-slate-900 dark:text-white shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-bold truncate max-w-[150px]">
                          {branch.name}
                        </span>
                        {branch.isHeadquarters && (
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" title="Headquarters" />
                        )}
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        branch.isActive
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {branch.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 truncate">
                      {branch.address || `${branch.latitude}, ${branch.longitude}`}
                    </p>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                      <span>Radius: {branch.radiusMeters}m</span>
                      {fences.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveBranch(bId);
                          }}
                          className="text-slate-400 hover:text-rose-500 transition-colors"
                          title="Delete Location"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Branch Form & Leaflet Map */}
          <div className="lg:col-span-2 space-y-4">
            {/* Selected Branch Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Location Name *
                </label>
                <input
                  type="text"
                  required
                  value={activeBranch.name || ''}
                  onChange={(e) => handleActiveBranchChange('name', e.target.value)}
                  placeholder="e.g. Lahore Regional Office"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Branch Code
                </label>
                <input
                  type="text"
                  value={activeBranch.branchCode || ''}
                  onChange={(e) => handleActiveBranchChange('branchCode', e.target.value)}
                  placeholder="e.g. LHR-02"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Radius: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{activeBranch.radiusMeters || 150}m</strong>
                  </label>
                </div>
                <input
                  type="range"
                  min="25"
                  max="1000"
                  step="25"
                  value={activeBranch.radiusMeters || 150}
                  onChange={(e) => {
                    const r = parseInt(e.target.value, 10);
                    handleActiveBranchChange('radiusMeters', r);
                    if (circleRef.current) circleRef.current.setRadius(r);
                  }}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-emerald-500"
                />
              </div>
            </div>

            {/* Address & Status Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={activeBranch.address || ''}
                  onChange={(e) => handleActiveBranchChange('address', e.target.value)}
                  placeholder="Street / Plaza address..."
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={activeBranch.isActive}
                    onChange={(e) => handleActiveBranchChange('isActive', e.target.checked)}
                    className="rounded text-emerald-500 w-4 h-4"
                  />
                  <span>Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={activeBranch.isHeadquarters}
                    onChange={(e) => handleActiveBranchChange('isHeadquarters', e.target.checked)}
                    className="rounded text-amber-500 w-4 h-4"
                  />
                  <span>Headquarters</span>
                </label>
              </div>
            </div>

            {/* Search Location Bar on Map */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search landmark, sector, or city to reposition..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation(e)}
                />
              </div>
              <button
                type="button"
                onClick={handleSearchLocation}
                disabled={isSearching}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSearching ? 'Searching...' : 'Locate'}
              </button>
              <button
                type="button"
                onClick={handleLocateMe}
                disabled={isLocating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
              >
                <Navigation className="w-3 h-3" />
                {isLocating ? 'Detecting GPS...' : 'My Location'}
              </button>
            </div>

            {/* Leaflet Map Canvas Container */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
              <div ref={mapContainerRef} className="h-80 w-full z-0" />
              <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-[#111D17]/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-300 z-10 flex items-center gap-2">
                <span>Lat: {activeBranch.latitude}</span>
                <span>Lng: {activeBranch.longitude}</span>
                {gpsAccuracy && <span>(±{gpsAccuracy}m)</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#00C471] hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer active:scale-98"
        >
          <CheckCircle2 className="w-4 h-4" />
          {isLoading ? 'Saving Geo-Fences...' : 'Save All Geo-Fences'}
        </button>
      </div>
    </form>
  );
}
