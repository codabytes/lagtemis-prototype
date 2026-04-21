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
  Wrench,
  Pin,
  PinOff,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from './AuthGuard';

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string; active: boolean; collapsed: boolean; onClick?: () => void }> = ({ to, icon, label, active, collapsed, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
        : 'text-slate-600 hover:bg-slate-100 hover:text-blue-600'
    } ${collapsed ? 'justify-center px-0' : ''}`}
  >
    <div className="flex-shrink-0">{icon}</div>
    {!collapsed && <span className="font-medium truncate">{label}</span>}
  </Link>
);

const NavGroup: React.FC<{ label: string; icon: React.ReactNode; children: React.ReactNode; isOpen: boolean; onToggle: () => void; collapsed: boolean }> = ({ label, icon, children, isOpen, onToggle, collapsed }) => (
  <div className="space-y-1">
    <button
      onClick={onToggle}
      title={collapsed ? label : undefined}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 text-slate-600 hover:bg-slate-100 hover:text-blue-600 ${collapsed ? 'justify-center px-0' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">{icon}</div>
        {!collapsed && <span className="font-medium truncate">{label}</span>}
      </div>
      {!collapsed && (isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
    </button>
    {isOpen && !collapsed && (
      <div className="pl-12 space-y-1">
        {children}
      </div>
    )}
  </div>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [isPinned, setIsPinned] = React.useState(true);
  const [isHovered, setIsHovered] = React.useState(false);
  
  const [isFacilitiesOpen, setIsFacilitiesOpen] = React.useState(location.pathname.startsWith('/facilities'));
  const [isPersonnelOpen, setIsPersonnelOpen] = React.useState(location.pathname.startsWith('/personnel'));

  const isCollapsed = !isPinned && !isHovered;

  // Close mobile sidebar on navigation
  React.useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

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
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`z-50 bg-white border-r border-slate-200 transition-all duration-300 ease-in-out flex-col flex ${
          isMobileOpen 
            ? 'fixed inset-y-0 left-0 w-72 translate-x-0' 
            : 'fixed inset-y-0 left-0 -translate-x-full lg:relative lg:inset-auto lg:translate-x-0 lg:h-screen'
        } ${(!isMobileOpen && (isPinned || isHovered)) ? 'lg:w-64' : 'lg:w-20'}`}
      >
        <div className="h-full flex flex-col overflow-hidden">
          <div className={`p-6 border-b border-slate-100 flex items-center justify-between ${isCollapsed && !isMobileOpen ? 'px-4' : ''}`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-xl">T</div>
              {(!isCollapsed || isMobileOpen) && (
                <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                  <h1 className="font-bold text-slate-900 leading-tight">TEMIS</h1>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Lagos State Govt</p>
                </div>
              )}
            </div>
            
            {/* Desktop Pin Toggle */}
            <button
              onClick={() => setIsPinned(!isPinned)}
              className={`hidden lg:flex p-1.5 rounded-lg transition-colors ${isPinned ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:bg-slate-100'} ${isCollapsed ? 'hidden' : ''}`}
              title={isPinned ? "Unpin Sidebar" : "Pin Sidebar"}
            >
              {isPinned ? <Pin size={16} /> : <PinOff size={16} />}
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-2 text-slate-400 hover:bg-slate-100 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
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
                    collapsed={isCollapsed && !isMobileOpen}
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
                        <div className="flex-shrink-0">{sub.icon}</div>
                        <span className="truncate">{sub.label}</span>
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
                  collapsed={isCollapsed && !isMobileOpen}
                />
              );
            })}
          </nav>

          <div className={`p-4 border-t border-slate-100 ${isCollapsed && !isMobileOpen ? 'px-2' : ''}`}>
            <div className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-slate-50 ${isCollapsed && !isMobileOpen ? 'px-2 justify-center' : ''}`}>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-blue-600 font-bold text-xs">
                {user?.email?.[0].toUpperCase()}
              </div>
              {(!isCollapsed || isMobileOpen) && (
                <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user?.email}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">{user?.role}</p>
                </div>
              )}
            </div>
            <button
              onClick={signOut}
              title={isCollapsed && !isMobileOpen ? "Sign Out" : undefined}
              className={`w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors duration-200 ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}`}
            >
              <LogOut size={20} className="flex-shrink-0" />
              {(!isCollapsed || isMobileOpen) && <span className="font-medium">Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg lg:hidden"
            >
              <Menu size={24} />
            </button>
            
            {/* Desktop Collapse Toggle (Visible when unpinned) */}
            {!isPinned && (
              <button
                onClick={() => setIsPinned(true)}
                className="hidden lg:flex p-2 text-slate-400 hover:bg-slate-100 rounded-lg"
                title="Expand Sidebar"
              >
                <ChevronRight size={20} />
              </button>
            )}
            {isPinned && (
              <button
                onClick={() => setIsPinned(false)}
                className="hidden lg:flex p-2 text-slate-400 hover:bg-slate-100 rounded-lg"
                title="Collapse Sidebar"
              >
                <ChevronLeft size={20} />
              </button>
            )}
          </div>

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
        <div className="flex-1 overflow-auto p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
