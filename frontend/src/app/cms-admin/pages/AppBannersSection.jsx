import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, ArrowUp, ArrowDown, Eye, EyeOff, Smartphone, Image as ImageIcon, Megaphone } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../../shared/api/runtimeConfig';
import { getStoredAdminToken } from '../../admin/store/adminStore';
import PromoBanners from '../../shared/components/PromoBanners';

// CMS Admin -> App Services -> Banners: small promo / ad banners shown under
// the service cards on the app home screen.

const authHeaders = (extra = {}) => ({ headers: { Authorization: `Bearer ${getStoredAdminToken()}`, ...extra } });

const EMPTY = { title: '', image: '', link: '', isAd: false, isActive: true, startsAt: '', endsAt: '' };

const inputClass = 'w-full bg-gray-50 border border-gray-200 rounded-sm px-4 py-2.5 outline-none focus:border-emerald-800 transition text-sm text-gray-900 font-medium';
const labelClass = 'text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block';

// <input type="datetime-local"> works in local time without a zone
const toLocalInput = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const fromLocalInput = (value) => (value ? new Date(value).toISOString() : '');

const statusOf = (banner) => {
  if (!banner.isActive) return { label: 'Hidden', cls: 'bg-gray-100 text-gray-500' };
  const now = Date.now();
  if (banner.startsAt && new Date(banner.startsAt).getTime() > now) return { label: 'Scheduled', cls: 'bg-sky-50 text-sky-700' };
  if (banner.endsAt && new Date(banner.endsAt).getTime() <= now) return { label: 'Ended', cls: 'bg-amber-50 text-amber-700' };
  return { label: 'Live', cls: 'bg-emerald-50 text-emerald-700' };
};

const fmt = (value) => (value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '');

