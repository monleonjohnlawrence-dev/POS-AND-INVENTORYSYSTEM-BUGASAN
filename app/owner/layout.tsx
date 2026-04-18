"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient'; 
import { 
  LayoutDashboard, 
  Warehouse, 
  Users, 
  LogOut, 
  Menu, 
  X,
  TrendingUp,
  Loader2
} from 'lucide-react';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { label: 'Dashboard', href: '/owner/dashboard', icon: LayoutDashboard },
    { label: 'Inventory', href: '/owner/inventory', icon: Warehouse },
    { label: 'Users/Cashiers', href: '/owner/users', icon: Users },
    { label: 'Sales Reports', href: '/owner/reports', icon: TrendingUp },
  ];

  // LOGOUT LOGIC
  const handleLogout = async () => {
    const confirmLogout = confirm("Sigurado ka nga mo-logout?");
    if (!confirmLogout) return;

    setIsLoggingOut(true);
    try {
      // Kini ang moforce og clear sa session sa Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // I-redirect sa login page (root path)
      router.push('/'); 
      router.refresh(); 
    } catch (error: any) {
      alert("Error logging out: " + error.message);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Toggle Button */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-slate-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6">
          <h2 className="text-white text-2xl font-black flex items-center gap-2">
            <span className="bg-blue-600 p-1 rounded text-xl">🌾</span> BugasPOS
          </h2>
          <p className="text-[10px] text-slate-500 mt-1 font-black uppercase tracking-[0.2em]">Admin Portal</p>
        </div>

        <nav className="mt-6 px-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Section at the Bottom */}
        <div className="absolute bottom-8 w-full px-4">
          <button 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-50 group"
          >
            {isLoggingOut ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            )}
            <span className="font-bold">{isLoggingOut ? 'Signing out...' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-end px-8">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-black text-slate-800">Owner Account</p>
              <div className="flex items-center justify-end gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Online</p>
              </div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full border-2 border-white shadow-sm flex items-center justify-center font-black text-slate-600 text-sm">
              OA
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="p-8 overflow-y-auto h-[calc(100vh-64px)]">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
}