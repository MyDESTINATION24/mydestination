import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Layout, 
  Image as ImageIcon, 
  Bell, 
  Save, 
  CheckCircle2, 
  Eye, 
  Utensils, 
  Sparkles, 
  Car, 
  Shirt, 
  Coffee, 
  PartyPopper,
  Search,
  Menu,
  Wallet,
  Heart,
  Star,
  MapPin,
  Grid,
  Briefcase,
  Navigation,
  User,
  SlidersHorizontal,
  ArrowUpRight,
  Crown,
  Shield,
  Download,
  Lock,
  Gift,
  Check,
  X,
  ChevronLeft,
  Wifi,
  Tv,
  ParkingCircle,
  Wind
} from 'lucide-react';
import toast from 'react-hot-toast';
import logo from '../../../assets/rokologin-removebg-preview.png';
import { getLogoFilterStyle } from '../../../utils/themeUtils';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PRESET_PALETTES = [
  { name: 'Vibrant Sun Gold', start: '#FFD000', end: '#FF9E00', primary: '#FFD000', vip: 'dark_gold' },
  { name: 'Luxury Amber Glow', start: '#FFE066', end: '#F59E0B', primary: '#F59E0B', vip: 'dark_gold' },
  { name: 'Rose Gold', start: '#FF5370', end: '#FF1053', primary: '#FF1053', vip: 'rose' },
  { name: 'Emerald Sage', start: '#5F8575', end: '#2E5B4B', primary: '#5F8575', vip: 'emerald' }
];

