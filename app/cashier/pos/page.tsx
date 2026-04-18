"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  ShoppingBag, Plus, Trash2, Search, 
  Loader2, X 
} from 'lucide-react';

export default function CashierPOS() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // MODAL STATE - Fixed with explicit types
  const [showQtyModal, setShowQtyModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [qtyInput, setQtyInput] = useState("1");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: inv } = await supabase.from('inventory').select('*').order('rice_type');
    setInventory(inv || []);
    setLoading(false);
  };

  // Fixed with : any type
  const handleItemClick = (item: any) => {
    setSelectedItem(item);
    setQtyInput("1");
    setShowQtyModal(true);
  };

  const confirmAddToCart = () => {
    const qty = parseFloat(qtyInput);
    if (isNaN(qty) || qty <= 0) return alert("Butangi og saktong timbang.");
    if (qty > selectedItem.total_kg) return alert("Dili kaabot ang stock!");

    const existing = cart.find((i: any) => i.id === selectedItem.id);
    if (existing) {
      setCart(cart.map((i: any) => i.id === selectedItem.id ? { ...i, qty: i.qty + qty } : i));
    } else {
      setCart([...cart, { ...selectedItem, qty: qty }]);
    }
    setShowQtyModal(false);
  };

  // Fixed with : any type
  const removeFromCart = (id: any) => setCart(cart.filter((item: any) => item.id !== id));
  
  const totalAmount = cart.reduce((sum, item: any) => sum + (item.retail_price * item.qty), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      for (const item of cart) {
        const { error: invError } = await supabase
          .from('inventory')
          .update({ total_kg: item.total_kg - item.qty })
          .eq('id', item.id);
        if (invError) throw invError;
      }
      
      const summary = cart.map((i: any) => `${i.qty}kg ${i.rice_type}`).join(", ");
      await supabase.from('sales').insert([{ items_summary: summary, total_amount: totalAmount }]);
      
      alert("Halin Recorded!");
      setCart([]);
      fetchData();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 max-w-[1600px] mx-auto min-h-screen">
      
      {/* SELECTION AREA (LEFT) */}
      <div className="flex-1 space-y-6">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search rice variety..." 
              className="w-full pl-12 pr-4 py-5 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 text-slate-900" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>

          {loading ? (
            <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500" /></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {inventory.filter((i: any) => i.rice_type.toLowerCase().includes(searchTerm.toLowerCase())).map((item: any) => (
                <button 
                  key={item.id} 
                  onClick={() => handleItemClick(item)} 
                  disabled={item.total_kg <= 0}
                  className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:border-blue-500 hover:bg-white hover:shadow-xl hover:shadow-blue-50/50 transition-all text-left group disabled:opacity-50"
                >
                  <p className="font-black text-slate-400 uppercase text-[10px] mb-1 tracking-widest">{item.weight_per_sack}kg Sack Type</p>
                  <p className="font-black text-slate-800 uppercase text-sm mb-1 line-clamp-1">{item.rice_type}</p>
                  <p className="text-2xl font-black text-slate-900 leading-tight mb-3">₱{item.retail_price}</p>
                  <div className="pt-3 border-t border-slate-200/50 flex justify-between items-center">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${item.total_kg < 20 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {item.total_kg}kg left
                    </span>
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                      <Plus size={16} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CART AREA (RIGHT) */}
      <div className="w-full lg:w-[400px]">
        <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100 flex flex-col h-[calc(100vh-2rem)] sticky top-4">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-800 uppercase text-lg tracking-tight flex items-center gap-3">
              <ShoppingBag className="text-blue-600" /> Order Cart
            </h3>
            <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-black">{cart.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2 -mr-2">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 italic">
                <p className="text-sm font-bold uppercase tracking-widest">Empty Order</p>
              </div>
            ) : (
              cart.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center bg-slate-50 p-5 rounded-[2rem] border border-slate-100 group">
                  <div className="flex-1">
                    <p className="font-black text-slate-800 text-sm uppercase">{item.rice_type}</p>
                    <p className="text-xs font-black text-blue-600 mt-1">{item.qty}kg × ₱{item.retail_price}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-black text-slate-900 mr-2 text-sm">₱{(item.qty * item.retail_price).toFixed(2)}</p>
                    <button 
                      onClick={() => removeFromCart(item.id)} 
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18}/>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-8 pt-8 border-t-4 border-double border-slate-100 space-y-6">
            <div className="flex justify-between items-end px-2">
              <span className="font-black text-slate-400 uppercase text-xs tracking-[0.2em]">Total Amount</span>
              <span className="font-black text-4xl text-slate-900 leading-none tracking-tighter">₱{totalAmount.toFixed(2)}</span>
            </div>
            
            <button 
              onClick={handleCheckout} 
              disabled={cart.length === 0 || isProcessing}
              className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl shadow-slate-200 hover:bg-black active:scale-95 disabled:opacity-20 transition-all flex items-center justify-center gap-3"
            >
              {isProcessing ? <Loader2 className="animate-spin" /> : "FINALIZE SALE"}
            </button>
          </div>
        </div>
      </div>

      {/* QUANTITY MODAL */}
      {showQtyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-3xl font-black text-slate-800 uppercase italic leading-none">{selectedItem?.rice_type}</h2>
                <p className="text-sm font-bold text-blue-500 mt-2 uppercase tracking-widest">₱{selectedItem?.retail_price} / KG</p>
              </div>
              <button onClick={() => setShowQtyModal(false)} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900"><X size={24}/></button>
            </div>

            <div className="space-y-6">
              <div className="relative">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-4 mb-2 block tracking-widest">Weight (Kilograms)</label>
                <input 
                  type="number" step="0.1" autoFocus
                  className="w-full px-8 py-6 bg-slate-50 border-none rounded-[2rem] text-4xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                  value={qtyInput}
                  onChange={(e) => setQtyInput(e.target.value)}
                />
              </div>

              <div className="bg-slate-900 p-6 rounded-[2rem] flex justify-between items-center text-white">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sub-total</span>
                <span className="text-2xl font-black italic">₱{(parseFloat(qtyInput || "0") * (selectedItem?.retail_price || 0)).toFixed(2)}</span>
              </div>

              <button 
                onClick={confirmAddToCart}
                className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black text-xl shadow-xl shadow-blue-200 active:scale-95 transition-all uppercase tracking-widest"
              >
                Confirm Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}