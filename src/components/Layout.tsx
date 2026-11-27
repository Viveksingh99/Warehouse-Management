import { useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bot,
  Grid3X3,
  LogOut,
  Menu,
  ShieldCheck,
  Users,
  Warehouse,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/warehouse';

const ROLE_STYLES: Record<UserRole, { label: string; className: string }> = {
  admin: { label: 'Admin', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  auditor: { label: 'Auditor', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  technician: { label: 'Technician', className: 'bg-sky-100 text-sky-800 border-sky-200' },
};

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const navItems = [
    { to: '/', label: 'Warehouse Map', icon: Grid3X3, visible: true },
    { to: '/shuttle', label: 'Shuttle Status', icon: Bot, visible: true },
    {
      to: '/auditor',
      label: 'Auditor Dashboard',
      icon: BarChart3,
      visible: user.role === 'auditor' || user.role === 'admin',
    },
    {
      to: '/users',
      label: 'User Admin',
      icon: Users,
      visible: user.role === 'admin',
    },
  ].filter((item) => item.visible);

  const roleStyle = ROLE_STYLES[user.role];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Warehouse className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <span className="block text-sm font-bold tracking-tight text-slate-900 sm:text-base">
                GridFlow WMS
              </span>
              <span className="hidden text-xs text-slate-500 sm:block">
                5×5 Automated Pallet Control
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1" aria-label="Primary navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
              <ShieldCheck className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <span className="text-sm font-medium text-slate-800" data-testid="current-username">
                {user.username}
              </span>
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${roleStyle.className}`}
                data-testid="current-user-role"
              >
                {roleStyle.label}
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>

            <button
              type="button"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="inline-flex md:hidden items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
            <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span className="text-sm font-medium text-slate-800">{user.username}</span>
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${roleStyle.className}`}
              >
                {roleStyle.label}
              </span>
            </div>
            <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                        isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </NavLink>
                );
              })}
              <button
                type="button"
                onClick={handleLogout}
                className="mt-1 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            </nav>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
