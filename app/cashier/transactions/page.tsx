"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Receipt, Clock, Filter, ArrowUpRight, Loader2, ShoppingBag } from 'lucide-react';

export default function CashierTransactions() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodaySales();
  }, []);

  const fetchTodaySales = async () => {
    setLoading(true);
    
    // Pagkuha sa sales para lang karong adlawa (Today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .gte('created_at', today.toISOString()) // Sugod sa 12:00 AM karong adlawa
      .order('created_at', { ascending: false });

    if (!error) {
      setSales(data || []);
    }
    setLoading(false);
  };

  // Kwentahon ang total sales karong adlawa
  const totalToday = sales.reduce((acc, sale) => acc + Number(sale.total_amount), 0);

  return (
    <div className="space-y-6 p-4">
      {/* Shift Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* TOTAL SALES CARD */}
        <div className="bg-blue-600 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-100 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-blue-100 text-xs font-black uppercase tracking-[0.2em]">Total Sales (Today)</p>
            <h2 className="text-5xl font-black mt-2 tracking-tight">
              ₱{totalToday.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
            <div className="flex items-center gap-2 mt-6 text-[10px] font-black bg-white/20 w-fit px-4 py-1.5 rounded-full uppercase tracking-widest">
              <ShoppingBag size={12} />
              <span>Personal Shift Records</span>
            </div>
          </div>
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        </div>

        {/* TRANSACTION COUNT CARD */}
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Transactions</p>
            <h2 className="text-5xl font-black text-slate-800 mt-2">{sales.length}</h2>
            <p className="text-slate-500 text-[10px] mt-2 font-bold uppercase italic tracking-tighter">
              Updated just now
            </p>
          </div>
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300">
            <Receipt size={40} />
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Recent Transactions</h3>
          <button onClick={fetchTodaySales} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
            <Filter size={18} className="text-slate-400" />
          </button>
        </div>

        <div className="overflow-x-auto text-sm">
          {loading ? (
            <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Time</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Items Summary</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-20 text-center text-slate-400 font-bold italic uppercase tracking-widest">Walay sales karong adlawa.</td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="p-6">
                        <div className="flex items-center gap-3 text-slate-600 font-bold">
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                            <Clock size={14} />
                          </div>
                          {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="p-6">
                        <p className="font-black text-slate-800 uppercase leading-tight">{sale.items_summary}</p>
                        <p className="text-[10px] text-slate-400 font-black tracking-widest mt-1">ID: {sale.id.slice(0, 8)}</p>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-black text-slate-900 text-lg tracking-tight">₱{Number(sale.total_amount).toFixed(2)}</span>
                          <span className="text-[9px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">PAID</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}