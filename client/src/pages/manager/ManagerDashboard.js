import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  TrendingUp,
  AlertTriangle,
  Users,
  BarChart3,
  Eye
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
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const ManagerDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [salesTrends, setSalesTrends] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [hourlyPattern, setHourlyPattern] = useState([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [
        dashboardRes,
        trendsRes,
        productsRes,
        categoriesRes,
        hourlyRes
      ] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/analytics/sales-trends?period=7days'),
        api.get('/analytics/top-products?period=7days&limit=5'),
        api.get('/analytics/sales-by-category?period=7days'),
        api.get('/analytics/hourly-pattern?days=7')
      ]);

      setDashboardData(dashboardRes.data);
      setSalesTrends(trendsRes.data.trends);
      setTopProducts(productsRes.data.topProducts);
      setCategorySales(categoriesRes.data.categorySales);
      setHourlyPattern(hourlyRes.data.hourlyPattern);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of sales performance, inventory, and analytics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Revenue */}
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

        {/* Today's Transactions */}
        <div className="stat-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="stat-label">Today's Transactions</dt>
                <dd className="stat-value">
                  {formatNumber(dashboardData?.today?.transactions || 0)}
                </dd>
              </dl>
            </div>
          </div>
          <div className="mt-3">
            <div className="stat-change stat-change-positive">
              <TrendingUp className="h-4 w-4 inline mr-1" />
              +{((dashboardData?.today?.transactions || 0) - (dashboardData?.yesterday?.transactions || 0))} from yesterday
            </div>
          </div>
        </div>

        {/* Inventory Status */}
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

        {/* Active Users */}
        <div className="stat-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="stat-label">Active Users Today</dt>
                <dd className="stat-value">
                  {formatNumber(dashboardData?.users?.activeToday || 0)}
                </dd>
              </dl>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-sm text-gray-600">
              {formatNumber(dashboardData?.users?.total || 0)} total users
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

        {/* Sales by Category */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Sales by Category</h3>
          </div>
          <div className="card-body">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySales}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, total_revenue }) => `${category}: ${formatCurrency(total_revenue)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total_revenue"
                  >
                    {categorySales.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Top Selling Products</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {topProducts.slice(0, 5).map((product, index) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(product.total_revenue)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatNumber(product.total_sold)} sold
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hourly Sales Pattern */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Hourly Sales Pattern</h3>
          </div>
          <div className="card-body">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyPattern}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors">
              <Package className="h-6 w-6 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-600">Manage Inventory</span>
            </button>
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors">
              <BarChart3 className="h-6 w-6 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-600">View Reports</span>
            </button>
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors">
              <AlertTriangle className="h-6 w-6 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-600">Stock Alerts</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
