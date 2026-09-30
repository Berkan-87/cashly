import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard, FileText, Wallet, Users, BarChart3, Settings as SettingsIcon,
  Plus, Sparkles,
} from 'lucide-react';

const Sidebar = () => {
  const { customers, invoices, transactions, settings } = useApp();

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
    <aside className="hidden lg:flex w-80 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white flex-col flex-shrink-0 border-r border-slate-800">
      {/* Logo */}
      <div className="px-6 py-4 border-b border-slate-800/50">
        <div className="flex items-center gap-6">
          <div className="w-14 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/40 flex-shrink-0">
            <span className="text-2xl">💼</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-white leading-tight">Cashly</h1>
            <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-1">
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Financial Tracker</span>
            </p>
          </div>
        </div>
      </div>

      {/* Kullanıcı Kartı */}
      <div className="px-1 py-1 border-b border-slate-800/50">
        <div className="bg-slate-800/50 rounded-2xl p-4 flex items-center gap-4 hover:bg-slate-800 transition-colors cursor-pointer">
          <div className="w-12 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center font-bold text-base text-white shadow-md flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-white truncate">{businessName}</p>
            <p className="text-sm text-slate-400">Free Plan</p>
          </div>
          <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse flex-shrink-0" title="Active"></div>
        </div>
      </div>

      {/* Yeni İşlem Butonu */}
      <div className="px-1 py-1">
        <NavLink
          to="/cashflow"
          className="flex items-center justify-center gap-3 w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl text-base font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:shadow-xl hover:shadow-indigo-600/40 hover:scale-[1.02]"
        >
          <Plus className="w-5 h-3 flex-shrink-0" />
          New Transaction
        </NavLink>
      </div>

      {/* Menü */}
      <nav className="flex-1 px-1 py-1 overflow-y-auto">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-4 mb-4">
          Menu
        </p>
        <div className="flex flex-col gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `group flex items-center gap-4 px-2 py-2 rounded-xl text-base font-medium transition-all relative ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white hover:translate-x-1'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-white rounded-r-full" />
                    )}
                    <Icon className={`w-6 h-6 flex-shrink-0 transition-transform ${
                      isActive ? '' : 'group-hover:scale-110'
                    }`} />
                    <span className="flex-1">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Alt İstatistikler */}
      <div className="px-5 py-5 border-t border-slate-800">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800/50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-indigo-400">{customers.length}</p>
            <p className="text-[11px] text-slate-500 uppercase tracking-wide mt-0.5">Clients</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-emerald-400">{invoices.length}</p>
            <p className="text-[11px] text-slate-500 uppercase tracking-wide mt-0.5">Invoices</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-amber-400">{transactions.length}</p>
            <p className="text-[11px] text-slate-500 uppercase tracking-wide mt-0.5">Trans.</p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-600">
            v1.0 • © 2026 Cashly
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;