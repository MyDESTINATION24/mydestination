import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, Loader2, Plus, Save, Trash2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadService } from '../../../shared/services/uploadService';
import {
  createTourBannerDraft,
  deleteAdminTourBanner,
  getAdminTourBanners,
  upsertAdminTourBanner,
} from '../../services/toursService';

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-400/5';
const labelClass = 'mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400';

const CATEGORIES = [
  { id: 'yatra', label: 'Pilgrim Yatras' },
  { id: 'trek', label: 'Treks' },
  { id: 'airways', label: 'Airways (Helicopter)' },
];

// Hero banner shown at the top of /taxi/user/tours. One per category, so the
// Yatras and Treks tabs can carry different artwork and copy.
const TourBannerManager = () => {
  const [banners, setBanners] = useState([]);
  const [formData, setFormData] = useState(createTourBannerDraft());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setBanners(await getAdminTourBanners());
    } catch {
      toast.error('Failed to load tour banners.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setField = (key, value) => setFormData((current) => ({ ...current, [key]: value }));

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Could not read the selected image'));
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });

      if (!String(base64 || '').startsWith('data:image/')) {
        throw new Error('Please select a valid image file');
      }

      const result = await uploadService.uploadImage(base64, 'taxi/tour-banners');
      const url = result?.url || result?.data?.url || result?.secure_url;
      if (!url) throw new Error('Upload did not return an image URL');

      setField('imageUrl', url);
      toast.success('Banner image uploaded.');
    } catch (error) {
      toast.error(error?.message || 'Banner upload failed');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.imageUrl) {
      toast.error('Upload a banner image first.');
      return;
    }

    try {
      setSaving(true);
      await upsertAdminTourBanner(formData);
      toast.success(formData.id ? 'Banner updated.' : 'Banner created.');
      setFormData(createTourBannerDraft());
      await load();
    } catch (error) {
      toast.error(error?.message || 'Could not save the banner.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAdminTourBanner(id);
      toast.success('Banner deleted.');
      if (formData.id === id) setFormData(createTourBannerDraft());
      await load();
    } catch {
      toast.error('Could not delete the banner.');
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Tour Banners</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">
          The hero image shown above the package list on the customer tours screen. Any headline
          or button should be part of the artwork -- nothing is drawn over it.
        </p>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr_1.1fr]">
        {/* Editor */}
        <form onSubmit={handleSubmit} className="rounded-[32px] border border-slate-200 bg-white p-6 lg:p-8 shadow-sm space-y-5">
          <h2 className="text-lg font-black text-slate-900">
            {formData.id ? 'Edit banner' : 'New banner'}
          </h2>

          <div>
            <label className={labelClass}>Category</label>
            <select className={inputClass} value={formData.category} onChange={(e) => setField('category', e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Banner Image</label>
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-4">
              {formData.imageUrl ? (
                <div className="relative">
                  <img src={formData.imageUrl} alt="Banner" className="h-40 w-full rounded-xl object-cover" />
                  <button
                    type="button"
                    onClick={() => setField('imageUrl', '')}
                    className="absolute right-2 top-2 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-black uppercase text-rose-600 shadow"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center gap-2 py-6 text-slate-400">
                  {uploading ? <Loader2 size={22} className="animate-spin" /> : <Upload size={22} />}
                  <span className="text-xs font-bold">
                    {uploading ? 'Uploading...' : 'Click to upload a wide image (1600x600 works well)'}
                  </span>
                  <input type="file" className="hidden" accept="image/*" disabled={uploading} onChange={handleImageChange} />
                </label>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Order</label>
              <input type="number" min="0" className={inputClass} value={formData.order} onChange={(e) => setField('order', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-emerald-500"
                  checked={Boolean(formData.isActive)}
                  onChange={(e) => setField('isActive', e.target.checked)}
                />
                <span className="text-sm font-semibold text-slate-700">Active</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-black text-white shadow-lg transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {formData.id ? 'Update Banner' : 'Create Banner'}
            </button>
            {formData.id ? (
              <button
                type="button"
                onClick={() => setFormData(createTourBannerDraft())}
                className="rounded-2xl border border-slate-200 px-6 py-3 text-sm font-black text-slate-600"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        {/* Existing banners */}
        <div className="space-y-4">
          {loading ? (
            <div className="rounded-[32px] border border-slate-200 bg-white p-12 text-center text-slate-400">
              <Loader2 size={24} className="mx-auto animate-spin" />
            </div>
          ) : banners.length === 0 ? (
            <div className="rounded-[32px] border-2 border-dashed border-slate-200 bg-white p-12 text-center">
              <ImageIcon size={32} className="mx-auto text-slate-200" />
              <p className="mt-3 text-sm font-bold text-slate-500">No banners yet.</p>
              <p className="mt-1 text-xs text-slate-400">
                Until one is added the tours screen falls back to its built-in heading.
              </p>
            </div>
          ) : (
            banners.map((banner) => (
              <div key={banner.id} className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                <div className="relative h-40">
                  <img src={banner.imageUrl} alt="Tour banner" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                  <div className="absolute top-4 left-5 flex gap-2">
                    <span className="rounded-lg bg-white/90 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-700">
                      {banner.category}
                    </span>
                    <span className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider ${banner.isActive ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'}`}>
                      {banner.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 p-5">
                  <p className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-500">Order {banner.order}</p>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...createTourBannerDraft(), ...banner })}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(banner.id)}
                      className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-rose-600 hover:bg-rose-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TourBannerManager;
