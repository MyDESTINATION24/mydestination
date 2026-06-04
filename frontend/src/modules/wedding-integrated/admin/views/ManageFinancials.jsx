import { useState, useEffect } from 'react';
import { weddingService } from '../../../../services/weddingService';
import { adminStyles } from '../theme/themeConfig';
import { 
  TrendingUp, 
  CreditCard, 
  ArrowUpRight, 
  IndianRupee, 
  Calendar,
  Filter,
  Download,
  AlertCircle,
  Loader2
} from 'lucide-react';

const ManageFinancials = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const financialResponse = await weddingService.getAdminFinancials();
        setData(financialResponse);
      } catch (err) {
        console.error('Error fetching financials:', err);
        setError(err.message || 'Failed to fetch financial data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[hsl(353,45%,35%)]" />
        <p className="text-gray-500 font-medium">Loading financial records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50 border border-red-100 rounded-3xl text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-red-800">Error</h3>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  const financials = data || {
    totalRevenue: '₹0 L',
    commissionsEarned: '₹0 L',
    platformFeesEarned: '₹0 L',
    pendingPayouts: '₹0 L',
    netProfit: '₹0 L',
    subscriptionRevenue: '₹0 L',
    recentTransactions: [],
    recentSubscriptions: []
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-serif text-[hsl(353,45%,35%)]">Financial Management</h2>
            <p className="text-gray-500 text-sm mt-1">Track platform revenue, commissions and vendor payouts</p>
          </div>
          <div className="flex gap-3">
             <button className="flex items-center gap-2 px-4 py-2 border border-[#B06A6C]/20 bg-white rounded-xl text-sm font-medium hover:bg-gray-50 transition-all">
                <Calendar size={16} /> Last 30 Days
             </button>
             <button className="flex items-center gap-2 px-4 py-2 bg-[hsl(353,45%,35%)] text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all active:scale-95">
                <Download size={16} /> Export Reports
             </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
         {[
           { label: 'Booking Revenue', value: financials.totalRevenue, icon: TrendingUp, color: 'bg-blue-50 text-blue-600', trend: '+0%' },
           { label: 'Platform Fee (User)', value: financials.platformFeesEarned || '₹0', icon: IndianRupee, color: 'bg-teal-50 text-teal-600', trend: '+0%' },
           { label: 'Vendor Commission', value: financials.commissionsEarned, icon: IndianRupee, color: 'bg-purple-50 text-purple-600', trend: '+0%' },
           { label: 'Subscription Revenue', value: financials.subscriptionRevenue || '₹0', icon: CreditCard, color: 'bg-indigo-50 text-indigo-600', trend: '+0%' },
           { label: 'Pending Payouts', value: financials.pendingPayouts, icon: AlertCircle, color: 'bg-orange-50 text-orange-600', trend: 'Requires attention' },
           { label: 'Net Profit', value: financials.netProfit, icon: ArrowUpRight, color: 'bg-green-50 text-green-600', trend: '+0%' },
         ].map((stat, i) => (
           <div key={i} className={`${adminStyles.glassCard} p-6 rounded-3xl group hover:shadow-xl transition-all duration-300`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                {stat.trend.includes('%') && (
                  <span className="text-[10px] font-black px-2 py-1 bg-green-100 text-green-700 rounded-lg">
                    {stat.trend}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-[hsl(353,20%,15%)]">{stat.value}</h3>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 gap-8">
         {/* Recent Transactions */}
         <div className={`${adminStyles.glassCard} p-8 rounded-3xl`}>
            <div className="flex items-center justify-between mb-8">
               <h3 className={`${adminStyles.heading} text-xl font-bold`}>Recent Transactions</h3>
               <button className="text-sm font-bold text-[hsl(353,45%,35%)] hover:underline">View All History</button>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="border-b border-[hsl(353,45%,35%)]/10">
                        <th className="pb-4 font-bold text-gray-400 text-[10px] uppercase tracking-widest">Transaction / Date</th>
                        <th className="pb-4 font-bold text-gray-400 text-[10px] uppercase tracking-widest">Vendor & Client</th>
                        <th className="pb-4 font-bold text-gray-400 text-[10px] uppercase tracking-widest">Deal Amount / Fee</th>
                        <th className="pb-4 font-bold text-gray-400 text-[10px] uppercase tracking-widest text-right">Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[hsl(353,45%,35%)]/5">
                     {financials.recentTransactions.length > 0 ? financials.recentTransactions.map((txn) => (
                       <tr key={txn.id} className="group hover:bg-white/40 transition-all duration-300">
                          <td className="py-5">
                             <p className="font-bold text-sm text-[hsl(353,20%,15%)]">{txn.id}</p>
                             <p className="text-xs text-gray-400">{txn.date}</p>
                          </td>
                          <td className="py-5">
                             <p className="font-bold text-sm text-gray-700">{txn.vendor}</p>
                             <p className="text-xs text-gray-400">for {txn.client}</p>
                          </td>
                          <td className="py-5">
                             <p className="font-black text-sm text-gray-800">{txn.amount}</p>
                             <p className="text-[10px] text-teal-600 font-bold">+{txn.platformFee} Platform Fee.</p>
                          </td>
                          <td className="py-5 text-right">
                             <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                txn.status === 'Paid' 
                                  ? 'bg-green-50 text-green-600' 
                                  : 'bg-orange-50 text-orange-600'
                             }`}>
                                {txn.status}
                             </span>
                          </td>
                       </tr>
                     )) : (
                       <tr>
                         <td colSpan="4" className="py-10 text-center text-gray-500 font-medium">
                           No transactions recorded yet.
                         </td>
                       </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Recent Subscriptions */}
         <div className={`${adminStyles.glassCard} p-8 rounded-3xl`}>
            <div className="flex items-center justify-between mb-8">
               <h3 className={`${adminStyles.heading} text-xl font-bold`}>Subscription Purchases</h3>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="border-b border-[hsl(353,45%,35%)]/10">
                        <th className="pb-4 font-bold text-gray-400 text-[10px] uppercase tracking-widest">Transaction / Date</th>
                        <th className="pb-4 font-bold text-gray-400 text-[10px] uppercase tracking-widest">Vendor</th>
                        <th className="pb-4 font-bold text-gray-400 text-[10px] uppercase tracking-widest">Plan Name</th>
                        <th className="pb-4 font-bold text-gray-400 text-[10px] uppercase tracking-widest">Revenue</th>
                        <th className="pb-4 font-bold text-gray-400 text-[10px] uppercase tracking-widest text-right">Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[hsl(353,45%,35%)]/5">
                     {financials.recentSubscriptions?.length > 0 ? financials.recentSubscriptions.map((sub) => (
                       <tr key={sub.id} className="group hover:bg-white/40 transition-all duration-300">
                          <td className="py-5">
                             <p className="font-bold text-sm text-[hsl(353,20%,15%)]">{sub.id}</p>
                             <p className="text-xs text-gray-400">{sub.date}</p>
                          </td>
                          <td className="py-5">
                             <p className="font-bold text-sm text-gray-700">{sub.vendor}</p>
                          </td>
                          <td className="py-5">
                             <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md text-xs font-bold">{sub.plan}</span>
                          </td>
                          <td className="py-5">
                             <p className="font-black text-sm text-green-600">{sub.amount}</p>
                          </td>
                          <td className="py-5 text-right">
                             <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                sub.status === 'Paid' 
                                  ? 'bg-green-50 text-green-600' 
                                  : 'bg-orange-50 text-orange-600'
                             }`}>
                                {sub.status}
                             </span>
                          </td>
                       </tr>
                     )) : (
                       <tr>
                         <td colSpan="5" className="py-10 text-center text-gray-500 font-medium">
                           No subscription transactions recorded yet.
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

export default ManageFinancials;
