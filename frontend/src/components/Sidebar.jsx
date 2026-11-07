import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  Activity,
  Zap,
  Flame,
  Car,
  Trash2,
  SunMedium,
  CloudRain,
  BrainCircuit,
  Lightbulb,
  FileSpreadsheet,
  UploadCloud,
  Users,
  Settings,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const menuItems = [
  { path: '/overview', name: 'Overview', icon: LayoutDashboard },
  { path: '/dataset-explorer', name: 'Dataset Explorer', icon: Database },
  { path: '/activity-monitoring', name: 'Activity Monitoring', icon: Activity },
  { path: '/energy-analytics', name: 'Energy Analytics', icon: Zap },
  { path: '/fuel-analytics', name: 'Fuel Analytics', icon: Flame },
  { path: '/transportation-analytics', name: 'Transportation Analytics', icon: Car },
  { path: '/waste-analytics', name: 'Waste Analytics', icon: Trash2 },
  { path: '/renewable-energy', name: 'Renewable Energy', icon: SunMedium },
  { path: '/carbon-analytics', name: 'Carbon Emission Analytics', icon: CloudRain },
  { path: '/prediction', name: 'Prediction & Insights', icon: BrainCircuit },
  { path: '/recommendations', name: 'Recommendations', icon: Lightbulb },
  { path: '/reports', name: 'Reports Generator', icon: FileSpreadsheet },
  { path: '/import', name: 'Data Import', icon: UploadCloud },
  { path: '/users', name: 'User Management', icon: Users, role: 'ADMIN' },
  { path: '/settings', name: 'System Settings', icon: Settings }
];

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, hasRole } = useAuth();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800 bg-slate-950/60 gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-900/50">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-white text-base tracking-tight block">IPRC CarbonTrack</span>
          <span className="text-[10px] text-emerald-400 font-medium tracking-wide uppercase block">ISRO Mahendragiri</span>
        </div>
      </div>

      {/* Research Proposal Reference Badge */}
      <div className="px-4 py-2.5 mx-3 mt-3 rounded-lg bg-slate-800/80 border border-slate-700/60">
        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Research Ref</p>
        <p className="text-xs font-mono font-medium text-emerald-400">RES-IPRC-2025-003</p>
        <p className="text-[10px] text-slate-400">Environment Protection</p>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Core Operations
        </div>
        {menuItems.map((item) => {
          if (item.role && !hasRole(item.role)) return null;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 truncate">{item.name}</span>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </NavLink>
          );
        })}
      </div>

      {/* User profile footer */}
      {user && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-white text-xs">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-emerald-400 font-medium truncate">{user.role} • {user.department?.code || 'IPRC'}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;

