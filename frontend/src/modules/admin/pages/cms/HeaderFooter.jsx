import React, { useState } from 'react';
import { 
  ChevronRight,
  Loader2,
  Plus,
  MoreVertical,
  Layout,
  Globe,
  Edit3
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettings } from '../../../../shared/context/SettingsContext';
import RichTextEditor from '../../../../components/common/RichTextEditor';
import SafeHTML from '../../../../components/common/SafeHTML';

const HeaderFooter = () => {
  const { settings } = useSettings();
  const appName = settings.general?.app_name || 'App';
  const appLogo = settings.general?.logo || settings.customization?.logo || settings.general?.favicon || '';
  const [loading, setLoading] = useState(false);
  const [colors, setColors] = useState({
    headerBg: '#ffffff',
    headerText: '#212529',
    headerActive: '#4f46e5',
    footerBg: '#111827',
    footerText: '#ffffff'
  });

  const [footerAboutHtml, setFooterAboutHtml] = useState(
    '<p style="color:#ffffff; font-family:Inter;"><strong>My Destination</strong> is India’s premier luxury hospitality and travel reservation platform.</p>'
  );

  const [pages] = useState([
    { title: 'Home', language: 'English' },
    { title: 'Inicio', language: 'Spanish' }
  ]);

  const handleUpdate = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Landing site color & footer settings updated');
    }, 1000);
  };

  const inputClass = "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors";
  const labelClass = "block text-xs font-semibold text-gray-500 mb-1.5";
  const cardClass = "bg-white rounded-xl border border-gray-200 p-6";

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8 font-sans pb-20">
      
      {/* Header Area */}
      <div className="mb-6">
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
           <span>Landing Header-Footer</span>
           <ChevronRight size={12} />
           <span className="text-gray-700 font-medium">Index</span>
        </div>
        <div className="flex items-center justify-between">
           <h1 className="text-xl font-semibold text-gray-900 tracking-tight italic">Header & Footer Settings</h1>
        </div>
      </div>

      <div className="space-y-8 max-w-6xl mx-auto">
        
        {/* Colors Selection Card */}
        <div className={cardClass}>
           <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                 <Layout size={18} />
              </div>
              <div>
                 <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Landingsite Color Settings</h3>
                 <p className="text-xs text-gray-400 font-medium">Configure primary branding colors for landing page header and footer</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                 <label className={labelClass}>Landingsite Header Background Color</label>
                 <input className={inputClass} value={colors.headerBg} onChange={(e) => setColors({...colors, headerBg: e.target.value})} />
              </div>
              <div>
                 <label className={labelClass}>Landingsite Header Text Color</label>
                 <input className={inputClass} value={colors.headerText} onChange={(e) => setColors({...colors, headerText: e.target.value})} />
              </div>
              <div>
                 <label className={labelClass}>Landingsite Header Active Text Color</label>
                 <input className={inputClass} value={colors.headerActive} onChange={(e) => setColors({...colors, headerActive: e.target.value})} />
              </div>
              <div>
                 <label className={labelClass}>Landingsite Footer Background Color</label>
                 <input className={inputClass} value={colors.footerBg} onChange={(e) => setColors({...colors, footerBg: e.target.value})} />
              </div>
           </div>
        </div>

        {/* Rich Text Editor for Footer Text */}
        <div className={cardClass}>
           <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                 <Edit3 size={18} />
              </div>
              <div>
                 <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Footer Rich Text & Description</h3>
                 <p className="text-xs text-gray-400 font-medium">Format footer copyright, brand story, and contact details</p>
              </div>
           </div>

           <div className="space-y-4">
              <label className={labelClass}>Footer Text & Copyright Content</label>
              <RichTextEditor
                value={footerAboutHtml}
                onChange={setFooterAboutHtml}
                placeholder="Enter footer brand summary or copyright HTML..."
                minHeight="140px"
              />

              {/* Preview Box */}
              <div className="p-4 rounded-lg bg-slate-900 text-white space-y-2 mt-4">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Live Footer Preview</span>
                 <SafeHTML html={footerAboutHtml} />
              </div>
           </div>

           <div className="flex justify-end mt-6 border-t border-gray-50 pt-4">
              <button 
                onClick={handleUpdate}
                disabled={loading}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Update Landing Settings'}
              </button>
           </div>
        </div>

        {/* Page Registry Section */}
        <div className={cardClass}>
           <div className="flex items-center gap-3 mb-8">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                 <Globe size={18} />
              </div>
              <div>
                 <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Header-Footer Page Registry</h3>
                 <p className="text-xs text-gray-400 font-medium">Manage navigational static pages throughout landing site</p>
              </div>
           </div>

           <div className="overflow-hidden border border-gray-100 rounded-xl shadow-sm">
              <table className="w-full text-left border-collapse">
                 <thead className="bg-[#F9FAFB] border-b border-gray-100">
                    <tr>
                       <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Title</th>
                       <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Language</th>
                       <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                    {pages.map((row, idx) => (
                       <tr key={idx} className="hover:bg-gray-50/50 transition-all group">
                          <td className="px-6 py-5 text-sm font-semibold text-gray-700">{row.title}</td>
                          <td className="px-6 py-5 text-sm font-medium text-gray-500 text-center">
                             <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-[11px] font-bold text-gray-500 border border-gray-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                {row.language}
                             </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                             <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-100 bg-white text-gray-400 hover:text-indigo-600 shadow-sm">
                                <MoreVertical size={16} />
                             </button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

      </div>

    </div>
  );
};

export default HeaderFooter;
