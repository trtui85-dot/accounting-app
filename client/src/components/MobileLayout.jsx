import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth.jsx';
import { ToastProvider } from './toast.jsx';
import {
  LayoutDashboard, FileText, Users, Package, Settings
} from 'lucide-react';
import './MobileLayout.css';

const navItems = [
  { path: '/', icon: LayoutDashboard, labelKey: 'dashboard' },
  { path: '/invoices', icon: FileText, labelKey: 'invoices' },
  { path: '/clients', icon: Users, labelKey: 'clients' },
  { path: '/products', icon: Package, labelKey: 'products' },
  { path: '/settings', icon: Settings, labelKey: 'settings' },
];

export default function MobileLayout() {
  const { t } = useTranslation();
  const location = useLocation();

  const current = navItems.find(n => {
    if (n.path === '/') return location.pathname === '/';
    return location.pathname.startsWith(n.path);
  });

  return (
    <ToastProvider>
      <div className="m-app">
        <header className="m-topbar">
          <span className="m-topbar-title">{t(current?.labelKey || 'dashboard')}</span>
        </header>

        <main className="m-main">
          <Outlet />
        </main>

        <nav className="m-navbar">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `m-nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </ToastProvider>
  );
}
