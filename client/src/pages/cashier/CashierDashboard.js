import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard,
  DollarSign,
  Package,
  TrendingUp,
  Clock,
  Barcode,
  X
} from 'lucide-react';
import { format } from 'date-fns';

// Customer Creation Modal Component
const CustomerCreationModal = ({ onClose, onCreate }) => {
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    credit_limit: 0
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerData.name.trim()) {
      toast.error('Customer name is required');
      return;
    }

    setLoading(true);
    try {
      await onCreate(customerData);
      setCustomerData({
        name: '',
        phone: '',
        email: '',
        address: '',
        credit_limit: 0
      });
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create New Customer</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="input w-full"
                    value={customerData.name}
                    onChange={(e) => setCustomerData({...customerData, name: e.target.value})}
                    placeholder="Enter customer name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="input w-full"
                    value={customerData.phone}
                    onChange={(e) => setCustomerData({...customerData, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="input w-full"
                    value={customerData.email}
                    onChange={(e) => setCustomerData({...customerData, email: e.target.value})}
                    placeholder="Enter email address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    className="input w-full"
                    rows={3}
                    value={customerData.address}
                    onChange={(e) => setCustomerData({...customerData, address: e.target.value})}
                    placeholder="Enter customer address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credit Limit (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input w-full"
                    value={customerData.credit_limit}
                    onChange={(e) => setCustomerData({...customerData, credit_limit: parseFloat(e.target.value) || 0})}
                    placeholder="Enter credit limit (0 for unlimited)"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Customer'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const CashierDashboard = () => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [todayStats, setTodayStats] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [creditDueDate, setCreditDueDate] = useState('');
  const [overdueCount, setOverdueCount] = useState(0);
  const [totalOutstanding, setTotalOutstanding] = useState(0);

  useEffect(() => {
    loadTodayStats();
    loadRecentSales();
    loadCreditData();
  }, []);

  const loadTodayStats = async () => {
    try {
      const response = await api.get('/sales/dashboard/today');
      setTodayStats(response.data);
    } catch (error) {
      console.error('Failed to load today stats:', error);
    }
  };

  const loadRecentSales = async () => {
    try {
      const response = await api.get('/sales/dashboard/recent');
      setRecentSales(response.data.recentSales);
    } catch (error) {
      console.error('Failed to load recent sales:', error);
    }
  };

  const loadCreditData = async () => {
    try {
      const response = await api.get('/customers/credit/summary');
      setOverdueCount(response.data.overdueCredits);
      setTotalOutstanding(response.data.totalOutstanding);
    } catch (error) {
      console.error('Failed to load credit data:', error);
    }
  };

  const searchProducts = async (query) => {
    if (query.length < 2) {
      setProducts([]);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/products?search=${encodeURIComponent(query)}&limit=10`);
      setProducts(response.data.products);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Failed to search products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchProducts(query);
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product_id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock_quantity) {
        toast.error('Not enough stock available');
        return;
      }
      setCart(cart.map(item => 
        item.product_id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      if (product.stock_quantity === 0) {
        toast.error('Product is out of stock');
        return;
      }
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        stock_quantity: product.stock_quantity
      }]);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const item = cart.find(item => item.product_id === productId);
    if (newQuantity > item.stock_quantity) {
      toast.error('Not enough stock available');
      return;
    }

    setCart(cart.map(item => 
      item.product_id === productId 
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const processSale = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    if (paymentMethod === 'credit') {
      if (!selectedCustomer) {
        toast.error('Please select a customer for credit sales');
        return;
      }
      if (!creditDueDate) {
        toast.error('Please select a due date for credit sales');
        return;
      }
    }

    try {
      setLoading(true);
      const items = cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      }));

      const saleData = {
        items,
        payment_method: paymentMethod
      };

      if (paymentMethod === 'credit') {
        saleData.customer_id = selectedCustomer.id;
        saleData.credit_due_date = creditDueDate;
      }

      const response = await api.post('/sales', saleData);

      const paymentText = paymentMethod === 'credit' ? 'credit sale' : 'sale';
      toast.success(`${paymentText.charAt(0).toUpperCase() + paymentText.slice(1)} completed successfully!`);
      
      // Reset form
      setCart([]);
      setSearchQuery('');
      setProducts([]);
      setPaymentMethod('cash');
      setSelectedCustomer(null);
      setCustomerSearch('');
      setCreditDueDate('');
      
      loadTodayStats();
      loadRecentSales();
      
    } catch (error) {
      console.error('Sale failed:', error);
      toast.error(error.response?.data?.error || 'Failed to process sale');
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScan = () => {
    setShowBarcodeScanner(true);
  };

  const closeBarcodeScanner = () => {
    setShowBarcodeScanner(false);
  };

  const searchCustomers = async (query) => {
    if (query.length < 2) {
      setCustomers([]);
      return;
    }

    try {
      const response = await api.get(`/customers/search?q=${encodeURIComponent(query)}`);
      setCustomers(response.data.customers);
    } catch (error) {
      console.error('Customer search failed:', error);
      setCustomers([]);
    }
  };

  const handleCustomerSearchChange = (e) => {
    const query = e.target.value;
    setCustomerSearch(query);
    searchCustomers(query);
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    setCustomers([]);
    setShowCustomerModal(false);
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerSearch('');
    setCustomers([]);
  };

  const createNewCustomer = async (customerData) => {
    try {
      const response = await api.post('/customers', customerData);
      const newCustomer = response.data.customer;
      setSelectedCustomer(newCustomer);
      setCustomerSearch(newCustomer.name);
      setShowCustomerModal(false);
      toast.success('Customer created successfully');
    } catch (error) {
      console.error('Failed to create customer:', error);
      toast.error(error.response?.data?.error || 'Failed to create customer');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cashier Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Process sales and manage transactions
        </p>
      </div>

      {/* Credit Management Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Sales Today</p>
                <p className="text-2xl font-bold text-gray-900">{todayStats?.transactions || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Today's Revenue</p>
                <p className="text-2xl font-bold text-green-600">₦{(todayStats?.revenue || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Overdue Credits</p>
                <p className="text-2xl font-bold text-yellow-600">{overdueCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Outstanding</p>
                <p className="text-2xl font-bold text-red-600">₦{(totalOutstanding || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Sales Interface */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Search */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Product Search</h3>
            </div>
            <div className="card-body">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products by name, SKU, or barcode..."
                    className="input pl-10"
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                </div>
                <button
                  onClick={handleBarcodeScan}
                  className="btn btn-secondary flex items-center gap-2 px-4"
                  title="Scan Barcode"
                > 
                  <Barcode className="h-5 w-5" />
                  <span className="hidden sm:inline">Scan</span>
                </button>
              </div>

              {/* Search Results */}
              {products.length > 0 && (
                <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                        <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                        <p className="text-sm text-gray-500">
                          Stock: {product.stock_quantity} | Price: ₦{product.price.toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        disabled={product.stock_quantity === 0 || loading}
                        className="btn btn-primary btn-sm disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {loading && (
                <div className="mt-4 text-center">
                  <div className="spinner mx-auto"></div>
                </div>
              )}
            </div>
          </div>

          {/* Shopping Cart */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Shopping Cart
              </h3>
            </div>
            <div className="card-body">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Your cart is empty</p>
                  <p className="text-sm">Search and add products to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.product_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-500">₦{item.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          disabled={item.quantity >= item.stock_quantity}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product_id)}
                          className="p-1 text-red-400 hover:text-red-600 ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="font-medium">₦{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Cart Total and Checkout */}
              {cart.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-medium text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-gray-900">
                      ₦{getCartTotal().toFixed(2)}
                    </span>
                  </div>

                  {/* Payment Method Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPaymentMethod('cash')}
                        className={`flex-1 btn ${paymentMethod === 'cash' ? 'btn-primary' : 'btn-secondary'}`}
                      >
                        Cash
                      </button>
                      <button
                        onClick={() => setPaymentMethod('credit')}
                        className={`flex-1 btn ${paymentMethod === 'credit' ? 'btn-primary' : 'btn-secondary'}`}
                      >
                        Credit
                      </button>
                    </div>
                  </div>

                  {/* Customer Selection for Credit Sales */}
                  {paymentMethod === 'credit' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search customer..."
                          className="input w-full"
                          value={customerSearch}
                          onChange={handleCustomerSearchChange}
                        />
                        {selectedCustomer && (
                          <button
                            onClick={clearCustomer}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      {/* Customer Search Results */}
                      {customers.length > 0 && (
                        <div className="mt-2 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                          {customers.map((customer) => (
                            <button
                              key={customer.id}
                              onClick={() => selectCustomer(customer)}
                              className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-sm text-gray-500">
                                {customer.phone && `Phone: ${customer.phone}`}
                                {customer.phone && customer.email && ' • '}
                                {customer.email && `Email: ${customer.email}`}
                              </div>
                              <div className="text-xs text-gray-400">
                                Outstanding: ₦{customer.outstanding_balance?.toFixed(2) || '0.00'}
                                {customer.credit_limit > 0 && ` • Limit: ₦${customer.credit_limit.toFixed(2)}`}
                              </div>
                            </button>
                          ))}
                          <button
                            onClick={() => setShowCustomerModal(true)}
                            className="w-full p-3 text-left hover:bg-gray-50 text-blue-600 font-medium"
                          >
                            + Create New Customer
                          </button>
                        </div>
                      )}

                      {!customerSearch && (
                        <button
                          onClick={() => setShowCustomerModal(true)}
                          className="w-full mt-2 btn btn-outline"
                        >
                          + Create New Customer
                        </button>
                      )}

                      {/* Credit Due Date */}
                      {selectedCustomer && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Credit Due Date
                          </label>
                          <input
                            type="date"
                            className="input w-full"
                            value={creditDueDate}
                            onChange={(e) => setCreditDueDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={processSale}
                    disabled={loading || (paymentMethod === 'credit' && (!selectedCustomer || !creditDueDate))}
                    className="w-full btn btn-success btn-lg disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="spinner h-5 w-5 mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <CreditCard className="h-5 w-5 mr-2" />
                        {paymentMethod === 'credit' ? 'Complete Credit Sale' : 'Complete Sale'}
                      </div>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          {/* Today's Stats */}
          {todayStats && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Today's Performance</h3>
              </div>
              <div className="card-body space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Package className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm text-gray-600">Transactions</span>
                  </div>
                  <span className="font-medium">{todayStats.todayStats?.transaction_count || 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Recent Sales */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Recent Sales
              </h3>
            </div>
            <div className="card-body">
              {recentSales.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent sales</p>
              ) : (
                <div className="space-y-3">
                  {recentSales.slice(0, 5).map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{sale.transaction_id}</p>
                        <p className="text-gray-500">
                          {format(new Date(sale.created_at), 'HH:mm')} • {sale.item_count} items
                        </p>
                      </div>
                      <span className="font-medium">₦{sale.total_amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Credit Management Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Credit Management
              </h3>
            </div>
            <div className="card-body space-y-3">
              <a
                href="/dashboard/cashier/credit"
                className="block w-full text-center btn btn-primary btn-sm"
              >
                Manage Credits
              </a>
              {overdueCount > 0 && (
                <div className="text-center">
                  <p className="text-sm text-red-600">
                    {overdueCount} overdue credit(s) need attention
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeBarcodeScanner}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Barcode Scanner</h3>
                  <button
                    onClick={closeBarcodeScanner}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="text-center">
                    <Barcode className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-sm text-gray-600 mb-4">
                      Position the barcode in front of the camera to scan
                    </p>
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      onClick={closeBarcodeScanner}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Creation Modal */}
      {showCustomerModal && (
        <CustomerCreationModal
          onClose={() => setShowCustomerModal(false)}
          onCreate={createNewCustomer}
        />
      )}
    </div>
  );
};

export default CashierDashboard;
