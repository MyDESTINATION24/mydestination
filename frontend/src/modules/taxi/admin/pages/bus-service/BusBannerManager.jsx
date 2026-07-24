import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  Filter,
  Image as ImageIcon,
  Loader2,
  Plus,
  Save,
  Trash2,
  Upload,
  RefreshCcw,
  Link as LinkIcon,
  Layers,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  getAdminBusBanners,
  createAdminBusBanner,
  updateAdminBusBanner,
  deleteAdminBusBanner,
} from '../../services/busService';

const Motion = motion;

const createInitialFormData = () => ({
  title: '',
  linkUrl: '',
  order: '0',
  image: null,
  image_url: '',
  use_url: false,
  isActive: true,
});

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-400/5';

const BusBannerManager = ({ type = 'banner' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState(createInitialFormData);
  const [imagePreview, setImagePreview] = useState(null);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const results = await getAdminBusBanners({ type });
      setBanners(results);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast.error(error?.message || `Failed to load bus ${type}s`);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredBanners = useMemo(() => {
    const query = String(search || '').trim().toLowerCase();
    if (!query) return banners;
    return banners.filter(
      (banner) =>
        String(banner.title || '').toLowerCase().includes(query) ||
        String(banner.linkUrl || '').toLowerCase().includes(query)
    );
  }, [banners, search]);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFormData((current) => ({
      ...current,
      image: file,
      use_url: false,
      image_url: '',
    }));
    setImagePreview(URL.createObjectURL(file));
  };

  const handleOpenCreate = () => {
    setFormData(createInitialFormData());
    setImagePreview(null);
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title || '',
      linkUrl: item.linkUrl || '',
      order: String(item.order ?? '0'),
      image: null,
      image_url: item.imageUrl || '',
      use_url: !item.imageUrl?.startsWith('data:') && !!item.imageUrl,
      isActive: item.isActive !== false,
    });
    setImagePreview(item.imageUrl || null);
    setIsFormOpen(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!formData.use_url && !formData.image && !editingItem) {
      toast.error(`Please upload a ${type} image`);
      return;
    }

    if (formData.use_url && !formData.image_url.trim()) {
      toast.error('Please enter an image URL');
      return;
    }

    setSaving(true);
    try {
      let imageData = formData.use_url ? formData.image_url.trim() : '';

      if (!formData.use_url && formData.image instanceof File) {
        imageData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(formData.image);
        });
      }

      const payload = {
        title: formData.title.trim(),
        linkUrl: formData.linkUrl.trim(),
        order: Number(formData.order || 0),
        isActive: formData.isActive,
        imageUrl: formData.use_url ? formData.image_url.trim() : undefined,
        image: imageData || undefined,
        type,
      };

      if (editingItem) {
        await updateAdminBusBanner(editingItem.id || editingItem._id, payload);
        toast.success(`Bus ${type} updated successfully`);
      } else {
        await createAdminBusBanner(payload);
        toast.success(`Bus ${type} created successfully`);
      }

      setIsFormOpen(false);
      setFormData(createInitialFormData());
      setImagePreview(null);
      await loadData();
    } catch (error) {
      console.error('Save banner error:', error);
      toast.error(error?.message || `Failed to save ${type}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this bus ${type}?`)) return;

    try {
      await deleteAdminBusBanner(id);
      toast.success(`Bus ${type} deleted successfully`);
      await loadData();
    } catch (error) {
      console.error('Delete banner error:', error);
      toast.error(error?.message || `Failed to delete ${type}`);
    }
  };

  const toggleStatus = async (item) => {
    const id = item.id || item._id;
    try {
      const nextActiveState = !item.isActive;
      await updateAdminBusBanner(id, { isActive: nextActiveState });
      setBanners((current) =>
        current.map((b) => ((b.id || b._id) === id ? { ...b, isActive: nextActiveState } : b))
      );
      toast.success(`${type === 'offer' ? 'Offer' : 'Banner'} status updated to ${nextActiveState ? 'Active' : 'Inactive'}`);
    } catch (error) {
      console.error('Banner status toggle error:', error);
      toast.error(error?.message || 'Failed to update status');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-8 font-sans text-slate-800">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              <Layers size={14} />
              Bus Service
            </div>
            <h1 className="mt-3 text-3xl font-black text-slate-900 leading-none">
              {type === 'offer' ? 'Bus Offers & Promotions' : 'Bus Banners'}
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              {type === 'offer'
                ? 'Manage promotional banner offers displayed under the customer-side Bus offers section.'
                : 'Manage promotional banners displayed on the customer-side Bus service homepage.'}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-[280px]">
              <Filter size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className={`${inputClass} pl-11`}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by title or link..."
              />
            </div>
            {!isFormOpen && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Plus size={16} />
                Add Bus {type === 'offer' ? 'Offer' : 'Banner'}
              </button>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isFormOpen ? (
            <Motion.form
              key="banner-form"
              onSubmit={handleSave}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 lg:p-8 max-w-4xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900">
                  {editingItem
                    ? `Edit Bus ${type === 'offer' ? 'Offer' : 'Banner'}`
                    : `Create Bus ${type === 'offer' ? 'Offer' : 'Banner'}`}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-sm"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                      {type === 'offer' ? 'Offer Title' : 'Banner Title'}
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData((current) => ({ ...current, title: e.target.value }))}
                      className={inputClass}
                      placeholder="e.g. Festival Season Offer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                      Redirection URL (Link)
                    </label>
                    <input
                      type="text"
                      value={formData.linkUrl}
                      onChange={(e) => setFormData((current) => ({ ...current, linkUrl: e.target.value }))}
                      className={inputClass}
                      placeholder="e.g. /taxi/user/promo or external link"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                        Sort Order
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.order}
                        onChange={(e) => setFormData((current) => ({ ...current, order: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                    <div className="flex flex-col justify-end pb-3">
                      <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-800">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData((current) => ({ ...current, isActive: e.target.checked }))}
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 h-4 w-4"
                        />
                        <span>Active status</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                      {type === 'offer' ? 'Offer Image' : 'Banner Image'}<span className="text-rose-500">*</span>
                    </label>

                    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-4 flex flex-col items-center justify-center min-h-[170px]">
                      {imagePreview ? (
                        <div className="space-y-4 w-full flex flex-col items-center">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="h-28 w-full rounded-xl border border-slate-100 object-contain bg-slate-50"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null);
                              setFormData((current) => ({ ...current, image: null, image_url: '' }));
                            }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors"
                          >
                            Remove Image
                          </button>
                        </div>
                      ) : (
                        <label className="flex cursor-pointer flex-col items-center justify-center gap-3 py-6 text-center w-full">
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                          <Upload size={28} className="text-slate-400" />
                          <div>
                            <p className="text-sm font-bold text-slate-700">Upload Image File</p>
                            <p className="text-xs text-slate-400 mt-1">Recommended size: 500x120px</p>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-black uppercase tracking-wider text-slate-400">
                      <input
                        type="checkbox"
                        checked={formData.use_url}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData((current) => ({
                            ...current,
                            use_url: checked,
                            image: checked ? null : current.image,
                          }));
                          if (checked) {
                            setImagePreview(null);
                          }
                        }}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 h-4 w-4"
                      />
                      <span>Use image URL instead</span>
                    </label>

                    {formData.use_url && (
                      <div>
                        <input
                          type="url"
                          value={formData.image_url}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData((current) => ({ ...current, image_url: val }));
                            setImagePreview(val);
                          }}
                          className={inputClass}
                          placeholder="https://example.com/banner.jpg"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-6">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {saving ? <RefreshCcw className="animate-spin" size={16} /> : <Save size={16} />}
                  {editingItem ? `Update ${type === 'offer' ? 'Offer' : 'Banner'}` : `Save ${type === 'offer' ? 'Offer' : 'Banner'}`}
                </button>
              </div>
            </Motion.form>
          ) : (
            <Motion.div
              key="banner-list"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm"
            >
              <div className="grid grid-cols-[140px_minmax(0,1.2fr)_minmax(0,1fr)_100px_120px_150px] gap-4 bg-slate-100 px-6 py-5 text-sm font-black text-slate-700">
                <p>{type === 'offer' ? 'Offer' : 'Banner'}</p>
                <p>Title</p>
                <p>Link URL</p>
                <p>Order</p>
                <p>Status</p>
                <p>Actions</p>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Loader2 size={32} className="animate-spin text-slate-500 mb-2" />
                  <p className="text-sm font-bold">Loading {type}s...</p>
                </div>
              ) : filteredBanners.length === 0 ? (
                <div className="py-20 text-center text-sm font-bold text-slate-400">
                  No bus {type}s found. Click "Add Bus {type === 'offer' ? 'Offer' : 'Banner'}" to create one.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 bg-white">
                  {filteredBanners.map((item) => (
                    <div
                      key={item.id || item._id}
                      className="grid grid-cols-[140px_minmax(0,1.2fr)_minmax(0,1fr)_100px_120px_150px] gap-4 px-6 py-4 items-center"
                    >
                      <div>
                        <div className="h-12 w-28 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={type === 'offer' ? 'Offer' : 'Banner'}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '';
                              }}
                            />
                          ) : (
                            <ImageIcon size={20} className="text-slate-300" />
                          )}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-base font-black text-slate-900">
                          {item.title || <span className="text-slate-400 italic font-semibold">Untitled {type === 'offer' ? 'Offer' : 'Banner'}</span>}
                        </p>
                      </div>

                      <div className="min-w-0 flex items-center gap-1.5 text-sm text-slate-500">
                        <LinkIcon size={14} className="shrink-0 text-slate-400" />
                        <span className="truncate font-semibold">{item.linkUrl || '—'}</span>
                      </div>

                      <div>
                        <span className="text-sm font-black text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {item.order ?? 0}
                        </span>
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={() => toggleStatus(item)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-all ${
                            item.isActive !== false
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100/60'
                              : 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100/60'
                          }`}
                        >
                          {item.isActive !== false ? (
                            <>
                              <CheckCircle size={12} className="stroke-[2.5px]" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={12} className="stroke-[2.5px]" />
                              <span>Inactive</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="inline-flex h-9 px-3.5 items-center justify-center rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id || item._id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BusBannerManager;
