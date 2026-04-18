"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  UserPlus, Edit2, Trash2, Loader2, X, User, 
  ShieldCheck, ShieldAlert 
} from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({ 
    id: '',
    username: '', 
    password: '', 
    role: 'CASHIER',
    status: 'active'
  });

  // 1. FETCH USERS - Gi-check nato ang error para mahibal-an ngano dili mo-display
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('email', { ascending: true });

      if (error) {
        console.error("Error fetching profiles:", error.message);
        alert("Dili makuha ang data: " + error.message);
      } else {
        setUsers(data || []);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchUsers(); 
  }, []);

  const resetForm = () => {
    setFormData({ id: '', username: '', password: '', role: 'CASHIER', status: 'active' });
    setIsEditing(false);
    setShowModal(false);
  };

  // 2. HANDLE SUBMIT - Gi-fix ang domain ngadto sa .com para dili ma-invalid
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    if (isEditing) {
      // UPDATE PROFILE ONLY
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: formData.role,
          status: formData.status
        })
        .eq('id', formData.id);

      if (error) {
        alert("Update Error: " + error.message);
      } else {
        alert("Account updated successfully!");
        resetForm();
        fetchUsers();
      }
    } else {
      // CREATE NEW AUTH USER
      // Naggamit og @staff.com aron sigurado nga valid ang email format sa Supabase
      const finalEmail = `${formData.username.toLowerCase().trim()}@staff.com`;
      
      const { data, error: authError } = await supabase.auth.signUp({
        email: finalEmail,
        password: formData.password,
        options: {
          data: { role: formData.role }
        }
      });

      if (authError) {
        alert("Sign Up Error: " + authError.message);
      } else {
        alert(`Success! Created account for ${formData.username}. Palihug i-manual confirm sa SQL kung gikinahanglan.`);
        resetForm();
        fetchUsers();
      }
    }
    setIsSaving(false);
  };

  // 3. DELETE USER
  const deleteUser = async (id: string, email: string) => {
    if (confirm(`Sigurado ka nga papason si ${email.split('@')[0]}?`)) {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) alert(error.message);
      else fetchUsers();
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4">
      {/* Header Section */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Staff Accounts</h1>
          <p className="text-sm text-slate-500 font-medium italic">Manage user access and permissions</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
        >
          <UserPlus size={18} /> New Staff
        </button>
      </div>

      {/* User List Display */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
      ) : (
        <div className="grid gap-3">
          {users.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 font-bold uppercase tracking-widest text-xs">
              Walay accounts nga nakita sa profiles table
            </div>
          ) : (
            users.map((user: any) => (
              <div 
                key={user.id} 
                className={`bg-white p-5 rounded-3xl border flex items-center justify-between transition-all ${user.status === 'active' ? 'border-slate-100 shadow-sm' : 'border-red-100 bg-red-50/10 opacity-75'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${user.role === 'ADMIN' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {user.role === 'ADMIN' ? <ShieldCheck size={24}/> : <User size={24}/>}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800 text-lg">{user.email?.split('@')[0]}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${user.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {user.status}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{user.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setFormData({ id: user.id, username: user.email.split('@')[0], password: '', role: user.role, status: user.status });
                      setIsEditing(true);
                      setShowModal(true);
                    }}
                    className="p-3 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-xl transition-all"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => deleteUser(user.id, user.email)}
                    className="p-3 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl relative border border-white">
            <h2 className="text-2xl font-black text-slate-800 mb-6 tracking-tight uppercase">
              {isEditing ? "Edit Staff" : "Add Staff"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 ml-2 uppercase tracking-widest">Username</label>
                <input 
                  disabled={isEditing}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 disabled:opacity-50 font-bold text-slate-900 placeholder:text-slate-400 shadow-inner" 
                  value={formData.username} 
                  onChange={e => setFormData({...formData, username: e.target.value})} 
                  required 
                  placeholder="e.g. jdoe"
                />
              </div>

              {!isEditing && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 ml-2 uppercase tracking-widest">Password</label>
                  <input 
                    type="password"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-900 placeholder:text-slate-400 shadow-inner" 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                    required 
                    placeholder="Min. 6 chars"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 ml-2 uppercase tracking-widest">Role</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-500" 
                    value={formData.role} 
                    onChange={e => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="CASHIER">CASHIER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 ml-2 uppercase tracking-widest">Status</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-500" 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="active">ACTIVE</option>
                    <option value="inactive">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button type="button" onClick={resetForm} className="flex-1 font-bold text-slate-400 hover:text-slate-600 uppercase text-xs tracking-widest">Cancel</button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all"
                >
                  {isSaving ? <Loader2 className="animate-spin mx-auto" size={20} /> : "CONFIRM"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}