const AppBannersSection = ({ linkPresets = [] }) => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | banner
  const [form, setForm] = useState(EMPTY);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/app-services/admin/banners`, authHeaders());
      setBanners(res.data?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load banners');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing('new'); setForm(EMPTY); setImageFile(null); setImagePreview(''); };
  const openEdit = (banner) => {
    setEditing(banner);
    setForm({
      title: banner.title || '', image: banner.image || '', link: banner.link || '',
      isAd: !!banner.isAd, isActive: banner.isActive !== false,
      startsAt: toLocalInput(banner.startsAt), endsAt: toLocalInput(banner.endsAt),
    });
    setImageFile(null);
    setImagePreview(banner.image || '');
  };
  const close = () => { setEditing(null); setForm(EMPTY); setImageFile(null); setImagePreview(''); };

  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!imageFile && !form.image.trim()) { toast.error('Add a banner image'); return; }
    if (form.link && !/^\/(?!\/)\S*$/.test(form.link) && !/^https:\/\/\S+$/i.test(form.link)) {
      toast.error('Link must start with / (e.g. /hotels) or https://'); return;
    }
    if (form.startsAt && form.endsAt && new Date(form.endsAt) <= new Date(form.startsAt)) {
      toast.error('End date must be after the start date'); return;
    }
    const data = new FormData();
    data.append('title', form.title);
    data.append('link', form.link);
    data.append('isAd', form.isAd);
    data.append('isActive', form.isActive);
    data.append('startsAt', fromLocalInput(form.startsAt));
    data.append('endsAt', fromLocalInput(form.endsAt));
    if (imageFile) data.append('image', imageFile);
    else data.append('image', form.image);

    setSaving(true);
    const t = toast.loading('Saving banner...');
    try {
      const config = authHeaders({ 'Content-Type': 'multipart/form-data' });
      if (editing === 'new') await axios.post(`${API_BASE_URL}/app-services/admin/banners`, data, config);
      else await axios.put(`${API_BASE_URL}/app-services/admin/banners/${editing._id}`, data, config);
      toast.success(editing === 'new' ? 'Banner added' : 'Banner updated', { id: t });
      close();
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save banner', { id: t });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (banner) => {
    try {
      await axios.put(`${API_BASE_URL}/app-services/admin/banners/${banner._id}`, { isActive: !banner.isActive }, authHeaders());
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };

  const remove = async (banner) => {
    if (!window.confirm(`Delete the banner "${banner.title}"?`)) return;
    try {
      await axios.delete(`${API_BASE_URL}/app-services/admin/banners/${banner._id}`, authHeaders());
      toast.success('Banner deleted');
      if (editing?._id === banner._id) close();
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const move = async (index, direction) => {
    const next = [...banners];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setBanners(next);
    try {
      await axios.put(`${API_BASE_URL}/app-services/admin/banners/reorder`, { ids: next.map((b) => b._id) }, authHeaders());
    } catch {
      toast.error('Could not save the new order');
      load();
    }
  };

  const previewBanner = { _id: 'preview', title: form.title, image: imagePreview || form.image, link: form.link, isAd: form.isAd };

  return (
    <section className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-gray-900 tracking-widest uppercase flex items-center gap-2">
            <Megaphone size={20} className="text-emerald-700" /> Banners &amp; Ads
          </h3>
          <p className="text-sm text-gray-500">Small sliding banners under the service cards. Use them for offers or paid ads. Best image size: 1200 × 300.</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-5 py-3 rounded-sm transition">
          <Plus size={18} /> Add Banner
        </button>
      </div>

      {editing ? (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 items-start">
          <form onSubmit={save} className="bg-white border border-gray-100 rounded-sm p-6 shadow-sm space-y-5">
            <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              {editing === 'new' ? <Plus size={18} className="text-emerald-500" /> : <Edit2 size={18} className="text-emerald-500" />}
              {editing === 'new' ? 'New Banner' : `Edit “${editing.title}”`}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className={labelClass}>Name *</label>
                <input className={inputClass} value={form.title} maxLength={80} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Diwali cab offer (only admins see this)" />
              </div>

              <div className="md:col-span-2">
                <label className={`${labelClass} flex items-center gap-2`}><ImageIcon size={14} /> Banner image * (1200 × 300, wide)</label>
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
                </div>
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Opens when tapped (optional)</label>
                <div className="flex flex-col md:flex-row gap-2">
                  <select
                    className={`${inputClass} md:w-56`}
                    value={linkPresets.some((l) => l.path === form.link) ? form.link : ''}
                    onChange={(e) => setForm({ ...form, link: e.target.value })}
                  >
                    <option value="">Custom link / none…</option>
                    {linkPresets.map((l) => <option key={l.path} value={l.path}>{l.label}</option>)}
                  </select>
                  <input className={inputClass} value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/taxi/user or https://advertiser.com — leave empty for no link" />
                </div>
              </div>

              <div>
                <label className={labelClass}>Show from (optional)</label>
                <input type="datetime-local" className={inputClass} value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Show until (optional)</label>
                <input type="datetime-local" className={inputClass} value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input type="checkbox" checked={form.isAd} onChange={(e) => setForm({ ...form, isAd: e.target.checked })} className="h-4 w-4 accent-emerald-800" />
                <span className="text-sm font-semibold text-gray-800">This is a paid ad (shows an “Ad” tag)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 accent-emerald-800" />
                <span className="text-sm font-semibold text-gray-800">Show in the app</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="flex-1 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 text-white font-bold py-3 rounded-sm transition flex items-center justify-center gap-2">
                <Save size={18} /> {editing === 'new' ? 'Add Banner' : 'Save Changes'}
              </button>
              <button type="button" onClick={close} className="px-5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-sm transition">
                <X size={18} />
              </button>
            </div>
          </form>

          <div className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <Smartphone size={14} className="text-emerald-600" /> Live preview (phone width)
            </div>
            <div className="p-5 bg-[#F7F9FB] flex justify-center">
              <div className="w-full max-w-[340px] pointer-events-none select-none">
                {previewBanner.image
                  ? <PromoBanners banners={[previewBanner]} reduceMotion />
                  : <div className="aspect-[4/1] rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-400">Add an image to preview</div>}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="bg-white border border-gray-100 rounded-sm shadow-sm">
        <div className="px-5 py-3 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
          Banners slide in this order
        </div>
        {loading ? (
          <div className="h-24 animate-pulse bg-gray-50" />
        ) : banners.length === 0 ? (
          <p className="text-center text-gray-400 py-10">No banners yet. The app hides the banner row until you add one.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {banners.map((banner, index) => {
              const status = statusOf(banner);
              return (
                <li key={banner._id} className={`flex items-center gap-4 px-5 py-3 ${banner.isActive ? '' : 'opacity-60'}`}>
                  <div className="flex flex-col">
                    <button onClick={() => move(index, -1)} disabled={index === 0} className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-20" title="Move up"><ArrowUp size={14} /></button>
                    <button onClick={() => move(index, 1)} disabled={index === banners.length - 1} className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-20" title="Move down"><ArrowDown size={14} /></button>
                  </div>
                  <div className="h-12 w-48 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    <img src={banner.image} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 truncate flex items-center gap-2">
                      {banner.title}
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${status.cls}`}>{status.label}</span>
                      {banner.isAd && <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-900 text-white">Ad</span>}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">{banner.link ? `Opens ${banner.link}` : 'No link'}</p>
                    {(banner.startsAt || banner.endsAt) && (
                      <p className="text-[11px] text-gray-400 truncate">
                        {banner.startsAt ? `From ${fmt(banner.startsAt)}` : 'Now'} → {banner.endsAt ? fmt(banner.endsAt) : 'no end'}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => toggleActive(banner)} title={banner.isActive ? 'Hide' : 'Show'} className="p-2 bg-gray-50 text-gray-600 rounded-sm hover:bg-gray-200 border border-gray-200">
                      {banner.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button onClick={() => openEdit(banner)} title="Edit" className="p-2 bg-emerald-50 text-emerald-800 rounded-sm hover:bg-emerald-800 hover:text-white border border-emerald-100">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => remove(banner)} title="Delete" className="p-2 bg-red-50 text-red-700 rounded-sm hover:bg-red-600 hover:text-white border border-red-100">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
};

export default AppBannersSection;
