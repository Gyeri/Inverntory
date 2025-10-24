import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';

import { 
  Users, 
  ShoppingCart, 
  Package, 
  Activity,
  TrendingUp,
  AlertTriangle,
  Shield,
  BarChart3,
  DollarSign
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [salesTrends, setSalesTrends] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [
        dashboardRes,
        usersRes,
        trendsRes,
        activityRes
      ] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/users'),
        api.get('/analytics/sales-trends?period=7days'),
        api.get('/analytics/activity-logs?limit=10')
      ]);

      setDashboardData(dashboardRes.data);
      setUserStats(usersRes.data);
      setSalesTrends(trendsRes.data.trends);
      setRecentActivity(activityRes.data.activities || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'cashier': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          System overview and administrative controls
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="stat-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="stat-label">Today's Revenue</dt>
                <dd className="stat-value">
                  {formatCurrency(dashboardData?.today?.revenue || 0)}
                </dd>
              </dl>
            </div>
          </div>
          <div className="mt-3">
            <div className="stat-change stat-change-positive">
              <TrendingUp className="h-4 w-4 inline mr-1" />
              {formatCurrency((dashboardData?.today?.revenue || 0) - (dashboardData?.yesterday?.revenue || 0))} from yesterday
            </div>
          </div>
        </div>

        {/* Total Users */}
        <div className="stat-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="stat-label">Total Users</dt>
                <dd className="stat-value">
                  {formatNumber(dashboardData?.users?.total || 0)}
                </dd>
              </dl>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-sm text-gray-600">
              {formatNumber(dashboardData?.users?.activeToday || 0)} active today
            </div>
          </div>
        </div>

        {/* Total Products */}
        <div className="stat-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="stat-label">Total Products</dt>
                <dd className="stat-value">
                  {formatNumber(dashboardData?.products?.total || 0)}
                </dd>
              </dl>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-sm text-gray-600">
              <span className="text-red-600">{dashboardData?.products?.outOfStock || 0} out of stock</span>
              <span className="mx-2">•</span>
              <span className="text-yellow-600">{dashboardData?.products?.lowStock || 0} low stock</span>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="stat-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="stat-label">System Status</dt>
                <dd className="stat-value text-green-600">Online</dd>
              </dl>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-sm text-gray-600">
              All systems operational
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trends */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Sales Trends (Last 7 Days)</h3>
          </div>
          <div className="card-body">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'revenue' ? formatCurrency(value) : value,
                      name === 'revenue' ? 'Revenue' : 'Transactions'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="revenue"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="transactions" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="transactions"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* User Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Recent System Activity</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Activity className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.action.replace('_', ' ').toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {activity.details}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* User Management Preview */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">User Management</h3>
            <span className="text-sm text-gray-500">
              {userStats?.users?.length || 0} total users
            </span>
          </div>
        </div>
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">User</th>
                  <th className="table-header-cell">Role</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Created</th>
                  <th className="table-header-cell">Last Active</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {userStats?.users?.slice(0, 5).map((user) => (
                  <tr key={user.id} className="table-row">
                    <td className="table-cell">
                      <div>
                        <div className="font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.username}</div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="table-cell">
                      {new Date(user.updated_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body text-center">
            <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900">Manage Users</h3>
            <p className="text-sm text-gray-500">Create and manage user accounts</p>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900">View Analytics</h3>
            <p className="text-sm text-gray-500">Detailed system analytics</p>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <Activity className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900">Activity Logs</h3>
            <p className="text-sm text-gray-500">Monitor system activity</p>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <Shield className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900">System Settings</h3>
            <p className="text-sm text-gray-500">Configure system settings</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
