import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import { adminStyles } from '../theme/themeConfig';
import { weddingService } from '../../../../services/weddingService';

const formatRequirement = (msg) => {
  if (!msg) return <span className="text-gray-400 italic">No details provided</span>;
  const match = msg.match(/\[Interested In: (.*?)\]([\s\S]*)/);
  if (match) {
    const packageInfo = match[1].trim();
    const userMsg = match[2].trim();
    return (
      <div className="flex flex-col gap-1.5">
        {packageInfo && <span className="font-bold text-[10px] text-[hsl(353,45%,35%)] bg-[hsl(353,45%,35%)]/10 px-2 py-0.5 rounded uppercase tracking-wider w-fit">{packageInfo}</span>}
        {userMsg && <span className="text-sm text-gray-600 whitespace-normal line-clamp-2 leading-snug">{userMsg}</span>}
      </div>
    );
  }
  return <p className="text-sm text-gray-600 whitespace-normal line-clamp-2 leading-snug">{msg}</p>;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsData = await weddingService.getAdminStats();
        const enquiriesData = await weddingService.getAdminEnquiries();
        
        // Transform stats object into displayable array
        const statsArray = [
          { label: 'Total Vendors', value: statsData?.totalVendors || 0, icon: 'Users', growth: '+12%', path: '/wedding/admin/vendors/all' },
          { label: 'Pending Approvals', value: statsData?.pendingVendors || 0, icon: 'Clock', growth: 'New', path: '/wedding/admin/vendors/pending' },
          { label: 'Total Enquiries', value: statsData?.totalEnquiries || 0, icon: 'MessageSquare', growth: '+8%', path: '/wedding/admin/enquiries' },
          { label: 'Pending Enquiries', value: statsData?.pendingEnquiries || 0, icon: 'TrendingUp', growth: 'Active', path: '/wedding/admin/enquiries' },
        ];
        
        setStats(statsArray);
        setEnquiries(Array.isArray(enquiriesData) ? enquiriesData : []);
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        setStats([]);
        setEnquiries([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(353,45%,35%)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = { Users, MessageSquare, TrendingUp, Clock }[stat.icon];
          return (
            <div 
              key={index} 
              onClick={() => navigate(stat.path || '/wedding/admin/dashboard')}
              className={`${adminStyles.glassCard} p-6 rounded-3xl group cursor-pointer transition-all duration-300`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-[hsl(353,45%,35%)]/10 text-[hsl(353,45%,35%)] rounded-2xl transition-transform">
                  <Icon size={24} />
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">
                  {stat.change}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                <h3 className="text-3xl font-bold text-[hsl(353,20%,15%)]">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Recent Enquiries Table (Full-Width) */}
        <div className={`${adminStyles.glassCard} p-8 rounded-3xl overflow-hidden`}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className={`${adminStyles.heading} text-2xl font-bold`}>Recent Enquiries</h3>
              <p className="text-gray-500 text-sm mt-1">Track and manage latest wedding leads</p>
            </div>
            <Link 
                to="/wedding/admin/enquiries" 
                className="text-sm font-bold flex items-center gap-1 text-[hsl(353,45%,35%)] hover:underline px-4 py-2 rounded-xl hover:bg-[hsl(353,45%,35%)]/5 transition-all"
            >
              View All Enquiries <ChevronRight size={18} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-white/40">
                  <th className="pb-6 font-bold text-gray-400 text-xs uppercase tracking-[0.1em]">Client Name</th>
                  <th className="pb-6 font-bold text-gray-400 text-xs uppercase tracking-[0.1em]">Requirement</th>
                  <th className="pb-6 font-bold text-gray-400 text-xs uppercase tracking-[0.1em]">Target</th>
                  <th className="pb-6 font-bold text-gray-400 text-xs uppercase tracking-[0.1em]">Budget</th>
                  <th className="pb-6 font-bold text-gray-400 text-xs uppercase tracking-[0.1em]">Status</th>
                  <th className="pb-6 font-bold text-gray-400 text-xs uppercase tracking-[0.1em] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {enquiries.length > 0 ? enquiries.map((enq) => (
                  <tr key={enq._id} className="group hover:bg-white/40 transition-all duration-300">
                    <td className="py-6 pr-8">
                      <p className="font-bold text-lg text-[hsl(353,20%,15%)]">{enq.name}</p>
                      <p className="text-xs text-gray-500">{enq.phone}</p>
                    </td>
                    <td className="py-6 pr-4">
                       {formatRequirement(enq.message)}
                    </td>
                    <td className="py-6">
                      <div className="flex flex-col text-gray-700">
                         <span className="text-xs font-bold uppercase">{enq.targetType}</span>
                         <span className="text-xs text-gray-500">{enq.weddingDate ? new Date(enq.weddingDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-6">
                      <p className="text-sm font-semibold text-[hsl(353,45%,35%)]">{enq.budget}</p>
                    </td>
                    <td className="py-6">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                        enq.status === 'New' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {enq.status}
                      </span>
                    </td>
                    <td className="py-6 text-right">
                      <button 
                        onClick={() => navigate(`/wedding/admin/enquiries?id=${enq._id}`)}
                        className="p-3 bg-[hsl(353,45%,35%)]/5 hover:bg-[hsl(353,45%,35%)] hover:text-white text-[hsl(353,45%,35%)] rounded-2xl shadow-sm transition-all duration-300 transform group-hover:scale-105"
                      >
                        <ArrowUpRight size={20} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-gray-500 font-medium">
                      No enquiries found. Start by generating some leads!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
