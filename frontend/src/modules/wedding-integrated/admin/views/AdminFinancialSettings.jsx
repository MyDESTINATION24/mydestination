import React, { useState, useEffect } from 'react';
import { Settings, Save, Loader2, IndianRupee } from 'lucide-react';
import { platformSettingsService } from '../../../../services/apiService';
import toast from 'react-hot-toast';

const AdminFinancialSettings = () => {
  const [settings, setSettings] = useState({
    platformFee: 499,
    platformFeeType: 'fixed',
    vendorCommission: 499,
    vendorCommissionType: 'fixed',
    currency: 'INR',
    freeTrialEnabled: false,
    freeTrialStartDate: '',
    freeTrialEndDate: '',
    freeTrialDays: 30,
    freeTrialLeads: 50
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await platformSettingsService.getSettings();
      if (data) {
        setSettings({
          platformFee: data.platformFee || 499,
          platformFeeType: data.platformFeeType || 'fixed',
          vendorCommission: data.vendorCommission || 499,
          vendorCommissionType: data.vendorCommissionType || 'fixed',
          currency: data.currency || 'INR',
          freeTrialEnabled: data.freeTrialEnabled || false,
          freeTrialStartDate: data.freeTrialStartDate ? data.freeTrialStartDate.split('T')[0] : '',
          freeTrialEndDate: data.freeTrialEndDate ? data.freeTrialEndDate.split('T')[0] : '',
          freeTrialDays: data.freeTrialDays || 30,
          freeTrialLeads: data.freeTrialLeads || 50
        });
      }
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Only allow numbers
    if (value && !/^\d*$/.test(value)) return;

    if (value.length > 6) {
      toast.error('Value cannot exceed 6 digits', { id: `err_${name}` });
      return;
    }

    setSettings(prev => ({
      ...prev,
      [name]: value === '' ? '' : Number(value)
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const toastId = toast.loading("Saving settings...");
      await platformSettingsService.updateSettings({
        platformFee: settings.platformFee,
        platformFeeType: settings.platformFeeType,
        vendorCommission: settings.vendorCommission,
        vendorCommissionType: settings.vendorCommissionType,
        freeTrialEnabled: settings.freeTrialEnabled,
        freeTrialStartDate: settings.freeTrialStartDate || null,
        freeTrialEndDate: settings.freeTrialEndDate || null,
        freeTrialDays: settings.freeTrialDays,
        freeTrialLeads: settings.freeTrialLeads
      });
      toast.success("Settings saved successfully!", { id: toastId });
    } catch (error) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Global Financial Settings</h2>
            <p className="text-sm text-slate-500">Manage platform fees and vendor commission deductions globally.</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* User Side Setting */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2">User Side: Booking Confirmation</h3>
            <p className="text-sm text-slate-500 mb-4">
              This is the "Platform Fee" amount that a User sees and pays during the "Complete Booking" step on their Enquiries dashboard.
            </p>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">Platform Fee Amount</label>
              <div className="flex items-center gap-4 max-w-lg">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {settings.platformFeeType === 'percentage' ? <span className="text-slate-400 font-bold ml-1">%</span> : <IndianRupee className="w-5 h-5 text-slate-400" />}
                  </div>
                  <input
                    type="number"
                    name="platformFee"
                    value={settings.platformFee}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    placeholder="e.g. 499"
                  />
                </div>
                <select
                  name="platformFeeType"
                  value={settings.platformFeeType}
                  onChange={(e) => setSettings(prev => ({ ...prev, platformFeeType: e.target.value }))}
                  className="w-48 px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium text-slate-700"
                >
                  <option value="fixed">Fixed (₹)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Vendor Side Setting */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Vendor Side: Automatic Commission Deduction</h3>
            <p className="text-sm text-slate-500 mb-4">
              This is the exact amount automatically deducted (debited) from the Vendor's Wallet when a user confirms a booking.
            </p>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">Vendor Commission Amount</label>
              <div className="flex items-center gap-4 max-w-lg">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {settings.vendorCommissionType === 'percentage' ? <span className="text-slate-400 font-bold ml-1">%</span> : <IndianRupee className="w-5 h-5 text-slate-400" />}
                  </div>
                  <input
                    type="number"
                    name="vendorCommission"
                    value={settings.vendorCommission}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    placeholder="e.g. 499"
                  />
                </div>
                <select
                  name="vendorCommissionType"
                  value={settings.vendorCommissionType}
                  onChange={(e) => setSettings(prev => ({ ...prev, vendorCommissionType: e.target.value }))}
                  className="w-48 px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium text-slate-700"
                >
                  <option value="fixed">Fixed (₹)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Promotional Free Trial Setting */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mt-8">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-slate-800">Promotional Free Trial for New Vendors</h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={settings.freeTrialEnabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, freeTrialEnabled: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <p className="text-sm text-slate-500 mb-6">
              If enabled, vendors registering within the specified date range will automatically receive a free subscription.
            </p>
            
            {settings.freeTrialEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in duration-300">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-700">Start Date</label>
                  <input
                    type="date"
                    name="freeTrialStartDate"
                    min={new Date().toISOString().split("T")[0]}
                    value={settings.freeTrialStartDate}
                    onChange={(e) => setSettings(prev => ({ ...prev, freeTrialStartDate: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-700">End Date</label>
                  <input
                    type="date"
                    name="freeTrialEndDate"
                    min={settings.freeTrialStartDate || new Date().toISOString().split("T")[0]}
                    value={settings.freeTrialEndDate}
                    onChange={(e) => setSettings(prev => ({ ...prev, freeTrialEndDate: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-700">Free Trial Validity (Days)</label>
                  <input
                    type="number"
                    name="freeTrialDays"
                    value={settings.freeTrialDays}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    placeholder="e.g. 30"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-700">Free Leads Quota</label>
                  <input
                    type="number"
                    name="freeTrialLeads"
                    value={settings.freeTrialLeads}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    placeholder="e.g. 50"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminFinancialSettings;
