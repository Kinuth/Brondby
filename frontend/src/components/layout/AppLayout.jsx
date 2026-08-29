import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Receipt, 
  LogOut, 
  ShieldCheck, 
  UserCheck, 
  Sparkles 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AppLayout = () => {
  const { user, role, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/jobs', label: 'Investigation Jobs', icon: Briefcase },
  ];

  if (isAdmin) {
    navItems.push(
      { to: '/clients', label: 'Clients Directory', icon: Users },
      { to: '/invoices', label: 'Invoices & Billing', icon: Receipt },
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base tracking-wide flex items-center gap-1.5">
                BRONDBY
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
                  Africa
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Due Diligence & Investigations</p>
            </div>
          </div>

          {/* Role Banner */}
          <div className="px-4 py-3 mx-4 my-4 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-emerald-400 animate-pulse' : 'bg-brand-400'}`} />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                {isAdmin ? 'Admin Console' : 'Worker Portal'}
              </span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
              isAdmin ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
            }`}>
              {role}
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Account Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/80">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-brand-400 shrink-0">
                {user?.first_name ? user.first_name[0] : (user?.username ? user.username[0].toUpperCase() : 'U')}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.full_name || user?.username}
                </p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Brondby Enterprises Limited</span>
            <span>/</span>
            <span className="text-slate-200 font-medium capitalize">{role} Workspace</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="text-slate-400 hidden sm:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
            <div className="h-4 w-px bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              API Connected
            </div>
          </div>
        </header>

        <div className="p-8 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
