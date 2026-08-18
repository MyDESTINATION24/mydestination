import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { weddingService } from '../../../../services/weddingService';
import { adminStyles } from '../theme/themeConfig';
import { Plus, Edit, Trash2, CheckCircle2, IndianRupee, Layers, X, PlusCircle, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const ManageSubscriptions = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  
  const [formData, setFormData] = useState({
    planName: '',
    price: '',
    originalPrice: '',
    validityMonths: '',
    validityType: 'months',
    numberOfLeads: '',
    features: [''],
    isActive: true
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const data = await weddingService.getAdminSubscriptions();
      setPlans(data?.data || []);
    } catch (error) {
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const removeFeature = (index) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures.length ? newFeatures : [''] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.planName || !formData.price || !formData.validityMonths || !formData.numberOfLeads) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      const cleanData = {
        ...formData,
        features: formData.features.filter(f => f.trim() !== '')
      };

      if (editingPlan) {
        await weddingService.updateSubscriptionPlan(editingPlan._id, cleanData);
        toast.success('Plan updated successfully');
      } else {
        await weddingService.createSubscriptionPlan(cleanData);
        toast.success('Plan created successfully');
      }
      
      setShowForm(false);
      fetchPlans();
    } catch (error) {
      toast.error('Failed to save subscription plan');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      planName: plan.planName,
      price: plan.price,
      originalPrice: plan.originalPrice || '',
      validityMonths: plan.validityMonths,
      validityType: plan.validityType || 'months',
      numberOfLeads: plan.numberOfLeads,
      features: plan.features?.length ? plan.features : [''],
      isActive: plan.isActive
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this plan?")) return;
    try {
      await weddingService.deleteSubscriptionPlan(id);
      toast.success('Plan deleted successfully');
      fetchPlans();
    } catch (error) {
      toast.error('Failed to delete plan');
    }
  };

  const openAddForm = () => {
    setEditingPlan(null);
    setFormData({
      planName: '',
      price: '',
      originalPrice: '',
      validityMonths: '',
      validityType: 'months',
      numberOfLeads: '',
      features: [''],
      isActive: true
    });
    setErrors({});
    setShowForm(true);
  };

  const handleNumberInput = (field, value, maxLen) => {
    // Only allow numbers
    if (value && !/^\d*$/.test(value)) return;
    
    // Check max length
    if (value.length > maxLen) {
      toast.error(`Maximum ${maxLen} digits allowed`, { id: `err_${field}` });
      setErrors(prev => ({ ...prev, [field]: `Cannot exceed ${maxLen} digits` }));
      return;
    }
    
    setErrors(prev => { const newErr = {...prev}; delete newErr[field]; return newErr; });
    setFormData({ ...formData, [field]: value });
  };

  if (loading && plans.length === 0) {
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
            <h2 className="text-3xl font-serif text-[hsl(353,45%,35%)]">Manage Subscriptions</h2>
            <p className="text-gray-500 text-sm mt-1">Create and manage vendor subscription plans</p>
          </div>
          <button 
            onClick={openAddForm}
            className="flex items-center gap-2 px-6 py-3 bg-[hsl(353,45%,35%)] text-white rounded-2xl text-sm font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 leading-none"
          >
             <Plus size={18} /> Add New Plan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {plans.map((plan) => (
           <div key={plan._id} className={`${adminStyles.glassCard} p-6 rounded-[2rem] relative overflow-hidden ${!plan.isActive ? 'opacity-70' : ''}`}>
              <div className="flex justify-between items-start mb-4">
                 <div>
                   <span className="px-4 py-1.5 bg-[hsl(353,45%,35%)]/10 text-[hsl(353,45%,35%)] rounded-full text-[10px] font-black uppercase tracking-widest leading-none mb-3 inline-block">
                     {plan.validityMonths} {plan.validityType === 'days' ? 'Days' : 'Months'}
                   </span>
                   <h3 className="text-2xl font-black text-[hsl(353,20%,15%)] leading-none">{plan.planName}</h3>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => handleEdit(plan)} className="p-2.5 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all">
                       <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(plan._id)} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                       <Trash2 size={16} />
                    </button>
                 </div>
              </div>
              
              <div className="mt-6 mb-6 flex items-baseline gap-2 flex-wrap">
                <div className="flex items-baseline gap-1">
                  <IndianRupee size={24} className="text-[hsl(353,45%,35%)] font-bold"/>
                  <span className="text-4xl font-black text-slate-800">{plan.price}</span>
                </div>
                {/* Only a genuinely higher was-price is shown, so a plan can never
                    advertise a discount it does not give. */}
                {Number(plan.originalPrice) > Number(plan.price) ? (
                  <>
                    <span className="text-lg font-bold text-slate-400 line-through">₹{plan.originalPrice}</span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-600">
                      {Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)}% OFF
                    </span>
                  </>
                ) : null}
              </div>

              <div className="bg-[#B06A6C]/5 p-4 rounded-xl border border-[#B06A6C]/10 mb-6 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Layers size={18} className="text-[hsl(353,45%,35%)]" />
                  <span className="font-bold text-slate-700">Leads Quota</span>
                </div>
                <span className="text-xl font-black text-[hsl(353,45%,35%)]">{plan.numberOfLeads}</span>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Included Features</p>
                {plan.features?.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>

              {!plan.isActive && (
                <div className="absolute top-0 right-0 bg-red-500 text-white px-4 py-1 rounded-bl-xl text-xs font-bold">
                  Inactive
                </div>
              )}
           </div>
         ))}
         
         {plans.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-[#B06A6C]/20 rounded-[2.5rem] bg-white/30 backdrop-blur-sm">
               <PlusCircle size={48} className="text-[#B06A6C]/20 mb-4" />
               <p className="text-gray-400 font-medium">No subscription plans created yet.</p>
               <button onClick={openAddForm} className="mt-4 text-[#B06A6C] font-bold hover:underline">Create First Plan</button>
            </div>
         )}
      </div>

      {showForm && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white/90 backdrop-blur-xl w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl p-8 md:p-12 relative border border-white/40 no-scrollbar">
              <button onClick={() => setShowForm(false)} className="absolute right-8 top-8 p-3 hover:bg-slate-100 rounded-2xl transition-colors">
                 <X size={24} className="text-slate-400" />
              </button>

              <h3 className="text-3xl font-serif text-[hsl(353,45%,35%)] mb-8">
                {editingPlan ? 'Edit Plan' : 'Create New Plan'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan Name</label>
                    <input 
                      required
                      value={formData.planName}
                      onChange={e => {
                        const val = e.target.value;
                        if (val.length > 30) {
                           toast.error('Plan name is too long', { id: 'err_name' });
                           return;
                        }
                        setFormData({...formData, planName: val});
                      }}
                      placeholder="e.g. Premium Plan"
                      className="w-full px-5 py-3 bg-white border border-[#B06A6C]/20 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B06A6C]/40"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><IndianRupee size={12}/> Price</label>
                      <input 
                        required type="text"
                        value={formData.price}
                        onChange={e => handleNumberInput('price', e.target.value, 6)}
                        placeholder="e.g. 4999"
                        className={`w-full px-5 py-3 bg-white border ${errors.price ? 'border-red-500 ring-1 ring-red-500' : 'border-[#B06A6C]/20'} rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B06A6C]/40`}
                      />
                      {errors.price && <p className="text-xs text-red-500 font-bold">{errors.price}</p>}
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><IndianRupee size={12}/> Original Price (optional)</label>
                      <input
                        type="text"
                        value={formData.originalPrice}
                        onChange={e => handleNumberInput('originalPrice', e.target.value, 6)}
                        placeholder="e.g. 500 — shown struck through"
                        className="w-full px-5 py-3 bg-white border border-[#B06A6C]/20 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B06A6C]/40"
                      />
                      <p className="text-[10px] font-semibold text-slate-400">Leave empty for no discount. Must be higher than the price.</p>
                   </div>
                   <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Calendar size={12}/> Validity</label>
                        <div className="flex gap-2">
                          <label className="text-[10px] font-bold flex items-center gap-1 cursor-pointer text-slate-600">
                            <input type="radio" name="validityType" value="days" checked={formData.validityType === 'days'} onChange={(e) => setFormData({...formData, validityType: e.target.value})} className="accent-[hsl(353,45%,35%)] w-3 h-3" /> Days
                          </label>
                          <label className="text-[10px] font-bold flex items-center gap-1 cursor-pointer text-slate-600">
                            <input type="radio" name="validityType" value="months" checked={formData.validityType === 'months'} onChange={(e) => setFormData({...formData, validityType: e.target.value})} className="accent-[hsl(353,45%,35%)] w-3 h-3" /> Months
                          </label>
                        </div>
                      </div>
                      <input 
                        required type="text"
                        value={formData.validityMonths}
                        onChange={e => handleNumberInput('validityMonths', e.target.value, 3)}
                        placeholder={`e.g. ${formData.validityType === 'days' ? '15' : '12'}`}
                        className={`w-full px-5 py-3 bg-white border ${errors.validityMonths ? 'border-red-500 ring-1 ring-red-500' : 'border-[#B06A6C]/20'} rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B06A6C]/40`}
                      />
                      {errors.validityMonths && <p className="text-xs text-red-500 font-bold">{errors.validityMonths}</p>}
                   </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Layers size={12}/> Number of Leads</label>
                    <input 
                      required type="text"
                      value={formData.numberOfLeads}
                      onChange={e => handleNumberInput('numberOfLeads', e.target.value, 4)}
                      placeholder="e.g. 50"
                      className={`w-full px-5 py-3 bg-white border ${errors.numberOfLeads ? 'border-red-500 ring-1 ring-red-500' : 'border-[#B06A6C]/20'} rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B06A6C]/40`}
                    />
                    {errors.numberOfLeads && <p className="text-xs text-red-500 font-bold">{errors.numberOfLeads}</p>}
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Features List</label>
                    {formData.features.map((feature, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input 
                          value={feature}
                          onChange={e => handleFeatureChange(idx, e.target.value)}
                          placeholder="e.g. Priority Support"
                          className="flex-1 px-5 py-3 bg-white border border-[#B06A6C]/20 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B06A6C]/20"
                        />
                        <button type="button" onClick={() => removeFeature(idx)} className="p-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">
                          <X size={20} />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={addFeature} className="text-sm text-[hsl(353,45%,35%)] font-bold flex items-center gap-1 hover:underline">
                      <Plus size={16}/> Add Feature
                    </button>
                 </div>

                 <div className="flex items-center gap-3 pt-2">
                    <input 
                      type="checkbox" 
                      id="isActive"
                      checked={formData.isActive}
                      onChange={e => setFormData({...formData, isActive: e.target.checked})}
                      className="w-5 h-5 accent-[hsl(353,45%,35%)]"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Plan is Active</label>
                 </div>

                 <div className="pt-6">
                    <button type="submit" disabled={loading} className="w-full py-4 bg-[hsl(353,45%,35%)] text-white rounded-[2rem] font-bold shadow-xl shadow-[hsl(353,45%,35%)]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
                       {loading ? 'Processing...' : (editingPlan ? 'Update Plan' : 'Save Plan')}
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

export default ManageSubscriptions;
