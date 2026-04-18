"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Plus, Search, Scale, Package, AlertTriangle, 
  MoreVertical, Loader2, RefreshCcw, Edit3 
} from 'lucide-react';

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // Para mahibal-an kung Edit or Add

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    weight_per_sack: 25,
    sacks_to_add: 0,
    reorder_level: 20
  });

  const fetchInventory = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('inventory').select('*').order('rice_type');
    if (!error) setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchInventory(); }, []);

  // OPEN MODAL FOR EDIT
  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.rice_type,
      price: item.retail_price,
      weight_per_sack: item.weight_per_sack,
      sacks_to_add: 0, // 0 lang ni pirme inig start kay "additional" sacks raman ni
      reorder_level: item.reorder_level
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const additionalKg = Number(formData.sacks_to_add) * Number(formData.weight_per_sack);

    if (editingItem) {
      // LOGIC: UPDATE PRICE & ADD STOCK
      const { error } = await supabase
        .from('inventory')
        .update({ 
          rice_type: formData.name,
          retail_price: Number(formData.price),
          total_kg: Number(editingItem.total_kg) + additionalKg, // I-plus ang bag-ong stock
          reorder_level: Number(formData.reorder_level)
        })
        .eq('id', editingItem.id);

      if (error) alert(error.message);
    } else {
      // LOGIC: NEW ITEM
      const { error } = await supabase
        .from('inventory')
        .insert([{ 
          rice_type: formData.name, 
          retail_price: Number(formData.price),
          total_kg: additionalKg, 
          weight_per_sack: Number(formData.weight_per_sack),
          reorder_level: Number(formData.reorder_level)
        }]);
      if (error) alert(error.message);
    }

    setShowModal(false);
    setEditingItem(null);
    fetchInventory();
    setIsSaving(false);
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Rice Inventory</h1>
          <p className="text-slate-500 font-medium italic text-sm">Update prices and restock sacks</p>
        </div>
        <button onClick={() => { setEditingItem(null); setShowModal(true); }} className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95">
          <Plus size={20} /> Add New Variety
        </button>
      </div>

      {/* Product List */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 uppercase text-[10px] font-black text-slate-400 tracking-widest">
              <tr>
                <th className="p-5">Rice Variety</th>
                <th className="p-5">Retail Price</th>
                <th className="p-5">Current Stock</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {products.map((product) => {
                const fullSacks = Math.floor(product.total_kg / product.weight_per_sack);
                const looseKg = (product.total_kg % product.weight_per_sack).toFixed(1);
                
                return (
                  <tr key={product.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-5">
                      <p className="font-black text-slate-800 uppercase leading-none mb-1">{product.rice_type}</p>
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-500">{product.weight_per_sack}KG SACK</span>
                    </td>
                    <td className="p-5">
                      <span className="text-xl font-black text-blue-600">₱{product.retail_price}</span>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800">{product.total_kg} kg</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{fullSacks} Sacks + {looseKg} kg left</span>
                      </div>
                    </td>
                    <td className="p-5 text-right">
                      <button onClick={() => openEditModal(product)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                        <Edit3 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add & Edit (Restock/Price Change) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-white">
            <h2 className="text-2xl font-black text-slate-800 mb-6 tracking-tight uppercase italic">
              {editingItem ? 'Edit & Restock' : 'Add New Variety'}
            </h2>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Rice Name</label>
                <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">New Price (₱)</label>
                  <input type="number" step="0.01" required className="w-full px-5 py-4 bg-blue-50 border border-blue-100 rounded-2xl font-black text-blue-600" 
                    value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Add Sacks</label>
                  <input type="number" required className="w-full px-5 py-4 bg-green-50 border border-green-100 rounded-2xl font-black text-green-600" 
                    value={formData.sacks_to_add} onChange={e => setFormData({...formData, sacks_to_add: e.target.value})} />
                </div>
              </div>

              {editingItem && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Current Stock Info</p>
                  <p className="text-sm font-bold text-slate-700">{editingItem.total_kg} kg existing</p>
                  <p className="text-xs font-medium text-blue-500 italic">+ {(Number(formData.sacks_to_add) * formData.weight_per_sack)} kg to be added</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 font-bold text-slate-400 uppercase text-xs">Cancel</button>
                <button type="submit" className="flex-[2] bg-slate-900 text-white py-4 rounded-2xl font-black shadow-lg transition-all active:scale-95 uppercase">
                  {editingItem ? 'Update & Restock' : 'Confirm Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}