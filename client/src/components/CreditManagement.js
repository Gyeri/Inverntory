import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  AlertTriangle, 
  User, 
  Phone, 
  Mail,
  CreditCard,
  Search,
  Filter,
  Eye,
  CheckCircle,
  X,
  ArrowRight,
  RefreshCw,
  Download,
  Bell,
  TrendingUp,
  Users,
  Wallet,
  BarChart3,
  Plus,
  Receipt
} from 'lucide-react';
import { format } from 'date-fns';

const CreditManagement = () => {
  const { isAdmin, isManager, isCashier } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [overdueCredits, setOverdueCredits] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSales, setCustomerSales] = useState([]);
  const [customerPayments, setCustomerPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOverdue, setFilterOverdue] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'customers', 'overdue', 'payments', 'analytics'
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    payment_method: 'cash',
    notes: ''
  });
  const [creditSummary, setCreditSummary] = useState(null);
  const [allPayments, setAllPayments] = useState([]);

  // Determine user capabilities
  const canViewAnalytics = isAdmin() || isManager();
  const canRecordPayments = isAdmin() || isManager() || isCashier();
  const canExportData = isAdmin() || isManager();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadCustomers(),
      loadOverdueCredits(),
      loadCreditSummary(),
      ...(canExportData ? [loadAllPayments()] : [])
    ]);
  };

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/customers');
      setCustomers(response.data.customers);
    } catch (error) {
      console.error('Failed to load customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const loadOverdueCredits = async () => {
    try {
      const response = await api.get('/customers/overdue/list?days=30');
      setOverdueCredits(response.data.overdueCredits);
    } catch (error) {
      console.error('Failed to load overdue credits:', error);
      toast.error('Failed to load overdue credits');
    }
  };

  const loadCreditSummary = async () => {
    try {
      const response = await api.get('/customers/credit/summary');
      setCreditSummary(response.data);
    } catch (error) {
      console.error('Failed to load credit summary:', error);
    }
  };

  const loadAllPayments = async () => {
    try {
      const response = await api.get('/customers/payments/all');
      setAllPayments(response.data.payments);
    } catch (error) {
      console.error('Failed to load payments:', error);
    }
  };

  const loadCustomerDetails = async (customerId) => {
    try {
      setLoading(true);
      const response = await api.get(`/customers/${customerId}`);
      setCustomerSales(response.data.creditSales);
      setCustomerPayments(response.data.payments);
      setSelectedCustomer(response.data.customer);
    } catch (error) {
      console.error('Failed to load customer details:', error);
      toast.error('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  const recordPayment = async () => {
    if (!selectedCredit || !paymentForm.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await api.post(`/customers/${selectedCustomer.id}/payments`, {
        sale_id: selectedCredit.id,
        amount: parseFloat(paymentForm.amount),
        payment_date: paymentForm.payment_date,
        payment_method: paymentForm.payment_method,
        notes: paymentForm.notes
      });
      
      toast.success('Payment recorded successfully');
      loadCustomerDetails(selectedCustomer.id);
      loadData();
      setShowPaymentModal(false);
      setSelectedCredit(null);
      setPaymentForm({
        amount: '',
        payment_date: format(new Date(), 'yyyy-MM-dd'),
        payment_method: 'cash',
        notes: ''
      });
    } catch (error) {
      console.error('Failed to record payment:', error);
      toast.error(error.response?.data?.error || 'Failed to record payment');
    }
  };

  const openPaymentModal = (credit) => {
    setSelectedCredit(credit);
    setPaymentForm({
      amount: credit.remaining_balance?.toString() || '',
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      payment_method: 'cash',
      notes: ''
    });
    setShowPaymentModal(true);
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = !searchQuery || 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchQuery)) ||
      (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = !filterOverdue || customer.outstanding_balance > 0;
    
    return matchesSearch && matchesFilter;
  });

  const getOverdueCount = () => {
    return overdueCredits.length;
  };

  const getTotalOverdue = () => {
    return overdueCredits.reduce((total, credit) => total + credit.remaining_balance, 0);
  };

  const getTotalOutstanding = () => {
    return customers.reduce((total, customer) => total + (customer.outstanding_balance || 0), 0);
  };

  const getDaysOverdue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today - due;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getOverdueSeverity = (days) => {
    if (days <= 7) return 'warning';
    if (days <= 30) return 'danger';
    return 'critical';
  };

  const exportPayments = () => {
    const csvContent = [
      ['Date', 'Customer', 'Transaction ID', 'Amount', 'Method', 'Notes'].join(','),
      ...allPayments.map(payment => [
        format(new Date(payment.payment_date), 'yyyy-MM-dd'),
        payment.customer_name,
        payment.transaction_id,
        payment.amount,
        payment.payment_method,
        payment.notes || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setActiveTab('customers')}
          className="card hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="card-body text-center">
            <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Manage Customers</h3>
            <p className="text-sm text-gray-500">View and manage customer accounts</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className="card hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="card-body text-center">
            <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Overdue Credits</h3>
            <p className="text-sm text-gray-500">{getOverdueCount()} overdue accounts</p>
          </div>
        </button>

        {canViewAnalytics ? (
          <button
            onClick={() => setActiveTab('analytics')}
            className="card hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="card-body text-center">
              <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">Analytics</h3>
              <p className="text-sm text-gray-500">Credit performance insights</p>
            </div>
          </button>
        ) : (
          <button
            onClick={() => setActiveTab('payments')}
            className="card hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="card-body text-center">
              <Receipt className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">Payment History</h3>
              <p className="text-sm text-gray-500">View payment records</p>
            </div>
          </button>
        )}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
          </div>
          <div className="card-body">
            {creditSummary?.recentPayments?.length > 0 ? (
              <div className="space-y-3">
                {creditSummary.recentPayments.slice(0, 5).map((payment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">{payment.customer_name}</p>
                        <p className="text-sm text-gray-500">{payment.transaction_id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">₦{payment.amount.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">{format(new Date(payment.payment_date), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Receipt className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No recent payments</p>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Top Customers by Outstanding</h3>
          </div>
          <div className="card-body">
            {customers.filter(c => c.outstanding_balance > 0).length > 0 ? (
              <div className="space-y-3">
                {customers
                  .filter(c => c.outstanding_balance > 0)
                  .sort((a, b) => b.outstanding_balance - a.outstanding_balance)
                  .slice(0, 5)
                  .map((customer, index) => (
                    <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{customer.name}</p>
                          <p className="text-sm text-gray-500">{customer.phone}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600">₦{customer.outstanding_balance.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-300" />
                <p>All customers are up to date</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCustomersTab = () => (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customers by name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterOverdue(!filterOverdue)}
                className={`btn ${filterOverdue ? 'btn-primary' : 'btn-outline'}`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Overdue Only
              </button>
              <button
                onClick={loadCustomers}
                className="btn btn-outline"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customers List */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">
            Customers ({filteredCustomers.length})
          </h3>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading customers...</span>
            </div>
          ) : filteredCustomers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Contact</th>
                    <th>Credit Limit</th>
                    <th>Outstanding</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <div>
                          <p className="font-medium text-gray-900">{customer.name}</p>
                          <p className="text-sm text-gray-500">ID: {customer.id}</p>
                        </div>
                      </td>
                      <td>
                        <div className="space-y-1">
                          {customer.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-3 w-3 mr-1" />
                              {customer.phone}
                            </div>
                          )}
                          {customer.email && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="h-3 w-3 mr-1" />
                              {customer.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="font-medium">₦{customer.credit_limit?.toFixed(2) || '0.00'}</span>
                      </td>
                      <td>
                        <span className={`font-medium ${customer.outstanding_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ₦{customer.outstanding_balance?.toFixed(2) || '0.00'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${customer.outstanding_balance > 0 ? 'badge-error' : 'badge-success'}`}>
                          {customer.outstanding_balance > 0 ? 'Outstanding' : 'Clear'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => loadCustomerDetails(customer.id)}
                          className="btn btn-sm btn-outline"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No customers found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderOverdueTab = () => (
    <div className="space-y-4">
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Overdue Credits ({getOverdueCount()})
            </h3>
            <div className="flex gap-2">
              <button
                onClick={loadOverdueCredits}
                className="btn btn-outline btn-sm"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          {overdueCredits.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Transaction</th>
                    <th>Due Date</th>
                    <th>Days Overdue</th>
                    <th>Amount</th>
                    {canRecordPayments && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {overdueCredits.map((credit) => {
                    const daysOverdue = getDaysOverdue(credit.credit_due_date);
                    const severity = getOverdueSeverity(daysOverdue);
                    
                    return (
                      <tr key={credit.id}>
                        <td>
                          <div>
                            <p className="font-medium text-gray-900">{credit.customer_name}</p>
                            <p className="text-sm text-gray-500">{credit.customer_phone}</p>
                          </div>
                        </td>
                        <td>
                          <div>
                            <p className="font-medium">{credit.transaction_id}</p>
                            <p className="text-sm text-gray-500">₦{credit.credit_amount.toFixed(2)}</p>
                          </div>
                        </td>
                        <td>
                          <span className="text-sm">{format(new Date(credit.credit_due_date), 'MMM dd, yyyy')}</span>
                        </td>
                        <td>
                          <span className={`badge ${
                            severity === 'warning' ? 'badge-warning' :
                            severity === 'danger' ? 'badge-error' : 'badge-error'
                          }`}>
                            {daysOverdue} days
                          </span>
                        </td>
                        <td>
                          <span className="font-semibold text-red-600">
                            ₦{credit.remaining_balance.toFixed(2)}
                          </span>
                        </td>
                        {canRecordPayments && (
                          <td>
                            <button
                              onClick={() => openPaymentModal(credit)}
                              className="btn btn-sm btn-primary"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Record Payment
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-300" />
              <p>No overdue credits</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPaymentsTab = () => (
    <div className="space-y-4">
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
        </div>
        <div className="card-body p-0">
          {customerPayments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Transaction</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {customerPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{format(new Date(payment.payment_date), 'MMM dd, yyyy')}</td>
                      <td>{selectedCustomer?.name}</td>
                      <td>{payment.transaction_id}</td>
                      <td>
                        <span className="font-semibold text-green-600">
                          ₦{payment.amount.toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-outline">
                          {payment.payment_method}
                        </span>
                      </td>
                      <td>{payment.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No payment history</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Collection Rate</p>
                <p className="text-2xl font-bold text-blue-600">
                  {creditSummary ? 
                    ((creditSummary.totalOutstanding / (creditSummary.totalOutstanding + creditSummary.monthlyAmount)) * 100).toFixed(1) + '%' 
                    : '0%'
                  }
                </p>
                <p className="text-xs text-gray-400">This month</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Payment Time</p>
                <p className="text-2xl font-bold text-green-600">15 days</p>
                <p className="text-xs text-gray-400">Average</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Credit Utilization</p>
                <p className="text-2xl font-bold text-purple-600">
                  {creditSummary ? 
                    ((creditSummary.totalOutstanding / (customers.reduce((sum, c) => sum + (c.credit_limit || 0), 0))) * 100).toFixed(1) + '%'
                    : '0%'
                  }
                </p>
                <p className="text-xs text-gray-400">Of total limit</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods Breakdown */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
        </div>
        <div className="card-body">
          {allPayments.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['cash', 'bank_transfer', 'pos', 'mobile_money'].map(method => {
                const methodPayments = allPayments.filter(p => p.payment_method === method);
                const total = methodPayments.reduce((sum, p) => sum + p.amount, 0);
                const count = methodPayments.length;
                
                return (
                  <div key={method} className="text-center p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 capitalize">{method.replace('_', ' ')}</h4>
                    <p className="text-2xl font-bold text-blue-600">₦{total.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">{count} payments</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No payment data available</p>
            </div>
          )}
        </div>
      </div>

      {/* All Payments Table */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">All Payments</h3>
            <button
              onClick={exportPayments}
              className="btn btn-outline btn-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>
        <div className="card-body p-0">
          {allPayments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Transaction</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Recorded By</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {allPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{format(new Date(payment.payment_date), 'MMM dd, yyyy')}</td>
                      <td>
                        <div>
                          <p className="font-medium">{payment.customer_name}</p>
                          <p className="text-sm text-gray-500">{payment.customer_phone}</p>
                        </div>
                      </td>
                      <td>{payment.transaction_id}</td>
                      <td>
                        <span className="font-semibold text-green-600">
                          ₦{payment.amount.toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-outline">
                          {payment.payment_method}
                        </span>
                      </td>
                      <td>{payment.recorded_by_name}</td>
                      <td>{payment.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No payment history</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Credit Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isCashier() ? 'Manage customer credits and record payments' : 
             isManager() ? 'Monitor and analyze credit performance' :
             'Comprehensive credit management and analytics'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="btn btn-outline"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
                <p className="text-xs text-gray-400">Active accounts</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Overdue Credits</p>
                <p className="text-2xl font-bold text-red-600">{getOverdueCount()}</p>
                <p className="text-xs text-gray-400">Require attention</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Wallet className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Outstanding</p>
                <p className="text-2xl font-bold text-yellow-600">₦{getTotalOutstanding().toFixed(2)}</p>
                <p className="text-xs text-gray-400">Unpaid amount</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">This Month</p>
                <p className="text-2xl font-bold text-green-600">
                  ₦{creditSummary?.monthlyAmount?.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-gray-400">{creditSummary?.monthlyCredits || 0} credits</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Overdue Alerts */}
      {overdueCredits.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg mr-4">
              <Bell className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-800">Overdue Credit Alert</h3>
              <p className="text-sm text-red-700 mt-1">
                You have {getOverdueCount()} overdue credit(s) totaling ₦{getTotalOverdue().toFixed(2)}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('overdue')}
              className="btn btn-error btn-sm"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              View Overdue Credits
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Tabs */}
      <div className="card">
        <div className="card-header">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'customers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Customers ({customers.length})
            </button>
            <button
              onClick={() => setActiveTab('overdue')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overdue'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overdue Credits ({getOverdueCount()})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'payments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Payment History
            </button>
            {canViewAnalytics && (
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'analytics'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Analytics
              </button>
            )}
          </nav>
        </div>
        <div className="card-body">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'customers' && renderCustomersTab()}
          {activeTab === 'overdue' && renderOverdueTab()}
          {activeTab === 'payments' && renderPaymentsTab()}
          {activeTab === 'analytics' && canViewAnalytics && renderAnalyticsTab()}
        </div>
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedCustomer.name}</h2>
                  <p className="text-sm text-gray-500">Customer Details</p>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Info */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold">Customer Information</h3>
                  </div>
                  <div className="card-body space-y-3">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Name:</span>
                      <span className="ml-2 font-medium">{selectedCustomer.name}</span>
                    </div>
                    {selectedCustomer.phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">Phone:</span>
                        <span className="ml-2">{selectedCustomer.phone}</span>
                      </div>
                    )}
                    {selectedCustomer.email && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">Email:</span>
                        <span className="ml-2">{selectedCustomer.email}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Wallet className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Credit Limit:</span>
                      <span className="ml-2 font-medium">₦{selectedCustomer.credit_limit?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Outstanding:</span>
                      <span className={`ml-2 font-medium ${selectedCustomer.outstanding_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ₦{selectedCustomer.outstanding_balance?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Credit Sales */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold">Credit Sales</h3>
                  </div>
                  <div className="card-body p-0">
                    {customerSales.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Transaction</th>
                              <th>Date</th>
                              <th>Amount</th>
                              <th>Due Date</th>
                              <th>Status</th>
                              {canRecordPayments && <th>Action</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {customerSales.map((sale) => {
                              const totalPaid = sale.total_payments || 0;
                              const remaining = sale.credit_amount - totalPaid;
                              const isOverdue = new Date(sale.credit_due_date) < new Date();
                              
                              return (
                                <tr key={sale.id}>
                                  <td className="font-medium">{sale.transaction_id}</td>
                                  <td>{format(new Date(sale.created_at), 'MMM dd, yyyy')}</td>
                                  <td>₦{sale.credit_amount.toFixed(2)}</td>
                                  <td>{format(new Date(sale.credit_due_date), 'MMM dd, yyyy')}</td>
                                  <td>
                                    <span className={`badge ${
                                      remaining <= 0 ? 'badge-success' :
                                      isOverdue ? 'badge-error' : 'badge-warning'
                                    }`}>
                                      {remaining <= 0 ? 'Paid' : isOverdue ? 'Overdue' : 'Pending'}
                                    </span>
                                  </td>
                                  {canRecordPayments && (
                                    <td>
                                      {remaining > 0 && (
                                        <button
                                          onClick={() => openPaymentModal(sale)}
                                          className="btn btn-sm btn-primary"
                                        >
                                          <Plus className="h-3 w-3 mr-1" />
                                          Pay
                                        </button>
                                      )}
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>No credit sales</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Payment Modal */}
      {showPaymentModal && selectedCredit && canRecordPayments && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Record Payment</h2>
                  <p className="text-sm text-gray-500">
                    {selectedCustomer?.name} - {selectedCredit.transaction_id}
                  </p>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Original Amount:</span>
                      <p className="font-medium">₦{selectedCredit.credit_amount?.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Remaining:</span>
                      <p className="font-medium text-red-600">₦{selectedCredit.remaining_balance?.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedCredit.remaining_balance}
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                    className="input w-full"
                    placeholder="Enter payment amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm({...paymentForm, payment_date: e.target.value})}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})}
                    className="input w-full"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="pos">POS</option>
                    <option value="mobile_money">Mobile Money</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                    className="input w-full"
                    rows={3}
                    placeholder="Optional payment notes..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={recordPayment}
                  className="btn btn-primary flex-1"
                  disabled={!paymentForm.amount || !paymentForm.payment_date}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Record Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditManagement;
