import React from 'react';
import { Bell, Search, User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AppNavbarProps {
  user: any;
}

export default function AppNavbar({ user }: AppNavbarProps) {
  const { logout } = useAuth();

  return (
    <header className="h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left: Search Bar (Global) */}
      <div className="flex items-center flex-1 max-w-xl">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search leads, companies, or permits..." 
            className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-4 ml-4">
        <button className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-slate-950"></span>
        </button>

        <div className="h-6 w-px bg-slate-800 mx-1"></div>

        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-slate-200">{user?.email?.split('@')[0] || 'User'}</p>
            <p className="text-xs text-slate-500">Administrator</p>
          </div>
          
          <div className="relative group">
            <button className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium shadow-lg shadow-indigo-900/20 border border-indigo-500/50">
              {user?.email?.[0].toUpperCase() || 'U'}
            </button>
            
            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
              <div className="py-1">
                <button className="w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2">
                  <User className="w-4 h-4" /> Profile
                </button>
                <button className="w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Settings
                </button>
                <div className="h-px bg-slate-800 my-1"></div>
                <button 
                  onClick={logout}
                  className="w-full px-4 py-2 text-sm text-red-400 hover:bg-slate-800 hover:text-red-300 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
