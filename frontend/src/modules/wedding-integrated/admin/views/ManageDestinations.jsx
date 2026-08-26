import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { weddingService } from '../../../../services/weddingService';
import { adminStyles } from '../theme/themeConfig';
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  MapPin, 
  IndianRupee,
  Type,
  LayoutGrid,
  PlusCircle,
  X,
  Upload,
  Trash,
  Calendar,
  Pencil,
  ChevronDown
} from 'lucide-react';

const ManageDestinations = () => {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categories = [
    'Heritage', 
    'Beach', 
    'Hill', 
    'Resort',
    'Temple / Spiritual',
    'Desert',
    'Lake',
    'Forest / Wildlife'
  ];
  const [editingDest, setEditingDest] = useState(null);
  const [newDest, setNewDest] = useState({
    name: '',
    location: '',
    category: 'Heritage',
    startingPrice: '',
    originalStartingPrice: '',
    avgCost: '',
    bestSeason: '',
    description: '',
    image: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await weddingService.getDestinations();
      setDestinations(data);
    } catch (error) {
      console.error('Error fetching destinations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image size should be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewDest({ ...newDest, image: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newDest.name || !newDest.location || !newDest.startingPrice) {
      alert("Please fill in all required fields (Name, Location, Starting Price)");
      return;
    }
    
    try {
      setLoading(true);
      if (editingDest) {
        await weddingService.updateDestination(editingDest._id, newDest);
      } else {
        await weddingService.addDestination(newDest);
      }
      setShowAddForm(false);
      resetForm();
      fetchData();
    } catch (error) {
      alert('Failed to save destination');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (dest) => {
    setEditingDest(dest);
    setNewDest({
      name: dest.name,
      location: dest.location,
      category: dest.category,
      startingPrice: dest.startingPrice,
      originalStartingPrice: dest.originalStartingPrice || '',
      avgCost: dest.avgCost || '',
      bestSeason: dest.bestSeason || '',
      description: dest.description || '',
      image: dest.image || ''
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingDest(null);
    setNewDest({
      name: '',
      location: '',
      category: 'Heritage',
      startingPrice: '',
    originalStartingPrice: '',
      avgCost: '',
      bestSeason: '',
      description: '',
      image: ''
    });
  };

  const openAddForm = () => {
    resetForm();
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this destination?")) return;
    try {
      setLoading(true);
      await weddingService.deleteDestination(id);
      fetchData();
    } catch (error) {
      alert('Failed to delete destination');
    } finally {
      setLoading(false);
    }
  };

  if (loading && destinations.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(353,45%,35%)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-serif text-[hsl(353,45%,35%)]">Manage Destinations</h2>
            <p className="text-gray-500 text-sm mt-1">Add and control the wedding destinations available on the platform</p>
          </div>
          <button 
            onClick={openAddForm}
            className="flex items-center gap-2 px-6 py-3 bg-[hsl(353,45%,35%)] text-white rounded-2xl text-sm font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 leading-none"
          >
             <Plus size={18} /> Add New Destination
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {destinations.map((dest) => (
           <div key={dest._id} className={`${adminStyles.glassCard} p-6 rounded-[2rem] group relative overflow-hidden h-80`}>
              <img 
                src={dest.image || 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop'} 
                className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 transition-opacity duration-700" 
                alt={dest.name}
              />
              <div className="relative z-10 flex flex-col h-full">
                 <div className="flex justify-between items-start mb-auto">
                    <span className="px-4 py-1.5 bg-[hsl(353,45%,35%)] text-white rounded-full text-[10px] font-black uppercase tracking-widest leading-none">
                       {dest.category}
                    </span>
                    <div className="flex gap-2">
                       <button 
                         onClick={() => handleEdit(dest)}
                         className="p-2.5 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                       >
                          <Pencil size={16} />
                       </button>
                       <button 
                         onClick={() => handleDelete(dest._id)}
                         className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                       >
                          <Trash2 size={16} />
                       </button>
                    </div>
                 </div>
                 
                 <div className="mt-4">
                    <h3 className="text-2xl font-black text-[hsl(353,20%,15%)] leading-none mb-2">{dest.name}</h3>
                    <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                       <MapPin size={14} className="text-[#B06A6C]"/> {dest.location}
                    </div>
                 </div>

                 <div className="mt-4 pt-4 border-t border-[hsl(353,45%,35%)]/10 flex justify-between items-center">
                     <div>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Starting Price</p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                           <p className="text-sm font-black text-slate-800">₹{(dest.startingPrice / 100000).toFixed(1)}L+</p>
                           {dest.originalStartingPrice && Number(dest.originalStartingPrice) > Number(dest.startingPrice) && (
                              <>
                                 <span className="text-xs text-gray-400 line-through font-bold">
                                    ₹{(dest.originalStartingPrice / 100000).toFixed(1)}L
                                 </span>
                                 <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded leading-none">
                                    {Math.round(((dest.originalStartingPrice - dest.startingPrice) / dest.originalStartingPrice) * 100)}% OFF
                                 </span>
                              </>
                           )}
                        </div>
                     </div>
                    <span className="text-[10px] font-black text-[#B06A6C] uppercase tracking-widest flex items-center gap-1 bg-[#B06A6C]/5 px-3 py-1 rounded-full">
                       LIVE DATA
                    </span>
                 </div>
              </div>
           </div>
         ))}
         
         {destinations.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-[#B06A6C]/20 rounded-[2.5rem] bg-white/30 backdrop-blur-sm">
               <PlusCircle size={48} className="text-[#B06A6C]/20 mb-4" />
               <p className="text-gray-400 font-medium">No custom destinations added yet.</p>
            </div>
         )}
      </div>

      {/* Add Form Modal Overlay */}
      {showAddForm && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white/90 backdrop-blur-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl p-8 md:p-12 relative border border-white/40 no-scrollbar">
              <button 
                onClick={resetForm}
                className="absolute right-8 top-8 p-3 hover:bg-slate-100 rounded-2xl transition-colors"
              >
                 <X size={24} className="text-slate-400" />
              </button>

              <h3 className="text-3xl font-serif text-[hsl(353,45%,35%)] mb-8">
                {editingDest ? 'Edit Destination' : 'Add Destination'}
              </h3>
              <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <Type size={12} /> Name
                    </label>
                    <input 
                      required
                      value={newDest.name}
                      onChange={e => setNewDest({...newDest, name: e.target.value})}
                      placeholder="e.g. Udaipur"
                      className="w-full px-5 py-3 bg-white border border-[#B06A6C]/20 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B06A6C]/20"
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <MapPin size={12} /> Location
                    </label>
                    <input 
                      required
                      value={newDest.location}
                      onChange={e => setNewDest({...newDest, location: e.target.value})}
                      placeholder="e.g. Rajasthan, India"
                      className="w-full px-5 py-3 bg-white border border-[#B06A6C]/20 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B06A6C]/20"
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <LayoutGrid size={12} /> Category
                    </label>
                    <div className="relative">
                       <div 
                         onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                         className="w-full px-5 py-3 bg-white border border-[#B06A6C]/20 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B06A6C]/20 cursor-pointer flex justify-between items-center"
                       >
                          <span>{newDest.category || 'Select Category'}</span>
                          <ChevronDown size={16} className={`text-gray-400 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                       </div>
                       
                       {showCategoryDropdown && (
                         <div className="absolute z-50 w-full mt-2 bg-white border border-[#B06A6C]/20 rounded-xl shadow-xl overflow-hidden">
                            {categories.map(cat => (
                               <div 
                                 key={cat} 
                                 className={`px-5 py-3 cursor-pointer text-sm transition-colors ${newDest.category === cat ? 'bg-[#B06A6C]/10 text-[#B06A6C] font-bold' : 'hover:bg-[#B06A6C]/5 text-gray-700'}`}
                                 onClick={() => { setNewDest({...newDest, category: cat}); setShowCategoryDropdown(false); }}
                               >
                                 {cat}
                               </div>
                            ))}
                         </div>
                       )}
                    </div>
                 </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                       <span className="flex items-center gap-2"><IndianRupee size={12} /> Starting Price</span>
                       {newDest.startingPrice && <span className="text-[#B06A6C] font-bold">₹{(newDest.startingPrice / 100000).toFixed(1)}L+</span>}
                    </label>
                    <input 
                      type="number"
                      required
                      value={newDest.startingPrice}
                      onChange={e => setNewDest({...newDest, startingPrice: e.target.value})}
                      placeholder="e.g. 1500000"
                      className="w-full px-5 py-3 bg-white border border-[#B06A6C]/20 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B06A6C]/20"
                    />
                 </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                       <span className="flex items-center gap-2"><IndianRupee size={12} /> Original Price (optional)</span>
                       {newDest.originalStartingPrice && <span className="text-[#B06A6C] font-bold">₹{(newDest.originalStartingPrice / 100000).toFixed(1)}L+</span>}
                    </label>
                    <input
                      type="number"
                      value={newDest.originalStartingPrice}
                      onChange={e => setNewDest({...newDest, originalStartingPrice: e.target.value})}
                      placeholder="Shown struck through — leave empty for no discount"
                      className="w-full px-5 py-3 bg-white border border-[#B06A6C]/20 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B06A6C]/20"
                    />
                    <p className="text-[10px] font-semibold text-slate-400">Must be higher than the starting price, or it is ignored.</p>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <IndianRupee size={12} /> Average Cost
                    </label>
                    <input 
                      required
                      value={newDest.avgCost}
                      onChange={e => setNewDest({...newDest, avgCost: e.target.value})}
                      placeholder="e.g. ₹20L - ₹35L"
                      className="w-full px-5 py-3 bg-white border border-[#B06A6C]/20 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B06A6C]/20"
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <Calendar size={12} /> Best Season
                    </label>
                    <input 
                      required
                      value={newDest.bestSeason}
                      onChange={e => setNewDest({...newDest, bestSeason: e.target.value})}
                      placeholder="e.g. Oct - March"
                      className="w-full px-5 py-3 bg-white border border-[#B06A6C]/20 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B06A6C]/20"
                    />
                 </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <ImageIcon size={12} /> Destination Image
                    </label>
                    <div className="relative group">
                       <input 
                         type="file" 
                         id="dest-image-upload"
                         accept="image/*"
                         onChange={handleImageChange}
                         className="hidden" 
                       />
                       
                       {!newDest.image ? (
                         <label 
                           htmlFor="dest-image-upload"
                           className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-[#B06A6C]/20 rounded-3xl bg-white/50 hover:bg-[#B06A6C]/5 hover:border-[#B06A6C]/40 transition-all cursor-pointer group-hover:scale-[0.99]"
                         >
                            <div className="flex flex-col items-center gap-2">
                               <div className="w-12 h-12 rounded-2xl bg-[#B06A6C]/10 flex items-center justify-center text-[#B06A6C]">
                                  <Upload size={20} />
                               </div>
                               <div className="text-center">
                                  <p className="text-sm font-bold text-slate-600">Click to upload photo</p>
                                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">PNG, JPG or WebP (Max 2MB)</p>
                                </div>
                            </div>
                         </label>
                       ) : (
                         <div className="relative h-48 w-full rounded-3xl overflow-hidden border border-[#B06A6C]/20 shadow-lg">
                            <img src={newDest.image} className="w-full h-full object-cover" alt="Preview" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                               <label htmlFor="dest-image-upload" className="p-3 bg-white text-[hsl(353,45%,35%)] rounded-2xl cursor-pointer hover:scale-110 transition-transform">
                                  <Upload size={20} />
                               </label>
                               <button 
                                 type="button"
                                 onClick={() => setNewDest({ ...newDest, image: '' })}
                                 className="p-3 bg-white text-red-500 rounded-2xl hover:scale-110 transition-transform"
                               >
                                  <Trash size={20} />
                               </button>
                            </div>
                         </div>
                       )}
                    </div>
                 </div>

                 <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                    <textarea 
                      value={newDest.description}
                      onChange={e => setNewDest({...newDest, description: e.target.value})}
                      placeholder="Tell us about the destination..."
                      className="w-full h-24 px-5 py-3 bg-white border border-[#B06A6C]/20 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B06A6C]/20"
                    />
                 </div>

                 <div className="md:col-span-2 pt-4">
                    <button type="submit" disabled={loading} className="w-full py-4 bg-[hsl(353,45%,35%)] text-white rounded-[2rem] font-bold shadow-xl shadow-[hsl(353,45%,35%)]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
                       {loading ? 'Processing...' : (editingDest ? 'Update Destination' : 'Save Destination')}
                    </button>
                 </div>
              </form>
           </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ManageDestinations;
