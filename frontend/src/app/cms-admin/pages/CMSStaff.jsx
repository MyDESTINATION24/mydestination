import React, { useState, useEffect } from 'react';
import { api as apiService } from '../../../services/apiService';
import adminService from '../../../services/adminService';
import toast from 'react-hot-toast';
import { Plus, Trash2, Upload } from 'lucide-react';
import RichTextEditor from '../../../components/common/RichTextEditor';

const CMSStaff = () => {
  const [staffData, setStaffData] = useState({
    sectionSubtitle: "Tourism members",
    sectionTitle: "OUR STAFF",
    description: "Our team of dedicated travel experts is here to ensure your journey is smooth, safe, and unforgettable.",
    backgroundImage: "",
    buttonText: "JOIN NOW",
    items: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState(null);
  const [uploadingBg, setUploadingBg] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await apiService.get('/cms/landing-page');
      if (res.data?.data?.staff) {
        const fetched = res.data.data.staff;
        setStaffData({
          sectionSubtitle: fetched.sectionSubtitle || "Tourism members",
          sectionTitle: fetched.sectionTitle || "OUR STAFF",
          description: fetched.description || "Our team of dedicated travel experts is here to ensure your journey is smooth, safe, and unforgettable.",
          backgroundImage: fetched.backgroundImage || "",
          buttonText: fetched.buttonText || "JOIN NOW",
          items: fetched.items || []
        });
      }
    } catch (error) {
      toast.error('Failed to load staff configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiService.put('/cms/landing-page', { staff: staffData });
      toast.success('Staff section updated successfully!');
    } catch (error) {
      toast.error('Failed to update staff section');
    } finally {
      setSaving(false);
    }
  };

  const handleBgImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('images', file);
    formData.append('type', 'landing_page');

    setUploadingBg(true);
    try {
      const res = await adminService.uploadImage(formData);
      if (res.success) {
        const url = res.url || (res.files && res.files[0]?.url);
        if (url) {
          setStaffData(prev => ({ ...prev, backgroundImage: url }));
          toast.success('Background image uploaded successfully');
        }
      }
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingBg(false);
    }
  };

  const handleAddItem = () => {
    setStaffData({
      ...staffData,
      items: [...staffData.items, { name: '', role: '', email: '', description: '', image: '' }]
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = staffData.items.filter((_, idx) => idx !== index);
    setStaffData({ ...staffData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...staffData.items];
    newItems[index][field] = value;
    setStaffData({ ...staffData, items: newItems });
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
        <h2 className="text-2xl font-black text-gray-900 tracking-widest uppercase">Staff & About</h2>
        <p className="text-sm text-gray-500">Edit the staff members displayed on the landing page.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 md:p-8 rounded-sm border border-gray-200 shadow-sm space-y-8">
        {/* Section Headers */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg border-b pb-2">Section Text & Banner</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Section Subtitle</label>
                <RichTextEditor
                  value={staffData.sectionSubtitle || ''}
                  onChange={(val) => setStaffData({...staffData, sectionSubtitle: val})}
                  placeholder="Tourism members"
                  minHeight="90px"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Section Title</label>
                <RichTextEditor
                  value={staffData.sectionTitle || ''}
                  onChange={(val) => setStaffData({...staffData, sectionTitle: val})}
                  placeholder="OUR STAFF"
                  minHeight="90px"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Description</label>
              <RichTextEditor
                value={staffData.description || ''}
                onChange={(val) => setStaffData({...staffData, description: val})}
                placeholder="Our team of dedicated travel experts..."
                minHeight="120px"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Button Text</label>
                <RichTextEditor
                  value={staffData.buttonText || ''}
                  onChange={(val) => setStaffData({...staffData, buttonText: val})}
                  placeholder="JOIN NOW"
                  minHeight="90px"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Banner Background Image</label>
                <div className="flex items-center gap-3 mt-1">
                  {staffData.backgroundImage ? (
                    <>
                      <img src={staffData.backgroundImage} alt="" className="w-16 h-10 object-cover rounded-sm border shadow-sm" />
                      <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-sm text-xs font-bold transition flex items-center gap-1.5">
                        <Upload size={14} /> Change Image
                        <input type="file" accept="image/*" className="hidden" onChange={handleBgImageUpload} />
                      </label>
                    </>
                  ) : (
                    <label className="cursor-pointer bg-white border border-dashed border-gray-300 hover:border-emerald-500 text-gray-500 px-3 py-1.5 rounded-sm text-xs font-bold transition flex items-center gap-1.5">
                      <Upload size={14} /> Upload Image
                      <input type="file" accept="image/*" className="hidden" onChange={handleBgImageUpload} />
                    </label>
                  )}
                  {uploadingBg && <p className="text-xs text-emerald-600">Uploading...</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-bold text-lg">Staff Members</h3>
            <button 
              type="button" 
              onClick={handleAddItem}
              className="flex items-center gap-2 text-sm text-emerald-600 font-bold hover:text-emerald-800 transition"
            >
              <Plus size={16} /> Add Staff Member
            </button>
          </div>
          
          {staffData.items && staffData.items.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {staffData.items.map((item, idx) => (
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
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Name</label>
                      <RichTextEditor
                        value={item.name || ''}
                        onChange={(val) => handleItemChange(idx, 'name', val)}
                        placeholder="John Doe"
                        minHeight="90px"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Role / Position</label>
                      <RichTextEditor
                        value={item.role || ''}
                        onChange={(val) => handleItemChange(idx, 'role', val)}
                        placeholder="Tour Manager"
                        minHeight="90px"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Description</label>
                      <RichTextEditor
                        value={item.description || ''}
                        onChange={(val) => handleItemChange(idx, 'description', val)}
                        placeholder="Short bio..."
                        minHeight="100px"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Profile Image</label>
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
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No staff members added yet.</p>
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

export default CMSStaff;
