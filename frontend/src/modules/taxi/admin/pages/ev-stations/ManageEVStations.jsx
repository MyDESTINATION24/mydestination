import React, { useEffect, useMemo, useState, useRef } from 'react';
import { GoogleMap, MarkerF, Autocomplete } from '@react-google-maps/api';
import { 
  ChevronRight, 
  Edit2, 
  Plus, 
  Save, 
  Search, 
  Trash2, 
  MapPin, 
  Zap, 
  ArrowLeft,
  X,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppGoogleMapsLoader, HAS_VALID_GOOGLE_MAPS_KEY, INDIA_CENTER } from '../../utils/googleMaps';
import { 
  getAdminEVStations, 
  createAdminEVStation, 
  updateAdminEVStation, 
  deleteAdminEVStation 
} from '../../services/evStationService';

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-400/5';
const labelClass = 'mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400';

const CONNECTOR_OPTIONS = [
  'CCS2',
  'Type 2',
  'DC Fast Charger',
  'AC Destination',
  'CHAdeMO',
  'GB/T',
];

const MAP_CONTAINER_STYLE = { width: '100%', height: '350px' };

const ManageEVStations = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stations, setStations] = useState([]);
  
  // View mode: 'list', 'create', 'edit'
  const [viewMode, setViewMode] = useState('list');
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: 22.7196,
    longitude: 75.8577,
    stallsTotal: 8,
    stallsAvailable: 8,
    powerKW: 150,
    pricing: '₹15/kWh',
    connectorTypes: ['CCS2', 'Type 2'],
    status: 'active',
  });

  // Map references
  const autocompleteRef = useRef(null);
  const mapRef = useRef(null);
  const { isLoaded: isMapLoaded, loadError: mapLoadError } = useAppGoogleMapsLoader();

  const loadStations = async () => {
    try {
      setLoading(true);
      const data = await getAdminEVStations();
      setStations(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load EV stations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStations();
  }, []);

  const filteredStations = useMemo(() => {
    return stations.filter((item) =>
      [item.name, item.address, item.pricing, item.connectorTypes.join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(searchTerm.trim().toLowerCase())
    );
  }, [stations, searchTerm]);

  const handleEditClick = (station) => {
    setFormData({
      name: station.name,
      address: station.address,
      latitude: Number(station.latitude),
      longitude: Number(station.longitude),
      stallsTotal: Number(station.stallsTotal || 8),
      stallsAvailable: Number(station.stallsAvailable || 8),
      powerKW: Number(station.powerKW || 150),
      pricing: station.pricing || '₹15/kWh',
      connectorTypes: station.connectorTypes || ['CCS2', 'Type 2'],
      status: station.status || 'active',
    });
    setEditingId(station.id);
    setViewMode('edit');
  };

  const handleCreateClick = () => {
    // Center map around user location if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData((curr) => ({
            ...curr,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }));
        },
        () => {}
      );
    }

    setFormData({
      name: '',
      address: '',
      latitude: 22.7196,
      longitude: 75.8577,
      stallsTotal: 8,
      stallsAvailable: 8,
      powerKW: 150,
      pricing: '₹15/kWh',
      connectorTypes: ['CCS2', 'Type 2'],
      status: 'active',
    });
    setEditingId(null);
    setViewMode('create');
  };

  const handleMapClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setFormData((curr) => ({
      ...curr,
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
    }));
  };

  const handleMarkerDragEnd = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setFormData((curr) => ({
      ...curr,
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
    }));
  };

  const handlePlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setFormData((curr) => ({
          ...curr,
          address: place.formatted_address || place.name || curr.address,
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
        }));
        if (mapRef.current) {
          mapRef.current.panTo({ lat, lng });
        }
      }
    }
  };

  const handleConnectorToggle = (type) => {
    setFormData((curr) => {
      const exists = curr.connectorTypes.includes(type);
      const updated = exists
        ? curr.connectorTypes.filter((t) => t !== type)
        : [...curr.connectorTypes, type];
      return { ...curr, connectorTypes: updated };
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this charging station?')) return;
    try {
      await deleteAdminEVStation(id);
      toast.success('Station deleted successfully.');
      loadStations();
    } catch {
      toast.error('Failed to delete EV station.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Station name is required.');
    if (!formData.address.trim()) return toast.error('Address is required.');
    if (isNaN(formData.latitude) || isNaN(formData.longitude)) {
      return toast.error('Latitude and Longitude must be valid numbers.');
    }

    try {
      setSubmitting(true);
      if (viewMode === 'edit') {
        await updateAdminEVStation(editingId, formData);
        toast.success('EV station updated successfully.');
      } else {
        await createAdminEVStation(formData);
        toast.success('EV station created successfully.');
      }
      setViewMode('list');
      loadStations();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save EV station.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8 font-sans animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <span>Home</span>
            <ChevronRight size={12} />
            <span className="text-slate-700">EV Stations</span>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900 mt-1 flex items-center gap-2">
            <Zap className="text-amber-500 fill-amber-500/20" size={24} />
            EV Charging Stations
          </h1>
        </div>

        {viewMode === 'list' ? (
          <button
            onClick={handleCreateClick}
            className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black uppercase tracking-widest text-white shadow-lg active:scale-95 transition-all hover:bg-slate-800"
          >
            <Plus size={16} /> Add Station
          </button>
        ) : (
          <button
            onClick={() => setViewMode('list')}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white border border-slate-200 px-5 py-3 text-sm font-black uppercase tracking-widest text-slate-600 shadow-sm active:scale-95 transition-all hover:bg-slate-50"
          >
            <ArrowLeft size={16} /> Back to List
          </button>
        )}
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-6">
          {/* Search Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search by name, address, pricing..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-slate-300 focus:bg-white"
              />
            </div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Total Stations: {filteredStations.length}
            </div>
          </div>

          {/* Stations List */}
          {loading ? (
            <div className="flex justify-center items-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <RefreshCw className="animate-spin text-slate-400" size={32} />
            </div>
          ) : filteredStations.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm text-slate-400 font-bold">
              No EV Stations found. Add one to get started!
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="p-5 text-[10px] font-black uppercase tracking-wider text-slate-400">Station Info</th>
                      <th className="p-5 text-[10px] font-black uppercase tracking-wider text-slate-400">Stalls (Avail/Total)</th>
                      <th className="p-5 text-[10px] font-black uppercase tracking-wider text-slate-400">Power & Cost</th>
                      <th className="p-5 text-[10px] font-black uppercase tracking-wider text-slate-400">Connectors</th>
                      <th className="p-5 text-[10px] font-black uppercase tracking-wider text-slate-400">Status</th>
                      <th className="p-5 text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredStations.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="p-5">
                          <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                          <div className="text-slate-400 text-xs mt-1 flex items-center gap-1">
                            <MapPin size={12} className="shrink-0" />
                            {item.address}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Lat: {item.latitude}, Lng: {item.longitude}
                          </div>
                        </td>
                        <td className="p-5">
                          <div className="flex items-center gap-2">
                            <div className={`h-2.5 w-2.5 rounded-full ${item.stallsAvailable > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span className="font-bold text-slate-800 text-sm">
                              {item.stallsAvailable} / {item.stallsTotal}
                            </span>
                          </div>
                        </td>
                        <td className="p-5">
                          <div className="font-bold text-slate-800 text-sm">{item.powerKW} kW</div>
                          <div className="text-slate-400 text-xs">{item.pricing}</div>
                        </td>
                        <td className="p-5">
                          <div className="flex flex-wrap gap-1">
                            {item.connectorTypes.map((c) => (
                              <span key={c} className="bg-slate-100 text-slate-600 rounded-lg px-2 py-0.5 text-[10px] font-black uppercase">
                                {c}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-5">
                          <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            item.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            item.status === 'maintenance' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                            {item.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-5 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditClick(item)}
                              className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Form details card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
                {viewMode === 'edit' ? 'Edit Station Details' : 'New Station Details'}
              </h3>

              <div>
                <label className={labelClass}>Station Name</label>
                <input
                  type="text"
                  placeholder="e.g. Connaught Place Supercharger"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Address</label>
                <input
                  type="text"
                  placeholder="Street name, City, Pin Code"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="22.7196"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="75.8577"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Total Stalls</label>
                  <input
                    type="number"
                    value={formData.stallsTotal}
                    onChange={(e) => setFormData({ ...formData, stallsTotal: Number(e.target.value) })}
                    className={inputClass}
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Available Stalls</label>
                  <input
                    type="number"
                    value={formData.stallsAvailable}
                    onChange={(e) => setFormData({ ...formData, stallsAvailable: Number(e.target.value) })}
                    className={inputClass}
                    min="0"
                    max={formData.stallsTotal}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Power Capacity (kW)</label>
                  <input
                    type="number"
                    placeholder="e.g. 150"
                    value={formData.powerKW}
                    onChange={(e) => setFormData({ ...formData, powerKW: Number(e.target.value) })}
                    className={inputClass}
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Pricing Details</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹15/kWh"
                    value={formData.pricing}
                    onChange={(e) => setFormData({ ...formData, pricing: e.target.value })}
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Connectors Supported</label>
                <div className="flex flex-wrap gap-2">
                  {CONNECTOR_OPTIONS.map((type) => {
                    const isSelected = formData.connectorTypes.includes(type);
                    return (
                      <button
                        type="button"
                        key={type}
                        onClick={() => handleConnectorToggle(type)}
                        className={`rounded-xl px-4 py-2 text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className={labelClass}>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className={inputClass}
                >
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="coming_soon">Coming Soon</option>
                </select>
              </div>

              <div className="pt-2 flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-lg active:scale-95 disabled:opacity-50 transition-all hover:bg-slate-800"
                >
                  <Save size={16} />
                  {submitting ? 'Saving...' : 'Save Station'}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="rounded-2xl bg-white border border-slate-200 px-6 py-3.5 text-sm font-black uppercase tracking-widest text-slate-600 shadow-sm active:scale-95 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Map pinpointing card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                <MapPin className="text-indigo-500" size={18} />
                Pinpoint on Map
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Search for a location using autocomplete or click/drag the marker on the map to automatically fill in the coordinates.
              </p>

              {/* Autocomplete Input Search */}
              {HAS_VALID_GOOGLE_MAPS_KEY && isMapLoaded && (
                <div className="relative z-50">
                  <Autocomplete
                    onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
                    onPlaceChanged={handlePlaceChanged}
                  >
                    <input
                      type="text"
                      placeholder="Search address or location..."
                      className="w-full rounded-2xl border border-indigo-200 bg-indigo-50/20 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white"
                    />
                  </Autocomplete>
                </div>
              )}

              {/* Map Canvas */}
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 relative">
                {!HAS_VALID_GOOGLE_MAPS_KEY ? (
                  <div className="p-8 flex flex-col items-center justify-center text-center h-[350px]">
                    <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                      <AlertTriangle className="text-amber-500" size={24} />
                    </div>
                    <p className="font-bold text-slate-800 text-sm">Interactive Map Unavailable</p>
                    <p className="text-xs text-slate-500 mt-2 max-w-xs leading-normal">
                      Using standard manual coordinate input as Google Maps key is not configured.
                    </p>
                  </div>
                ) : mapLoadError ? (
                  <div className="p-8 flex flex-col items-center justify-center text-center h-[350px]">
                    <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mb-4">
                      <X className="text-rose-500" size={24} />
                    </div>
                    <p className="font-bold text-slate-800 text-sm">Maps Failed to Load</p>
                    <p className="text-xs text-slate-500 mt-2 max-w-xs leading-normal">
                      Check your internet connection or console for API credentials errors.
                    </p>
                  </div>
                ) : isMapLoaded ? (
                  <GoogleMap
                    mapContainerStyle={MAP_CONTAINER_STYLE}
                    center={{ lat: formData.latitude, lng: formData.longitude }}
                    zoom={14}
                    onClick={handleMapClick}
                    onLoad={(map) => (mapRef.current = map)}
                    options={{
                      streetViewControl: false,
                      mapTypeControl: false,
                      fullscreenControl: false,
                    }}
                  >
                    <MarkerF
                      position={{ lat: formData.latitude, lng: formData.longitude }}
                      draggable={true}
                      onDragEnd={handleMarkerDragEnd}
                      title="Drag me to pinpoint station location"
                      icon={{
                        url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
                      }}
                    />
                  </GoogleMap>
                ) : (
                  <div className="h-[350px] flex items-center justify-center text-slate-400 font-bold uppercase text-[10px] tracking-widest animate-pulse">
                    Initializing Maps...
                  </div>
                )}
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 flex justify-between items-center text-xs">
                <div className="text-slate-500 font-semibold uppercase">Current Coordinates:</div>
                <div className="font-mono text-slate-800 font-bold">
                  {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                </div>
              </div>
            </div>

          </div>
        </form>
      )}
    </div>
  );
};

export default ManageEVStations;
