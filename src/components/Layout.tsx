import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Building2, 
  BookOpen, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Search,
  School,
  ChevronDown,
  ChevronRight,
  Wrench
} from 'lucide-react';
import { useAuth } from './AuthGuard';

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string; active: boolean; onClick?: () => void }> = ({ to, icon, label, active, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
        : 'text-slate-600 hover:bg-slate-100 hover:text-blue-600'
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </Link>
);

const NavGroup: React.FC<{ label: string; icon: React.ReactNode; children: React.ReactNode; isOpen: boolean; onToggle: () => void }> = ({ label, icon, children, isOpen, onToggle }) => (
  <div className="space-y-1">
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 text-slate-600 hover:bg-slate-100 hover:text-blue-600`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
    </button>
    {isOpen && (
      <div className="pl-12 space-y-1">
        {children}
      </div>
    )}
  </div>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isFacilitiesOpen, setIsFacilitiesOpen] = React.useState(location.pathname.startsWith('/facilities'));
  const [isPersonnelOpen, setIsPersonnelOpen] = React.useState(location.pathname.startsWith('/personnel'));

  const navigation = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/institutions', icon: <School size={20} />, label: 'Institutions' },
    { to: '/students', icon: <GraduationCap size={20} />, label: 'Students' },
    { 
      label: 'Personnel Management', 
      icon: <Users size={20} />, 
      subItems: [
        { to: '/personnel/academic', label: 'Academic Staff', icon: <Users size={18} /> },
        { to: '/personnel/non-academic', label: 'Non-Academic Staff', icon: <Users size={18} /> },
      ]
    },
    { 
      label: 'Facilities', 
      icon: <Building2 size={20} />, 
      subItems: [
        { to: '/facilities/management', label: 'Management', icon: <Building2 size={18} /> },
        { to: '/facilities/maintenance', label: 'Maintenance', icon: <Wrench size={18} /> },
      ]
    },
    { to: '/publications', icon: <BookOpen size={20} />, label: 'Research & Publications' },
    { to: '/trainings', icon: <FileText size={20} />, label: 'Training Management' },
    ...(user?.role === 'SuperUser' ? [
      { to: '/users', icon: <Users size={20} />, label: 'User Management' },
      { to: '/settings', icon: <Settings size={20} />, label: 'System Settings' }
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">T</div>
              <div>
                <h1 className="font-bold text-slate-900 leading-tight">TEMIS</h1>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Lagos State Govt</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              if ('subItems' in item) {
                const isOpen = item.label === 'Facilities' ? isFacilitiesOpen : isPersonnelOpen;
                const onToggle = item.label === 'Facilities' ? () => setIsFacilitiesOpen(!isFacilitiesOpen) : () => setIsPersonnelOpen(!isPersonnelOpen);
                
                return (
                  <NavGroup
                    key={item.label}
                    label={item.label}
                    icon={item.icon}
                    isOpen={isOpen}
                    onToggle={onToggle}
                  >
                    {item.subItems.map((sub) => (
                      <Link
                        key={sub.to}
                        to={sub.to}
                        className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-sm ${
                          location.pathname === sub.to
                            ? 'bg-blue-50 text-blue-600 font-bold'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
                        }`}
                      >
                        {sub.icon}
                        <span>{sub.label}</span>
                      </Link>
                    ))}
                  </NavGroup>
                );
              }
              return (
                <NavItem
                  key={item.to}
                  to={item.to}
                  icon={item.icon}
                  label={item.label}
                  active={location.pathname === item.to}
                />
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                {user?.email?.[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{user?.email}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors duration-200"
            >
              <LogOut size={20} />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg lg:hidden"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="flex-1 max-w-xl mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search records, institutions, or reports..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl transition-all duration-200 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Status</p>
              <p className="text-xs font-semibold text-green-600 flex items-center gap-1 justify-end">
                <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse"></span>
                Operational
              </p>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
