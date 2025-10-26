import React, { useState } from 'react';
import { 
  FileText, 
  RefreshCw, 
  ChevronDown,
  FileDown,
  Printer,
  File,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

const SalesReports = () => {
  const [startDate, setStartDate] = useState('2025-10-17');
  const [endDate, setEndDate] = useState('2025-10-23');
  const [selectedStore, setSelectedStore] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState('All');
  
  // Format for display
  const dateRange = `${format(new Date(startDate), 'MM/dd/yyyy')} - ${format(new Date(endDate), 'MM/dd/yyyy')}`;
  
  // Sample data for the report
  const summaryData = {
    totalAmount: '₦4,56,000',
    totalPaid: '₦2,56.42',
    totalUnpaid: '₦1,52.45',
    overdue: '₦2,56.12'
  };
  
  const productData = [
    { id: 'PT001', sku: 'PT001', name: 'Lenovo IdeaPad 3', image: '💻', brand: 'Lenovo', category: 'Computers', soldQty: '05', soldAmount: '₦3000', instockQty: '100' },
    { id: 'PT002', sku: 'PT002', name: 'Beats Pro', image: '🎧', brand: 'Beats', category: 'Electronics', soldQty: '10', soldAmount: '₦1600', instockQty: '140' },
    { id: 'PT003', sku: 'PT003', name: 'Nike Jordan', image: '👟', brand: 'Nike', category: 'Shoe', soldQty: '08', soldAmount: '₦880', instockQty: '300' },
    { id: 'PT005', sku: 'PT005', name: 'Amazon Echo Dot', image: '🔊', brand: 'Amazon', category: 'Electronics', soldQty: '05', soldAmount: '₦400', instockQty: '320' },
    { id: 'PT009', sku: 'PT009', name: 'Gaming Chair', image: '🪑', brand: 'Arlime', category: 'Furniture', soldQty: '10', soldAmount: '₦2000', instockQty: '410' },
    { id: 'PT004', sku: 'PT004', name: 'Apple Series 5 Watch', image: '⌚', brand: 'Apple', category: 'Electronics', soldQty: '10', soldAmount: '₦1200', instockQty: '450' },
    { id: 'PT010', sku: 'PT010', name: 'Borealis Backpack', image: '🎒', brand: 'The North Face', category: 'Bags', soldQty: '20', soldAmount: '₦900', instockQty: '550' },
    { id: 'PT008', sku: 'PT008', name: 'Iphone 14 Pro', image: '📱', brand: 'Apple', category: 'Phone', soldQty: '12', soldAmount: '₦6480', instockQty: '630' },
  ];

  const handleGenerateReport = () => {
    // In a real implementation, this would fetch data based on filters
    console.log('Generating report with filters:', { dateRange, selectedStore, selectedProduct });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Report</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your Sales report
          </p>
        </div>
        <div className="flex space-x-2">
          <button className="btn btn-secondary p-2">
            <RefreshCw className="h-5 w-5" />
          </button>
          <button className="btn btn-secondary p-2">
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Amount */}
        <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg mr-3">
              <FileText className="h-5 w-5 text-success-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Amount</p>
              <p className="text-xl font-bold text-gray-900">{summaryData.totalAmount}</p>
            </div>
          </div>
        </div>
        
        {/* Total Paid */}
        <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg mr-3">
              <FileText className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Paid</p>
              <p className="text-xl font-bold text-gray-900">{summaryData.totalPaid}</p>
            </div>
          </div>
        </div>
        
        {/* Total Unpaid */}
        <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-warning-100 rounded-lg mr-3">
              <FileText className="h-5 w-5 text-warning-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Unpaid</p>
              <p className="text-xl font-bold text-gray-900">{summaryData.totalUnpaid}</p>
            </div>
          </div>
        </div>
        
        {/* Overdue */}
        <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-danger-100 rounded-lg mr-3">
              <FileText className="h-5 w-5 text-danger-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <p className="text-xl font-bold text-gray-900">{summaryData.overdue}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <div className="relative">
              <input
                type="date"
                id="start-date"
                className="input w-full pr-10"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </div>
          </div>
          
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <div className="relative">
              <input
                type="date"
                id="end-date"
                className="input w-full pr-10"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </div>
          </div>
        </div>
        
        <div>
          <label htmlFor="store" className="block text-sm font-medium text-gray-700 mb-1">
            Store
          </label>
          <select
            id="store"
            className="input w-full"
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
          >
            <option>All</option>
            <option>Store 1</option>
            <option>Store 2</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="product" className="block text-sm font-medium text-gray-700 mb-1">
            Products
          </label>
          <select
            id="product"
            className="input w-full"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
          >
            <option>All</option>
            <option>Electronics</option>
            <option>Furniture</option>
          </select>
        </div>
        
        <div className="md:col-span-3 flex justify-end">
          <button 
            onClick={handleGenerateReport}
            className="btn btn-primary px-4 py-2"
          >
            Generate Report
          </button>
        </div>
      </div>
      
      {/* Report Table */}
      <div className="card">
        <div className="card-header flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Sales Report</h3>
          <div className="flex space-x-2">
            <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Export as PDF">
              <File className="h-5 w-5" />
            </button>
            <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Export as Excel">
              <FileDown className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg" title="Print">
              <Printer className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="table-header bg-gray-50">
              <tr>
                <th className="table-header-cell text-left">SKU</th>
                <th className="table-header-cell text-left">Product Name</th>
                <th className="table-header-cell text-left">Brand</th>
                <th className="table-header-cell text-left">Category</th>
                <th className="table-header-cell text-center">Sold Qty</th>
                <th className="table-header-cell text-right">Sold Amount</th>
                <th className="table-header-cell text-center">Instock Qty</th>
              </tr>
            </thead>
            <tbody className="table-body divide-y divide-gray-200">
              {productData.map((product) => (
                <tr key={product.id} className="table-row hover:bg-gray-50">
                  <td className="table-cell py-3">{product.sku}</td>
                  <td className="table-cell py-3">
                    <div className="flex items-center">
                      <span className="mr-2 text-lg">{product.image}</span>
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </td>
                  <td className="table-cell py-3">{product.brand}</td>
                  <td className="table-cell py-3">{product.category}</td>
                  <td className="table-cell py-3 text-center">{product.soldQty}</td>
                  <td className="table-cell py-3 text-right">{product.soldAmount}</td>
                  <td className="table-cell py-3 text-center">{product.instockQty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesReports;
