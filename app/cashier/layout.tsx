"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, History, LogOut, Menu, X, LayoutDashboard } from 'lucide-react';

export default function CashierLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { label: 'POS Terminal', href: '/cashier/pos', icon: ShoppingCart },
    { label: 'My Transactions', href: '/cashier/transactions', icon: History },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <h2 className="text-blue-600 text-2xl font-black flex items-center gap-2">
            🌾 <span className="text-slate-800">BugasPOS</span>
          </h2>
          <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-[0.2em]">Cashier Mode</p>
        </div>

        <nav className="mt-4 px-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-4 rounded-2xl transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-50'}`}>
                <Icon size={22} />
                <span className="font-bold">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-8 w-full px-4">
          <Link href="/" className="flex items-center gap-3 px-4 py-4 text-slate-400 hover:text-red-500 transition-all">
            <LogOut size={22} />
            <span className="font-bold">Exit Session</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
            <button className="lg:hidden p-2 text-slate-600" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <X /> : <Menu />}
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-3">
                <div className="text-right">
                    <p className="text-sm font-black text-slate-800">Cashier Maria</p>
                    <p className="text-[10px] text-blue-500 font-bold uppercase">Station 01</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">M</div>
            </div>
        </header>
        <div className="flex-1 p-6 overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}