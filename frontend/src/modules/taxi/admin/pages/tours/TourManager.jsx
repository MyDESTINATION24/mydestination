import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Edit2, Compass, Phone, Plus, Save, Search, Trash2, MapPin, Image as ImageIcon, Upload, HelpCircle, Utensils, Calendar } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  createTourDraft,
  deleteAdminTour,
  getAdminTours,
  upsertAdminTour,
} from '../../services/toursService';

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-400/5';
const labelClass = 'mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400';

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`;

const TourManager = ({ mode: modeProp = null }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const isCreate = modeProp === 'create' || location.pathname.endsWith('/create');
  const isEdit = modeProp === 'edit' || location.pathname.includes('/edit/');
  const isList = !isCreate && !isEdit;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tours, setTours] = useState([]);
  const [formData, setFormData] = useState(createTourDraft());

  // Input helpers for destinations (comma-separated string <-> array)
  const [destinationsStr, setDestinationsStr] = useState('');

  const loadTours = async () => {
    try {
      setLoading(true);
      setTours(await getAdminTours());
    } catch {
      toast.error('Failed to load tours.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isList) {
      loadTours();
      return;
    }

    const loadSingle = async () => {
      try {
        setLoading(true);
        const items = await getAdminTours();
        const existing = items.find((item) => String(item.id) === String(id));
        if (existing) {
          setFormData(existing);
          setDestinationsStr((existing.destinations || []).join(', '));
        } else {
          setFormData(createTourDraft());
          setDestinationsStr('');
        }
      } catch {
        toast.error('Failed to load tour details.');
      } finally {
        setLoading(false);
      }
    };

    if (isEdit && id) {
      loadSingle();
    } else {
      setLoading(false);
      setFormData(createTourDraft());
      setDestinationsStr('');
    }
  }, [id, isEdit, isList]);

  const filteredTours = useMemo(
    () =>
      tours.filter((item) =>
        [item.name, item.duration, item.startPoint, item.endPoint, item.overview]
          .join(' ')
          .toLowerCase()
          .includes(searchTerm.trim().toLowerCase())
      ),
    [tours, searchTerm]
  );

  const setField = (key, value) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const handleDestinationsChange = (value) => {
    setDestinationsStr(value);
    const cleaned = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    setField('destinations', cleaned);
  };

  // Itinerary handlers
  const addItineraryItem = () => {
    const nextDay = formData.itinerary.length + 1;
    const suffix = nextDay === 1 ? 'st' : nextDay === 2 ? 'nd' : nextDay === 3 ? 'rd' : 'th';
    const newItem = {
      day: `${nextDay}${suffix} Day`,
      title: '',
      description: '',
    };
    setField('itinerary', [...formData.itinerary, newItem]);
  };

  const removeItineraryItem = (idx) => {
    const updated = formData.itinerary.filter((_, i) => i !== idx);
    setField('itinerary', updated);
  };

  const updateItineraryItem = (idx, field, value) => {
    const updated = formData.itinerary.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    setField('itinerary', updated);
  };

  // Inclusions/Exclusions handlers
  const addInclusion = () => {
    setField('inclusions', [...formData.inclusions, '']);
  };

  const updateInclusion = (idx, value) => {
    const updated = formData.inclusions.map((item, i) => (i === idx ? value : item));
    setField('inclusions', updated);
  };

  const removeInclusion = (idx) => {
    const updated = formData.inclusions.filter((_, i) => i !== idx);
    setField('inclusions', updated);
  };

  const addExclusion = () => {
    setField('exclusions', [...formData.exclusions, '']);
  };

  const updateExclusion = (idx, value) => {
    const updated = formData.exclusions.map((item, i) => (i === idx ? value : item));
    setField('exclusions', updated);
  };

  const removeExclusion = (idx) => {
    const updated = formData.exclusions.filter((_, i) => i !== idx);
    setField('exclusions', updated);
  };

  // Hotels handlers
  const addHotel = () => {
    const newHotel = { destination: '', name: '', mealPlan: 'All Meals' };
    setField('hotels', [...formData.hotels, newHotel]);
  };

  const updateHotel = (idx, field, value) => {
    const updated = formData.hotels.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    setField('hotels', updated);
  };

  const removeHotel = (idx) => {
    const updated = formData.hotels.filter((_, i) => i !== idx);
    setField('hotels', updated);
  };

  // Image upload handlers
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.name.trim() || !formData.overview.trim() || !formData.duration.trim()) {
      toast.error('Tour name, overview, and duration are required.');
      return;
    }

    try {
      setSubmitting(true);
      await upsertAdminTour(formData);
      toast.success(isEdit ? 'Tour updated successfully.' : 'Tour created successfully.');
      navigate('/taxi/admin/tours');
    } catch {
      toast.error('Failed to save tour.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (tourId) => {
    if (!window.confirm('Are you sure you want to delete this tour and all linked bookings?')) return;
    try {
      await deleteAdminTour(tourId);
      toast.success('Tour deleted.');
      loadTours();
    } catch {
      toast.error('Failed to delete tour.');
    }
  };

  if (isList) {
    return (
      <div className="min-h-screen bg-[#F3F4F9] font-sans">
        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-8 py-5">
          <h1 className="text-[14px] font-black uppercase tracking-tight text-slate-800">Tours</h1>
          <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
            <span>Transport</span>
            <ChevronRight size={12} className="opacity-30" />
            <span className="text-gray-500">Tours</span>
          </div>
        </div>

        <div className="p-8 lg:p-10">
          <div className="mx-auto max-w-7xl rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-8 py-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">Tour Catalog</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Manage luxury pilgrim tours, helicopter packages, itineraries, inclusions, hotels, and custom rates.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search tour"
                    className="h-11 rounded-full border border-slate-200 bg-white pl-9 pr-4 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/taxi/admin/tours/create')}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800"
                >
                  <Plus size={16} />
                  Add Tour
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/80">
                  <tr className="text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4">Tour details</th>
                    <th className="px-6 py-4">Helicopter / Transport</th>
                    <th className="px-6 py-4">Duration</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td className="px-6 py-10 text-sm font-semibold text-slate-500" colSpan={6}>Loading tours...</td>
                    </tr>
                  ) : filteredTours.length === 0 ? (
                    <tr>
                      <td className="px-6 py-10 text-sm font-semibold text-slate-500" colSpan={6}>No tours found.</td>
                    </tr>
                  ) : (
                    filteredTours.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                              <Compass size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900">{item.name}</p>
                              <p className="text-xs font-semibold text-slate-500 truncate max-w-md">
                                {item.startPoint} → {item.endPoint}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-sm font-semibold text-slate-600">
                          {item.helicopterType || '--'}
                        </td>
                        <td className="px-6 py-5 text-sm font-semibold text-slate-600">
                          {item.duration}
                        </td>
                        <td className="px-6 py-5 text-sm font-black text-slate-900">
                          {formatCurrency(item.price)} <span className="text-xs font-bold text-slate-400">/ {item.priceType === 'per_day' ? 'day' : 'package'}</span>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ${
                            item.status === 'active' ? 'bg-emerald-50 text-emerald-700' : item.status === 'paused' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => navigate(`/taxi/admin/tours/edit/${item.id}`)}
                              className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="rounded-xl border border-rose-200 p-2 text-rose-500 transition hover:bg-rose-50"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F9] font-sans">
      <div className="flex items-center justify-between border-b border-gray-100 bg-white px-8 py-5">
        <h1 className="text-[14px] font-black uppercase tracking-tight text-slate-800">
          {isEdit ? 'Edit Tour' : 'Add Tour'}
        </h1>
        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
          <span>Tours</span>
          <ChevronRight size={12} className="opacity-30" />
          <span className="text-gray-500">{isEdit ? 'Edit' : 'Create'}</span>
        </div>
      </div>

      <div className="p-8 lg:p-10">
        <form onSubmit={handleSubmit} className="mx-auto max-w-6xl space-y-8">
          <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
            
            {/* Left Column: Form Fields */}
            <div className="space-y-8">
              
              {/* Card 1: General Profile */}
              <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm space-y-6">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Tour Profile</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Define the tour name, detailed overview description, and package details.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className={labelClass}>Tour Name</label>
                    <input className={inputClass} value={formData.name} onChange={(event) => setField('name', event.target.value)} placeholder="e.g. Chardham Yatra by Helicopter" />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className={labelClass}>Overview Description</label>
                    <textarea className={`${inputClass} min-h-28`} value={formData.overview} onChange={(event) => setField('overview', event.target.value)} placeholder="Provide a premium pilgrimage experience overview..." />
                  </div>

                  <div>
                    <label className={labelClass}>Tour Duration</label>
                    <input className={inputClass} value={formData.duration} onChange={(event) => setField('duration', event.target.value)} placeholder="e.g. 06 Days / 05 Nights" />
                    <p className="mt-1 text-[11px] text-slate-400">Shown to customers. Not used for pricing.</p>
                  </div>

                  <div>
                    <label className={labelClass}>Billable Days</label>
                    <input
                      type="number"
                      min="0"
                      className={inputClass}
                      value={formData.durationDays}
                      onChange={(event) => setField('durationDays', event.target.value)}
                      placeholder="e.g. 6"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      {formData.priceType === 'per_day'
                        ? 'Price per day is multiplied by this. Leave 0 to read the day count from the text above.'
                        : 'Ignored while pricing is set to Total Package.'}
                    </p>
                  </div>

                  <div>
                    <label className={labelClass}>Helicopter Type / Fleet</label>
                    <input className={inputClass} value={formData.helicopterType} onChange={(event) => setField('helicopterType', event.target.value)} placeholder="e.g. Bell 407/ AS 350 B3" />
                  </div>

                  <div>
                    <label className={labelClass}>Start Point</label>
                    <input className={inputClass} value={formData.startPoint} onChange={(event) => setField('startPoint', event.target.value)} placeholder="e.g. Dehradun" />
                  </div>

                  <div>
                    <label className={labelClass}>End Point</label>
                    <input className={inputClass} value={formData.endPoint} onChange={(event) => setField('endPoint', event.target.value)} placeholder="e.g. Dehradun" />
                  </div>

                  <div>
                    <label className={labelClass}>Meals Included</label>
                    <input className={inputClass} value={formData.meals} onChange={(event) => setField('meals', event.target.value)} placeholder="e.g. Breakfast, Lunch, Dinner" />
                  </div>

                  <div>
                    <label className={labelClass}>Package Type</label>
                    <input className={inputClass} value={formData.packageType} onChange={(event) => setField('packageType', event.target.value)} placeholder="e.g. All Inclusive (Stay + Transport + Pooja)" />
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelClass}>Destinations Covered (Comma separated)</label>
                    <input className={inputClass} value={destinationsStr} onChange={(event) => handleDestinationsChange(event.target.value)} placeholder="e.g. Dehradun, Kharsali, Yamunotri, Harsil, Kedarnath, Badrinath" />
                  </div>

                  <div>
                    <label className={labelClass}>Price (INR)</label>
                    <input type="number" className={inputClass} value={formData.price} onChange={(event) => setField('price', event.target.value)} placeholder="e.g. 50000" />
                  </div>

                  <div>
                    <label className={labelClass}>Pricing Frequency</label>
                    <select className={inputClass} value={formData.priceType} onChange={(event) => setField('priceType', event.target.value)}>
                      <option value="per_day">Per Day</option>
                      <option value="total">Total Tour Cost</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Status</label>
                    <select className={inputClass} value={formData.status} onChange={(event) => setField('status', event.target.value)}>
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Card 2: Tour Itinerary */}
              <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Daily Itinerary</h2>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      Add step-by-step description of travel routes for each day of yatra.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addItineraryItem}
                    className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 px-3.5 py-2 text-xs font-black text-indigo-700 hover:bg-indigo-100"
                  >
                    <Plus size={14} /> Add Day
                  </button>
                </div>

                {formData.itinerary.length === 0 ? (
                  <p className="text-xs font-bold italic text-slate-400">No itinerary days added yet. Click Add Day above.</p>
                ) : (
                  <div className="space-y-4">
                    {formData.itinerary.map((item, idx) => (
                      <div key={idx} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3 relative group">
                        <button
                          type="button"
                          onClick={() => removeItineraryItem(idx)}
                          className="absolute right-4 top-4 text-slate-400 hover:text-rose-500 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                        <div className="grid gap-3 sm:grid-cols-3 pr-8">
                          <div>
                            <label className={labelClass}>Day Label</label>
                            <input className={inputClass} value={item.day} onChange={(e) => updateItineraryItem(idx, 'day', e.target.value)} placeholder="e.g. 1st Day" />
                          </div>
                          <div className="sm:col-span-2">
                            <label className={labelClass}>Title / Route</label>
                            <input className={inputClass} value={item.title} onChange={(e) => updateItineraryItem(idx, 'title', e.target.value)} placeholder="e.g. Dehradun Arrival" />
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>Day Details</label>
                          <textarea className={`${inputClass} min-h-20`} value={item.description} onChange={(e) => updateItineraryItem(idx, 'description', e.target.value)} placeholder="Details of checking in, helipad transport, hotel stay, puja Darshan..." />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card 3: Inclusions & Exclusions */}
              <div className="grid gap-8 md:grid-cols-2">
                <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-black text-slate-900">Inclusions</h2>
                    </div>
                    <button
                      type="button"
                      onClick={addInclusion}
                      className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.inclusions.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input className={inputClass} value={item} onChange={(e) => updateInclusion(idx, e.target.value)} placeholder="e.g. VIP Pass for Puja Darshan" />
                        <button type="button" onClick={() => removeInclusion(idx)} className="text-slate-400 hover:text-rose-500 shrink-0">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {formData.inclusions.length === 0 && (
                      <p className="text-xs font-semibold text-slate-400 italic">No inclusions listed.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-black text-slate-900">Exclusions</h2>
                    </div>
                    <button
                      type="button"
                      onClick={addExclusion}
                      className="rounded-lg bg-rose-50 p-1.5 text-rose-700 hover:bg-rose-100"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.exclusions.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input className={inputClass} value={item} onChange={(e) => updateExclusion(idx, e.target.value)} placeholder="e.g. Special puja charges" />
                        <button type="button" onClick={() => removeExclusion(idx)} className="text-slate-400 hover:text-rose-500 shrink-0">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {formData.exclusions.length === 0 && (
                      <p className="text-xs font-semibold text-slate-400 italic">No exclusions listed.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 4: Tour Hotels */}
              <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Tour Hotels</h2>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      Specify the accommodation plans for each destination.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addHotel}
                    className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-700 hover:bg-indigo-100"
                  >
                    <Plus size={14} /> Add Hotel
                  </button>
                </div>

                {formData.hotels.length === 0 ? (
                  <p className="text-xs font-bold italic text-slate-400">No hotel information added. Click Add Hotel above.</p>
                ) : (
                  <div className="space-y-4">
                    {formData.hotels.map((item, idx) => (
                      <div key={idx} className="grid gap-3 sm:grid-cols-[1fr_1.25fr_1fr_auto] items-end rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                        <div>
                          <label className={labelClass}>Destination</label>
                          <input className={inputClass} value={item.destination} onChange={(e) => updateHotel(idx, 'destination', e.target.value)} placeholder="e.g. Kharsali" />
                        </div>
                        <div>
                          <label className={labelClass}>Hotel Type / Recommendations</label>
                          <input className={inputClass} value={item.name} onChange={(e) => updateHotel(idx, 'name', e.target.value)} placeholder="e.g. Yamunotri Cottages / Kriti Resort" />
                        </div>
                        <div>
                          <label className={labelClass}>Meal Plan</label>
                          <input className={inputClass} value={item.mealPlan} onChange={(e) => updateHotel(idx, 'mealPlan', e.target.value)} placeholder="e.g. All Meals" />
                        </div>
                        <button type="button" onClick={() => removeHotel(idx)} className="mb-3 text-slate-400 hover:text-rose-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Right Column: Snapshots & Media */}
            <div className="space-y-8">
              
              {/* Media Upload (Route Map / Featured Image) */}
              <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-black text-slate-900 font-bold">Route Map / Featured Image</h3>
                  <p className="text-xs text-slate-400 font-medium">Add visual route maps or featured banner photo for this tour.</p>
                </div>

                <div className="group relative overflow-hidden rounded-[32px] border-2 border-dashed border-slate-200 bg-slate-50 transition-all hover:border-slate-300">
                  {formData.image ? (
                    <div className="relative h-48 w-full p-2">
                      <img src={formData.image} alt="Route Map" className="h-full w-full rounded-[24px] object-cover" />
                      <button
                        type="button"
                        onClick={() => setField('image', '')}
                        className="absolute right-6 top-6 rounded-full bg-white/90 p-2 text-rose-500 shadow-xl backdrop-blur-md transition hover:bg-white active:scale-95"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex h-48 cursor-pointer flex-col items-center justify-center gap-3">
                      <div className="rounded-2xl bg-white p-4 text-slate-400 shadow-sm transition group-hover:scale-110 group-hover:text-slate-600">
                        <Upload size={24} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-black text-slate-900">Upload Route Map Image</p>
                        <p className="mt-1 text-[11px] font-bold text-slate-400 uppercase tracking-widest">JPG, PNG up to 3MB</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    </label>
                  )}
                  {formData.image && (
                    <input type="file" className="absolute inset-0 cursor-pointer opacity-0" accept="image/*" onChange={handleImageChange} />
                  )}
                </div>
              </div>

              {/* Gallery Photos */}
              <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-black text-slate-900">Tour Gallery</h3>
                  <p className="text-xs text-slate-400 font-medium font-bold">Add scenic views or hotel accommodation images.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {(formData.gallery || []).map((img, idx) => (
                    <div key={idx} className="group relative aspect-square overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
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
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-[24px] border-2 border-dashed border-slate-200 bg-slate-50 transition-all hover:border-slate-300 hover:bg-slate-100/50 shadow-sm">
                    <div className="rounded-xl bg-white p-2.5 text-slate-400 shadow-sm">
                      <Plus size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center px-2">Add Gallery Photo</span>
                    <input type="file" className="hidden" accept="image/*" multiple onChange={handleGalleryChange} />
                  </label>
                </div>
              </div>

              {/* Premium Tour Preview Snapshot Card */}
              <div className="rounded-[32px] border border-slate-200 bg-slate-900 p-8 text-white shadow-xl space-y-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white/10 p-3">
                    <Compass size={20} className="text-indigo-400 animate-spin-slow" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black">Tour Live Preview</h3>
                    <p className="text-sm font-medium text-slate-300">Live configuration summary of details.</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-white/10 p-3">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-300 font-bold">Duration</p>
                        <p className="mt-1 text-base font-black text-white">{formData.duration || '--'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-white/10 p-3">
                        <Utensils size={18} />
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-300 font-bold">Meal Inclusion</p>
                        <p className="mt-1 text-sm font-bold text-white">{formData.meals || '--'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-300 font-bold">Package Cost</p>
                    <p className="mt-3 text-3xl font-black text-white">{formatCurrency(formData.price)}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-300">
                      Cost type: <span className="font-black text-emerald-400 capitalize">{formData.priceType.replace('_', ' ')}</span>
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/taxi/admin/tours')}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800 disabled:opacity-60"
            >
              <Save size={16} />
              {submitting ? 'Saving...' : isEdit ? 'Update Tour Package' : 'Create Tour Package'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TourManager;
