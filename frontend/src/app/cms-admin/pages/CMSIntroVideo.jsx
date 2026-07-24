import React, { useState, useEffect } from 'react';
import { api as apiService } from '../../../services/apiService';
import adminService from '../../../services/adminService';
import toast from 'react-hot-toast';
import RichTextEditor from '../../../components/common/RichTextEditor';

const CMSIntroVideo = () => {
  const [data, setData] = useState({
    bannerText: "Destination events success",
    videoLink: "",
    thumbnailImage: "",
    facilitiesSubtitle: "FACILITIES",
    facilitiesTitle: "Core Features",
    features: [
      { title: "", description: "", iconType: "Star" },
      { title: "", description: "", iconType: "Moon" },
      { title: "", description: "", iconType: "MapPin" }
    ]
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await apiService.get('/cms/landing-page');
      if (res.data?.data?.introVideoAndFacilities) {
        setData(res.data.data.introVideoAndFacilities);
      }
    } catch (error) {
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiService.put('/cms/landing-page', { introVideoAndFacilities: data });
      toast.success('Configuration updated successfully!');
    } catch (error) {
      toast.error('Failed to update configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('images', file);
    formData.append('type', 'landing_page');

    setUploadingField(field);
    try {
      const res = await adminService.uploadImage(formData);
      if (res.success) {
        const url = res.url || (res.files && res.files[0]?.url);
        if (url) {
          const updatedData = { ...data, [field]: url };
          setData(updatedData);

          try {
            await apiService.put('/cms/landing-page', { introVideoAndFacilities: updatedData });
            toast.success('Image uploaded & saved successfully');
          } catch (saveErr) {
            console.error('Auto-save failed after image upload:', saveErr);
            toast.success('Image uploaded. Click "Save Changes" to apply.');
          }
        }
      }
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingField(null);
    }
  };

  const handleFeatureChange = (index, field, value) => {
    const updatedFeatures = [...data.features];
    if (!updatedFeatures[index]) {
        updatedFeatures[index] = { title: "", description: "", iconType: "Star" };
    }
    updatedFeatures[index][field] = value;
    setData({ ...data, features: updatedFeatures });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-900 tracking-widest uppercase">Intro Video & Facilities</h2>
        <p className="text-sm text-gray-500">Edit the banner text, video link, and core features shown below the hero section.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 md:p-8 rounded-sm border border-gray-200 shadow-sm space-y-8">
        
        {/* Intro Video Section */}
        <div>
            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Banner & Video</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Banner Text</label>
                <RichTextEditor
                  value={data.bannerText || ''}
                  onChange={(val) => setData({ ...data, bannerText: val })}
                  placeholder="Destination events success"
                  minHeight="90px"
                />
            </div>
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Video Link (YouTube URL)</label>
                <input 
                type="text" 
                value={data.videoLink || ''}
                onChange={(e) => setData({...data, videoLink: e.target.value})}
                className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-emerald-500 transition"
                />
            </div>
            <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Video Thumbnail Image</label>
                <div className="flex items-center gap-3">
                {data.thumbnailImage ? (
                    <>
                    <img src={data.thumbnailImage} alt="" className="w-24 h-16 object-cover rounded-sm border shadow-sm" />
                    <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-sm text-xs font-bold transition">
                        Change Image
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'thumbnailImage')} />
                    </label>
                    </>
                ) : (
                    <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'thumbnailImage')}
                    className="w-full border border-gray-200 p-1.5 text-sm focus:outline-none focus:border-emerald-500 transition bg-white"
                    />
                )}
                </div>
                {uploadingField === 'thumbnailImage' && <p className="text-xs text-emerald-600">Uploading...</p>}
            </div>
            </div>
        </div>

        {/* Facilities Section */}
        <div>
            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Core Facilities</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Facilities Subtitle</label>
                    <RichTextEditor
                      value={data.facilitiesSubtitle || ''}
                      onChange={(val) => setData({ ...data, facilitiesSubtitle: val })}
                      placeholder="FACILITIES"
                      minHeight="90px"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Facilities Title</label>
                    <RichTextEditor
                      value={data.facilitiesTitle || ''}
                      onChange={(val) => setData({ ...data, facilitiesTitle: val })}
                      placeholder="Core Features"
                      minHeight="90px"
                    />
                </div>
            </div>

            <div className="space-y-4">
                {[0, 1, 2].map((index) => (
                    <div key={index} className="p-4 border border-gray-100 bg-gray-50 rounded-sm space-y-4">
                        <h4 className="text-sm font-bold text-gray-700">Feature {index + 1}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Title</label>
                                <RichTextEditor
                                  value={data.features?.[index]?.title || ''}
                                  onChange={(val) => handleFeatureChange(index, 'title', val)}
                                  placeholder="Feature Title"
                                  minHeight="90px"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Description</label>
                                <RichTextEditor
                                  value={data.features?.[index]?.description || ''}
                                  onChange={(val) => handleFeatureChange(index, 'description', val)}
                                  placeholder="Feature Description"
                                  minHeight="90px"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Icon</label>
                                <select
                                    value={data.features?.[index]?.iconType || 'Star'}
                                    onChange={(e) => handleFeatureChange(index, 'iconType', e.target.value)}
                                    className="w-full border border-gray-200 p-2 text-sm focus:outline-none focus:border-emerald-500 transition bg-white mt-1"
                                >
                                    <option value="Star">Star (High Rating)</option>
                                    <option value="Moon">Moon (Quiet Hours)</option>
                                    <option value="MapPin">MapPin (Best Location)</option>
                                    <option value="Wifi">WiFi</option>
                                    <option value="Coffee">Coffee</option>
                                    <option value="Shield">Shield (Security)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
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

export default CMSIntroVideo;
