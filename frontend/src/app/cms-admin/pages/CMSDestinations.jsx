import React, { useState, useEffect } from 'react';
import { api as apiService } from '../../../services/apiService';
import adminService from '../../../services/adminService';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import RichTextEditor from '../../../components/common/RichTextEditor';

const CMSDestinations = () => {
  const [destData, setDestData] = useState({
    sectionTitle: "Select your perfect trips",
    sectionHeading: "TOP DESTINATION",
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
      if (res.data?.data?.destinations) {
        setDestData(res.data.data.destinations);
      }
    } catch (error) {
      toast.error('Failed to load destinations configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiService.put('/cms/landing-page', { destinations: destData });
      toast.success('Destinations section updated successfully!');
    } catch (error) {
      toast.error('Failed to update destinations section');
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = () => {
    setDestData({
      ...destData,
      items: [...destData.items, { title: '', image: '', description: '', link: '' }]
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = destData.items.filter((_, idx) => idx !== index);
    setDestData({ ...destData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...destData.items];
    newItems[index][field] = value;
    setDestData({ ...destData, items: newItems });
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
        <h2 className="text-2xl font-black text-gray-900 tracking-widest uppercase">Top Destinations</h2>
        <p className="text-sm text-gray-500">Edit the destination cards displayed on the landing page.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 md:p-8 rounded-sm border border-gray-200 shadow-sm space-y-8">
        {/* Section Headers */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg border-b pb-2">Section Text</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Section Title (Subtitle)</label>
              <RichTextEditor
                value={destData.sectionTitle || ''}
                onChange={(val) => setDestData({ ...destData, sectionTitle: val })}
                placeholder="Select your perfect trips"
                minHeight="100px"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Section Heading (Main)</label>
              <RichTextEditor
                value={destData.sectionHeading || ''}
                onChange={(val) => setDestData({ ...destData, sectionHeading: val })}
                placeholder="TOP DESTINATION"
                minHeight="100px"
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-bold text-lg">Destination Items</h3>
            <button 
              type="button" 
              onClick={handleAddItem}
              className="flex items-center gap-2 text-sm text-emerald-600 font-bold hover:text-emerald-800 transition"
            >
              <Plus size={16} /> Add Destination
            </button>
          </div>
          
          {destData.items && destData.items.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {destData.items.map((item, idx) => (
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
                        placeholder="Wed in Goa, India"
                        minHeight="90px"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Image</label>
                      <div className="flex items-center gap-3 mt-1">
                        {item.image ? (
                          <>
                            <img src={item.image} alt="" className="w-12 h-12 object-cover rounded-sm border shadow-sm" />
                            <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-sm text-xs font-bold transition">
                              Change Image
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, idx, 'image')} />
                            </label>
                          </>
                        ) : (
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, idx, 'image')}
                            className="w-full border border-gray-300 p-1.5 text-sm focus:outline-none focus:border-emerald-500 transition bg-white"
                          />
                        )}
                      </div>
                      {uploadingIdx === idx && <p className="text-xs text-emerald-600">Uploading...</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Description</label>
                      <RichTextEditor
                        value={item.description || ''}
                        onChange={(val) => handleItemChange(idx, 'description', val)}
                        placeholder="Experience the vibrant nightlife, pristine beaches..."
                        minHeight="120px"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Link (Optional)</label>
                      <div className="flex flex-col gap-2">
                        <select
                          value={
                            ['', '/hotels', '/taxi/user', '/taxi/user/tours', '/taxi/user/airways', '/wedding'].includes(item.link || '')
                              ? (item.link || '')
                              : 'custom'
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'custom') {
                              handleItemChange(idx, 'link', 'https://');
                            } else {
                              handleItemChange(idx, 'link', val);
                            }
                          }}
                          className="w-full border border-gray-300 p-2 text-sm focus:outline-none focus:border-emerald-500 bg-white transition cursor-pointer"
                        >
                          <option value="">No Link</option>
                          <option value="/hotels">Hotels App (/hotels)</option>
                          <option value="/taxi/user">Taxi App (/taxi/user)</option>
                          <option value="/taxi/user/tours">Char Dham Yatra App (/taxi/user/tours)</option>
                          <option value="/taxi/user/airways">Helicopter Booking App (/taxi/user/airways)</option>
                          <option value="/wedding">Wedding Planner App (/wedding)</option>
                          <option value="custom">Custom URL...</option>
                        </select>
                        {!['', '/hotels', '/taxi/user', '/taxi/user/tours', '/taxi/user/airways', '/wedding'].includes(item.link || '') && (
                          <input 
                            type="text" 
                            placeholder="Enter custom URL (e.g. https://example.com)"
                            value={item.link || ''}
                            onChange={(e) => handleItemChange(idx, 'link', e.target.value)}
                            className="w-full border border-gray-300 p-2 text-sm focus:outline-none focus:border-emerald-500 transition"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No destinations added yet.</p>
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

export default CMSDestinations;
