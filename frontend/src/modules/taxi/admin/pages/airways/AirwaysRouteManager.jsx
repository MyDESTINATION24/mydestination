import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Edit2, PlaneTakeoff, Plus, Route, Save, Search, Trash2, Image as ImageIcon, Upload, Eye, Clock, ArrowRight, ChevronLeft } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  createAirwayRouteDraft,
  deleteAdminAirwayRoute,
  getAdminAirwayRoutes,
  getAdminAirways,
  upsertAdminAirwayRoute,
} from '../../services/airwaysService';

const DAY_OPTIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-400/5';
const labelClass = 'mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400';

const AirwaysRouteManager = ({ mode: modeProp = null }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const isCreate = modeProp === 'create' || location.pathname.endsWith('/create');
  const isEdit = modeProp === 'edit' || location.pathname.includes('/edit/');
  const isDetails = modeProp === 'details' || location.pathname.includes('/details/');
  const isList = !isCreate && !isEdit && !isDetails;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [airways, setAirways] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [formData, setFormData] = useState(createAirwayRouteDraft());

  const loadData = async () => {
    try {
      setLoading(true);
      const [airwayItems, routeItems] = await Promise.all([getAdminAirways(), getAdminAirwayRoutes()]);
      setAirways(airwayItems);
      setRoutes(routeItems);
    } catch {
      toast.error('Failed to load airway routes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isList) {
      loadData();
      return;
    }

    const loadSingle = async () => {
      try {
        setLoading(true);
        const [airwayItems, routeItems] = await Promise.all([getAdminAirways(), getAdminAirwayRoutes()]);
        setAirways(airwayItems);
        const existing = routeItems.find((item) => String(item.id) === String(id));
        setFormData(existing || createAirwayRouteDraft());
      } catch {
        toast.error('Failed to load route.');
      } finally {
        setLoading(false);
      }
    };

    loadSingle();
  }, [id, isCreate, isList, isDetails]);

  const airwayMap = useMemo(
    () => new Map(airways.map((item) => [item.id, item])),
    [airways],
  );

  const filteredRoutes = useMemo(
    () =>
      routes.filter((item) =>
        [item.routeName, item.flightNumber, item.originAirport, item.destinationAirport]
          .join(' ')
          .toLowerCase()
          .includes(searchTerm.trim().toLowerCase()),
      ),
    [routes, searchTerm],
  );

  const setField = (key, value) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const toggleAirway = (airwayId) => {
    setFormData((current) => {
      const currentIds = Array.isArray(current.airwayIds) && current.airwayIds.length > 0
        ? current.airwayIds
        : current.airwayId
          ? [current.airwayId]
          : [];
      const nextIds = currentIds.includes(airwayId)
        ? currentIds.filter((item) => item !== airwayId)
        : [...currentIds, airwayId];

      return {
        ...current,
        airwayIds: nextIds,
        airwayId: nextIds[0] || '',
      };
    });
  };

  const toggleDay = (day) => {
    setFormData((current) => ({
      ...current,
      operatingDays: current.operatingDays.includes(day)
        ? current.operatingDays.filter((item) => item !== day)
        : [...current.operatingDays, day],
    }));
  };
  
  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setField('image', reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((current) => ({
          ...current,
          gallery: [...(current.gallery || []), reader.result],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeGalleryImage = (index) => {
    setFormData((current) => ({
      ...current,
      gallery: (current.gallery || []).filter((_, i) => i !== index),
    }));
  };

  const selectedAirwayIds = useMemo(
    () => (Array.isArray(formData.airwayIds) && formData.airwayIds.length > 0
      ? formData.airwayIds
      : formData.airwayId
        ? [formData.airwayId]
        : []),
    [formData.airwayId, formData.airwayIds],
  );

  const selectedAirways = useMemo(
    () => selectedAirwayIds.map((item) => airwayMap.get(item)).filter(Boolean),
    [airwayMap, selectedAirwayIds],
  );

  const selectedAirway = selectedAirways[0] || null;

  useEffect(() => {
    if (selectedAirways.length === 0) return;

    setFormData((current) => ({
      ...current,
      seatInventory: selectedAirways.flatMap((airway) => airway.seatClasses || []).reduce((acc, seatClass) => {
        acc[seatClass.cabin] = Number(current.seatInventory?.[seatClass.cabin] ?? seatClass.seatCount ?? 0);
        return acc;
      }, {}),
    }));
  }, [selectedAirwayIds.join('|')]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (selectedAirwayIds.length === 0 || !formData.routeName.trim() || !formData.flightNumber.trim()) {
      toast.error('At least one airway, route name, and flight number are required.');
      return;
    }

    try {
      setSubmitting(true);
      await upsertAdminAirwayRoute({
        ...formData,
        airwayIds: selectedAirwayIds,
        airwayId: selectedAirwayIds[0] || '',
        distanceKm: Number(formData.distanceKm || 0),
        durationMinutes: Number(formData.durationMinutes || 0),
      });
      toast.success(isEdit ? 'Route updated.' : 'Route created.');
      navigate('/taxi/admin/airways/routes');
    } catch {
      toast.error('Failed to save airway route.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (routeId) => {
    if (!window.confirm('Delete this airway route?')) return;
    try {
      await deleteAdminAirwayRoute(routeId);
      toast.success('Route deleted.');
      loadData();
    } catch {
      toast.error('Failed to delete route.');
    }
  };

  if (isList) {
    return (
      <div className="min-h-screen bg-[#F3F4F9] font-sans pb-12">
        <div className="border-b border-gray-100 bg-white px-8 py-5 flex items-center justify-between">
          <h1 className="text-[14px] font-black uppercase tracking-tight text-slate-800">Airway Routes</h1>
          <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
            <span>Airways</span>
            <ChevronRight size={12} className="opacity-30" />
            <span className="text-gray-500">Routes</span>
          </div>
        </div>

        <div className="p-8 lg:p-10">
          <div className="mx-auto max-w-7xl rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-8 py-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">Route Matrix</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Build separate airway sectors, assign flights, and manage class-wise route inventory.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search route"
                    className="h-11 rounded-full border border-slate-200 bg-white pl-9 pr-4 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/taxi/admin/airways/routes/create')}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800"
                >
                  <Plus size={16} />
                  Add Route
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Flight / Route</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Airlines</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Sector</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Departure & Arrival</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Distance & Duration</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Operating Days</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-10 text-center text-sm font-semibold text-slate-500">
                        <div className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin"></span>
                          Loading airway routes...
                        </div>
                      </td>
                    </tr>
                  ) : filteredRoutes.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-10 text-center text-sm font-semibold text-slate-500">
                        No airway routes found.
                      </td>
                    </tr>
                  ) : (
                    filteredRoutes.map((item) => {
                      const routeAirways = (Array.isArray(item.airwayIds) && item.airwayIds.length > 0
                        ? item.airwayIds
                        : item.airwayId
                          ? [item.airwayId]
                          : [])
                        .map((entry) => airwayMap.get(entry))
                        .filter(Boolean);
                      
                      const statusColors = {
                        scheduled: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                        seasonal: 'bg-amber-50 text-amber-700 border-amber-100',
                        paused: 'bg-rose-50 text-rose-700 border-rose-100',
                      };
                      const statusClass = statusColors[item.routeStatus] || 'bg-slate-50 text-slate-700 border-slate-100';

                      return (
                        <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {item.image ? (
                                <img src={item.image} alt={item.routeName} className="h-10 w-10 rounded-xl object-cover border border-slate-100 shrink-0 animate-in fade-in zoom-in-95 duration-200" />
                              ) : (
                                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100 shrink-0">
                                  <PlaneTakeoff size={18} />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-slate-900 text-[13px]">{item.routeName}</p>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{item.flightNumber}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="max-w-[150px] truncate">
                              <p className="text-[12px] font-bold text-slate-700">
                                {routeAirways.length > 0 ? routeAirways.map((entry) => entry.airlineName).join(', ') : 'None'}
                              </p>
                              <p className="text-[10px] text-slate-400 font-semibold truncate">
                                {routeAirways.length > 0 ? routeAirways.map((entry) => entry.aircraftModel).join(', ') : ''}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700">
                              <span className="font-extrabold text-slate-900">{item.originAirport}</span>
                              <ArrowRight size={12} className="text-slate-400" />
                              <span className="font-extrabold text-slate-900">{item.destinationAirport}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-[12px] font-bold text-slate-800 flex items-center gap-1.5">
                                <Clock size={11} className="text-indigo-500" />
                                {item.departureTime} - {item.arrivalTime}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-[12px] font-semibold text-slate-700">{item.distanceKm} km</p>
                              <p className="text-[10px] text-slate-400 font-bold">{item.durationMinutes} mins</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1 max-w-[150px]">
                              {(item.operatingDays || []).map((day) => (
                                <span key={day} className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 uppercase">
                                  {day}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusClass}`}>
                              {item.routeStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => navigate(`/taxi/admin/airways/routes/details/${item.id}`)}
                                className="rounded-lg border border-slate-100 bg-white p-1.5 text-slate-500 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/10 active:scale-95"
                                title="View Details"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => navigate(`/taxi/admin/airways/routes/edit/${item.id}`)}
                                className="rounded-lg border border-slate-100 bg-white p-1.5 text-slate-500 shadow-sm transition hover:border-amber-200 hover:text-amber-600 hover:bg-amber-50/10 active:scale-95"
                                title="Edit"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(item.id)}
                                className="rounded-lg border border-rose-100 bg-white p-1.5 text-rose-500 shadow-sm transition hover:bg-rose-50 hover:text-rose-700 active:scale-95"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isDetails) {
    const routeAirways = (Array.isArray(formData.airwayIds) && formData.airwayIds.length > 0
      ? formData.airwayIds
      : formData.airwayId
        ? [formData.airwayId]
        : [])
      .map((entry) => airwayMap.get(entry))
      .filter(Boolean);

    const statusColors = {
      scheduled: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      seasonal: 'bg-amber-50 text-amber-700 border-amber-100',
      paused: 'bg-rose-50 text-rose-700 border-rose-100',
    };
    const statusClass = statusColors[formData.routeStatus] || 'bg-slate-50 text-slate-700 border-slate-100';

    return (
      <div className="min-h-screen bg-[#F3F4F9] font-sans pb-12 animate-in fade-in duration-300">
        <div className="border-b border-gray-100 bg-white px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/taxi/admin/airways/routes')}
              className="flex items-center gap-1.5 text-xs text-slate-500 font-bold hover:text-slate-900 transition mr-2 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 active:scale-95"
            >
              <ChevronLeft size={16} /> Back to Routes
            </button>
            <h1 className="text-[14px] font-black uppercase tracking-tight text-slate-800">Route Details</h1>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
            <span>Airways</span>
            <ChevronRight size={12} className="opacity-30" />
            <span>Routes</span>
            <ChevronRight size={12} className="opacity-30" />
            <span className="text-gray-500">Details</span>
          </div>
        </div>

        <div className="p-8 lg:p-10 max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <span className="w-8 h-8 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin"></span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header card */}
              <div className="bg-white rounded-[32px] border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  {formData.image ? (
                    <img src={formData.image} alt={formData.routeName} className="h-20 w-20 rounded-[24px] object-cover border border-slate-100 shadow-sm" />
                  ) : (
                    <div className="h-20 w-20 rounded-[24px] bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm shrink-0">
                      <PlaneTakeoff size={36} />
                    </div>
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusClass}`}>
                        {formData.routeStatus}
                      </span>
                      <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-0.5 tracking-wider">
                        {formData.flightNumber}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 leading-tight">{formData.routeName}</h2>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">
                      ID: {formData.id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/taxi/admin/airways/routes/edit/${formData.id}`)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 shadow-sm active:scale-95"
                  >
                    <Edit2 size={16} />
                    Edit Route
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!window.confirm('Delete this airway route?')) return;
                      try {
                        await deleteAdminAirwayRoute(formData.id);
                        toast.success('Route deleted.');
                        navigate('/taxi/admin/airways/routes');
                      } catch {
                        toast.error('Failed to delete route.');
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl bg-rose-50 border border-rose-100 px-5 py-3 text-sm font-black text-rose-600 transition hover:bg-rose-100 shadow-sm active:scale-95"
                  >
                    <Trash2 size={16} />
                    Delete Route
                  </button>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Columns (Sector Details & parameters) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Route Parameters / Info */}
                  <div className="bg-white rounded-[32px] border border-slate-200 p-6 sm:p-8 shadow-sm">
                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-4 mb-6">Route Parameters</h3>
                    
                    {/* Connection illustration */}
                    <div className="bg-slate-50/70 rounded-3xl p-6 border border-slate-100 mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="text-center sm:text-left">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Origin</p>
                        <p className="text-3xl font-black text-slate-900 mt-1">{formData.originAirport}</p>
                      </div>
                      <div className="flex-1 flex items-center justify-center gap-2">
                        <div className="h-0.5 bg-slate-200 flex-1 relative hidden sm:block">
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-300"></div>
                        </div>
                        <div className="bg-white p-3 rounded-full border border-slate-200 text-slate-500 shadow-sm">
                          <PlaneTakeoff size={20} className="rotate-45" />
                        </div>
                        <div className="h-0.5 bg-slate-200 flex-1 relative hidden sm:block">
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-300"></div>
                        </div>
                      </div>
                      <div className="text-center sm:text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Destination</p>
                        <p className="text-3xl font-black text-slate-900 mt-1">{formData.destinationAirport}</p>
                      </div>
                    </div>

                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/30 p-4">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Departure</p>
                        <p className="mt-2 text-base font-black text-slate-900 flex items-center gap-1.5">
                          <Clock size={16} className="text-indigo-500" />
                          {formData.departureTime}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/30 p-4">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Arrival</p>
                        <p className="mt-2 text-base font-black text-slate-900 flex items-center gap-1.5">
                          <Clock size={16} className="text-indigo-500" />
                          {formData.arrivalTime}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/30 p-4">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Distance</p>
                        <p className="mt-2 text-base font-black text-slate-900">{formData.distanceKm} km</p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/30 p-4">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Duration</p>
                        <p className="mt-2 text-base font-black text-slate-900">{formData.durationMinutes} mins</p>
                      </div>
                    </div>

                    {/* Operating Days */}
                    <div className="mt-8">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">Operating Days</p>
                      <div className="flex flex-wrap gap-2">
                        {DAY_OPTIONS.map((day) => {
                          const active = formData.operatingDays.includes(day);
                          return (
                            <span
                              key={day}
                              className={`rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-wider border ${
                                active
                                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                  : 'bg-white border-slate-100 text-slate-300'
                              }`}
                            >
                              {day}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Notes */}
                    {formData.notes && (
                      <div className="mt-8 border-t border-slate-100 pt-6">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Route Notes / Remarks</p>
                        <p className="text-sm font-semibold text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">{formData.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Route Gallery */}
                  {formData.gallery && formData.gallery.length > 0 && (
                    <div className="bg-white rounded-[32px] border border-slate-200 p-6 sm:p-8 shadow-sm">
                      <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-4 mb-6">Route Gallery</h3>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                        {formData.gallery.map((img, idx) => (
                          <div key={idx} className="group relative aspect-square overflow-hidden rounded-[24px] border border-slate-200 bg-white">
                            <img src={img} alt={`Gallery ${idx}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Columns (Assigned Airway details & seat inventory) */}
                <div className="space-y-6">
                  {/* Airway Details */}
                  <div className="bg-white rounded-[32px] border border-slate-200 p-6 sm:p-8 shadow-sm">
                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-4 mb-6">Assigned Airway</h3>
                    {routeAirways.length === 0 ? (
                      <div className="text-sm font-semibold text-slate-500">No airway operator assigned.</div>
                    ) : (
                      <div className="space-y-6">
                        {routeAirways.map((airway, idx) => (
                          <div key={airway.id || idx} className={`${idx > 0 ? 'border-t border-slate-100 pt-6' : ''}`}>
                            <div className="flex items-center gap-3">
                              {airway.image ? (
                                <img src={airway.image} alt={airway.airlineName} className="h-12 w-12 rounded-2xl object-cover border border-slate-100 shadow-sm" />
                              ) : (
                                <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                                  <PlaneTakeoff size={20} />
                                </div>
                              )}
                              <div>
                                <h4 className="font-extrabold text-slate-900 text-[14px] leading-tight">{airway.airlineName}</h4>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{airway.airlineCode} | {airway.aircraftModel}</p>
                              </div>
                            </div>

                            <div className="mt-5 space-y-3.5 text-[12px] font-semibold text-slate-600">
                              {airway.registrationCode && (
                                <div className="flex justify-between border-b border-slate-50 pb-2">
                                  <span className="text-slate-400">Registration Code</span>
                                  <span className="text-slate-900 font-extrabold">{airway.registrationCode}</span>
                                </div>
                              )}
                              {airway.baseAirport && (
                                <div className="flex justify-between border-b border-slate-50 pb-2">
                                  <span className="text-slate-400">Base Airport</span>
                                  <span className="text-slate-900 font-extrabold">{airway.baseAirport}</span>
                                </div>
                              )}
                              {airway.pilotName && (
                                <div className="flex justify-between border-b border-slate-50 pb-2">
                                  <span className="text-slate-400">Pilot Name</span>
                                  <span className="text-slate-900 font-extrabold">{airway.pilotName}</span>
                                </div>
                              )}
                              {airway.pilotPhone && (
                                <div className="flex justify-between border-b border-slate-50 pb-2">
                                  <span className="text-slate-400">Pilot Contact</span>
                                  <span className="text-slate-900 font-extrabold">{airway.pilotPhone}</span>
                                </div>
                              )}
                              <div className="flex justify-between border-b border-slate-50 pb-2">
                                <span className="text-slate-400">Base Price</span>
                                <span className="text-slate-900 font-extrabold text-indigo-600">₹{airway.basePrice}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-50 pb-2">
                                <span className="text-slate-400">Service Tax</span>
                                <span className="text-slate-900 font-extrabold">{airway.serviceTaxPercent}%</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Seat Inventory Card */}
                  <div className="bg-white rounded-[32px] border border-slate-200 p-6 sm:p-8 shadow-sm">
                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-4 mb-6">Seat Inventory</h3>
                    {Object.keys(formData.seatInventory || {}).length === 0 ? (
                      <div className="text-sm font-semibold text-slate-500">No seat inventory allocated.</div>
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(formData.seatInventory || {}).map(([cabin, count]) => (
                          <div key={cabin} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 flex items-center justify-between shadow-sm">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Cabin Class</p>
                              <p className="mt-1 text-sm font-extrabold text-slate-800">{cabin}</p>
                            </div>
                            <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 text-center shadow-sm">
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Allocated</p>
                              <p className="mt-0.5 text-base font-black text-slate-900">{count} Seats</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F9] font-sans">
      <div className="border-b border-gray-100 bg-white px-8 py-5 flex items-center justify-between">
        <h1 className="text-[14px] font-black uppercase tracking-tight text-slate-800">
          {isEdit ? 'Edit Airway Route' : 'Create Airway Route'}
        </h1>
        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
          <span>Airways</span>
          <ChevronRight size={12} className="opacity-30" />
          <span className="text-gray-500">Route Form</span>
        </div>
      </div>

      <div className="p-8 lg:p-10">
        <form onSubmit={handleSubmit} className="mx-auto max-w-5xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
              <Route size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Route Configuration</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Create separate airways routes, assign flights, and set class-specific route inventory.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>Airways</label>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-wrap gap-2">
                  {airways.map((item) => {
                    const active = selectedAirwayIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleAirway(item.id)}
                        className={`rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-wider transition ${
                          active
                            ? 'bg-slate-900 text-white'
                            : 'border border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {item.airlineName} ({item.airlineCode})
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div>
              <label className={labelClass}>Flight Number</label>
              <input className={inputClass} value={formData.flightNumber} onChange={(event) => setField('flightNumber', event.target.value.toUpperCase())} />
            </div>
            <div>
              <label className={labelClass}>Route Name</label>
              <input className={inputClass} value={formData.routeName} onChange={(event) => setField('routeName', event.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Route Status</label>
              <select className={inputClass} value={formData.routeStatus} onChange={(event) => setField('routeStatus', event.target.value)}>
                <option value="scheduled">Scheduled</option>
                <option value="seasonal">Seasonal</option>
                <option value="paused">Paused</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Popular Sector</label>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-sky-500"
                  checked={Boolean(formData.isFeatured)}
                  onChange={(event) => setField('isFeatured', event.target.checked)}
                />
                <span className="text-sm font-semibold text-slate-700">
                  Show on the Airways home screen
                </span>
              </label>
            </div>
            <div>
              <label className={labelClass}>Origin Airport</label>
              <input className={inputClass} value={formData.originAirport} onChange={(event) => setField('originAirport', event.target.value.toUpperCase())} />
            </div>
            <div>
              <label className={labelClass}>Destination Airport</label>
              <input className={inputClass} value={formData.destinationAirport} onChange={(event) => setField('destinationAirport', event.target.value.toUpperCase())} />
            </div>
            <div>
              <label className={labelClass}>Departure Time</label>
              <input type="time" className={inputClass} value={formData.departureTime} onChange={(event) => setField('departureTime', event.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Arrival Time</label>
              <input type="time" className={inputClass} value={formData.arrivalTime} onChange={(event) => setField('arrivalTime', event.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Distance (km)</label>
              <input type="number" className={inputClass} value={formData.distanceKm} onChange={(event) => setField('distanceKm', event.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Duration (mins)</label>
              <input type="number" className={inputClass} value={formData.durationMinutes} onChange={(event) => setField('durationMinutes', event.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Route Image</label>
              <div className="group relative mt-2 overflow-hidden rounded-[32px] border-2 border-dashed border-slate-200 bg-slate-50 transition-all hover:border-slate-300">
                {formData.image ? (
                  <div className="relative h-48 w-full p-2">
                    <img src={formData.image} alt="Route" className="h-full w-full rounded-[24px] object-cover" />
                    <button
                      type="button"
                      onClick={() => setField('image', '')}
                      className="absolute right-6 top-6 rounded-full bg-white/90 p-2 text-rose-500 shadow-xl backdrop-blur-md transition hover:bg-white active:scale-95"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 pointer-events-none">
                      <p className="rounded-full bg-white/90 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-xl backdrop-blur-md">
                        Change Image
                      </p>
                    </div>
                  </div>
                ) : (
                  <label className="flex h-48 cursor-pointer flex-col items-center justify-center gap-3">
                    <div className="rounded-2xl bg-white p-4 text-slate-400 shadow-sm transition group-hover:scale-110 group-hover:text-slate-600">
                      <Upload size={24} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-black text-slate-900">Upload Route Banner</p>
                      <p className="mt-1 text-[11px] font-bold text-slate-400 uppercase tracking-widest">JPG, PNG up to 2MB</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
                )}
                {formData.image && (
                   <input type="file" className="absolute inset-0 cursor-pointer opacity-0" accept="image/*" onChange={handleImageChange} />
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Route Gallery</label>
              <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {(formData.gallery || []).map((img, idx) => (
                  <div key={idx} className="group relative aspect-square overflow-hidden rounded-[24px] border border-slate-200 bg-white">
                    <img src={img} alt={`Gallery ${idx}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(idx)}
                      className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-rose-500 shadow-lg backdrop-blur-md transition hover:bg-white active:scale-90"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-[24px] border-2 border-dashed border-slate-200 bg-slate-50 transition-all hover:border-slate-300 hover:bg-slate-100/50">
                  <div className="rounded-xl bg-white p-2.5 text-slate-400 shadow-sm">
                    <Plus size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Add Photo</span>
                  <input type="file" className="hidden" accept="image/*" multiple onChange={handleGalleryChange} />
                </label>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <label className={labelClass}>Operating Days</label>
            <div className="flex flex-wrap gap-2">
              {DAY_OPTIONS.map((day) => {
                const active = formData.operatingDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-wider transition ${
                      active ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedAirway ? (
            <div className="mt-8 rounded-[28px] border border-slate-200 bg-slate-50/70 p-6">
              <h3 className="text-sm font-black text-slate-900">Seat Inventory Allocation</h3>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Allocate cabin inventory for this route using the airway’s seat classes.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {selectedAirways
                  .flatMap((airway) => airway.seatClasses || [])
                  .filter((seatClass, index, array) => array.findIndex((entry) => entry.cabin === seatClass.cabin) === index)
                  .map((seatClass) => (
                  <div key={seatClass.id}>
                    <label className={labelClass}>{seatClass.cabin}</label>
                    <input
                      type="number"
                      className={inputClass}
                      value={formData.seatInventory?.[seatClass.cabin] ?? 0}
                      onChange={(event) =>
                        setField('seatInventory', {
                          ...(formData.seatInventory || {}),
                          [seatClass.cabin]: Number(event.target.value || 0),
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/taxi/admin/airways/routes')}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800 disabled:opacity-60"
            >
              <Save size={16} />
              {submitting ? 'Saving...' : isEdit ? 'Update Route' : 'Create Route'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AirwaysRouteManager;
