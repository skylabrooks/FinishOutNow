import React from 'react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Briefcase, 
  Settings, 
  Bell, 
  Building2,
  PieChart,
  Users,
  FileText
} from 'lucide-react';

interface NavigationSidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

export default function NavigationSidebar({ activeView, setActiveView }: NavigationSidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'main' },
    { id: 'map', label: 'Map View', icon: MapIcon, section: 'main' },
    { id: 'leads', label: 'My Leads', icon: Briefcase, section: 'main' },
    { id: 'analytics', label: 'Analytics', icon: PieChart, section: 'analysis' },
    { id: 'team', label: 'Team', icon: Users, section: 'management' },
    { id: 'reports', label: 'Reports', icon: FileText, section: 'management' },
  ];

  const renderNavItem = (item: any) => {
    const isActive = activeView === item.id;
    return (
      <button
        key={item.id}
        onClick={() => setActiveView(item.id)}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 group ${
          isActive 
            ? 'bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500' 
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-l-2 border-transparent'
        }`}
      >
        <item.icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-full">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-md">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">FinishOut<span className="text-indigo-500">Now</span></span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-8">
        
        {/* Main Section */}
        <div>
          <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Discovery</h3>
          <div className="space-y-1">
            {navItems.filter(i => i.section === 'main').map(renderNavItem)}
          </div>
        </div>

        {/* Analysis Section */}
        <div>
          <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Intelligence</h3>
          <div className="space-y-1">
            {navItems.filter(i => i.section === 'analysis').map(renderNavItem)}
          </div>
        </div>

        {/* Management Section */}
        <div>
          <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Management</h3>
          <div className="space-y-1">
            {navItems.filter(i => i.section === 'management').map(renderNavItem)}
          </div>
        </div>

      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-800 space-y-1">
        <button 
          onClick={() => window.dispatchEvent(new Event('open-settings'))}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
        <button 
          onClick={() => window.dispatchEvent(new Event('open-alerts'))}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all"
        >
          <Bell className="w-4 h-4" />
          <span>Alerts</span>
        </button>
      </div>
    </aside>
  );
}
