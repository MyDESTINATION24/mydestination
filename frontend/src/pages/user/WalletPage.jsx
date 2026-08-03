import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, ArrowUpRight, ArrowDownLeft,
    X, IndianRupee, Loader2,
    Calendar, Wallet, AlertCircle, CheckCircle2
} from 'lucide-react';
import { api } from '../../services/apiService';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';

const WalletPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const isWedding = location.pathname.startsWith('/wedding');
    const isTaxi = location.pathname.startsWith('/taxi');

    const theme = {
        bg: isWedding ? 'bg-[#81313A]' : isTaxi ? 'bg-slate-900' : 'bg-[#39593F]',
        text: isWedding ? 'text-[#81313A]' : isTaxi ? 'text-slate-900' : 'text-[#39593F]',
        textLight: isWedding ? 'text-rose-100/60' : isTaxi ? 'text-slate-300/60' : 'text-emerald-100/60',
        ringFocus: isWedding ? 'focus-within:border-[#81313A] focus-within:ring-[#81313A]' : isTaxi ? 'focus-within:border-slate-900 focus-within:ring-slate-900' : 'focus-within:border-[#39593F] focus-within:ring-[#39593F]',
        hoverBgBtn: isWedding ? 'hover:bg-[#81313A] hover:border-[#81313A]' : isTaxi ? 'hover:bg-slate-900 hover:border-slate-900' : 'hover:bg-[#39593F] hover:border-[#39593F]',
        lightBg: isWedding ? 'bg-[#81313A]/5' : isTaxi ? 'bg-slate-900/5' : 'bg-[#39593F]/5',
        shadowColor: isWedding ? 'shadow-[#81313A]/20' : isTaxi ? 'shadow-slate-900/20' : 'shadow-[#39593F]/20'
    };

    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddMoneySheet, setShowAddMoneySheet] = useState(false);
    const [addAmount, setAddAmount] = useState('');
    const [processing, setProcessing] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    const quickAmounts = [500, 1000, 2000];

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const txnId = searchParams.get('phonepe_wallet_txn');
        const amount = searchParams.get('amount');
        const viewAs = searchParams.get('viewAs');

        if (txnId && amount) {
            verifyPhonePePayment(txnId, amount, viewAs);
        }

        fetchWalletData();
        fetchTransactions();
    }, []);

    const verifyPhonePePayment = async (txnId, amount, viewAs) => {
        // Clear immediately to prevent double-firing from React Strict Mode
        window.history.replaceState({}, document.title, window.location.pathname);
        try {
            setLoading(true);
            const verifyRes = await api.post('/wallet/verify-add-money', {
                phonepe_txn_id: txnId,
                amount: amount,
                viewAs: viewAs || 'user'
            });

            if (verifyRes.data.success) {
                toast.success('Money added successfully!');
                fetchWalletData();
                fetchTransactions();
            }
        } catch (error) {
            toast.error('Payment verification failed');
        } finally {
            setLoading(false);
        }
    };

    const fetchWalletData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token && token.startsWith('bypass-token')) {
                setBalance(100); // Mock ₹100
                return;
            }

            const res = await api.get('/wallet/stats', { params: { viewAs: 'user' } });
            if (res.data.success) {
                setBalance(res.data.stats.currentBalance || res.data.wallet?.balance || 0);
            }
        } catch (error) {
            if (error?.response?.status !== 401) {
                console.error('Fetch Wallet Error:', error);
            }
        }
    };

    const fetchTransactions = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token && token.startsWith('bypass-token')) {
                setTransactions([
                    {
                        _id: 'mock-tx-1',
                        description: 'Bypass Welcome Credit',
                        type: 'credit',
                        amount: 100,
                        status: 'confirmed',
                        createdAt: new Date().toISOString()
                    }
                ]);
                return;
            }

            const res = await api.get('/wallet/transactions', { params: { viewAs: 'user' } });
            if (res.data.success) {
                setTransactions(res.data.transactions);
            }
        } catch (error) {
            if (error?.response?.status !== 401) {
                console.error('Fetch Transactions Error:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAddMoney = async () => {
        const amount = Number(addAmount);
        if (!amount || amount < 10) {
            toast.error('Minimum amount is ₹10');
            return;
        }

        try {
            setProcessing(true);
            const { data } = await api.post('/wallet/add-money', { amount });
            
            if (data.success && data.url) {
                window.location.href = data.url;
            } else {
                throw new Error('Order creation failed');
            }
        } catch (error) {
            console.error('Add Money Error:', error);
            toast.error(error.response?.data?.message || 'Failed to initiate payment');
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen pb-24 font-sans"
        >
            <Toaster position="top-center" />

            {/* Header / Balance Card */}
            <div 
                className={`sticky top-0 z-10 ${isWedding ? 'bg-[#81313A]' : isTaxi ? 'bg-slate-900' : ''} px-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-8 rounded-b-[2.5rem] shadow-lg overflow-hidden transition-all duration-300`}
                style={!isWedding && !isTaxi ? { background: 'var(--color-theme-gradient, var(--color-surface, #5F8575))' } : {}}
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                <h1 className="text-white text-lg font-bold mb-6 text-center">My Wallet</h1>

                <div className="flex flex-col items-center">
                    <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-2">Available Balance</p>
                    <div className="flex items-start text-white">
                        <span className="text-2xl mt-1 opacity-80 mr-1">₹</span>
                        <span className="text-5xl font-black tracking-tight">{balance.toLocaleString('en-IN')}</span>
                    </div>
                </div>

                <div className="mt-8">
                    <button
                        onClick={() => setShowAddMoneySheet(true)}
                        className="w-full bg-white py-3.5 rounded-xl font-bold text-sm shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        style={!isWedding && !isTaxi ? { color: 'var(--color-surface, #5F8575)' } : {}}
                    >
                        <Plus size={18} strokeWidth={3} /> Add Money
                    </button>
                </div>
            </div>

            {/* Transactions List */}
            <div className="px-6 py-6 space-y-4">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Recent Transactions</h2>

                {transactions.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Wallet size={24} className="text-gray-300" />
                        </div>
                        <p className="text-gray-400 text-sm font-medium">No transactions yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {transactions.map((tx, idx) => (
                            <motion.div
                                key={tx._id || idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => setSelectedTransaction(tx)}
                                className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all"
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0 mr-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tx.isBooking ? 'bg-orange-50 text-orange-600' :
                                        tx.type === 'credit' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'
                                        }`}>
                                        {tx.isBooking ? <Calendar size={18} /> :
                                            tx.type === 'credit' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-bold text-gray-900 text-xs truncate leading-tight">{tx.description || 'Transaction'}</h4>
                                        <p className="text-[10px] text-gray-500 font-medium truncate mt-0.5">
                                            {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className={`font-black text-sm whitespace-nowrap ${tx.type === 'credit' ? 'text-green-600' : 'text-gray-900'
                                        }`}>
                                        {tx.type === 'credit' ? '+' : '-'}₹{tx.amount?.toLocaleString('en-IN')}
                                    </div>
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize inline-block mt-0.5 ${tx.status === 'confirmed' || tx.status === 'success' ? 'bg-green-100 text-green-700' :
                                        tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {tx.status || 'Success'}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Money Sheet */}
            <AnimatePresence>
                {showAddMoneySheet && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAddMoneySheet(false)}
                            className="fixed inset-0 bg-black z-[60]"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 bg-white z-[70] rounded-t-[2rem] p-6 pb-10 shadow-2xl safe-area-bottom"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900">Add Money to Wallet</h3>
                                <button onClick={() => setShowAddMoneySheet(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            <div className={`bg-gray-50 rounded-2xl p-4 mb-2 flex items-center gap-3 border border-gray-200 ${theme.ringFocus} transition-all`}>
                                <IndianRupee size={24} className="text-gray-400" />
                                <input
                                    type="number"
                                    value={addAmount}
                                    onChange={(e) => {
                                        setAddAmount(e.target.value);
                                        if (Number(e.target.value) < 10 && e.target.value !== '') {
                                            // Optional: Set specific error state if needed, or just handle in render
                                        }
                                    }}
                                    placeholder="Enter amount"
                                    className="flex-1 bg-transparent text-3xl font-bold text-gray-900 outline-none placeholder:text-gray-300"
                                    autoFocus
                                />
                            </div>

                            {/* Validation Message */}
                            <div className="mb-6 px-1">
                                {!addAmount ? (
                                    <p className="text-xs text-gray-400 font-medium">Minimum amount required is ₹10</p>
                                ) : Number(addAmount) < 10 ? (
                                    <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                                        <AlertCircle size={12} /> Minimum amount must be ₹10
                                    </p>
                                ) : (
                                    <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                                        <CheckCircle2 size={12} /> Valid amount
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                                {quickAmounts.map(amt => (
                                    <button
                                        key={amt}
                                        onClick={() => setAddAmount(String(amt))}
                                        className={`px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 ${theme.hoverBgBtn} hover:text-white transition-all whitespace-nowrap`}
                                    >
                                        +₹{amt}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleAddMoney}
                                disabled={processing || !addAmount || Number(addAmount) < 10}
                                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2
                                    ${(!addAmount || Number(addAmount) < 10)
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                        : `${isWedding ? 'bg-[#81313A]' : isTaxi ? 'bg-slate-900' : ''} text-white`
                                    }`}
                                style={!isWedding && !isTaxi && addAmount && Number(addAmount) >= 10 ? { background: 'var(--color-theme-gradient, var(--color-surface, #5F8575))' } : {}}
                            >
                                {processing && <Loader2 size={20} className="animate-spin" />}
                                {processing ? 'Processing...' : 'Proceed to Pay'}
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Transaction Detail Sheet */}
            <AnimatePresence>
                {selectedTransaction && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedTransaction(null)}
                            className="fixed inset-0 bg-black z-[80]"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 bg-white z-[90] rounded-t-[2rem] p-6 pb-12 shadow-2xl safe-area-bottom"
                        >
                            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />

                            <div className="flex flex-col items-center mb-6">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${selectedTransaction.type === 'credit' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'
                                    }`}>
                                    {selectedTransaction.type === 'credit' ? <ArrowDownLeft size={28} /> : <ArrowUpRight size={28} />}
                                </div>
                                <h3 className="text-xl font-black text-[var(--color-textDark)] text-center leading-tight mb-1">
                                    {selectedTransaction.type === 'credit' ? '+' : '-'}₹{selectedTransaction.amount?.toLocaleString('en-IN')}
                                </h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{selectedTransaction.status || 'Success'}</p>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-3 space-y-3">
                                <div className="flex justify-between items-start gap-4">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 shrink-0">Description</span>
                                    <span className="text-xs font-bold text-gray-900 text-right leading-relaxed break-words">{selectedTransaction.description}</span>
                                </div>
                                <div className="flex justify-between items-center bg-white/50 p-2 rounded-lg border border-gray-100">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</span>
                                    <span className="text-[11px] font-bold text-gray-900">
                                        {new Date(selectedTransaction.createdAt).toLocaleString('en-IN', {
                                            day: 'numeric', month: 'short',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center bg-white/50 p-2 rounded-lg border border-gray-100">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Transaction ID</span>
                                    <span className="text-[10px] font-mono text-gray-500">
                                        #{selectedTransaction._id?.slice(-8).toUpperCase()}
                                    </span>
                                </div>
                                {selectedTransaction.reference && (
                                    <div className="flex justify-between items-center bg-white/50 p-2 rounded-lg border border-gray-100">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bank Reference (UTR)</span>
                                        <span className="text-[10px] font-mono font-bold text-gray-900">
                                            {selectedTransaction.reference}
                                        </span>
                                    </div>
                                )}
                                {selectedTransaction.bookingId && (
                                    <div className="flex justify-between items-center bg-white/50 p-2 rounded-lg border border-gray-100">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Booking Ref</span>
                                        <span className={`text-[10px] font-bold ${theme.text} ${theme.lightBg} px-2 py-0.5 rounded`}>
                                            #{selectedTransaction.bookingId}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

        </motion.div>
    );
};



export default WalletPage;