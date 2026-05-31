import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, BedDouble, Users, Settings, LogOut, Menu, X, Wrench } from 'lucide-react';
import { getMe, getMyPG } from '../api/endpoints';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const role = localStorage.getItem('pg_role');
  const contextId = localStorage.getItem('pg_context_id');
  const [userEmail, setUserEmail] = useState<string>('owner@pgcontrol.com');
  const [pgName, setPgName] = useState<string>('PG Control');
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Fetch dynamic user email and PG name
  useEffect(() => {
    getMe().then(user => setUserEmail(user.email)).catch(console.error);
    getMyPG().then(pg => setPgName(pg.name)).catch(console.error);
  }, []);

  const handleSignOut = () => {
    setIsSigningOut(true);
    localStorage.removeItem('pg_token');
    localStorage.removeItem('pg_id');
    localStorage.removeItem('pg_role');
    localStorage.removeItem('pg_context_id');
    navigate('/login');
  };

  const handleReturnToAdmin = () => {
    setIsSigningOut(true);
    localStorage.removeItem('pg_context_id');
    navigate('/admin');
    window.location.reload();
  };



  return (
    <div className="min-h-screen bg-main-bg flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <header className="md:hidden h-16 bg-white border-b border-main-border flex items-center justify-between px-4 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-bg font-bold font-serif text-xs">
            PG
          </div>
          <span className="font-serif text-lg text-main-text">{pgName}</span>
        </div>
        <button aria-label="Open menu"
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -mr-2 text-main-text"
        >
          <Menu size={24} />
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-[280px] max-w-[80vw] bg-bg h-full shadow-2xl animate-[slideRight_250ms_cubic-bezier(0.4,0,0.2,1)]">
            <button aria-label="Close menu"
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 text-text-secondary hover:text-text-primary p-2"
            >
              <X size={24} />
            </button>
            <SidebarContent 
              role={role} 
              contextId={contextId} 
              userEmail={userEmail}
              pgName={pgName}
              handleReturnToAdmin={handleReturnToAdmin} 
              handleSignOut={handleSignOut} 
              isSigningOut={isSigningOut} 
            />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-[240px] flex-shrink-0 h-screen sticky top-0">
        <SidebarContent 
          role={role} 
          contextId={contextId} 
          userEmail={userEmail}
          pgName={pgName}
          handleReturnToAdmin={handleReturnToAdmin} 
          handleSignOut={handleSignOut} 
          isSigningOut={isSigningOut} 
        />
      </aside>

      {/* Main Content */}
      <main key={location.pathname} className="flex-1 w-full max-w-[1200px] mx-auto min-h-[calc(100vh-64px)] md:min-h-screen animate-fade-up">
        <Outlet />
      </main>

      <style>{`
        @keyframes slideRight {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

interface SidebarContentProps {
  role: string | null;
  contextId: string | null;
  userEmail: string;
  pgName: string;
  handleReturnToAdmin: () => void;
  handleSignOut: () => void;
  isSigningOut: boolean;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ role, contextId, userEmail, pgName, handleReturnToAdmin, handleSignOut, isSigningOut }) => (
  <div className="flex flex-col h-full bg-bg text-text-primary">
    {/* Top: Brand */}
    <div className="h-16 flex items-center px-6 border-b border-white/5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-bg font-bold font-serif text-sm">
          {pgName.slice(0, 2).toUpperCase()}
        </div>
        <span className="font-serif text-lg tracking-wide text-text-primary truncate" title={pgName}>{pgName}</span>
      </div>
    </div>

    {/* Admin return pill */}
    {role === 'admin' && contextId && (
      <div className="px-4 pt-4">
        <button 
          onClick={handleReturnToAdmin}
          disabled={isSigningOut}
          className="w-full bg-accent-dim text-accent border border-accent/20 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Return to Admin
        </button>
      </div>
    )}

    {/* Nav Links */}
    <nav className="flex-1 py-6 px-3 space-y-1">
      <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
      <NavItem to="/rooms" icon={<BedDouble size={20} />} label="Rooms" />
      <NavItem to="/tenants" icon={<Users size={20} />} label="Tenants" />
      <NavItem to="/maintenance" icon={<Wrench size={20} />} label="Maintenance" />
      <NavItem to="/settings" icon={<Settings size={20} />} label="Settings" />
    </nav>

    {/* Bottom: User & Logout */}
    <div className="p-4 border-t border-white/5">
      <div className="flex items-center justify-between">
        <div className="text-xs text-text-secondary truncate pr-2" title={userEmail}>
          {userEmail}
        </div>
        <button aria-label="Sign out"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="text-text-secondary hover:text-text-primary transition-colors p-2 rounded-md hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Sign Out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  </div>
);

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-r-md transition-all ${
          isActive 
            ? 'bg-accent-dim text-accent border-l-[3px] border-accent font-medium' 
            : 'text-text-secondary hover:bg-white/5 hover:text-text-primary border-l-[3px] border-transparent font-medium'
        }`
      }
    >
      {icon}
      <span className="text-sm font-sans">{label}</span>
    </NavLink>
  );
};

export default Layout;
