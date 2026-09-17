import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Edit2, Save, X, Image as ImageIcon, Type, AlignLeft, Layers, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import RichTextEditor from '../../../components/common/RichTextEditor';
import { API_BASE_URL } from '../../../shared/api/runtimeConfig';
import { getStoredAdminToken } from '../../admin/store/adminStore';
import { fetchContentSections } from '../../../services/contentSections';
import SectionBlock from '../../../components/sections/SectionBlock';

// Live preview of the homepage block, rendered with the same component the
// landing page uses.
const LivePreview = ({ section, items, note }) => (
  <div className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden">
    <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
        <Eye size={14} className="text-emerald-600" /> Live preview (homepage)
      </span>
      {note ? <span className="text-[11px] text-gray-400">{note}</span> : null}
    </div>
    <div className="bg-slate-50 pointer-events-none select-none">
      <SectionBlock section={section} items={items} preview className="!border-t-0 !py-10" />
    </div>
  </div>
);

const placeholderCards = (count) => Array.from({ length: Math.max(1, Math.min(Number(count) || 3, 3)) }, () => ({}));

const authHeaders = (extra = {}) => ({ headers: { Authorization: `Bearer ${getStoredAdminToken()}`, ...extra } });

const EMPTY_SECTION = {
  navLabel: '', subtitle: '', title: '', description: '', buttonText: '',
  homeLimit: 3, order: '', showInNav: true, showOnHome: true, isActive: true
};
const EMPTY_ITEM = { title: '', image: '', category: '', badge: '', readTime: '', excerpt: '', content: '', order: 0, isActive: true };

const inputClass = 'w-full bg-gray-50 border border-gray-200 rounded-sm px-4 py-2.5 outline-none focus:border-emerald-800 transition text-sm text-gray-900 font-medium';
const labelClass = 'text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block';
const stripTags = (html) => String(html || '').replace(/<[^>]*>/g, '');

const Toggle = ({ label, checked, onChange, hint }) => (
  <label className="flex items-start gap-3 cursor-pointer select-none">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-4 w-4 accent-emerald-800" />
    <span>
      <span className="text-sm font-semibold text-gray-800">{label}</span>
      {hint ? <span className="block text-xs text-gray-500">{hint}</span> : null}
    </span>
  </label>
);

