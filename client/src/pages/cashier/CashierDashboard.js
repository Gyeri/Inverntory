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
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

const CashierDashboard = () => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [todayStats, setTodayStats] = useState(null);
  const [recentSales, setRecentSales] = useState([]);

  useEffect(() => {
    loadTodayStats();
    loadRecentSales();
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

    try {
      setLoading(true);
      const items = cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      }));

      const response = await api.post('/sales', {
        items,
        payment_method: 'cash'
      });

      toast.success('Sale completed successfully!');
      setCart([]);
      setSearchQuery('');
      setProducts([]);
      loadTodayStats();
      loadRecentSales();
      
    } catch (error) {
      console.error('Sale failed:', error);
      toast.error(error.response?.data?.error || 'Failed to process sale');
    } finally {
      setLoading(false);
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Sales Interface */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Search */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Product Search</h3>
            </div>
            <div className="card-body">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products by name, SKU, or barcode..."
                  className="input pl-10"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
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
                          Stock: {product.stock_quantity} | Price: ${product.price.toFixed(2)}
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
                        <p className="text-sm text-gray-500">${item.price.toFixed(2)} each</p>
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
                        <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
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
                      ${getCartTotal().toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={processSale}
                    disabled={loading}
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
                        Complete Sale
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
                      <span className="font-medium">${sale.total_amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashierDashboard;
