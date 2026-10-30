/**
 * @file WfhLocationModal.jsx
 * @description Modal for employees to register remote WFH home residence boundaries.
 *
 * SPECIFICATION:
 * - Module M14 (BUILD-GUIDE Section 17 · Row 14.4)
 */

import React, { useState } from 'react';
import { Home, MapPin, X, Navigation, AlertCircle } from 'lucide-react';
import { useCreateWfhLocationMutation } from '../attendanceApi.js';
import { useGeolocation } from '../../../hooks/useGeolocation.js';
import { toast } from 'sonner';

export const WfhLocationModal = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radiusMeters, setRadiusMeters] = useState(100);
  const [formError, setFormError] = useState('');

  const { getLocation, loading: isDetecting } = useGeolocation();
  const [createWfhLocation, { isLoading: isSubmitting }] = useCreateWfhLocationMutation();

  if (!isOpen) return null;

  const handleDetectLocation = async () => {
    setFormError('');
    try {
      const coords = await getLocation();
      setLatitude(coords.latitude.toFixed(6));
      setLongitude(coords.longitude.toFixed(6));
      toast.info(`Coordinates acquired with accuracy ±${coords.accuracy}m`);
    } catch (err) {
      setFormError(err.message || 'Unable to detect GPS position.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const radius = parseInt(radiusMeters, 10);

    if (!name.trim()) {
      setFormError('Please enter a location name (e.g. Home Residence).');
      return;
    }
    if (!address.trim()) {
      setFormError('Please enter the residential address.');
      return;
    }
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setFormError('Valid latitude between -90 and 90 is required.');
      return;
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      setFormError('Valid longitude between -180 and 180 is required.');
      return;
    }
    if (isNaN(radius) || radius < 10 || radius > 150) {
      setFormError('Radius must be between 10m and 150m.');
      return;
    }

    try {
      await createWfhLocation({
        name: name.trim(),
        address: address.trim(),
        latitude: lat,
        longitude: lon,
        radiusMeters: radius
      }).unwrap();

      toast.success('WFH Location registered and submitted for HR approval.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setFormError(err.data?.message || err.message || 'Failed to register WFH location.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Home className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Register WFH Residence Location
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Location Label / Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Primary Residence (Gulshan)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Complete Physical Address <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              placeholder="Apartment / House number, Street, Block, Area, City"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Coordinates with auto-detect button */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                GPS Coordinates <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isDetecting}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer disabled:opacity-50"
              >
                <Navigation className="w-3 h-3" />
                {isDetecting ? 'Detecting GPS...' : 'Use Current Position'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="any"
                required
                placeholder="Latitude (e.g. 24.8607)"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              />
              <input
                type="number"
                step="any"
                required
                placeholder="Longitude (e.g. 67.0011)"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Geofence Radius: <span className="text-indigo-600 font-bold">{radiusMeters} meters</span>
              </label>
              <span className="text-[10px] text-slate-400">Max 150m</span>
            </div>
            <input
              type="range"
              min={25}
              max={150}
              step={5}
              value={radiusMeters}
              onChange={(e) => setRadiusMeters(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          {formError && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-sm cursor-pointer"
            >
              {isSubmitting ? 'Registering...' : 'Register Location'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

