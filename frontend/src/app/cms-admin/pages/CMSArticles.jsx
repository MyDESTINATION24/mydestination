import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Image as ImageIcon, Type, AlignLeft, Layout } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import RichTextEditor from '../../../components/common/RichTextEditor';
import { API_BASE_URL } from '../../../shared/api/runtimeConfig';

const CMSArticles = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentArticle, setCurrentArticle] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    image: '',
    excerpt: '',
    content: ''
  });

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/articles`);
      if (response.data.success) {
        setArticles(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast.error('Failed to fetch articles');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFieldChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, image: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading(isEditing ? 'Updating article...' : 'Creating article...');
    
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('excerpt', formData.excerpt);
      data.append('content', formData.content);
      
      if (imageFile) {
        data.append('image', imageFile);
      } else if (formData.image) {
        data.append('image', formData.image);
      }

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };

      if (isEditing) {
        await axios.put(`${API_BASE_URL}/articles/${currentArticle._id}`, data, config);
        toast.success('Article updated successfully', { id: loadingToast });
      } else {
        await axios.post(`${API_BASE_URL}/articles`, data, config);
        toast.success('Article created successfully', { id: loadingToast });
      }
      resetForm();
      fetchArticles();
    } catch (error) {
      console.error('Error saving article:', error);
      toast.error(error.response?.data?.message || 'Failed to save article', { id: loadingToast });
    }
  };

  const handleEdit = (article) => {
    setIsEditing(true);
    setCurrentArticle(article);
    setImagePreview(article.image);
    setFormData({
      title: article.title,
      image: article.image,
      excerpt: article.excerpt || '',
      content: article.content || ''
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/articles/${id}`);
      toast.success('Article deleted successfully');
      fetchArticles();
    } catch (error) {
      toast.error('Failed to delete article');
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentArticle(null);
    setImageFile(null);
    setImagePreview('');
    setFormData({
      title: '',
      image: '',
      excerpt: '',
      content: ''
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-gray-900 tracking-widest uppercase">Manage Articles</h2>
        <p className="text-sm text-gray-500">Create, edit, and delete news articles with full rich text formatting.</p>
      </div>

      {/* Input Form */}
      <div className="bg-white border border-gray-100 rounded-sm p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          {isEditing ? <Edit2 size={18} className="text-emerald-500" /> : <Plus size={18} className="text-emerald-500" />}
          {isEditing ? 'Edit Article' : 'Add New Article'}
        </h3>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block flex items-center gap-2">
                <Type size={14} /> Article Title
              </label>
              <RichTextEditor
                value={formData.title}
                onChange={(val) => handleFieldChange('title', val)}
                placeholder="Enter article title..."
                minHeight="90px"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block flex items-center gap-2">
                <ImageIcon size={14} /> Featured Image
              </label>
              
              <div className="flex flex-col gap-4">
                {imagePreview && (
                  <div className="relative w-full h-40 rounded-sm overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                    <img src={imagePreview} alt="Preview" className="h-full object-contain" />
                    <button 
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(''); setFormData(prev => ({ ...prev, image: '' })); }}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full bg-gray-50 border border-gray-200 border-dashed rounded-sm px-4 py-2.5 text-sm text-gray-500 flex items-center justify-center gap-2">
                      <Plus size={16} /> Choose Image File
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-[1px] flex-1 bg-gray-150"></div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">OR USE URL</span>
                  <div className="h-[1px] flex-1 bg-gray-150"></div>
                </div>

                <input
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={(e) => {
                    handleInputChange(e);
                    if (e.target.value) {
                      setImagePreview(e.target.value);
                      setImageFile(null);
                    }
                  }}
                  placeholder="Paste image URL here..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-sm px-4 py-2.5 outline-none focus:border-emerald-800 transition text-sm text-gray-900 font-medium"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block flex items-center gap-2">
                <AlignLeft size={14} /> Excerpt / Short Summary
              </label>
              <RichTextEditor
                value={formData.excerpt}
                onChange={(val) => handleFieldChange('excerpt', val)}
                placeholder="Brief summary of article..."
                minHeight="100px"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block flex items-center gap-2">
                <AlignLeft size={14} /> Full Article Content
              </label>
              <RichTextEditor
                value={formData.content}
                onChange={(val) => handleFieldChange('content', val)}
                placeholder="Write full article content here..."
                minHeight="200px"
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3 rounded-sm transition flex items-center justify-center gap-2"
              >
                {isEditing ? <Save size={18} /> : <Plus size={18} />}
                {isEditing ? 'Update Article' : 'Create Article'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-sm transition flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Existing Articles Grid */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-6">Existing Articles</h3>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-60 bg-gray-250 border border-gray-200 rounded-sm"></div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 border border-dashed border-gray-200 rounded-sm">
            <p className="text-gray-400">No articles found. Create your first article above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <div
                key={article._id}
                className="bg-white border border-gray-150 rounded-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  <div className="h-40 bg-gray-50 overflow-hidden relative">
                    <img src={article.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] text-gray-400 font-semibold mb-1">{article.date}</p>
                    <h4 className="font-bold text-gray-800 line-clamp-2 leading-tight mb-2 h-10">{article.title?.replace(/<[^>]*>/g, '')}</h4>
                    <p className="text-xs text-gray-500 line-clamp-3">{article.excerpt?.replace(/<[^>]*>/g, '')}</p>
                  </div>
                </div>
                
                <div className="p-4 pt-0">
                  <div className="h-[1px] bg-gray-100 my-3" />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(article)}
                      className="p-2 bg-emerald-50 text-emerald-800 rounded-sm hover:bg-emerald-800 hover:text-white transition border border-emerald-100"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(article._id)}
                      className="p-2 bg-red-50 text-red-700 rounded-sm hover:bg-red-600 hover:text-white transition border border-red-100"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CMSArticles;
