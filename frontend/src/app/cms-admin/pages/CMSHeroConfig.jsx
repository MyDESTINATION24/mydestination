import React, { useState, useEffect } from 'react';
import { api as apiService } from '../../../services/apiService';
import adminService from '../../../services/adminService';
import toast from 'react-hot-toast';
import RichTextEditor from '../../../components/common/RichTextEditor';

const CMSHeroConfig = () => {
  const [heroData, setHeroData] = useState({
    textBlocks: [],
    buttonText: "Explore Our Tours",
    buttonLink: "/welcome",
    backgroundImages: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await apiService.get('/cms/landing-page');
      if (res.data?.data?.hero) {
        const hero = res.data.data.hero;
        if (!hero.textBlocks || hero.textBlocks.length === 0) {
          hero.textBlocks = [
            { text: hero.titleLines?.[0] || "We give you", tag: "h2" },
            { text: hero.titleLines?.[1] || "strong desire to travel &", tag: "h2" },
            { text: hero.titleLines?.[2] || "explore the world", tag: "h2" },
            { text: hero.titleLines?.[3] || "Tourism", tag: "h1" },
            { text: hero.subText || "Embark on an unforgettable journey...", tag: "p" }
          ];
        }
        setHeroData(hero);
      }
    } catch (error) {
      toast.error('Failed to load hero configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiService.put('/cms/landing-page', { hero: heroData });
      toast.success('Hero section updated successfully!');
    } catch (error) {
      toast.error('Failed to update hero section');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('images', file);
    formData.append('type', 'landing_page');

    setUploadingImage(true);
    try {
      const res = await adminService.uploadImage(formData);
      if (res.success) {
        const url = res.url || (res.files && res.files[0]?.url);
        if (url) {
          const updatedHeroData = { 
            ...heroData, 
            backgroundImages: [...(heroData.backgroundImages || []), url] 
          };
          setHeroData(updatedHeroData);

          try {
            await apiService.put('/cms/landing-page', { hero: updatedHeroData });
            toast.success('Image uploaded & saved successfully');
          } catch (saveErr) {
            toast.error('Image uploaded but auto-save failed. Click "Save Changes" to apply manually.');
          }
        }
      } else {
         toast.error('Upload failed: ' + (res.message || 'Unknown error'));
      }
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = async (indexToRemove) => {
    const updatedImages = heroData.backgroundImages.filter((_, idx) => idx !== indexToRemove);
    const updatedHeroData = { ...heroData, backgroundImages: updatedImages };
    setHeroData(updatedHeroData);
    
    try {
      await apiService.put('/cms/landing-page', { hero: updatedHeroData });
      toast.success('Image removed & saved successfully');
    } catch (saveErr) {
      toast.error('Image removed but auto-save failed. Click "Save Changes" to apply manually.');
    }
  };

  const handleAddTextBlock = () => {
    setHeroData({
      ...heroData,
      textBlocks: [...(heroData.textBlocks || []), { text: '', tag: 'h2' }]
    });
  };

  const handleRemoveTextBlock = (index) => {
    const newBlocks = [...heroData.textBlocks];
    newBlocks.splice(index, 1);
    setHeroData({ ...heroData, textBlocks: newBlocks });
  };

  const handleTextBlockChange = (index, field, value) => {
    const newBlocks = [...heroData.textBlocks];
    newBlocks[index][field] = value;
    setHeroData({ ...heroData, textBlocks: newBlocks });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-900 tracking-widest uppercase">Hero Section</h2>
        <p className="text-sm text-gray-500">Edit the main text and buttons that appear at the top of the homepage.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 md:p-8 rounded-sm border border-gray-200 shadow-sm space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-bold text-lg">Dynamic Text Blocks & Formatting</h3>
            <button 
              type="button" 
              onClick={handleAddTextBlock}
              className="text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded transition"
            >
              + Add Text Line
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-4">Edit text lines using the Rich Text Editor to completely manage fonts, size, and styling.</p>
          
          {(heroData.textBlocks || []).map((block, idx) => (
            <div key={idx} className="flex flex-col md:flex-row gap-3 bg-gray-50 p-4 border border-gray-100 rounded-sm relative group space-y-2 md:space-y-0">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Text Content</label>
                <RichTextEditor
                  value={block.text || ''}
                  onChange={(val) => handleTextBlockChange(idx, 'text', val)}
                  placeholder="Enter line text..."
                  minHeight="100px"
                />
              </div>
              <div className="w-full md:w-48 space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Font Size (Tag)</label>
                <select 
                  value={block.tag}
                  onChange={(e) => handleTextBlockChange(idx, 'tag', e.target.value)}
                  className="w-full border border-gray-200 p-2 text-sm focus:outline-none focus:border-emerald-500 transition bg-white"
                >
                  <option value="h1">H1 - Extra Large (Highlight)</option>
                  <option value="h2">H2 - Large</option>
                  <option value="h3">H3 - Medium</option>
                  <option value="p">P - Small (Paragraph)</option>
                </select>
              </div>
              <button 
                type="button" 
                onClick={() => handleRemoveTextBlock(idx)}
                className="absolute top-2 right-2 text-red-400 hover:text-red-600 md:relative md:top-auto md:right-auto md:mt-5"
                title="Remove Line"
              >
                &times;
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-lg border-b pb-2">Background Images (Slider)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(heroData.backgroundImages || []).map((img, idx) => (
              <div key={idx} className="relative group rounded-sm border shadow-sm overflow-hidden aspect-video">
                <img src={img} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition"
                >
                  &times;
                </button>
              </div>
            ))}
            <div className="relative border-2 border-dashed border-gray-300 rounded-sm aspect-video flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition cursor-pointer">
              {uploadingImage ? (
                <span className="text-xs font-bold">Uploading...</span>
              ) : (
                <>
                  <span className="text-2xl mb-1">+</span>
                  <span className="text-xs font-bold uppercase tracking-wide">Add Image</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">Recommended size: 1920x1080 (HD). Add multiple images to create a slider effect.</p>
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

export default CMSHeroConfig;
