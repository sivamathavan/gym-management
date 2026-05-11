import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCheck, CalendarDays, ScanLine,
  CreditCard, Building2, Settings, LogOut, Search, Bell, ChevronDown
} from 'lucide-react';
import { useQuery } from 'react-query';
import useStore from '../../store/useStore';
import { branchesApi } from '../../utils/api';

const NAV = [
  { label: 'Home', to: '/dashboard' },
  { label: 'Members', to: '/members' },
  { label: 'Trainers', to: '/trainers' },
  { label: 'Classes', to: '/classes' },
  { label: 'Attendance', to: '/attendance' },
  { label: 'Billing', to: '/billing' },
  { label: 'Branches', to: '/branches' },
  { label: 'Settings', to: '/settings' },
];

function BranchSelector() {
  const { selectedBranch, setSelectedBranch } = useStore();
  const { data: branches } = useQuery('branches', () => branchesApi.list().then(r => r.data));

  return (
    <div className="relative flex items-center gap-2 bg-dark-700 border border-dark-600 rounded-full px-3 py-1.5 transition-all hover:bg-dark-600 hover:border-dark-500">
      <Building2 size={14} className="text-neon-500" />
      <select
        value={selectedBranch}
        onChange={(e) => setSelectedBranch(e.target.value)}
        className="bg-transparent text-[12px] font-medium text-gray-300 outline-none cursor-pointer pr-4 appearance-none"
      >
        <option value="all">Total Branches</option>
        {branches?.map(b => (
          <option key={b.id} value={b.id} className="bg-dark-800 text-white">{b.name}</option>
        ))}
      </select>
      <ChevronDown size={12} className="absolute right-2 text-gray-400 pointer-events-none" />
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-dark-900 font-sans text-white flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-20 flex items-center justify-between px-6 lg:px-10 border-b border-dark-600/50 bg-dark-900/80 backdrop-blur-md sticky top-0 z-50">
        
        {/* Left: Logo & Branch Selector */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-neon-500 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(179,255,64,0.3)]">
              <span className="text-dark-900 font-extrabold text-sm">F</span>
            </div>
            <div>
              <div className="text-lg font-bold text-white tracking-tight">FitCore</div>
              <div className="text-[10px] text-gray-400 font-medium">Gym Management</div>
            </div>
          </div>
          <div className="hidden md:block w-px h-8 bg-dark-600"></div>
          <div className="hidden md:block">
            <BranchSelector />
          </div>
        </div>

        {/* Center: Pill Navigation */}
        <nav className="hidden lg:flex items-center bg-dark-800 rounded-full p-1 border border-dark-600 shadow-xl">
          {NAV.slice(0, 5).map(({ label, to }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-white text-dark-900 shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-dark-700'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          {/* Dropdown for remaining nav items if needed, or just show them */}
          {NAV.slice(5).map(({ label, to }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 hidden xl:block ${
                  isActive
                    ? 'bg-white text-dark-900 shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-dark-700'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right: Actions & Profile */}
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-full bg-dark-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-dark-700 transition-colors border border-dark-600">
            <Search size={16} />
          </button>
          <button className="relative w-10 h-10 rounded-full bg-dark-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-dark-700 transition-colors border border-dark-600">
            <Bell size={16} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-neon-500 rounded-full shadow-[0_0_8px_rgba(179,255,64,0.8)]"></span>
          </button>
          <div className="w-px h-6 bg-dark-600 mx-1"></div>
          <div className="flex items-center gap-3 bg-dark-800 rounded-full pl-2 pr-4 py-1.5 border border-dark-600 cursor-pointer hover:bg-dark-700 transition-colors">
            <div className="w-7 h-7 rounded-full bg-neon-500 flex items-center justify-center text-xs font-bold text-dark-900">
              {user?.name?.slice(0,2).toUpperCase() || 'AD'}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-medium text-white">{user?.name}</div>
            </div>
            <button onClick={handleLogout} className="ml-2 text-gray-400 hover:text-red-400 transition-colors">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-10 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
