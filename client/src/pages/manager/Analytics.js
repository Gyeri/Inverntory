import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  TrendingUp,
  BarChart3,
  Users,
  Clock,
  Calendar,
  Filter,
  Download,
  Printer,
  FileDown,
  File,
  RefreshCw
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
  Cell,
  Legend,
  Treemap,
  AreaChart,
  Area
} from 'recharts';

const Analytics = () => {
  // State for filters
  const [dateRange, setDateRange] = useState('last30days');
  const [selectedStore, setSelectedStore] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  
  // Sample data for charts (will be replaced with API data)
  const [salesData, setSalesData] = useState({
    trends: [],
    categoryBreakdown: [],
    topProducts: [],
    staffPerformance: [],
    customerInsights: [],
    paymentMethods: []
  });
  
  // Colors for charts
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  
  // Format currency
  const formatCurrency = (value) => {
    return `₦${value.toFixed(2)}`;
  };
  
  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // In a real app, you would fetch data from your API
      // const response = await api.get('/analytics/dashboard', { params: { dateRange, store: selectedStore, category: selectedCategory } });
      // setSalesData(response.data);
      
      // For now, we'll use sample data
      setSalesData({
        trends: [
          { date: '2023-01-01', revenue: 5000, transactions: 120 },
          { date: '2023-01-02', revenue: 6200, transactions: 145 },
          { date: '2023-01-03', revenue: 7800, transactions: 160 },
          { date: '2023-01-04', revenue: 5400, transactions: 130 },
          { date: '2023-01-05', revenue: 4900, transactions: 110 },
          { date: '2023-01-06', revenue: 8200, transactions: 175 },
          { date: '2023-01-07', revenue: 9100, transactions: 190 }
        ],
        categoryBreakdown: [
          { name: 'Electronics', value: 35000 },
          { name: 'Clothing', value: 24000 },
          { name: 'Food', value: 18000 },
          { name: 'Home', value: 12000 },
          { name: 'Beauty', value: 9000 }
        ],
        topProducts: [
          { name: 'Smartphone X', revenue: 12000, quantity: 40 },
          { name: 'Laptop Pro', revenue: 10000, quantity: 20 },
          { name: 'Wireless Earbuds', revenue: 8000, quantity: 80 },
          { name: 'Smart Watch', revenue: 6000, quantity: 30 },
          { name: 'Bluetooth Speaker', revenue: 4500, quantity: 45 }
        ],
        staffPerformance: [
          { name: 'John Doe', transactions: 145, revenue: 12500, avgTime: 2.5 },
          { name: 'Jane Smith', transactions: 132, revenue: 11200, avgTime: 2.2 },
          { name: 'Mike Johnson', transactions: 118, revenue: 9800, avgTime: 2.8 },
          { name: 'Sarah Williams', transactions: 105, revenue: 8900, avgTime: 3.1 }
        ],
        customerInsights: [
          { name: 'VIP Customers', value: 15 },
          { name: 'Regular Customers', value: 45 },
          { name: 'Occasional Customers', value: 25 },
          { name: 'One-time Customers', value: 15 }
        ],
        paymentMethods: [
          { name: 'Credit Card', value: 45 },
          { name: 'Cash', value: 25 },
          { name: 'Mobile Payment', value: 20 },
          { name: 'Other', value: 10 }
        ]
      });
      
      toast.success('Analytics data loaded successfully');
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load data on component mount and when filters change
  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, selectedStore, selectedCategory]);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Comprehensive performance metrics and insights
          </p>
        </div>
        <button 
          onClick={fetchAnalyticsData}
          className="btn btn-primary btn-sm flex items-center"
          disabled={isLoading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </button>
      </div>
      
      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select 
                className="form-select w-full"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Store</label>
              <select 
                className="form-select w-full"
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
              >
                <option value="all">All Stores</option>
                <option value="main">Main Store</option>
                <option value="branch1">Branch 1</option>
                <option value="branch2">Branch 2</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select 
                className="form-select w-full"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="food">Food</option>
                <option value="home">Home</option>
                <option value="beauty">Beauty</option>
              </select>
            </div>
            <div className="flex items-end">
              <button className="btn btn-primary">
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card hover:shadow-md transition-shadow">
          <div className="card-body flex items-center">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(45600)}</p>
              <p className="text-xs text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12.5% from last period
              </p>
            </div>
          </div>
        </div>
        
        <div className="card hover:shadow-md transition-shadow">
          <div className="card-body flex items-center">
            <div className="p-3 rounded-full bg-green-100 mr-4">
              <ShoppingCart className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">1,254</p>
              <p className="text-xs text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8.2% from last period
              </p>
            </div>
          </div>
        </div>
        
        <div className="card hover:shadow-md transition-shadow">
          <div className="card-body flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 mr-4">
              <Package className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(36.5)}</p>
              <p className="text-xs text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +3.7% from last period
              </p>
            </div>
          </div>
        </div>
        
        <div className="card hover:shadow-md transition-shadow">
          <div className="card-body flex items-center">
            <div className="p-3 rounded-full bg-purple-100 mr-4">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Customers</p>
              <p className="text-2xl font-bold text-gray-900">842</p>
              <p className="text-xs text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +5.3% from last period
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sales Analysis Section */}
      <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Sales Analysis</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trends Chart */}
        <div className="card">
          <div className="card-header">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Sales Trends</h3>
              <div className="flex space-x-2">
                <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg" title="Export as PDF">
                  <File className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg" title="Export as Excel">
                  <FileDown className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg" title="Print">
                  <Printer className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'revenue' ? formatCurrency(value) : value,
                      name === 'revenue' ? 'Revenue' : 'Transactions'
                    ]}
                  />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Revenue"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="transactions" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Transactions"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Revenue Breakdown */}
        <div className="card">
          <div className="card-header">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Revenue by Category</h3>
              <div className="flex space-x-2">
                <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg" title="Export as PDF">
                  <File className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg" title="Export as Excel">
                  <FileDown className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesData.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {salesData.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      
      {/* Product Performance Section */}
      <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Product Performance</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Top Selling Products</h3>
          </div>
          <div className="card-body">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={salesData.topProducts}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Product Category Performance */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Category Performance</h3>
          </div>
          <div className="card-body">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={salesData.categoryBreakdown}
                  dataKey="value"
                  nameKey="name"
                  stroke="#fff"
                  fill="#8884d8"
                >
                  {salesData.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Treemap>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      
      {/* Staff Performance Section */}
      <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Staff Performance</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Staff */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Top Performing Cashiers</h3>
          </div>
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4">Cashier</th>
                    <th className="text-center py-3 px-4">Transactions</th>
                    <th className="text-center py-3 px-4">Revenue</th>
                    <th className="text-center py-3 px-4">Avg. Time</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.staffPerformance.map((staff, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{staff.name}</td>
                      <td className="text-center py-3 px-4">{staff.transactions}</td>
                      <td className="text-center py-3 px-4">{formatCurrency(staff.revenue)}</td>
                      <td className="text-center py-3 px-4">{staff.avgTime} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Staff Efficiency */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Transaction Processing Time</h3>
          </div>
          <div className="card-body">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={salesData.staffPerformance}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgTime" fill="#f59e0b" name="Avg. Processing Time (min)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      
      {/* Customer Insights Section */}
      <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Customer Insights</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Segments */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Customer Segments</h3>
          </div>
          <div className="card-body">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesData.customerInsights}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {salesData.customerInsights.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Payment Methods */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Payment Method Distribution</h3>
          </div>
          <div className="card-body">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesData.paymentMethods}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {salesData.paymentMethods.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      
      {/* Export Options */}
      <div className="card mt-6">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Export Reports</h3>
        </div>
        <div className="card-body">
          <div className="flex flex-wrap gap-4">
            <button className="btn btn-outline flex items-center">
              <File className="h-4 w-4 mr-2" />
              Export as PDF
            </button>
            <button className="btn btn-outline flex items-center">
              <FileDown className="h-4 w-4 mr-2" />
              Export as Excel
            </button>
            <button className="btn btn-outline flex items-center">
              <Printer className="h-4 w-4 mr-2" />
              Print Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
