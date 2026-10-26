import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, Save, X, ArrowUp, ArrowDown, Eye, EyeOff, Smartphone, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../../shared/api/runtimeConfig';
import { getStoredAdminToken } from '../../admin/store/adminStore';
import { SERVICE_THEMES, SERVICE_ICONS, toServiceCard } from '../../../services/appServices';
import { ServiceCard } from '../../shared/pages/SuperAppDashboard';

// CMS Admin -> App Services: the "Explore Services" cards on the app home screen.

const authHeaders = (extra = {}) => ({ headers: { Authorization: `Bearer ${getStoredAdminToken()}`, ...extra } });

// Common destinations inside the app, so admins rarely need to type a path.
const LINK_PRESETS = [
  { label: 'Hotels', path: '/hotels' },
  { label: 'Cab booking', path: '/taxi/user' },
  { label: 'Wedding planner', path: '/wedding' },
  { label: 'Wedding destinations', path: '/wedding/destinations' },
  { label: 'Helicopter booking', path: '/taxi/user/airways' },
  { label: 'Char Dham / tours', path: '/taxi/user/tours' },
  { label: 'Bus booking', path: '/taxi/user/bus' },
  { label: 'Rentals', path: '/taxi/user/rental' },
];

const EMPTY = {
  title: '', description: '', path: '/hotels', ctaText: 'Explore',
  theme: 'emerald', icon: 'building', image: '', imagePos: 'center', isActive: true,
};

const inputClass = 'w-full bg-gray-50 border border-gray-200 rounded-sm px-4 py-2.5 outline-none focus:border-emerald-800 transition text-sm text-gray-900 font-medium';
const labelClass = 'text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block';

const PhonePreview = ({ card }) => (
  <div className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden">
    <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
      <Smartphone size={14} className="text-emerald-600" /> Live preview (app home screen)
    </div>
    <div className="p-5 bg-[#F7F9FB] flex justify-center">
      <div className="w-full max-w-[380px] pointer-events-none select-none">
        <motion.div initial="show" animate="show">
          <ServiceCard service={card} reduceMotion onClick={() => {}} />
        </motion.div>
      </div>
    </div>
  </div>
);

const CMSAppServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | service
  const [form, setForm] = useState(EMPTY);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [homeText, setHomeText] = useState({ greetingSubtitle: '', sectionTitle: '' });
  const [savingText, setSavingText] = useState(false);

  const saveHomeText = async (e) => {
    e.preventDefault();
    if (!homeText.sectionTitle.trim()) { toast.error('Section title is required'); return; }
    setSavingText(true);
    try {
      const res = await axios.put(`${API_BASE_URL}/app-services/admin/settings`, homeText, authHeaders());
      if (res.data?.settings) setHomeText(res.data.settings);
      toast.success('Text saved');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save text');
    } finally {
      setSavingText(false);
    }
  };

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/app-services/admin/all`, authHeaders());
      setServices(res.data?.data || []);
      if (res.data?.settings) setHomeText(res.data.settings);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load services');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing('new'); setForm(EMPTY); setImageFile(null); setImagePreview('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const openEdit = (service) => {
    setEditing(service);
    setForm({
      title: service.title || '', description: service.description || '', path: service.path || '/',
      ctaText: service.ctaText || 'Explore', theme: service.theme || 'emerald', icon: service.icon || 'compass',
      image: service.image || '', imagePos: service.imagePos || 'center', isActive: service.isActive !== false,
    });
    setImageFile(null);
    setImagePreview(toServiceCard(service).image);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const close = () => { setEditing(null); setForm(EMPTY); setImageFile(null); setImagePreview(''); };

  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!/^\/(?!\/)\S*$/.test(form.path) && !/^https:\/\/\S+$/i.test(form.path)) {
      toast.error('Link must start with / (e.g. /hotels) or https://'); return;
    }
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === 'image' && imageFile) return;
      data.append(key, value);
    });
    if (imageFile) data.append('image', imageFile);
    setSaving(true);
    const t = toast.loading('Saving...');
    try {
      const config = authHeaders({ 'Content-Type': 'multipart/form-data' });
      if (editing === 'new') await axios.post(`${API_BASE_URL}/app-services/admin`, data, config);
      else await axios.put(`${API_BASE_URL}/app-services/admin/${editing._id}`, data, config);
      toast.success(editing === 'new' ? 'Service added' : 'Service updated', { id: t });
      close();
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save', { id: t });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (service) => {
    try {
      await axios.put(`${API_BASE_URL}/app-services/admin/${service._id}`, { isActive: !service.isActive }, authHeaders());
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };

  const remove = async (service) => {
    if (!window.confirm(`Delete "${service.title}" from the app home screen?`)) return;
    try {
      await axios.delete(`${API_BASE_URL}/app-services/admin/${service._id}`, authHeaders());
      toast.success('Service deleted');
      if (editing?._id === service._id) close();
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const move = async (index, direction) => {
    const next = [...services];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setServices(next);
    try {
      await axios.put(`${API_BASE_URL}/app-services/admin/reorder`, { ids: next.map((s) => s._id) }, authHeaders());
    } catch (error) {
      toast.error('Could not save the new order');
      load();
    }
  };

  const previewCard = toServiceCard({
    ...form,
    key: editing && editing !== 'new' ? editing.key : 'preview',
    image: imagePreview || form.image,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-widest uppercase">App Services</h2>
          <p className="text-sm text-gray-500">The “Explore Services” cards on the app home screen. Add, edit, hide or reorder them.</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-5 py-3 rounded-sm transition">
          <Plus size={18} /> Add Service
        </button>
      </div>

      <form onSubmit={saveHomeText} className="bg-white border border-gray-100 rounded-sm p-5 shadow-sm grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
        <div>
          <label className={labelClass}>Greeting line (under “Hi, name!”)</label>
          <input className={inputClass} maxLength={80} value={homeText.greetingSubtitle} onChange={(e) => setHomeText({ ...homeText, greetingSubtitle: e.target.value })} placeholder="What are you looking for today?" />
        </div>
        <div>
          <label className={labelClass}>Section title</label>
          <input className={inputClass} maxLength={80} value={homeText.sectionTitle} onChange={(e) => setHomeText({ ...homeText, sectionTitle: e.target.value })} placeholder="Explore Services" />
        </div>
        <button type="submit" disabled={savingText} className="bg-gray-900 hover:bg-black disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-sm transition flex items-center gap-2">
          <Save size={16} /> Save text
        </button>
      </form>

      {editing ? (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 items-start">
          <form onSubmit={save} className="bg-white border border-gray-100 rounded-sm p-6 shadow-sm space-y-5">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              {editing === 'new' ? <Plus size={18} className="text-emerald-500" /> : <Edit2 size={18} className="text-emerald-500" />}
              {editing === 'new' ? 'New Service' : `Edit “${editing.title}”`}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Title *</label>
                <input className={inputClass} value={form.title} maxLength={40} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Hotels & Stays" />
              </div>
              <div>
                <label className={labelClass}>Button text</label>
                <input className={inputClass} value={form.ctaText} maxLength={20} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} placeholder="Explore" />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Description</label>
                <textarea className={`${inputClass} min-h-[70px]`} maxLength={140} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="One short line about this service" />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Opens (link)</label>
                <div className="flex flex-col md:flex-row gap-2">
                  <select
                    className={`${inputClass} md:w-56`}
                    value={LINK_PRESETS.some((l) => l.path === form.path) ? form.path : ''}
                    onChange={(e) => e.target.value && setForm({ ...form, path: e.target.value })}
                  >
                    <option value="">Custom link…</option>
                    {LINK_PRESETS.map((l) => <option key={l.path} value={l.path}>{l.label}</option>)}
                  </select>
                  <input className={inputClass} value={form.path} onChange={(e) => setForm({ ...form, path: e.target.value })} placeholder="/hotels or https://…" />
                </div>
              </div>

              <div>
                <label className={labelClass}>Colour</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(SERVICE_THEMES).map(([key, theme]) => (
                    <button
                      type="button"
                      key={key}
                      title={theme.label}
                      onClick={() => setForm({ ...form, theme: key })}
                      className={`h-9 w-9 rounded-xl bg-gradient-to-br ${theme.chip} ${form.theme === key ? 'ring-2 ring-offset-2 ring-gray-900' : ''}`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Icon</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(SERVICE_ICONS).map(([key, { label, Icon }]) => (
                    <button
                      type="button"
                      key={key}
                      title={label}
                      onClick={() => setForm({ ...form, icon: key })}
                      className={`h-9 w-9 rounded-xl flex items-center justify-center border transition ${form.icon === key ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                    >
                      <Icon size={16} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className={`${labelClass} flex items-center gap-2`}><ImageIcon size={14} /> Image</label>
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
                        setImageFile(file);
                        setImagePreview(URL.createObjectURL(file));
                        setForm((f) => ({ ...f, image: '' }));
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full bg-gray-50 border border-gray-200 border-dashed rounded-sm px-4 py-2.5 text-sm text-gray-500 flex items-center justify-center gap-2">
                      <Plus size={16} /> {imageFile ? imageFile.name : 'Upload image'}
                    </div>
                  </div>
                  <input
                    className={`${inputClass} md:flex-1`}
                    value={form.image}
                    onChange={(e) => { const v = e.target.value; setForm({ ...form, image: v }); setImageFile(null); setImagePreview(v); }}
                    placeholder="…or paste an image URL"
                  />
                  <select className={`${inputClass} md:w-44`} value={form.imagePos} onChange={(e) => setForm({ ...form, imagePos: e.target.value })}>
                    <option value="center">Focus: centre</option>
                    <option value="top">Focus: top</option>
                    <option value="bottom">Focus: bottom</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 accent-emerald-800" />
                <span className="text-sm font-semibold text-gray-800">Show in the app</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="flex-1 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 text-white font-bold py-3 rounded-sm transition flex items-center justify-center gap-2">
                <Save size={18} /> {editing === 'new' ? 'Add Service' : 'Save Changes'}
              </button>
              <button type="button" onClick={close} className="px-5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-sm transition">
                <X size={18} />
              </button>
            </div>
          </form>

          <PhonePreview card={previewCard} />
        </div>
      ) : null}

      <div className="bg-white border border-gray-100 rounded-sm shadow-sm">
        <div className="px-5 py-3 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
          Shown in this order on the app home screen
        </div>
        {loading ? (
          <div className="h-40 animate-pulse bg-gray-50" />
        ) : services.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No services yet. Click “Add Service”.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {services.map((service, index) => {
              const card = toServiceCard(service);
              const Icon = card.icon;
              return (
                <li key={service._id} className={`flex items-center gap-4 px-5 py-3 ${service.isActive ? '' : 'opacity-50'}`}>
                  <div className="flex flex-col">
                    <button onClick={() => move(index, -1)} disabled={index === 0} className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-20" title="Move up"><ArrowUp size={14} /></button>
                    <button onClick={() => move(index, 1)} disabled={index === services.length - 1} className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-20" title="Move down"><ArrowDown size={14} /></button>
                  </div>
                  <div className="h-14 w-20 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
                    {card.image ? <img src={card.image} alt="" className="h-full w-full object-cover" /> : <div className={`h-full w-full bg-gradient-to-br ${card.chip}`} />}
                    <span className={`absolute right-1 top-1 rounded-md bg-gradient-to-br ${card.chip} p-1 text-white`}><Icon size={10} /></span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 truncate">{service.title}{service.isActive ? '' : ' · Hidden'}</p>
                    <p className="text-xs text-gray-500 truncate">{service.description}</p>
                    <p className="text-[11px] text-gray-400 truncate">Opens {service.path}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => toggleActive(service)} title={service.isActive ? 'Hide' : 'Show'} className="p-2 bg-gray-50 text-gray-600 rounded-sm hover:bg-gray-200 border border-gray-200">
                      {service.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button onClick={() => openEdit(service)} title="Edit" className="p-2 bg-emerald-50 text-emerald-800 rounded-sm hover:bg-emerald-800 hover:text-white border border-emerald-100">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => remove(service)} title="Delete" className="p-2 bg-red-50 text-red-700 rounded-sm hover:bg-red-600 hover:text-white border border-red-100">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CMSAppServices;
