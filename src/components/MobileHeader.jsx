import React, { useState, useEffect } from 'react';
import { Menu, X, Plus } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard, FileText, Wallet, Users, BarChart3, Settings as SettingsIcon,
  Sparkles,
} from 'lucide-react';

const MobileHeader = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { customers, invoices, transactions, settings } = useApp();
  const location = useLocation();

  // Sayfa değişince menüyü kapat
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { path: '/invoices', label: 'Invoices', icon: FileText },
    { path: '/cashflow', label: 'Cash Flow', icon: Wallet },
    { path: '/customers', label: 'Customers', icon: Users },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
    { path: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  const businessName = settings.businessName || 'My Business';
  const initials = businessName
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      {/* Üst bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-lg border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-base">💼</span>
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight">Cashly</h1>
            <p className="text-[10px] text-slate-400">Financial Tracker</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Overlay + Drawer */}
      {isOpen && (
        <>
          {/* Arka plan overlay */}
          <div
            className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menü drawer */}
          <div className="lg:hidden fixed top-14 left-0 bottom-0 z-50 w-80 max-w-[85vw] bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 flex flex-col overflow-y-auto">
            {/* Kullanıcı Kartı */}
            <div className="p-5 border-b border-slate-800">
              <div className="bg-slate-800/50 rounded-xl p-3 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center font-bold text-sm text-white shadow-md flex-shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{businessName}</p>
                  <p className="text-xs text-slate-400">Free Plan</p>
                </div>
              </div>
            </div>

            {/* Yeni İşlem Butonu */}
            <div className="px-5 py-4">
              <NavLink
                to="/cashflow"
                className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-sm font-semibold shadow-lg shadow-indigo-600/30"
              >
                <Plus className="w-4 h-4" />
                New Transaction
              </NavLink>
            </div>

            {/* Menü */}
            <nav className="flex-1 px-4 py-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Alt İstatistikler */}
            <div className="p-4 border-t border-slate-800">
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-indigo-400">{customers.length}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Clients</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-emerald-400">{invoices.length}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Invoices</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-amber-400">{transactions.length}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Trans.</p>
                </div>
              </div>
              <div className="mt-3 text-center">
                <p className="text-[10px] text-slate-600">v1.0 • © 2026 Cashly</p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default MobileHeader;