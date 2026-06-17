import React, { useState, useEffect } from 'react';
import { api as apiService } from '../../../services/apiService';
import adminService from '../../../services/adminService';
import toast from 'react-hot-toast';
import { Trash2, Upload, Plus } from 'lucide-react';

const DEFAULT_CATEGORIES = [
  { title: 'Hotels', type: 'hotel', image: '' },
  { title: 'Cars', type: 'car', image: '' },
  { title: 'Activities', type: 'activity', image: '' },
];

const CMSCategories = () => {
  const [items, setItems] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await apiService.get('/cms/landing-page');
      if (res.data?.data?.categories?.items?.length > 0) {
        setItems(res.data.data.categories.items);
      }
    } catch (error) {
      toast.error('Failed to load categories configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiService.put('/cms/landing-page', { categories: { items } });
      toast.success('Categories updated successfully!');
    } catch (error) {
      toast.error('Failed to update categories');
    } finally {
      setSaving(false);
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleImageUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('images', file);
    formData.append('type', 'landing_page');
    setUploadingIdx(index);
    try {
      const res = await adminService.uploadImage(formData);
      if (res.success) {
        const url = res.url || (res.files && res.files[0]?.url);
        if (url) {
          handleItemChange(index, 'image', url);
          toast.success('Image uploaded!');
        }
      }
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingIdx(null);
    }
  };

  const handleAddCategory = () => {
    setItems([...items, { title: '', type: '', image: '' }]);
  };

  const handleRemoveCategory = (index) => {
    if (items.length <= 1) {
      toast.error('At least one category is required');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  if (loading) return <div className="text-sm text-gray-500 p-4">Loading...</div>;

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-900 tracking-widest uppercase">Categories Section</h2>
        <p className="text-sm text-gray-500">
          Manage the "Hotels, Cars, Activities" categories shown on the landing page. You can change titles, images, and add/remove categories.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 md:p-8 rounded-sm border border-gray-200 shadow-sm space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-bold text-lg">Category Cards</h3>
          <button
            type="button"
            onClick={handleAddCategory}
            className="flex items-center gap-2 text-sm text-emerald-600 font-bold hover:text-emerald-800 transition"
          >
            <Plus size={16} /> Add Category
          </button>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-1 gap-6">
          {items.map((item, idx) => (
            <div key={idx} className="border border-gray-200 rounded-sm p-5 bg-gray-50 relative">

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => handleRemoveCategory(idx)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition"
                title="Remove category"
              >
                <Trash2 size={18} />
              </button>

              <h4 className="font-bold text-sm text-emerald-700 mb-4">Category {idx + 1}</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pr-6">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Title (e.g. Hotels, Cars)
                  </label>
                  <input
                    type="text"
                    value={item.title || ''}
                    onChange={(e) => handleItemChange(idx, 'title', e.target.value)}
                    placeholder="Hotels"
                    className="w-full border border-gray-200 p-2.5 text-sm focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                {/* Type (search link) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Type (search link key)
                  </label>
                  <select
                    value={item.type || ''}
                    onChange={(e) => handleItemChange(idx, 'type', e.target.value)}
                    className="w-full border border-gray-200 p-2.5 text-sm focus:outline-none focus:border-emerald-500 transition bg-white"
                  >
                    <option value="">-- Select Type --</option>
                    <option value="hotel">hotel</option>
                    <option value="car">car</option>
                    <option value="activity">activity</option>
                    <option value="wedding">wedding</option>
                    <option value="tour">tour</option>
                  </select>
                  <p className="text-xs text-gray-400">"Search" button will link to /welcome?type=<strong>{item.type || '...'}</strong></p>
                </div>

                {/* Image Upload */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Category Image
                  </label>
                  <div className="flex items-center gap-5 flex-wrap">
                    {item.image ? (
                      <>
                        <div className="w-32 h-24 overflow-hidden border border-gray-200 shadow-sm rounded-sm">
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                        <label className="cursor-pointer flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-sm text-xs font-bold transition">
                          <Upload size={14} /> Change Image
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, idx)} />
                        </label>
                      </>
                    ) : (
                      <label className="cursor-pointer flex items-center gap-3 border-2 border-dashed border-gray-300 p-4 rounded-sm hover:border-emerald-400 transition w-full max-w-xs">
                        <Upload size={18} className="text-gray-400" />
                        <span className="text-sm text-gray-500">Click to upload image</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, idx)} />
                      </label>
                    )}
                    {uploadingIdx === idx && (
                      <p className="text-xs text-emerald-600 font-medium">Uploading...</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Preview Note */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-sm p-4">
          <p className="text-xs text-emerald-700 font-medium">
            💡 <strong>Note:</strong> If no image is uploaded for a category, the default local image will be used. Changes will reflect on the landing page immediately after saving.
          </p>
        </div>

        {/* Save */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-emerald-600 text-white px-8 py-3 text-sm font-bold tracking-widest uppercase hover:bg-emerald-700 transition disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CMSCategories;
