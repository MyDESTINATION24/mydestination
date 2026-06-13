import React, { useEffect, useState } from 'react';
import { IndianRupee, Loader2, Wallet } from 'lucide-react';
import adminService from '../../../services/adminService';
import { toast } from 'react-hot-toast';

const AdminUserRecharges = () => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  const fetchRecharges = async (page = 1) => {
    try {
      setLoading(true);
      const res = await adminService.getUserWalletRecharges({ page, limit: pagination.limit });
      if (res.success) {
        setTransactions(res.transactions);
        setPagination(res.pagination);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load user recharges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecharges(1);
  }, []);

  const currency = (val) => `₹${(val || 0).toLocaleString()}`;

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Wallet Recharges</h1>
          <p className="text-gray-500 text-sm mt-1">View centralized wallet top-ups by all users (customers) across the Super App.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden min-h-[500px]">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="p-4 font-semibold text-gray-500 uppercase text-[10px] tracking-wider">Transaction ID</th>
                    <th className="p-4 font-semibold text-gray-500 uppercase text-[10px] tracking-wider">User Info</th>
                    <th className="p-4 font-semibold text-gray-500 uppercase text-[10px] tracking-wider">Amount Added</th>
                    <th className="p-4 font-semibold text-gray-500 uppercase text-[10px] tracking-wider">Payment Ref</th>
                    <th className="p-4 font-semibold text-gray-500 uppercase text-[10px] tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.length > 0 ? transactions.map((t) => (
                    <tr key={t._id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-mono text-xs text-gray-500">
                        {t.metadata?.phonepeOrderId || t._id}
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{t.partnerId?.name || 'Unknown User'}</div>
                        <div className="text-xs text-gray-500">{t.partnerId?.phone}</div>
                        <div className="text-[10px] text-gray-400">{t.partnerId?.email}</div>
                      </td>
                      <td className="p-4 font-black text-green-600">
                        +{currency(t.amount)}
                      </td>
                      <td className="p-4">
                        <div className="font-mono text-xs text-gray-800 font-bold">{t.reference || 'N/A'}</div>
                        {t.metadata?.providerReferenceId && (
                           <div className="font-mono text-[10px] text-gray-400 mt-0.5" title="Provider Reference ID">
                             {t.metadata.providerReferenceId}
                           </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border bg-green-50 text-green-700 border-green-100">
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="p-12 text-center text-gray-400">
                        <div className="flex flex-col items-center">
                          <Wallet size={48} className="text-gray-200 mb-3 opacity-50" />
                          <p>No user recharges found.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
                <span className="text-xs text-gray-500">
                  Page {pagination.page} of {pagination.pages} (Total: {pagination.total})
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={pagination.page === 1}
                    onClick={() => fetchRecharges(pagination.page - 1)}
                    className="px-3 py-1 bg-white border border-gray-200 rounded text-xs font-bold disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    disabled={pagination.page === pagination.pages}
                    onClick={() => fetchRecharges(pagination.page + 1)}
                    className="px-3 py-1 bg-white border border-gray-200 rounded text-xs font-bold disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminUserRecharges;
