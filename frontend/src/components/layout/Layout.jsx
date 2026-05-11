import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCheck, CalendarDays, ScanLine,
  CreditCard, Building2, Settings, LogOut, Zap, Menu, Bell, ChevronDown
} from 'lucide-react';
import { useQuery } from 'react-query';
import useStore from '../../store/useStore';
import { branchesApi } from '../../utils/api';

const NAV = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, group: 'Overview' },
  { label: 'Members', to: '/members', icon: Users, group: 'Management' },
  { label: 'Trainers', to: '/trainers', icon: UserCheck, group: 'Management' },
  { label: 'Classes', to: '/classes', icon: CalendarDays, group: 'Management' },
  { label: 'Attendance', to: '/attendance', icon: ScanLine, group: 'Management' },
  { label: 'Billing', to: '/billing', icon: CreditCard, group: 'Finance' },
  { label: 'Branches', to: '/branches', icon: Building2, group: 'Settings' },
  { label: 'Settings', to: '/settings', icon: Settings, group: 'Settings' },
];

const groups = [...new Set(NAV.map(n => n.group))];

function BranchSelector() {
  const { selectedBranch, setSelectedBranch } = useStore();
  const { data: branches } = useQuery('branches', () => branchesApi.list().then(r => r.data));

  return (
    <div className="relative flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 transition-all hover:bg-white hover:shadow-sm">
      <Building2 size={14} className="text-emerald-500" />
      <select
        value={selectedBranch}
        onChange={(e) => setSelectedBranch(e.target.value)}
        className="bg-transparent text-[12px] font-medium text-gray-700 outline-none cursor-pointer pr-4 appearance-none"
      >
        <option value="all">Total Branches</option>
        {branches?.map(b => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
      <ChevronDown size={12} className="absolute right-2 text-gray-400 pointer-events-none" />
    </div>
  );
}

export default function Layout() {
  const { user, logout, sidebarOpen, toggleSidebar } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-56' : 'w-14'} bg-white border-r border-gray-100 flex flex-col transition-all duration-200 flex-shrink-0`}>
        {/* Logo */}
        <div className="h-14 flex items-center gap-2 px-3 border-b border-gray-100">
          <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <Zap size={14} className="text-white" />
          </div>
          {sidebarOpen && (
            <div>
              <div className="text-sm font-semibold text-gray-900">FitCore</div>
              <div className="text-[10px] text-gray-400">Gym Management</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto">
          {groups.map(group => (
            <div key={group} className="mb-4">
              {sidebarOpen && (
                <div className="text-[9px] uppercase tracking-widest text-gray-400 px-2 mb-1">{group}</div>
              )}
              {NAV.filter(n => n.group === group).map(({ label, to, icon: Icon }) => (
                <NavLink key={to} to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-2 py-2 rounded-lg text-[13px] mb-0.5 transition-colors ${
                      isActive
                        ? 'bg-emerald-500 text-white'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                  title={!sidebarOpen ? label : undefined}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  {sidebarOpen && <span>{label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-semibold text-emerald-700 flex-shrink-0">
              {user?.name?.slice(0,2).toUpperCase() || 'AD'}
            </div>
            {sidebarOpen && (
              <>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-gray-800 truncate">{user?.name}</div>
                  <div className="text-[10px] text-gray-400 capitalize">{user?.role?.replace('_', ' ')}</div>
                </div>
                <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors">
                  <LogOut size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-5 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={toggleSidebar} className="text-gray-400 hover:text-gray-700 transition-colors">
              <Menu size={18} />
            </button>
            <BranchSelector />
          </div>
          <div className="flex items-center gap-3">
            <button className="relative text-gray-400 hover:text-gray-700">
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center">4</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-[11px] font-semibold text-emerald-700">
              {user?.name?.slice(0,2).toUpperCase() || 'AD'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
