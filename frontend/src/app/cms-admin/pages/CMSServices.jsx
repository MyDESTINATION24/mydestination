import React, { useState, useEffect } from 'react';
import { api as apiService } from '../../../services/apiService';
import adminService from '../../../services/adminService';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import RichTextEditor from '../../../components/common/RichTextEditor';

const CMSServices = () => {
  const [servicesData, setServicesData] = useState({
    sectionSubtitle: "We fulfill your needs",
    sectionTitle: "SERVICES",
    items: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await apiService.get('/cms/landing-page');
      if (res.data?.data?.services) {
        setServicesData(res.data.data.services);
      }
    } catch (error) {
      toast.error('Failed to load services configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiService.put('/cms/landing-page', { services: servicesData });
      toast.success('Services section updated successfully!');
    } catch (error) {
      toast.error('Failed to update services section');
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = () => {
    setServicesData({
      ...servicesData,
      items: [...servicesData.items, { title: '', description: '', iconUrl: '' }]
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = servicesData.items.filter((_, idx) => idx !== index);
    setServicesData({ ...servicesData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...servicesData.items];
    newItems[index][field] = value;
    setServicesData({ ...servicesData, items: newItems });
  };

  const handleImageUpload = async (e, index, field) => {
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
          handleItemChange(index, field, url);
          toast.success('Image uploaded successfully');
        }
      }
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingIdx(null);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-900 tracking-widest uppercase">Services & Text</h2>
        <p className="text-sm text-gray-500">Edit the services and features displayed on the landing page.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 md:p-8 rounded-sm border border-gray-200 shadow-sm space-y-8">
        {/* Section Headers */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg border-b pb-2">Section Text</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Section Subtitle</label>
              <RichTextEditor
                value={servicesData.sectionSubtitle || ''}
                onChange={(val) => setServicesData({ ...servicesData, sectionSubtitle: val })}
                placeholder="We fulfill your needs"
                minHeight="90px"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Section Title</label>
              <RichTextEditor
                value={servicesData.sectionTitle || ''}
                onChange={(val) => setServicesData({ ...servicesData, sectionTitle: val })}
                placeholder="SERVICES"
                minHeight="90px"
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-bold text-lg">Service Items</h3>
            <button 
              type="button" 
              onClick={handleAddItem}
              className="flex items-center gap-2 text-sm text-emerald-600 font-bold hover:text-emerald-800 transition"
            >
              <Plus size={16} /> Add Service
            </button>
          </div>
          
          {servicesData.items && servicesData.items.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {servicesData.items.map((item, idx) => (
                <div key={idx} className="border border-gray-200 p-4 rounded-sm bg-gray-50 relative group space-y-4">
                  <button 
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition z-10"
                    title="Remove item"
                  >
                    <Trash2 size={18} />
                  </button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Title</label>
                      <RichTextEditor
                        value={item.title || ''}
                        onChange={(val) => handleItemChange(idx, 'title', val)}
                        placeholder="Service title"
                        minHeight="90px"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Icon Image</label>
                      <div className="flex items-center gap-3 mt-1">
                        {item.iconUrl ? (
                          <>
                            <img src={item.iconUrl} alt="" className="w-12 h-12 object-cover rounded-sm border shadow-sm" />
                            <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-sm text-xs font-bold transition">
                              Change Icon
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, idx, 'iconUrl')} />
                            </label>
                          </>
                        ) : (
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, idx, 'iconUrl')}
                            className="w-full border border-gray-300 p-1.5 text-sm focus:outline-none focus:border-emerald-500 transition bg-white"
                          />
                        )}
                      </div>
                      {uploadingIdx === idx && <p className="text-xs text-emerald-600">Uploading...</p>}
                    </div>
                  </div>

                  <div className="pr-8 space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Description</label>
                    <RichTextEditor
                      value={item.description || ''}
                      onChange={(val) => handleItemChange(idx, 'description', val)}
                      placeholder="Service description..."
                      minHeight="110px"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No services added yet.</p>
          )}
        </div>

        <div className="pt-4 flex justify-end">
          <button 
            type="submit" 
            disabled={saving}
            className="bg-emerald-600 text-white px-8 py-3 text-sm font-bold tracking-widest uppercase hover:bg-emerald-700 transition"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CMSServices;
