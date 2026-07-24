import React, { useState, useEffect } from 'react';
import { api as apiService } from '../../../services/apiService';
import adminService from '../../../services/adminService';
import toast from 'react-hot-toast';
import RichTextEditor from '../../../components/common/RichTextEditor';

const CMSPromoBanner = () => {
  const [promoData, setPromoData] = useState({
    subtitle: "Last minute trip",
    title: "OUR LATEST TOUR",
    dateText: "Fri 15 March to Sun 17 March",
    priceText: "$125 per person",
    buttonText: "BOOK NOW",
    buttonLink: "/welcome",
    backgroundImage: "",
    leftImage: "",
    rightImage: ""
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
      if (res.data?.data?.latestTour) {
        setPromoData(res.data.data.latestTour);
      }
    } catch (error) {
      toast.error('Failed to load promo banner configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiService.put('/cms/landing-page', { latestTour: promoData });
      toast.success('Promo Banner updated successfully!');
    } catch (error) {
      toast.error('Failed to update promo banner');
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
          const updatedPromoData = { ...promoData, [field]: url };
          setPromoData(updatedPromoData);

          try {
            await apiService.put('/cms/landing-page', { latestTour: updatedPromoData });
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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-900 tracking-widest uppercase">Promo Banner</h2>
        <p className="text-sm text-gray-500">Edit the promo banner (Latest Tour) shown on the landing page.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 md:p-8 rounded-sm border border-gray-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Subtitle</label>
            <RichTextEditor
              value={promoData.subtitle || ''}
              onChange={(val) => setPromoData({ ...promoData, subtitle: val })}
              placeholder="Last minute trip"
              minHeight="90px"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Main Title</label>
            <RichTextEditor
              value={promoData.title || ''}
              onChange={(val) => setPromoData({ ...promoData, title: val })}
              placeholder="OUR LATEST TOUR"
              minHeight="90px"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Date Text</label>
            <RichTextEditor
              value={promoData.dateText || ''}
              onChange={(val) => setPromoData({ ...promoData, dateText: val })}
              placeholder="Fri 15 March to Sun 17 March"
              minHeight="90px"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Price Text</label>
            <RichTextEditor
              value={promoData.priceText || ''}
              onChange={(val) => setPromoData({ ...promoData, priceText: val })}
              placeholder="$125 per person"
              minHeight="90px"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Button Text</label>
            <RichTextEditor
              value={promoData.buttonText || ''}
              onChange={(val) => setPromoData({ ...promoData, buttonText: val })}
              placeholder="BOOK NOW"
              minHeight="90px"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Button Link</label>
            <input 
              type="text" 
              value={promoData.buttonLink || ''}
              onChange={(e) => setPromoData({...promoData, buttonLink: e.target.value})}
              className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Left Image</label>
            <div className="flex items-center gap-3">
              {promoData.leftImage ? (
                <>
                  <img src={promoData.leftImage} alt="" className="w-12 h-12 object-cover rounded-sm border shadow-sm" />
                  <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-sm text-xs font-bold transition">
                    Change Image
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'leftImage')} />
                  </label>
                </>
              ) : (
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'leftImage')}
                  className="w-full border border-gray-200 p-1.5 text-sm focus:outline-none focus:border-emerald-500 transition bg-white"
                />
              )}
            </div>
            {uploadingField === 'leftImage' && <p className="text-xs text-emerald-600">Uploading...</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Right Image</label>
            <div className="flex items-center gap-3">
              {promoData.rightImage ? (
                <>
                  <img src={promoData.rightImage} alt="" className="w-12 h-12 object-cover rounded-sm border shadow-sm" />
                  <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-sm text-xs font-bold transition">
                    Change Image
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'rightImage')} />
                  </label>
                </>
              ) : (
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'rightImage')}
                  className="w-full border border-gray-200 p-1.5 text-sm focus:outline-none focus:border-emerald-500 transition bg-white"
                />
              )}
            </div>
            {uploadingField === 'rightImage' && <p className="text-xs text-emerald-600">Uploading...</p>}
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Background Image</label>
            <div className="flex items-center gap-3">
              {promoData.backgroundImage ? (
                <>
                  <img src={promoData.backgroundImage} alt="" className="w-16 h-12 object-cover rounded-sm border shadow-sm" />
                  <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-sm text-xs font-bold transition">
                    Change Background
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'backgroundImage')} />
                  </label>
                </>
              ) : (
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'backgroundImage')}
                  className="w-full border border-gray-200 p-1.5 text-sm focus:outline-none focus:border-emerald-500 transition bg-white"
                />
              )}
            </div>
            {uploadingField === 'backgroundImage' && <p className="text-xs text-emerald-600">Uploading...</p>}
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

export default CMSPromoBanner;
