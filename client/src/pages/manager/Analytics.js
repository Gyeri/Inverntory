import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Treemap, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, ComposedBar, Scatter
} from 'recharts';
import {
  Calendar, Filter, Download, TrendingUp, Package, Users,
  DollarSign, ShoppingCart, Clock, Award, BarChart2, PieChart as PieChartIcon
} from 'lucide-react';

const Analytics = () => {
  // State for filters
  const [timeRange, setTimeRange] = useState('month');
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  
  // Sample data (will be replaced with API data)
  const [salesData, setSalesData] = useState([
    { date: '2023-01-01', sales: 4000, profit: 2400, category: 'Electronics' },
    { date: '2023-01-02', sales: 3000, profit: 1398, category: 'Clothing' },
    { date: '2023-01-03', sales: 2000, profit: 9800, category: 'Food' },
    { date: '2023-01-04', sales: 2780, profit: 3908, category: 'Electronics' },
    { date: '2023-01-05', sales: 1890, profit: 4800, category: 'Clothing' },
    { date: '2023-01-06', sales: 2390, profit: 3800, category: 'Food' },
    { date: '2023-01-07', sales: 3490, profit: 4300, category: 'Electronics' },
  ]);
  
  const [productData, setProductData] = useState([
    { name: 'iPhone 13', value: 12000, quantity: 24, category: 'Electronics' },
    { name: 'Samsung TV', value: 9800, quantity: 12, category: 'Electronics' },
    { name: 'Nike Shoes', value: 7500, quantity: 30, category: 'Clothing' },
    { name: 'Adidas Shirt', value: 6500, quantity: 26, category: 'Clothing' },
    { name: 'Rice (5kg)', value: 5000, quantity: 50, category: 'Food' },
    { name: 'Cooking Oil', value: 4500, quantity: 45, category: 'Food' },
  ]);
  
  const [staffData, setStaffData] = useState([
    { name: 'John Doe', sales: 45000, transactions: 120, avgTime: 3.2 },
    { name: 'Jane Smith', sales: 38000, transactions: 95, avgTime: 2.8 },
    { name: 'Bob Johnson', sales: 32000, transactions: 85, avgTime: 4.1 },
    { name: 'Alice Brown', sales: 28000, transactions: 75, avgTime: 3.5 },
  ]);
  
  const [customerData, setCustomerData] = useState([
    { name: 'Premium', value: 35, count: 120 },
    { name: 'Regular', value: 45, count: 300 },
    { name: 'Occasional', value: 20, count: 500 },
  ]);
  
  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  // Currency formatter
  const formatCurrency = (value) => {
    return '₦' + value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  };
  
  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, we would fetch data from the API
      // const response = await api.get('/analytics', {
      //   params: { startDate, endDate, category, timeRange }
      // });
      // setSalesData(response.data.salesData);
      // setProductData(response.data.productData);
      // setStaffData(response.data.staffData);
      // setCustomerData(response.data.customerData);
      
      // For now, we'll use the sample data
      // Simulate API delay
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    } catch (error) {
      toast.error('Failed to load analytics data');
      setIsLoading(false);
    }
  };
  
  // Load data on component mount and filter changes
  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange, startDate, endDate, category]);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Comprehensive insights and performance metrics
          </p>
        </div>
        
        {/* Filter options */}
        <div className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Time Range:</label>
            <select 
              className="form-select rounded-md border-gray-300 shadow-sm"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">From:</label>
            <div className="relative">
              <input
                type="date"
                className="form-input rounded-md border-gray-300 shadow-sm pl-8"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Calendar className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">To:</label>
            <div className="relative">
              <input
                type="date"
                className="form-input rounded-md border-gray-300 shadow-sm pl-8"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <Calendar className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Category:</label>
            <select 
              className="form-select rounded-md border-gray-300 shadow-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Clothing">Clothing</option>
              <option value="Food">Food</option>
            </select>
          </div>
          
          <button 
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={fetchAnalyticsData}
          >
            <Filter className="h-4 w-4 mr-1" />
            Apply Filters
          </button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="text-lg font-semibold text-gray-900">{formatCurrency(salesData.reduce((sum, item) => sum + item.sales, 0))}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-900">View details</a>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Sales</dt>
                  <dd className="text-lg font-semibold text-gray-900">{salesData.reduce((sum, item) => sum + item.quantity || 1, 0)} units</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-900">View details</a>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Products Sold</dt>
                  <dd className="text-lg font-semibold text-gray-900">{productData.reduce((sum, item) => sum + item.quantity, 0)} units</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-900">View details</a>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Customers</dt>
                  <dd className="text-lg font-semibold text-gray-900">{customerData.reduce((sum, item) => sum + item.count, 0)}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-900">View details</a>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sales Analysis Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-medium leading-6 text-gray-900">Sales Analysis</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Trend Chart */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-4">Sales Trend</h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="sales" stroke="#8884d8" name="Sales" />
                    <Line yAxisId="right" type="monotone" dataKey="profit" stroke="#82ca9d" name="Profit" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Revenue Breakdown */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-4">Revenue Breakdown by Category</h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="category"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {productData.map((entry, index) => (
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
      </div>
      
      {/* Product Performance Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center">
            <Package className="h-5 w-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-medium leading-6 text-gray-900">Product Performance</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Selling Products */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-4">Top Selling Products</h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={productData.sort((a, b) => b.value - a.value).slice(0, 5)}
                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Product Category Performance */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-4">Product Category Performance</h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={productData}
                    dataKey="value"
                    nameKey="category"
                    ratio={4/3}
                    stroke="#fff"
                    fill="#8884d8"
                  >
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </Treemap>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Staff Performance Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-medium leading-6 text-gray-900">Staff Performance</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performing Cashiers */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-4">Top Performing Cashiers</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Time</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {staffData.map((staff, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{staff.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(staff.sales)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.transactions}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.avgTime} min</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Staff Efficiency */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-4">Staff Efficiency</h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={staffData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="transactions" fill="#8884d8" name="Transactions" />
                    <Bar dataKey="avgTime" fill="#82ca9d" name="Avg. Time (min)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Customer Insights Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-medium leading-6 text-gray-900">Customer Insights</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Segments */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-4">Customer Segments</h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={customerData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {customerData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Customer Count by Segment */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-4">Customer Count by Segment</h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={customerData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {customerData.map((entry, index) => (
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
      </div>
      
      {/* Export Options */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center">
            <Download className="h-5 w-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-medium leading-6 text-gray-900">Export Options</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="flex space-x-4">
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <Download className="h-4 w-4 mr-2" />
              Export as PDF
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              <Download className="h-4 w-4 mr-2" />
              Export as Excel
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Download className="h-4 w-4 mr-2" />
              Export as CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
