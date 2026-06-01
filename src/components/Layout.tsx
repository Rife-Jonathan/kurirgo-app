import { Outlet, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Package, Map, Home, Clock, Users } from 'lucide-react';
import React from 'react';
import clsx from 'clsx';

export default function Layout() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const role = user.role.toLowerCase(); // sender, courier, admin

  const navLinks = {
    sender: [
      { text: "Dashboard", path: "/sender/dashboard", icon: Home },
      { text: "History", path: "/sender/history", icon: Clock },
    ],
    courier: [
      { text: "Dashboard", path: "/courier/dashboard", icon: Home },
      { text: "Find Orders", path: "/courier/orders", icon: Map },
      { text: "History", path: "/courier/history", icon: Clock },
    ],
    admin: [
      { text: "Dashboard", path: "/admin/dashboard", icon: Home },
      { text: "Orders", path: "/admin/orders", icon: Package },
      { text: "Couriers", path: "/admin/couriers", icon: Users },
    ],
  }[role] || [];

  const getPageTitle = () => {
    const currentLink = navLinks.find(link => location.pathname.startsWith(link.path));
    const roleCapitalized = role.charAt(0).toUpperCase() + role.slice(1);
    if (currentLink) return roleCapitalized + " " + currentLink.text;
    return roleCapitalized + " Dashboard";
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* Sidebar Navigation */}
      <aside className="flex w-64 flex-col border-r border-slate-200 bg-white">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-200">
              <Package className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">Kurir.io</span>
          </div>
        </div>
        
        <nav className="flex-1 space-y-1 px-4">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path || location.pathname.startsWith(link.path + '/');
            return (
              <Link 
                key={link.path} 
                to={link.path}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors",
                  isActive 
                    ? "bg-orange-50 font-semibold text-orange-600" 
                    : "font-medium text-slate-600 hover:bg-slate-50"
                )}
              >
                <link.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                {link.text}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-4">
          <div className="rounded-xl bg-slate-900 p-4 text-white">
            <p className="text-xs font-medium opacity-60">Logged in as {user.role}</p>
            <p className="mt-1 text-sm font-semibold">{user.name}</p>
            <button onClick={handleLogout} className="mt-3 w-full rounded-lg bg-white/10 py-2 text-xs font-semibold hover:bg-white/20 transition-all text-red-300 hover:text-red-200">
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8 shadow-sm flex-shrink-0">
          <h1 className="text-lg font-bold text-slate-800">{getPageTitle()}</h1>
          <div className="flex items-center gap-4">
            {role === 'sender' && !location.pathname.includes('/new') && (
              <Link to="/sender/order/new" className="flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-200 transition-transform active:scale-95 hover:bg-orange-600">
                <Package className="h-4 w-4" strokeWidth={2.5} />
                Create New Order
              </Link>
            )}
            <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-slate-100 bg-slate-200">
              <img src={"https://api.dicebear.com/7.x/initials/svg?seed=" + user.name} alt="Avatar" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
