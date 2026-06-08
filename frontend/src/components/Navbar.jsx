import React from 'react';
import { Home, ListTodo, GraduationCap, BarChart3, Settings, CheckSquare } from 'lucide-react';

export default function Navbar({ activePage, setActivePage }) {
  const menuItems = [
    { id: 'home', label: 'Due Today', icon: Home },
    { id: 'tasks', label: 'Recurring Tasks', icon: ListTodo },
    { id: 'study', label: 'Study Planner', icon: GraduationCap },
    { id: 'reports', label: 'Analytics & Heatmap', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-full lg:w-64 glass-panel border-r border-slate-800 flex flex-col min-h-[auto] lg:min-h-screen z-10 shrink-0">
      {/* Branding */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-glow">
          <CheckSquare size={22} className="animate-pulse" />
        </div>
        <div>
          <h1 className="text-xl font-bold font-sans tracking-wide bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
            PersonalOS
          </h1>
          <p className="text-xs text-slate-500 font-medium font-sans">Premium Habit Hub</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-4 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible items-center lg:items-stretch scrollbar-none">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-400 border-l-4 border-indigo-500 shadow-glow'
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border-l-4 border-transparent'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-indigo-400' : 'text-slate-400'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Single-user visual indicator */}
      <div className="hidden lg:block p-4 border-t border-slate-800 text-center">
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">System Connected</div>
          <div className="text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            WhatsApp Bot Active
          </div>
        </div>
      </div>
    </aside>
  );
}
