import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BarChart3,
  Users,
  Settings,
  Activity,
  X,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  FileText,
  CreditCard
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin, isManager } = useAuth();
  const location = useLocation();

  const navigation = [
    // Cashier Navigation
    {
      name: 'Sales',
      href: '/dashboard/cashier',
      icon: ShoppingCart,
      roles: ['cashier', 'manager', 'admin']
    },

    // Manager Navigation
    {
      name: 'Dashboard',
      href: '/dashboard/manager',
      icon: LayoutDashboard,
      roles: ['manager', 'admin']
    },
    {
      name: 'Inventory',
      href: '/dashboard/manager/inventory',
      icon: Package,
      roles: ['manager', 'admin']
    },
    {
      name: 'Sales Reports',
      href: '/dashboard/manager/sales',
      icon: FileText,
      roles: ['manager', 'admin']
    },
    {
      name: 'Analytics',
      href: '/dashboard/manager/analytics',
      icon: BarChart3,
      roles: ['manager', 'admin']
    },

    // Admin Navigation
    {
      name: 'Admin Dashboard',
      href: '/dashboard/admin',
      icon: LayoutDashboard,
      roles: ['admin']
    },
    {
      name: 'User Management',
      href: '/dashboard/admin/users',
      icon: Users,
      roles: ['admin']
    },
    {
      name: 'Activity Logs',
      href: '/dashboard/admin/activity',
      icon: Activity,
      roles: ['admin']
    },
    {
      name: 'System Settings',
      href: '/dashboard/admin/settings',
      icon: Settings,
      roles: ['admin']
    },

    // Shared Navigation
    {
      name: 'Credit Management',
      href: user?.role === 'cashier' ? '/dashboard/cashier/credit' : '/dashboard/manager/credit',
      icon: CreditCard,
      roles: ['cashier', 'manager', 'admin']
    }
  ];

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role)
  );

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'manager': return 'Manager';
      case 'cashier': return 'Cashier';
      default: return role;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'cashier': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <ShoppingBag className="h-8 w-8 text-primary-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">Inventory</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex flex-col h-full">
          {/* User info */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-700">
                    {user?.full_name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user?.role)}`}>
                  {getRoleDisplayName(user?.role)}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={`sidebar-item ${
                    isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
                  }`}
                  onClick={onClose}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-sm">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200">
            <ShoppingBag className="h-8 w-8 text-primary-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">Inventory</span>
          </div>

          {/* User info */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-700">
                    {user?.full_name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user?.role)}`}>
                  {getRoleDisplayName(user?.role)}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={`sidebar-item ${
                    isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
