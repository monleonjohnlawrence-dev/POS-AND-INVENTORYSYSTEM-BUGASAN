"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  DollarSign, ShoppingCart, Package, ArrowUpRight, 
  RefreshCcw, Loader2, ShieldCheck, X, TrendingUp, Clock, Receipt 
} from 'lucide-react';

export default function OwnerDashboard() {
  const [loading, setLoading] = useState(true);
  const [recentSales, setRecentSales] = useState<any[]>([]); // Para sa table
  const [stats, setStats] = useState({
    today: 0,
    monthly: 0,
    overall: 0,
    lowStock: 0,
    totalOrders: 0
  });
  
  const [showResetModal, setShowResetModal] = useState(false);
  const [password, setPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    
    // REAL-TIME LISTENER
   const channel = supabase
  .channel('dashboard_updates')
  .on('postgres_changes' as any, { event: 'INSERT', table: 'sales' } as any, () => {
    fetchDashboardData();
  })
  .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const startOfDay = new Date(now.setHours(0,0,0,0)).toISOString();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // 1. FETCH RECENT SALES (Today Only)
      const { data: recentData } = await supabase
        .from('sales')
        .select('*')
        .gte('created_at', startOfDay) // Reset every 12 midnight logic
        .order('created_at', { ascending: false });

      setRecentSales(recentData || []);

      // 2. COMPUTE STATS
      const todayTotal = recentData?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;

      const { data: monthData } = await supabase.from('sales').select('total_amount').gte('created_at', startOfMonth);
      const monthTotal = monthData?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;

      const { data: resetDateData } = await supabase.from('dashboard_settings').select('value_timestamp').eq('key', 'overall_reset_date').single();
      const resetDate = resetDateData?.value_timestamp || '2000-01-01T00:00:00Z';
      
      const { data: overallData } = await supabase.from('sales').select('total_amount').gte('created_at', resetDate);
      const overallTotal = overallData?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;

      const { count: lowStockCount } = await supabase.from('inventory').select('*', { count: 'exact', head: true }).lt('total_kg', 20);

      setStats({
        today: todayTotal,
        monthly: monthTotal,
        overall: overallTotal,
        lowStock: lowStockCount || 0,
        totalOrders: recentData?.length || 0
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetOverall = async () => {
    if (password !== "admin123") return alert("Wrong password!");
    setIsResetting(true);
    const { error } = await supabase.from('dashboard_settings').update({ value_timestamp: new Date().toISOString() }).eq('key', 'overall_reset_date');
    if (!error) {
      setShowResetModal(false);
      setPassword("");
      fetchDashboardData();
    }
    setIsResetting(false);
  };

  return (
    <div className="space-y-8 p-4 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight italic">Admin Hub</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Business Intelligence & Control</p>
        </div>
        <button onClick={() => setShowResetModal(true)} className="group bg-white border-2 border-slate-100 px-6 py-3 rounded-2xl font-black text-xs uppercase text-slate-400 hover:text-red-600 hover:border-red-100 transition-all flex items-center gap-2">
          <RefreshCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" /> Reset Overall Sales
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Today's Revenue", val: stats.today, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
          { label: "Monthly Revenue", val: stats.monthly, icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Total Stock Balance", val: stats.overall, icon: ShieldCheck, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Critical Stock", val: stats.lowStock, icon: Package, color: "text-orange-600", bg: "bg-orange-50", suffix: " Items" }
        ].map((s, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50 relative overflow-hidden group">
            <div className={`w-12 h-12 rounded-xl ${s.bg} ${s.color} flex items-center justify-center mb-6`}><s.icon size={24} /></div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{s.label}</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {loading ? "..." : (s.suffix ? s.val + s.suffix : `₱${s.val.toLocaleString()}`)}
            </h3>
          </div>
        ))}
      </div>

      {/* Recent Transactions Table (Today Only) */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <div>
            <h3 className="font-black text-slate-800 uppercase text-sm tracking-widest">Today's Activity</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">Resets automatically at 12:00 Midnight</p>
          </div>
          <div className="flex items-center gap-2 bg-green-100 text-green-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Live Updates
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Details</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentSales.length === 0 ? (
                <tr><td colSpan={3} className="p-20 text-center text-slate-300 font-bold italic uppercase text-xs tracking-widest">No transactions yet today.</td></tr>
              ) : (
                recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-2 text-slate-500 font-black text-xs">
                        <Clock size={14} className="text-slate-300" />
                        {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="p-6">
                      <p className="font-black text-slate-800 text-sm uppercase italic">{sale.items_summary}</p>
                      <p className="text-[9px] text-slate-400 font-bold tracking-widest mt-1 uppercase">Receipt #{sale.id.slice(0, 8)}</p>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-black text-slate-900 text-lg">₱{Number(sale.total_amount).toFixed(2)}</span>
                        <span className="text-[8px] bg-blue-50 text-blue-500 px-2 py-0.5 rounded-md font-black uppercase mt-1">Verified</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-sm shadow-2xl">
            <h2 className="text-2xl font-black text-slate-800 uppercase italic mb-2">Authorize Reset</h2>
            <p className="text-xs font-bold text-slate-400 uppercase mb-8 leading-relaxed">This will reset the "Overall Sales" counter to zero. Security password required.</p>
            <input 
              type="password" autoFocus className="w-full px-6 py-5 bg-slate-50 border-none rounded-[1.5rem] text-center font-black text-xl outline-none focus:ring-4 focus:ring-red-100 transition-all mb-4"
              placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
            />
            <button 
              onClick={handleResetOverall} disabled={isResetting}
              className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest active:scale-95 transition-all"
            >
              {isResetting ? "Updating..." : "Confirm & Reset"}
            </button>
            <button onClick={() => setShowResetModal(false)} className="w-full mt-4 text-[10px] font-black text-slate-300 uppercase hover:text-slate-500 transition-colors">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}