const HotelUISettingsManager = ({ hotelId = 'global-default' }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('theme');
  const [previewTab, setPreviewTab] = useState('home'); // 'home' | 'details' | 'filters' | 'vip'

  const [uiConfig, setUiConfig] = useState({
    theme: {
      primaryColor: '#FFD000',
      secondaryColor: '#1E293B',
      backgroundColor: '#F8FAFC',
      cardBgColor: '#F8FAFC',
      fontFamily: 'Inter, sans-serif',
      borderRadius: '16px',
      useGradient: true,
      gradientStart: '#FFD000',
      gradientEnd: '#FF9E00',
      cardHeaderColor: '#FFD000',
      vipTheme: 'dark_gold'
    },
    sidebar: {
      profileBgColor: '#5F8575',
      headerBgColor: '#ffffff',
      accentColor: '#5F8575'
    },
    header: {
      headerBgColor: '#5F8575',
      useGradient: true,
      gradientStart: '#5F8575',
      gradientEnd: '#2E5B4B'
    },
    heroBanner: {
      bannerUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      title: 'Welcome to Grand Luxury Stay',
      subTitle: 'Enjoy world-class hospitality & premium room service'
    },
    activeServices: {
      roomService: true,
      spaBooking: true,
      cabBooking: true,
      laundryService: true,
      diningBooking: false,
      eventHall: false
    },
    customAnnouncement: {
      enabled: false,
      text: ''
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/hotel-ui/settings/global-default`);
      const data = await res.json();
      if (data.success && data.data) {
        setUiConfig((prev) => ({
          ...prev,
          ...data.data,
          theme: { ...prev.theme, ...(data.data.theme || {}) },
          sidebar: { ...prev.sidebar, ...(data.data.sidebar || {}) },
          header: { ...prev.header, ...(data.data.header || {}) },
          heroBanner: { ...prev.heroBanner, ...(data.data.heroBanner || {}) },
          activeServices: { ...prev.activeServices, ...(data.data.activeServices || {}) },
          customAnnouncement: { ...prev.customAnnouncement, ...(data.data.customAnnouncement || {}) }
        }));
        const rVal = data.data.theme?.borderRadius || '16px';
        const bVal = data.data.heroBanner?.bannerRadius || rVal;
        document.documentElement.style.setProperty('--card-radius', rVal);
        document.documentElement.style.setProperty('--hotel-card-radius', rVal);
        document.documentElement.style.setProperty('--border-radius', rVal);
        document.documentElement.style.setProperty('--banner-radius', bVal);
      }
    } catch (err) {
      console.error('Failed to load UI config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const rVal = uiConfig.theme?.borderRadius || '16px';
      const bVal = uiConfig.heroBanner?.bannerRadius || rVal;
      document.documentElement.style.setProperty('--card-radius', rVal);
      document.documentElement.style.setProperty('--hotel-card-radius', rVal);
      document.documentElement.style.setProperty('--border-radius', rVal);
      document.documentElement.style.setProperty('--banner-radius', bVal);
      const res = await fetch(`${API_BASE}/hotel-ui/settings/global-default`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uiConfig)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Global Theme & UI Settings saved! Applied to all hotels dynamically.');
      } else {
        toast.error(data.message || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving UI settings:', err);
      toast.error('Network error while saving UI settings');
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset) => {
    setUiConfig(prev => ({
      ...prev,
      theme: {
        ...prev.theme,
        useGradient: true,
        gradientStart: preset.start,
        gradientEnd: preset.end,
        primaryColor: preset.primary,
        cardHeaderColor: preset.start,
        vipTheme: preset.vip
      }
    }));
    toast.success(`Applied '${preset.name}' gradient theme!`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  const activeGradientStyle = uiConfig.theme.useGradient
    ? { background: `linear-gradient(135deg, ${uiConfig.theme.gradientStart || '#FFD000'} 0%, ${uiConfig.theme.gradientEnd || '#FF9E00'} 100%)` }
    : { backgroundColor: uiConfig.theme.primaryColor || '#FFD000' };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Global Theme & UI Customizer
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Global Theme & UI Studio</h1>
          <p className="text-sm text-slate-500">
            Control gradients, card colors, promo banners, and multi-screen theme styles live across all hotel pages in the User App.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition duration-200 disabled:opacity-50 cursor-pointer text-sm shrink-0"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save & Publish UI'}
          </button>
        </div>
      </div>

      {/* Main Grid: Controls + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Control Tabs */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          
          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('theme')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition cursor-pointer ${
                activeTab === 'theme' 
                  ? 'bg-white text-amber-600 shadow-sm font-semibold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Palette className="w-4 h-4" />
              Theme & Gradients
            </button>

            <button
              onClick={() => setActiveTab('banner')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition cursor-pointer ${
                activeTab === 'banner' 
                  ? 'bg-white text-amber-600 shadow-sm font-semibold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Banner & Content
            </button>
            <button
              onClick={() => { setActiveTab('sidebar'); setPreviewTab('sidebar'); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition cursor-pointer ${
                activeTab === 'sidebar' 
                  ? 'bg-white text-amber-600 shadow-sm font-semibold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Menu className="w-4 h-4" />
              Sidebar & Headers
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Tab 1: Theme & Gradients */}
            {activeTab === 'theme' && (
              <div className="space-y-6 animate-fadeIn">
                
                {/* Preset Gradient Swatches */}
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Curated Theme Presets</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {PRESET_PALETTES.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => applyPreset(preset)}
                        className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-400 bg-white text-left transition flex flex-col gap-2 cursor-pointer shadow-2xs"
                      >
                        <div 
                          className="h-8 rounded-lg w-full shadow-inner" 
                          style={{ background: `linear-gradient(135deg, ${preset.start} 0%, ${preset.end} 100%)` }}
                        />
                        <span className="text-[11px] font-bold text-slate-800 truncate">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Flat vs Gradient Mode Switcher */}
                <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50/60">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Use Dual-Color Gradient Theme</h4>
                    <p className="text-xs text-slate-500">Enable rich 2-color gradients on navbar, buttons, and card accents.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={uiConfig.theme.useGradient}
                    onChange={(e) => setUiConfig({
                      ...uiConfig,
                      theme: { ...uiConfig.theme, useGradient: e.target.checked }
                    })}
                    className="w-5 h-5 accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Color Pickers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {uiConfig.theme.useGradient ? (
                    <>
                      {/* Gradient Start */}
                      <div className="p-4 border rounded-xl bg-slate-50/50 space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase">Gradient Start Color</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={uiConfig.theme.gradientStart || '#FFD000'}
                            onChange={(e) => setUiConfig({
                              ...uiConfig,
                              theme: { ...uiConfig.theme, gradientStart: e.target.value, primaryColor: e.target.value }
                            })}
                            className="w-10 h-10 rounded-lg cursor-pointer border-0"
                          />
                          <input
                            type="text"
                            value={uiConfig.theme.gradientStart || '#FFD000'}
                            onChange={(e) => setUiConfig({
                              ...uiConfig,
                              theme: { ...uiConfig.theme, gradientStart: e.target.value, primaryColor: e.target.value }
                            })}
                            className="font-mono text-sm uppercase px-3 py-1.5 border rounded-lg bg-white w-full"
                          />
                        </div>
                      </div>

                      {/* Gradient End */}
                      <div className="p-4 border rounded-xl bg-slate-50/50 space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase">Gradient End Color</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={uiConfig.theme.gradientEnd || '#FF9E00'}
                            onChange={(e) => setUiConfig({
                              ...uiConfig,
                              theme: { ...uiConfig.theme, gradientEnd: e.target.value }
                            })}
                            className="w-10 h-10 rounded-lg cursor-pointer border-0"
                          />
                          <input
                            type="text"
                            value={uiConfig.theme.gradientEnd || '#FF9E00'}
                            onChange={(e) => setUiConfig({
                              ...uiConfig,
                              theme: { ...uiConfig.theme, gradientEnd: e.target.value }
                            })}
                            className="font-mono text-sm uppercase px-3 py-1.5 border rounded-lg bg-white w-full"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 border rounded-xl bg-slate-50/50 space-y-2 col-span-2">
                      <label className="text-xs font-bold text-slate-700 uppercase">Primary Solid Color</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={uiConfig.theme.primaryColor}
                          onChange={(e) => setUiConfig({
                            ...uiConfig,
                            theme: { ...uiConfig.theme, primaryColor: e.target.value }
                          })}
                          className="w-10 h-10 rounded-lg cursor-pointer border-0"
                        />
                        <input
                          type="text"
                          value={uiConfig.theme.primaryColor}
                          onChange={(e) => setUiConfig({
                            ...uiConfig,
                            theme: { ...uiConfig.theme, primaryColor: e.target.value }
                          })}
                          className="font-mono text-sm uppercase px-3 py-1.5 border rounded-lg bg-white w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Page, Card & Text Colors */}
                <h3 className="text-base font-bold text-slate-800 border-b pb-2 pt-2">Background, Card & Text Colors</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Page Outer Background */}
                  <div className="p-4 border rounded-xl bg-slate-50/50 space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase">Page Outer Background</label>
                    <p className="text-[11px] text-slate-500">Controls outer body background shade.</p>
                    <div className="flex items-center gap-3 pt-1">
                      <input
                        type="color"
                        value={uiConfig.theme.backgroundColor || '#F8FAFC'}
                        onChange={(e) => setUiConfig({
                          ...uiConfig,
                          theme: { ...uiConfig.theme, backgroundColor: e.target.value }
                        })}
                        className="w-10 h-10 rounded-lg cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={uiConfig.theme.backgroundColor || '#F8FAFC'}
                        onChange={(e) => setUiConfig({
                          ...uiConfig,
                          theme: { ...uiConfig.theme, backgroundColor: e.target.value }
                        })}
                        className="font-mono text-sm uppercase px-3 py-1.5 border rounded-lg bg-white w-full"
                      />
                    </div>
                  </div>

                  {/* Card & Container Fill Color */}
                  <div className="p-4 border rounded-xl bg-slate-50/50 space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase">Cards & Fill Color</label>
                    <p className="text-[11px] text-slate-500">Controls fill color of card containers.</p>
                    <div className="flex items-center gap-3 pt-1">
                      <input
                        type="color"
                        value={uiConfig.theme.cardBgColor || '#F8FAFC'}
                        onChange={(e) => setUiConfig({
                          ...uiConfig,
                          theme: { ...uiConfig.theme, cardBgColor: e.target.value }
                        })}
                        className="w-10 h-10 rounded-lg cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={uiConfig.theme.cardBgColor || '#F8FAFC'}
                        onChange={(e) => setUiConfig({
                          ...uiConfig,
                          theme: { ...uiConfig.theme, cardBgColor: e.target.value }
                        })}
                        className="font-mono text-sm uppercase px-3 py-1.5 border rounded-lg bg-white w-full"
                      />
                    </div>
                  </div>

                  {/* Headings & Text Color */}
                  <div className="p-4 border rounded-xl bg-slate-50/50 space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase">Headings & Title Text Color</label>
                    <p className="text-[11px] text-slate-500">Controls title texts like Review & Pay, Your Trip, etc.</p>
                    <div className="flex items-center gap-3 pt-1">
                      <input
                        type="color"
                        value={uiConfig.theme.secondaryColor || '#1E293B'}
                        onChange={(e) => setUiConfig({
                          ...uiConfig,
                          theme: { ...uiConfig.theme, secondaryColor: e.target.value }
                        })}
                        className="w-10 h-10 rounded-lg cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={uiConfig.theme.secondaryColor || '#1E293B'}
                        onChange={(e) => setUiConfig({
                          ...uiConfig,
                          theme: { ...uiConfig.theme, secondaryColor: e.target.value }
                        })}
                        className="font-mono text-sm uppercase px-3 py-1.5 border rounded-lg bg-white w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Card Style & Curves Custom Editing Studio */}
                <div className="space-y-4 pt-2 border-t mt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">Card Curves & Border Radius Studio</h3>
                      <p className="text-xs text-slate-500">Full editing control: customize curve radius manually or select preset styles.</p>
                    </div>
                    <span className="text-xs font-mono font-extrabold bg-amber-100 text-amber-800 px-3 py-1 rounded-full border border-amber-300 w-fit">
                      Active: {uiConfig.theme.borderRadius || '16px'}
                    </span>
                  </div>

                  {/* Preset Radius Buttons */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Preset Curve Styles</label>
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                      {[
                        { label: 'Square (0px)', value: '0px' },
                        { label: 'Soft (12px)', value: '12px' },
                        { label: 'Curved (16px)', value: '16px' },
                        { label: 'Super (24px)', value: '24px' },
                        { label: 'Extra (36px)', value: '36px' },
                        { label: 'Pill (9999px)', value: '9999px' }
                      ].map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            const newRadius = option.value;
                            setUiConfig(prev => ({
                              ...prev,
                              theme: { ...prev.theme, borderRadius: newRadius }
                            }));
                            document.documentElement.style.setProperty('--card-radius', newRadius);
                            document.documentElement.style.setProperty('--hotel-card-radius', newRadius);
                            document.documentElement.style.setProperty('--border-radius', newRadius);
                          }}
                          className={`py-2 px-2 text-xs font-bold rounded-xl border transition cursor-pointer text-center ${
                            uiConfig.theme.borderRadius === option.value
                              ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-2xs ring-2 ring-amber-400/20'
                              : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Editing Tools: Slider & Direct Text/Number Input */}
                  <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                      {/* Interactive Radius Slider */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                          <label htmlFor="card-radius-range">Drag Curve Radius (0px - 50px)</label>
                          <span className="font-mono text-amber-600 font-extrabold bg-white px-2 py-0.5 border rounded-md shadow-2xs">
                            {parseInt(uiConfig.theme.borderRadius) || 0}px
                          </span>
                        </div>
                        <input
                          id="card-radius-range"
                          type="range"
                          min="0"
                          max="50"
                          step="1"
                          value={parseInt(uiConfig.theme.borderRadius) || 0}
                          onChange={(e) => {
                            const val = `${e.target.value}px`;
                            setUiConfig(prev => ({
                              ...prev,
                              theme: { ...prev.theme, borderRadius: val }
                            }));
                            document.documentElement.style.setProperty('--card-radius', val);
                            document.documentElement.style.setProperty('--hotel-card-radius', val);
                            document.documentElement.style.setProperty('--border-radius', val);
                          }}
                          className="w-full accent-amber-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      {/* Manual Value Custom Input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase block">Custom Radius Input (e.g., 18px, 20px, 30px)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={uiConfig.theme.borderRadius || '16px'}
                            placeholder="e.g. 18px"
                            onChange={(e) => {
                              const val = e.target.value;
                              setUiConfig(prev => ({
                                ...prev,
                                theme: { ...prev.theme, borderRadius: val }
                              }));
                              document.documentElement.style.setProperty('--card-radius', val);
                              document.documentElement.style.setProperty('--hotel-card-radius', val);
                              document.documentElement.style.setProperty('--border-radius', val);
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setUiConfig(prev => ({
                                ...prev,
                                theme: { ...prev.theme, borderRadius: '9999px' }
                              }));
                              document.documentElement.style.setProperty('--card-radius', '9999px');
                              document.documentElement.style.setProperty('--hotel-card-radius', '9999px');
                              document.documentElement.style.setProperty('--border-radius', '9999px');
                            }}
                            className="px-3 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold shrink-0 hover:bg-slate-900 cursor-pointer shadow-xs"
                          >
                            Pill Mode
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Real-time Interactive Card Radius Preview */}
                    <div className="pt-3 border-t border-slate-200/80">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">Live Radius Preview Boxes</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div 
                          className="p-4 bg-white border border-slate-200 shadow-sm transition-all duration-200 space-y-2"
                          style={{ borderRadius: uiConfig.theme.borderRadius || '16px' }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900">Standard Card Curve</span>
                            <span 
                              className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5" 
                              style={{ borderRadius: uiConfig.theme.borderRadius || '16px' }}
                            >
                              Radius: {uiConfig.theme.borderRadius || '16px'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">Live preview of card corner roundness matching your settings.</p>
                          <button 
                            type="button"
                            className="w-full py-1.5 text-xs font-bold text-white shadow-xs"
                            style={{ 
                              backgroundColor: uiConfig.theme.primaryColor || '#FFD000',
                              borderRadius: uiConfig.theme.borderRadius || '16px' 
                            }}
                          >
                            Card Button
                          </button>
                        </div>

                        <div 
                          className="p-4 text-white shadow-sm transition-all duration-200 space-y-2 flex flex-col justify-between"
                          style={{ 
                            borderRadius: uiConfig.theme.borderRadius || '16px',
                            background: activeGradientStyle.background || activeGradientStyle.backgroundColor
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black">Gradient Surface Box</span>
                            <span 
                              className="text-[10px] bg-white/20 backdrop-blur-md font-bold px-2 py-0.5 text-white" 
                              style={{ borderRadius: uiConfig.theme.borderRadius || '16px' }}
                            >
                              Live Curve
                            </span>
                          </div>
                          <p className="text-xs opacity-90">Applies dynamically across hotel card containers & buttons.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}


            {/* Tab 3: Banner & Content */}
            {activeTab === 'banner' && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-base font-bold text-slate-800 border-b pb-2">Hero Banner Customization</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Banner Title</label>
                    <input
                      type="text"
                      value={uiConfig.heroBanner.title}
                      onChange={(e) => setUiConfig({
                        ...uiConfig,
                        heroBanner: { ...uiConfig.heroBanner, title: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Banner Subtitle</label>
                    <input
                      type="text"
                      value={uiConfig.heroBanner.subTitle}
                      onChange={(e) => setUiConfig({
                        ...uiConfig,
                        heroBanner: { ...uiConfig.heroBanner, subTitle: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Banner Image URL</label>
                    <input
                      type="text"
                      value={uiConfig.heroBanner.bannerUrl}
                      onChange={(e) => setUiConfig({
                        ...uiConfig,
                        heroBanner: { ...uiConfig.heroBanner, bannerUrl: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-xl text-sm font-mono text-xs"
                    />
                  </div>

                  {/* Banner Border Radius Studio Control */}
                  <div className="pt-4 border-t space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 uppercase">Banner Border Radius Studio</label>
                      <span className="text-xs font-mono font-extrabold bg-amber-100 text-amber-800 px-3 py-0.5 rounded-full border border-amber-300">
                        {uiConfig.heroBanner?.bannerRadius || uiConfig.theme?.borderRadius || '16px'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                      {[
                        { label: 'Square (0px)', value: '0px' },
                        { label: 'Soft (12px)', value: '12px' },
                        { label: 'Curved (16px)', value: '16px' },
                        { label: 'Super (24px)', value: '24px' },
                        { label: 'Extra (36px)', value: '36px' },
                        { label: 'Pill (9999px)', value: '9999px' }
                      ].map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            const newRadius = option.value;
                            setUiConfig(prev => ({
                              ...prev,
                              heroBanner: { ...prev.heroBanner, bannerRadius: newRadius }
                            }));
                            document.documentElement.style.setProperty('--banner-radius', newRadius);
                          }}
                          className={`py-2 px-2 text-xs font-bold rounded-xl border transition cursor-pointer text-center ${
                            (uiConfig.heroBanner?.bannerRadius || uiConfig.theme?.borderRadius) === option.value
                              ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-2xs ring-2 ring-amber-400/20'
                              : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                          <label htmlFor="banner-radius-range">Drag Banner Curve Slider</label>
                          <span className="font-mono text-amber-600 font-extrabold bg-white px-2 py-0.5 border rounded-md shadow-2xs">
                            {parseInt(uiConfig.heroBanner?.bannerRadius || uiConfig.theme?.borderRadius) || 0}px
                          </span>
                        </div>
                        <input
                          id="banner-radius-range"
                          type="range"
                          min="0"
                          max="50"
                          step="1"
                          value={parseInt(uiConfig.heroBanner?.bannerRadius || uiConfig.theme?.borderRadius) || 0}
                          onChange={(e) => {
                            const val = `${e.target.value}px`;
                            setUiConfig(prev => ({
                              ...prev,
                              heroBanner: { ...prev.heroBanner, bannerRadius: val }
                            }));
                            document.documentElement.style.setProperty('--banner-radius', val);
                          }}
                          className="w-full accent-amber-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase block">Custom Banner Radius Input</label>
                        <input
                          type="text"
                          value={uiConfig.heroBanner?.bannerRadius || uiConfig.theme?.borderRadius || '16px'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setUiConfig(prev => ({
                              ...prev,
                              heroBanner: { ...prev.heroBanner, bannerRadius: val }
                            }));
                            document.documentElement.style.setProperty('--banner-radius', val);
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-mono font-bold text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <label className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase mb-2">
                      <span>Custom Announcement Bar</span>
                      <input
                        type="checkbox"
                        checked={uiConfig.customAnnouncement.enabled}
                        onChange={() => setUiConfig({
                          ...uiConfig,
                          customAnnouncement: {
                            ...uiConfig.customAnnouncement,
                            enabled: !uiConfig.customAnnouncement.enabled
                          }
                        })}
                        className="w-4 h-4 accent-amber-500"
                      />
                    </label>
                    <input
                      type="text"
                      value={uiConfig.customAnnouncement.text}
                      disabled={!uiConfig.customAnnouncement.enabled}
                      onChange={(e) => setUiConfig({
                        ...uiConfig,
                        customAnnouncement: { ...uiConfig.customAnnouncement, text: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-xl text-sm disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Sidebar & Headers Customizer */}
            {activeTab === 'sidebar' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="text-base font-bold text-slate-800 border-b pb-2">Sidebar & Page Headers Customizer</h3>
                  <p className="text-xs text-slate-500 mt-1">Manage colors for the App Drawer / Sidebar and Page Headers (My Bookings, Search, etc.).</p>
                </div>

                {/* Preset Swatches for Sidebar & Header */}
                <div className="p-4 border rounded-xl bg-slate-50/60 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Quick Presets</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { name: 'Botanical Emerald', color: '#5F8575' },
                      { name: 'Sun Gold', color: '#FFD000' },
                      { name: 'Rose Velvet', color: '#FF1053' },
                      { name: 'Dark Slate', color: '#1E293B' }
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => setUiConfig({
                          ...uiConfig,
                          sidebar: { ...uiConfig.sidebar, profileBgColor: preset.color },
                          header: { ...uiConfig.header, headerBgColor: preset.color }
                        })}
                        className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-400 bg-white text-left transition flex items-center gap-2 cursor-pointer shadow-2xs"
                      >
                        <div className="w-5 h-5 rounded-full shrink-0" style={{ backgroundColor: preset.color }} />
                        <span className="text-[11px] font-bold text-slate-800 truncate">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Pickers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Sidebar Profile Card Color */}
                  <div className="p-4 border rounded-xl bg-slate-50/50 space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase">Sidebar Profile Card Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={uiConfig.sidebar?.profileBgColor || '#5F8575'}
                        onChange={(e) => setUiConfig({
                          ...uiConfig,
                          sidebar: { ...uiConfig.sidebar, profileBgColor: e.target.value }
                        })}
                        className="w-10 h-10 rounded-lg cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={uiConfig.sidebar?.profileBgColor || '#5F8575'}
                        onChange={(e) => setUiConfig({
                          ...uiConfig,
                          sidebar: { ...uiConfig.sidebar, profileBgColor: e.target.value }
                        })}
                        className="w-28 px-2 py-1 border rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Header Background Color */}
                  <div className="p-4 border rounded-xl bg-slate-50/50 space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase">Page Header Color (My Bookings)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={uiConfig.header?.headerBgColor || '#5F8575'}
                        onChange={(e) => setUiConfig({
                          ...uiConfig,
                          header: { ...uiConfig.header, headerBgColor: e.target.value }
                        })}
                        className="w-10 h-10 rounded-lg cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={uiConfig.header?.headerBgColor || '#5F8575'}
                        onChange={(e) => setUiConfig({
                          ...uiConfig,
                          header: { ...uiConfig.header, headerBgColor: e.target.value }
                        })}
                        className="w-28 px-2 py-1 border rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                  💡 <strong>Tip:</strong> Saving these settings updates the Sidebar profile card and page headers (like <em>My Bookings</em>) across all users in real-time.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Multi-Screen Live Preview */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
          
          <div className="w-full flex items-center justify-between mb-3 border-b pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
              <Eye className="w-4 h-4 text-amber-500" />
              <span>Live App Preview</span>
            </div>

            {/* Screen Selector Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-[10px] font-bold">
              <button
                onClick={() => setPreviewTab('home')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  previewTab === 'home' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-500'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => setPreviewTab('sidebar')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  previewTab === 'sidebar' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-500'
                }`}
              >
                Sidebar
              </button>
              <button
                onClick={() => setPreviewTab('details')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  previewTab === 'details' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-500'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setPreviewTab('filters')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  previewTab === 'filters' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-500'
                }`}
              >
                Filter
              </button>
              <button
                onClick={() => setPreviewTab('vip')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  previewTab === 'vip' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-500'
                }`}
              >
                VIP
              </button>
            </div>
          </div>

          {/* Device Mockup */}
          <div 
            className="w-full max-w-[340px] border-[8px] border-slate-900 rounded-[38px] shadow-2xl overflow-hidden min-h-[620px] flex flex-col relative"
            style={{
              fontFamily: uiConfig.theme.fontFamily,
              backgroundColor: uiConfig.theme.backgroundColor || '#F8FAFC'
            }}
          >
            {/* Notch */}
            <div className="w-32 h-4 bg-slate-900 mx-auto rounded-b-xl mb-1 z-30"></div>

            {/* Announcement bar */}
            {uiConfig.customAnnouncement.enabled && uiConfig.customAnnouncement.text?.trim() && !uiConfig.customAnnouncement.text.includes('Spa & Wellness Services') && (
              <div 
                className="text-[10px] font-bold py-1.5 px-3 text-white text-center truncate z-20"
                style={activeGradientStyle}
              >
                {uiConfig.customAnnouncement.text}
              </div>
            )}

            {/* SCREEN 1: HOME PREVIEW */}
            {previewTab === 'home' && (
              <div className="flex-1 flex flex-col overflow-y-auto">
                {/* App Top Navbar with Custom Theme Color */}
                <div 
                  className="p-3 pt-1 text-white flex flex-col gap-2 transition-all duration-300"
                  style={activeGradientStyle}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-1.5 rounded-full hover:bg-white/10 cursor-pointer">
                      <Menu size={18} />
                    </div>
                    <div className="h-7 w-20 flex items-center justify-center">
                      <img src={logo} alt="Logo" className="h-6 object-contain filter brightness-200" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-white/20 rounded-full cursor-pointer">
                        <Wallet size={16} />
                      </div>
                      <div className="p-1.5 bg-white/20 rounded-full cursor-pointer relative">
                        <Bell size={16} />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
                      </div>
                    </div>
                  </div>

                  {/* Search Bar Input */}
                  <div className="relative mt-1">
                    <input 
                      type="text" 
                      readOnly 
                      placeholder="Search in Bucharest..." 
                      className="w-full pl-9 pr-8 py-2 bg-white text-slate-800 rounded-full text-xs font-medium placeholder-slate-400 shadow-inner"
                    />
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <div className="absolute right-2 top-1.5 p-1 bg-slate-100 rounded-full text-slate-500">
                      <SlidersHorizontal size={12} />
                    </div>
                  </div>
                </div>

                {/* Main User App Screen Content */}
                <div className="p-3 space-y-3 flex-1 overflow-y-auto bg-slate-50/80">
                  {/* Category Filter Chips */}
                  <div className="flex gap-1.5 overflow-x-auto text-[11px] font-semibold text-slate-600 no-scrollbar pb-1">
                    <span className="px-3 py-1 text-white shadow-2xs font-bold rounded-full" style={activeGradientStyle}>All</span>
                    <span className="px-3 py-1 bg-white border border-slate-200 rounded-full">Hotel</span>
                    <span className="px-3 py-1 bg-white border border-slate-200 rounded-full">Villa</span>
                    <span className="px-3 py-1 bg-white border border-slate-200 rounded-full">Resort</span>
                    <span className="px-3 py-1 bg-white border border-slate-200 rounded-full">Homestay</span>
                  </div>

                  {/* Exclusive Offers Banner */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-black text-slate-800 tracking-tight">Exclusive offers for you</h4>
                      <span className="text-[9px] font-extrabold bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded uppercase">New</span>
                    </div>

                    <div 
                      className="relative overflow-hidden shadow-sm h-24 bg-slate-800 text-white flex items-end p-2.5 transition-all duration-200"
                      style={{ borderRadius: uiConfig.heroBanner?.bannerRadius || uiConfig.theme?.borderRadius || '16px' }}
                    >
                      <img 
                        src={uiConfig.heroBanner.bannerUrl} 
                        alt="Offer Banner" 
                        className="absolute inset-0 w-full h-full object-cover opacity-70"
                      />
                      <div className="relative z-10 space-y-1">
                        <span className="bg-rose-600 text-[9px] font-black px-1.5 py-0.5 rounded text-white uppercase">25% OFF</span>
                        <h5 className="text-xs font-bold leading-tight drop-shadow">{uiConfig.heroBanner.title}</h5>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono text-slate-200">Code: WEDININDIA</span>
                          <button className="bg-white text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs">Book now</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hotel Property Listing Card */}
                  <div 
                    className="bg-white p-2.5 border border-slate-100 shadow-sm space-y-2 transition-all duration-200"
                    style={{ borderRadius: uiConfig.theme.borderRadius }}
                  >
                    <div 
                      className="relative h-28 overflow-hidden transition-all duration-200"
                      style={{ borderRadius: `calc(${uiConfig.theme.borderRadius || '16px'} * 0.8)` }}
                    >
                      <img 
                        src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80" 
                        alt="Hotel Charlene" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 p-1.5 bg-white/80 backdrop-blur-md rounded-full shadow-xs text-slate-600">
                        <Heart size={12} />
                      </div>
                      <div 
                        className="absolute top-0 right-0 px-3 py-1 bg-white/95 backdrop-blur-md text-slate-900 text-xs font-black shadow-xs"
                        style={{ 
                          borderBottomLeftRadius: uiConfig.theme.borderRadius || '16px',
                          borderTopRightRadius: `calc(${uiConfig.theme.borderRadius || '16px'} * 0.8)`
                        }}
                      >
                        ₹ 5k
                      </div>
                      <div 
                        className="absolute bottom-0 inset-x-0 py-1 text-center text-[10px] font-bold text-slate-900 uppercase tracking-wider"
                        style={activeGradientStyle}
                      >
                        Couple Friendly
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-slate-900">Hotel Charlene</h4>
                      <span className="text-[10px] font-bold text-slate-500 flex items-center gap-0.5 hover:underline">
                        Book Now <ArrowUpRight size={10} />
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[9px] font-bold">
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">MUSSOORIE</span>
                      <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded flex items-center gap-0.5">
                        5.0 <Star size={8} className="fill-amber-500 text-amber-500" /> RATING
                      </span>
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded">1 ROOM</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN: SIDEBAR PREVIEW */}
            {previewTab === 'sidebar' && (
              <div className="flex-1 flex flex-col bg-slate-900/40 p-2 overflow-y-auto relative">
                <div className="w-[85%] bg-white h-full rounded-2xl p-3 flex flex-col shadow-2xl space-y-3 animate-fadeIn">
                  {/* Header Logo + Close */}
                  <div className="flex items-center justify-between border-b pb-2">
                    <img 
                      src={logo} 
                      alt="Logo" 
                      className="h-8 object-contain" 
                      style={getLogoFilterStyle(uiConfig.sidebar?.profileBgColor || uiConfig.theme?.primaryColor || '#5F8575')}
                    />
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <X size={12} />
                    </div>
                  </div>

                  {/* User Profile Card */}
                  <div 
                    className="p-3 rounded-xl text-white shadow-sm flex items-center gap-2"
                    style={{
                      background: uiConfig.sidebar?.profileBgColor || (uiConfig.theme?.useGradient ? `linear-gradient(135deg, ${uiConfig.theme.gradientStart || '#FFD000'} 0%, ${uiConfig.theme.gradientEnd || '#FF9E00'} 100%)` : (uiConfig.theme?.primaryColor || '#5F8575'))
                    }}
                  >
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border border-white/40">
                      <User size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate">abhi</div>
                      <div className="text-[9px] text-white/80">6268455485</div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="space-y-3 text-[10px] text-slate-600 font-bold overflow-y-auto flex-1">
                    <div>
                      <div className="text-[8px] text-slate-400 uppercase tracking-wider mb-1">TRAVEL & STAYS</div>
                      <div className="space-y-1">
                        <div className="p-1.5 bg-slate-50 rounded-lg flex items-center justify-between hover:bg-slate-100">
                          <span className="flex items-center gap-1.5"><Briefcase size={12} className="text-slate-500" /> My Bookings</span>
                          <ArrowUpRight size={10} className="text-slate-300" />
                        </div>
                        <div className="p-1.5 bg-slate-50 rounded-lg flex items-center justify-between hover:bg-slate-100">
                          <span className="flex items-center gap-1.5"><Heart size={12} className="text-slate-500" /> Saved Places</span>
                          <ArrowUpRight size={10} className="text-slate-300" />
                        </div>
                        <div className="p-1.5 bg-slate-50 rounded-lg flex items-center justify-between hover:bg-slate-100">
                          <span className="flex items-center gap-1.5"><Wallet size={12} className="text-slate-500" /> View Wallet</span>
                          <ArrowUpRight size={10} className="text-slate-300" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-[8px] text-slate-400 uppercase tracking-wider mb-1">GROW WITH MY DESTINATION</div>
                      <div className="space-y-1">
                        <div className="p-1.5 bg-slate-50 rounded-lg flex items-center justify-between hover:bg-slate-100">
                          <span className="flex items-center gap-1.5"><Gift size={12} className="text-slate-500" /> Refer & Earn</span>
                          <ArrowUpRight size={10} className="text-slate-300" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="p-2 border border-slate-200 text-slate-700 font-bold rounded-xl text-center text-[10px]">
                        Log Out
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN 2: HOTEL DETAILS & ROOMS */}
            {previewTab === 'details' && (
              <div className="flex-1 flex flex-col bg-white overflow-y-auto">
                <div className="relative h-32 bg-slate-200">
                  <img 
                    src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80" 
                    alt="Cover" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 p-1.5 bg-white/80 rounded-full"><ChevronLeft size={14} /></div>
                  <div className="absolute top-2 right-2 flex gap-1">
                    <div className="p-1.5 bg-white/80 rounded-full"><Heart size={14} /></div>
                  </div>
                </div>

                <div className="p-3 space-y-3">
                  <div>
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded uppercase">Hotel ★ 5.0</span>
                    <h3 className="text-base font-black text-slate-900 mt-1">Hotel Charlene</h3>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1"><MapPin size={10} /> Mussoorie, Uttarakhand • Mall Road</p>
                  </div>

                  <div className="flex gap-1.5">
                    <span className="px-2 py-1 bg-amber-50 text-slate-700 text-[10px] font-semibold rounded-md border border-amber-200 flex items-center gap-1"><Wifi size={10} /> Wi-Fi</span>
                    <span className="px-2 py-1 bg-amber-50 text-slate-700 text-[10px] font-semibold rounded-md border border-amber-200 flex items-center gap-1"><Wind size={10} /> AC</span>
                    <span className="px-2 py-1 bg-amber-50 text-slate-700 text-[10px] font-semibold rounded-md border border-amber-200 flex items-center gap-1"><Tv size={10} /> TV</span>
                  </div>

                  <div className="p-2.5 border-2 border-amber-300 rounded-xl space-y-1.5 bg-amber-50/20">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-slate-800">Deluxe Room</h4>
                      <span className="text-xs font-black text-slate-900">₹4,500 <span className="text-[9px] font-normal text-slate-400">/ night</span></span>
                    </div>
                    <button className="w-full py-1.5 bg-white border border-amber-400 text-slate-900 text-xs font-bold rounded-lg shadow-2xs">
                      Select Room
                    </button>
                  </div>
                </div>

                {/* Sticky Bottom Booking Bar */}
                <div className="mt-auto p-2.5 border-t bg-white flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">PRICE PER NIGHT</span>
                    <span className="text-sm font-black text-slate-900">₹4,500</span>
                  </div>
                  <button 
                    className="px-5 py-2 text-xs font-bold text-slate-900 rounded-xl shadow-sm flex items-center gap-1 cursor-pointer"
                    style={activeGradientStyle}
                  >
                    <span>Book Now</span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN 3: FILTERS MODAL */}
            {previewTab === 'filters' && (
              <div className="flex-1 flex flex-col bg-white p-3 space-y-3 overflow-y-auto">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase">Filters</h4>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-amber-600 font-bold">Clear</span>
                    <X size={14} className="text-slate-400 cursor-pointer" />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase text-slate-500">PROPERTY TYPE</span>
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2.5 py-1 text-slate-900 text-[10px] font-bold rounded-full shadow-2xs" style={activeGradientStyle}>All</span>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-full">Hotel</span>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-full">Villa</span>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-full">Resort</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase text-slate-500">SUITABLE FOR</span>
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2.5 py-1 border border-amber-300 bg-amber-50 text-slate-800 text-[10px] font-bold rounded-lg">Couple Friendly</span>
                    <span className="px-2.5 py-1 border border-slate-200 text-slate-600 text-[10px] rounded-lg">Family Friendly</span>
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  <button 
                    className="w-full py-2.5 text-xs font-bold text-slate-900 rounded-xl shadow-sm text-center"
                    style={activeGradientStyle}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN 4: VIP MEMBER DASHBOARD */}
            {previewTab === 'vip' && (
              <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto">
                {/* Profile Header */}
                <div className="p-3 text-slate-900 space-y-2" style={activeGradientStyle}>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-white text-slate-800 flex items-center justify-center font-bold text-sm shadow-md">
                      S
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold">Strive</h4>
                      <p className="text-[10px] opacity-80">srive0701@gmail.com</p>
                    </div>
                  </div>
                </div>

                {/* VIP Membership Banner Card */}
                <div className="p-3">
                  <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-amber-400">
                        <Crown size={16} />
                        <span className="text-xs font-black tracking-wider">Mall VIP</span>
                      </div>
                      <span className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Super Auction</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-bold text-amber-300">₹ 10 Coins</span>
                      <button className="px-3 py-1 text-[10px] font-bold text-slate-900 rounded-md" style={activeGradientStyle}>
                        Pay For
                      </button>
                    </div>
                  </div>

                  {/* Member Rights Grid */}
                  <div className="mt-3 bg-white p-2.5 rounded-xl border space-y-2">
                    <span className="text-[10px] font-extrabold text-slate-700 uppercase">Member Rights</span>
                    <div className="grid grid-cols-4 gap-2 text-center text-[9px] font-bold text-slate-600">
                      <div className="p-1.5 bg-amber-50 rounded-lg flex flex-col items-center gap-1 border border-amber-100">
                        <Gift size={14} className="text-amber-600" />
                        <span>50% OFF</span>
                      </div>
                      <div className="p-1.5 bg-amber-50 rounded-lg flex flex-col items-center gap-1 border border-amber-100">
                        <Download size={14} className="text-amber-600" />
                        <span>Download</span>
                      </div>
                      <div className="p-1.5 bg-amber-50 rounded-lg flex flex-col items-center gap-1 border border-amber-100">
                        <Shield size={14} className="text-amber-600" />
                        <span>Backup</span>
                      </div>
                      <div className="p-1.5 bg-amber-50 rounded-lg flex flex-col items-center gap-1 border border-amber-100">
                        <User size={14} className="text-amber-600" />
                        <span>Invite</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto p-3">
                  <button className="w-full py-2 text-xs font-bold text-slate-900 rounded-xl shadow-sm" style={activeGradientStyle}>
                    Pay For
                  </button>
                </div>
              </div>
            )}

            {/* Bottom App Navigation Bar */}
            <div className="bg-white border-t border-slate-100 py-2 px-3 flex items-center justify-around text-[10px] font-bold text-slate-400 z-20">
              <div className="flex flex-col items-center gap-0.5 cursor-pointer">
                <Grid size={16} />
                <span>SERVICES</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 cursor-pointer text-amber-600 font-black">
                <div className="p-1 bg-amber-50 rounded-full">
                  <Grid size={14} className="text-amber-600" />
                </div>
                <span>HOME</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 cursor-pointer">
                <Briefcase size={16} />
                <span>BOOKINGS</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 cursor-pointer">
                <Navigation size={16} />
                <span>NEAR BY</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 cursor-pointer">
                <User size={16} />
                <span>PROFILE</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default HotelUISettingsManager;