const CMSSections = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | section
  const [form, setForm] = useState(EMPTY_SECTION);
  const [managing, setManaging] = useState(null); // custom section whose cards are open
  const [editingItems, setEditingItems] = useState([]); // cards of the section being edited, for the preview

  const loadSections = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/content-sections/admin/all`, authHeaders());
      setSections(res.data?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load sections');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSections(); }, [loadSections]);

  const refreshPublic = () => fetchContentSections({ force: true });

  const startCreate = () => { setEditing('new'); setForm(EMPTY_SECTION); setManaging(null); setEditingItems([]); };
  const startEdit = (section) => {
    setEditing(section);
    setManaging(null);
    setEditingItems([]);
    if (section.kind === 'custom') {
      axios.get(`${API_BASE_URL}/content-sections/admin/${section._id}/items`, authHeaders())
        .then((res) => setEditingItems((res.data?.data || []).filter((item) => item.isActive !== false)))
        .catch(() => {});
    }
    setForm({
      navLabel: section.navLabel || '', subtitle: section.subtitle || '', title: section.title || '',
      description: section.description || '', buttonText: section.buttonText || '',
      homeLimit: section.homeLimit || 3, order: section.order ?? '',
      showInNav: section.showInNav !== false, showOnHome: section.showOnHome !== false, isActive: section.isActive !== false
    });
  };
  const closeForm = () => { setEditing(null); setForm(EMPTY_SECTION); };

  const saveSection = async (e) => {
    e.preventDefault();
    if (!form.navLabel.trim()) { toast.error('Navbar label is required'); return; }
    const payload = { ...form };
    if (payload.order === '') delete payload.order;
    const t = toast.loading('Saving section...');
    try {
      if (editing === 'new') {
        const res = await axios.post(`${API_BASE_URL}/content-sections/admin`, payload, authHeaders());
        toast.success('Section created. Now add cards with images.', { id: t });
        closeForm();
        await loadSections();
        refreshPublic();
        // Straight to the cards screen: that is where images are added.
        if (res.data?.data) setManaging(res.data.data);
        return;
      } else {
        await axios.put(`${API_BASE_URL}/content-sections/admin/${editing._id}`, payload, authHeaders());
        toast.success('Section updated', { id: t });
      }
      closeForm();
      await loadSections();
      refreshPublic();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save section', { id: t });
    }
  };

  const quickToggle = async (section, field) => {
    try {
      await axios.put(`${API_BASE_URL}/content-sections/admin/${section._id}`, { [field]: !section[field] }, authHeaders());
      await loadSections();
      refreshPublic();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };

  const removeSection = async (section) => {
    if (!window.confirm(`Delete "${section.navLabel}" and all ${section.itemCount || 0} of its cards? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API_BASE_URL}/content-sections/admin/${section._id}`, authHeaders());
      toast.success('Section deleted');
      if (managing?._id === section._id) setManaging(null);
      await loadSections();
      refreshPublic();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  if (managing) {
    return (
      <SectionItemsManager
        section={managing}
        onBack={() => { setManaging(null); loadSections(); refreshPublic(); }}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-widest uppercase">Homepage Sections</h2>
          <p className="text-sm text-gray-500">
            Blocks like Articles and Blogs: their navbar tab, homepage heading and cards. Add new ones with the button.
          </p>
        </div>
        <button onClick={startCreate} className="inline-flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-5 py-3 rounded-sm transition">
          <Plus size={18} /> Add Section
        </button>
      </div>

      {editing ? (
        <form onSubmit={saveSection} className="bg-white border border-gray-100 rounded-sm p-6 shadow-sm space-y-5">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            {editing === 'new' ? <Plus size={18} className="text-emerald-500" /> : <Edit2 size={18} className="text-emerald-500" />}
            {editing === 'new' ? 'New Section' : `Edit "${editing.navLabel}"`}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Navbar label *</label>
              <input className={inputClass} value={form.navLabel} onChange={(e) => setForm({ ...form, navLabel: e.target.value })} placeholder="e.g. Tour Packages" maxLength={40} />
              {editing !== 'new' && editing.kind === 'custom' ? (
                <p className="text-[11px] text-gray-400 mt-1">Page address: /sections/{editing.slug}</p>
              ) : null}
            </div>
            <div>
              <label className={labelClass}>Small heading above title</label>
              <input className={inputClass} value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="e.g. Reads & Deep Dives" />
            </div>
            <div>
              <label className={labelClass}>Section title</label>
              <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Travel Articles" />
            </div>
            <div>
              <label className={labelClass}>Button text</label>
              <input className={inputClass} value={form.buttonText} onChange={(e) => setForm({ ...form, buttonText: e.target.value })} placeholder={`Explore All ${form.navLabel || '...'}`} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Description</label>
              <textarea className={`${inputClass} min-h-[80px]`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="One line under the title" />
            </div>
            <div>
              <label className={labelClass}>Cards shown on homepage</label>
              <input type="number" min={1} max={12} className={inputClass} value={form.homeLimit} onChange={(e) => setForm({ ...form, homeLimit: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Position (lower shows first in navbar)</label>
              <input type="number" className={inputClass} value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} placeholder="Auto (last)" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-100 pt-4">
            <Toggle label="Show in navbar" checked={form.showInNav} onChange={(v) => setForm({ ...form, showInNav: v })} />
            <Toggle label="Show on homepage" checked={form.showOnHome} onChange={(v) => setForm({ ...form, showOnHome: v })} hint="Appears once it has at least one card" />
            <Toggle label="Active" checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} hint="Off hides it everywhere" />
          </div>

          {editing === 'new' ? (
            <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-sm px-4 py-3 text-sm text-emerald-900">
              <ImageIcon size={18} className="shrink-0 mt-0.5" />
              <span><b>Images go on the cards.</b> Create the section first and you'll go straight to adding cards with images.</span>
            </div>
          ) : editing.kind === 'custom' ? (
            <button
              type="button"
              onClick={() => { const target = editing; closeForm(); setManaging(target); }}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-emerald-300 bg-emerald-50 text-emerald-900 font-bold py-3 rounded-sm hover:bg-emerald-100 transition"
            >
              <ImageIcon size={18} /> Add / edit cards &amp; images ({editingItems.length})
            </button>
          ) : (
            <div className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-sm px-4 py-3 text-sm text-gray-700">
              <ImageIcon size={18} className="shrink-0 mt-0.5" />
              <span>
                Cards and images for this section are managed in{' '}
                <Link to={`/cms-admin/${editing.kind}`} className="font-bold text-emerald-800 underline">Manage {editing.navLabel}</Link>.
              </span>
            </div>
          )}

          <div className="flex gap-3">
            <button type="submit" className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3 rounded-sm transition flex items-center justify-center gap-2">
              <Save size={18} /> {editing === 'new' ? 'Create Section & Add Cards' : 'Save Changes'}
            </button>
            <button type="button" onClick={closeForm} className="px-5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-sm transition">
              <X size={18} />
            </button>
          </div>
        </form>
      ) : null}

      {editing ? (
        <LivePreview
          section={{ ...form, slug: editing === 'new' ? 'preview' : editing.slug }}
          items={
            editing !== 'new' && editing.kind === 'custom' && editingItems.length
              ? editingItems.slice(0, Number(form.homeLimit) || 3)
              : placeholderCards(form.homeLimit)
          }
          note={editing !== 'new' && editing.kind !== 'custom'
            ? `Shows your real ${editing.navLabel.toLowerCase()} on the site`
            : 'Grey boxes are where your cards will appear'}
        />
      ) : null}

      {loading ? (
        <div className="h-40 bg-gray-100 border border-gray-200 rounded-sm animate-pulse" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sections.map((section) => (
            <div key={section._id} className={`bg-white border rounded-sm p-5 flex flex-col gap-4 ${section.isActive ? 'border-gray-150' : 'border-dashed border-gray-300 opacity-70'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-black text-gray-900 uppercase tracking-wider truncate">{section.navLabel}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${section.kind === 'custom' ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                      {section.kind === 'custom' ? `${section.itemCount || 0} cards` : 'Built-in'}
                    </span>
                    {!section.isActive ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 uppercase">Hidden</span> : null}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">{section.title || '—'}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Position {section.order}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startEdit(section)} title="Edit" className="p-2 bg-emerald-50 text-emerald-800 rounded-sm hover:bg-emerald-800 hover:text-white transition border border-emerald-100">
                    <Edit2 size={14} />
                  </button>
                  {section.kind === 'custom' ? (
                    <button onClick={() => removeSection(section)} title="Delete" className="p-2 bg-red-50 text-red-700 rounded-sm hover:bg-red-600 hover:text-white transition border border-red-100">
                      <Trash2 size={14} />
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <button onClick={() => quickToggle(section, 'showInNav')} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border font-semibold ${section.showInNav ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-white text-gray-500 border-gray-200'}`}>
                  {section.showInNav ? <Eye size={12} /> : <EyeOff size={12} />} Navbar
                </button>
                <button onClick={() => quickToggle(section, 'showOnHome')} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border font-semibold ${section.showOnHome ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-white text-gray-500 border-gray-200'}`}>
                  {section.showOnHome ? <Eye size={12} /> : <EyeOff size={12} />} Homepage
                </button>
                {section.kind === 'custom' ? (
                  <button onClick={() => { setManaging(section); closeForm(); }} className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-emerald-950 text-emerald-300 font-bold">
                    <Layers size={12} /> Manage Cards
                  </button>
                ) : (
                  <Link to={`/cms-admin/${section.kind}`} className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-gray-100 text-gray-700 font-bold">
                    <Layers size={12} /> Manage {section.navLabel}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SectionItemsManager = ({ section, onBack }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(EMPTY_ITEM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const loadItems = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/content-sections/admin/${section._id}/items`, authHeaders());
      setItems(res.data?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load cards');
    } finally {
      setLoading(false);
    }
  }, [section._id]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const reset = () => { setEditingItem(null); setForm(EMPTY_ITEM); setImageFile(null); setImagePreview(''); };

  // What the homepage would show if this card were saved now.
  const draftCard = { ...form, image: imagePreview || form.image, _id: editingItem?._id || 'draft' };
  const draftHasContent = Boolean(stripTags(form.title).trim() || draftCard.image || stripTags(form.excerpt).trim());
  const liveCards = items.filter((item) => item.isActive !== false);
  let previewCards = editingItem
    ? liveCards.map((item) => (item._id === editingItem._id ? draftCard : item))
    : draftHasContent ? [draftCard, ...liveCards] : liveCards;
  if (editingItem && form.isActive === false) previewCards = previewCards.filter((item) => item._id !== editingItem._id);
  previewCards = previewCards.slice(0, section.homeLimit || 3);

  const startEdit = (item) => {
    setEditingItem(item);
    setImageFile(null);
    setImagePreview(item.image);
    setForm({
      title: item.title || '', image: item.image || '', category: item.category || '', badge: item.badge || '',
      readTime: item.readTime || '', excerpt: item.excerpt || '', content: item.content || '',
      order: item.order || 0, isActive: item.isActive !== false
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const save = async (e) => {
    e.preventDefault();
    if (!stripTags(form.title).trim()) { toast.error('Title is required'); return; }
    if (!imageFile && !form.image) { toast.error('Add an image'); return; }
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === 'image' && imageFile) return;
      data.append(key, value);
    });
    if (imageFile) data.append('image', imageFile);
    const t = toast.loading(editingItem ? 'Updating card...' : 'Adding card...');
    try {
      const config = authHeaders({ 'Content-Type': 'multipart/form-data' });
      if (editingItem) {
        await axios.put(`${API_BASE_URL}/content-sections/admin/items/${editingItem._id}`, data, config);
      } else {
        await axios.post(`${API_BASE_URL}/content-sections/admin/${section._id}/items`, data, config);
      }
      toast.success(editingItem ? 'Card updated' : 'Card added', { id: t });
      reset();
      loadItems();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save card', { id: t });
    }
  };

  const remove = async (item) => {
    if (!window.confirm('Delete this card?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/content-sections/admin/items/${item._id}`, authHeaders());
      toast.success('Card deleted');
      if (editingItem?._id === item._id) reset();
      loadItems();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-3">
          <ArrowLeft size={14} /> All sections
        </button>
        <h2 className="text-2xl font-black text-gray-900 tracking-widest uppercase">{section.navLabel} — Cards</h2>
        <p className="text-sm text-gray-500">These appear on the homepage and on /sections/{section.slug}.</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-sm p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          {editingItem ? <Edit2 size={18} className="text-emerald-500" /> : <Plus size={18} className="text-emerald-500" />}
          {editingItem ? 'Edit Card' : 'Add New Card'}
        </h3>

        <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className={`${labelClass} flex items-center gap-2`}><Type size={14} /> Title *</label>
              <RichTextEditor value={form.title} onChange={(val) => setForm((f) => ({ ...f, title: val }))} placeholder="Card title..." minHeight="90px" />
            </div>

            <div>
              <label className={`${labelClass} flex items-center gap-2`}><ImageIcon size={14} /> Image *</label>
              {imagePreview ? (
                <div className="relative w-full h-40 rounded-sm overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center mb-3">
                  <img src={imagePreview} alt="Preview" className="h-full object-contain" />
                  <button type="button" onClick={() => { setImageFile(null); setImagePreview(''); setForm((f) => ({ ...f, image: '' })); }} className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow">
                    <X size={14} />
                  </button>
                </div>
              ) : null}
              <div className="relative mb-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setImageFile(file);
                    setImagePreview(URL.createObjectURL(file));
                    setForm((f) => ({ ...f, image: '' }));
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-full bg-gray-50 border border-gray-200 border-dashed rounded-sm px-4 py-2.5 text-sm text-gray-500 flex items-center justify-center gap-2">
                  <Plus size={16} /> Choose Image File
                </div>
              </div>
              <input
                className={inputClass}
                value={form.image}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm((f) => ({ ...f, image: value }));
                  if (value) { setImagePreview(value); setImageFile(null); }
                }}
                placeholder="...or paste an image URL"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Category</label>
                <input className={inputClass} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="Travel Guides" />
              </div>
              <div>
                <label className={labelClass}>Badge</label>
                <input className={inputClass} value={form.badge} onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))} placeholder="NEW" />
              </div>
              <div>
                <label className={labelClass}>Read time</label>
                <input className={inputClass} value={form.readTime} onChange={(e) => setForm((f) => ({ ...f, readTime: e.target.value }))} placeholder="5 min read" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <label className={labelClass}>Position</label>
                <input type="number" className={inputClass} value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))} />
              </div>
              <Toggle label="Visible" checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className={`${labelClass} flex items-center gap-2`}><AlignLeft size={14} /> Short summary</label>
              <RichTextEditor value={form.excerpt} onChange={(val) => setForm((f) => ({ ...f, excerpt: val }))} placeholder="Shown on the card..." minHeight="100px" />
            </div>
            <div>
              <label className={`${labelClass} flex items-center gap-2`}><AlignLeft size={14} /> Full content</label>
              <RichTextEditor value={form.content} onChange={(val) => setForm((f) => ({ ...f, content: val }))} placeholder="Shown when the card is opened..." minHeight="200px" />
            </div>
            <div className="pt-2 flex gap-3">
              <button type="submit" className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3 rounded-sm transition flex items-center justify-center gap-2">
                {editingItem ? <Save size={18} /> : <Plus size={18} />}
                {editingItem ? 'Update Card' : 'Add Card'}
              </button>
              {editingItem ? (
                <button type="button" onClick={reset} className="px-5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-sm transition">
                  <X size={18} />
                </button>
              ) : null}
            </div>
          </div>
        </form>
      </div>

      <LivePreview
        section={section}
        items={previewCards.length ? previewCards : placeholderCards(section.homeLimit)}
        note={previewCards.length
          ? `Homepage shows the first ${section.homeLimit || 3} visible card${(section.homeLimit || 3) === 1 ? '' : 's'}`
          : 'Add a card to see it here'}
      />

      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-6">Existing Cards</h3>
        {loading ? (
          <div className="h-40 bg-gray-100 border border-gray-200 rounded-sm animate-pulse" />
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 border border-dashed border-gray-200 rounded-sm">
            <p className="text-gray-400">No cards yet. Add the first one above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div key={item._id} className={`bg-white border rounded-sm overflow-hidden flex flex-col justify-between ${item.isActive ? 'border-gray-150' : 'border-dashed border-gray-300 opacity-70'}`}>
                <div>
                  <div className="h-40 bg-gray-50 overflow-hidden">
                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] text-gray-400 font-semibold mb-1">{item.category || item.date}{item.isActive ? '' : ' · Hidden'}</p>
                    <h4 className="font-bold text-gray-800 line-clamp-2 leading-tight mb-2">{stripTags(item.title)}</h4>
                    <p className="text-xs text-gray-500 line-clamp-3">{stripTags(item.excerpt)}</p>
                  </div>
                </div>
                <div className="p-4 pt-0 flex justify-end gap-2">
                  <button onClick={() => startEdit(item)} title="Edit" className="p-2 bg-emerald-50 text-emerald-800 rounded-sm hover:bg-emerald-800 hover:text-white transition border border-emerald-100">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => remove(item)} title="Delete" className="p-2 bg-red-50 text-red-700 rounded-sm hover:bg-red-600 hover:text-white transition border border-red-100">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CMSSections;
