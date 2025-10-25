import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertTriangle,
  Package,
  X,
  ScanBarcode,
  Camera,
  Save
} from 'lucide-react';

const InventoryManagement = () => {
  const { isManager, isAdmin } = useAuth();
  const scannerRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [stockAlerts, setStockAlerts] = useState({ lowStock: [], outOfStock: [] });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    barcode: '',
    price: '',
    cost: '',
    stock_quantity: '',
    min_stock_level: '10',
    category: '',
    categoryId: '',
    supplier: ''
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadStockAlerts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, categoryFilter, stockFilter, categories]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products?limit=100');
      const raw = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data?.products)
        ? response.data.products
        : Array.isArray(response.data)
        ? response.data
        : [];
  
      const normalized = raw.map((p) => ({
        id: p.id || p._id || p.product_id || p.id,
        name: p.name || p.product_name || '',
        description: p.description || '',
        sku: p.sku || p.code || '',
        barcode: p.barcode || p.bar_code || '',
        price: Number(p.price ?? p.unit_price ?? 0),
        cost: Number(p.cost ?? p.purchase_price ?? p.cost_price ?? 0),
        stock_quantity: Number(p.stock_quantity ?? p.quantity ?? p.stock ?? (p.stockQuantity ?? 0)),
        min_stock_level: Number(p.min_stock_level ?? p.minStock ?? (p.minStockLevel ?? 0)),
        category: (typeof p.category === 'object' ? p.category?.name : p.category) || '',
        categoryId: p.categoryId || p.category_id || '',
        supplier: (typeof p.supplier === 'object' ? p.supplier?.name : p.supplier) || '',
        supplierId: p.supplierId || p.supplier_id || ''
      }));
  
      setProducts(normalized);
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      const raw = response?.data;
      const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
      const normalized = list.map((c) => ({
        id: c.id || c._id || c.category_id || c.id,
        name: c.name || c.category_name || '',
        description: c.description || '',
      }));
      setCategories(normalized);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);
    }
  };

  const getCategoryName = (product) => {
    if (typeof product.category === 'string' && product.category.trim()) return product.category;
    if (product.categoryId) {
      const found = categories.find((c) => c.id === product.categoryId);
      if (found?.name) return found.name;
    }
    return '';
  };

  const createCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      await api.post('/categories', {
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim()
      });
      toast.success('Category created successfully');
      setShowCategoryModal(false);
      setNewCategoryName('');
      setNewCategoryDescription('');
      // Reload categories
      await loadCategories();
      // Update category names on products if needed
      setProducts((prev) => prev.map((p) => ({
        ...p,
        category: getCategoryName(p)
      })));
    } catch (error) {
      console.error('Failed to create category:', error);
      toast.error(error.response?.data?.error || 'Failed to create category');
    }
  };

  const deleteCategory = async (id) => {
    if (!id) return;
    const category = categories.find((c) => c.id === id);
    if (!window.confirm(`Delete category '${category?.name || id}'?`)) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Category deleted');
      await loadCategories();
      // Clear category name from products using this id
      setProducts((prev) => prev.map((p) => (p.categoryId === id ? { ...p, category: '' } : p)));
    } catch (error) {
      const msg = Array.isArray(error.response?.data?.message)
        ? error.response.data.message.join('; ')
        : (error.response?.data?.error || error.message || 'Failed to delete category');
      if (error.response?.status === 403) {
        toast.error('Only admin can delete categories');
      } else {
        toast.error(msg);
      }
    }
  };

  const startBarcodeScan = async () => {
    try {
      setIsScanning(true);
      
      // Dynamically import QuaggaJS only when needed
      const Quagga = await import('quagga');
      
      // Initialize QuaggaJS scanner
      Quagga.default.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            width: 640,
            height: 480,
            facingMode: "environment" // Use back camera
          },
        },
        decoder: {
          readers: [
            "code_128_reader",
            "ean_reader",
            "ean_8_reader",
            "code_39_reader",
            "code_39_vin_reader",
            "codabar_reader",
            "upc_reader",
            "upc_e_reader",
            "i2of5_reader"
          ]
        },
        locate: true,
        locator: {
          patchSize: "medium",
          halfSample: true
        }
      }, (err) => {
        if (err) {
          console.error('Quagga initialization error:', err);
          toast.error('Failed to initialize camera scanner');
          setIsScanning(false);
          return;
        }
        console.log("Quagga initialization finished. Ready to start");
        Quagga.default.start();
      });

      // Listen for successful barcode detection
      Quagga.default.onDetected((data) => {
        const code = data.codeResult.code;
        console.log('Barcode detected:', code);
        
        // Stop scanning
        Quagga.default.stop();
        setIsScanning(false);
        
        // Look up product by barcode
        lookupProductByBarcode(code);
      });

    } catch (error) {
      console.error('Failed to start barcode scanner:', error);
      toast.error('Failed to access camera. Please check permissions.');
      setIsScanning(false);
    }
  };

  const stopBarcodeScan = async () => {
    try {
      const Quagga = await import('quagga');
      if (Quagga.default) {
        Quagga.default.stop();
      }
    } catch (error) {
      console.error('Error stopping scanner:', error);
    }
    setIsScanning(false);
  };

  const lookupProductByBarcode = async (barcode) => {
    try {
      // Try to find existing product with this barcode via API
      const response = await api.get(`/products/barcode/${barcode}`);
      const existingProduct = response.data.product;
      
      if (existingProduct) {
        // Product exists, populate form with existing data
        setFormData({
          name: existingProduct.name,
          description: existingProduct.description || '',
          sku: existingProduct.sku,
          barcode: existingProduct.barcode,
          price: existingProduct.price,
          cost: existingProduct.cost || '',
          stock_quantity: existingProduct.stock_quantity,
          min_stock_level: existingProduct.min_stock_level,
          category: existingProduct.category || '',
          supplier: existingProduct.supplier || ''
        });
        setSelectedProduct(existingProduct);
        setShowEditModal(true);
        toast.success(`Found existing product: ${existingProduct.name}`);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        // Product doesn't exist, just fill the barcode field
        setFormData(prev => ({ ...prev, barcode: barcode }));
        toast.success(`Barcode scanned: ${barcode}. Please fill in product details.`);
      } else {
        console.error('Error looking up product:', error);
        toast.error('Error processing scanned barcode');
      }
    }
  };

  const loadStockAlerts = async () => {
    try {
      const response = await api.get('/products/alerts/low-stock');
      setStockAlerts(response.data);
    } catch (error) {
      console.error('Failed to load stock alerts:', error);
    }
  };

  const filterProducts = () => {
    const source = Array.isArray(products) ? products : [];
    let filtered = [...source];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(product => getCategoryName(product) === categoryFilter);
    }

    // Stock filter
    if (stockFilter === 'low') {
      filtered = filtered.filter(product => 
        product.stock_quantity <= product.min_stock_level && product.stock_quantity > 0
      );
    } else if (stockFilter === 'out') {
      filtered = filtered.filter(product => product.stock_quantity === 0);
    } else if (stockFilter === 'in-stock') {
      filtered = filtered.filter(product => product.stock_quantity > product.min_stock_level);
    }

    setFilteredProducts(filtered);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const payload = {
        name: (formData.name || '').trim(),
        sku: (formData.sku || '').trim(),
        price: Number(formData.price),
        stockQuantity: Number(formData.stock_quantity),
      };
      if (formData.barcode && formData.barcode.trim()) payload.barcode = formData.barcode.trim();
      if (formData.description && formData.description.trim()) payload.description = formData.description.trim();
      if (formData.min_stock_level !== '' && formData.min_stock_level !== null && formData.min_stock_level !== undefined) {
        payload.minStockLevel = Number(formData.min_stock_level);
      }
      if (formData.categoryId) payload.categoryId = formData.categoryId;

      if (!payload.name || !payload.sku) {
        toast.error('Name and SKU are required');
        setLoading(false);
        return;
      }
      if (Number.isNaN(payload.price) || payload.price <= 0) {
        toast.error('Price must be a positive number');
        setLoading(false);
        return;
      }
      if (Number.isNaN(payload.stockQuantity) || payload.stockQuantity < 0) {
        toast.error('Stock quantity must be a non-negative number');
        setLoading(false);
        return;
      }
      if (payload.minStockLevel !== undefined && (Number.isNaN(payload.minStockLevel) || payload.minStockLevel < 0)) {
        toast.error('Min stock level must be a non-negative number');
        setLoading(false);
        return;
      }
      if (selectedProduct) {
        // Update product (Nest uses PATCH)
        await api.patch(`/products/${selectedProduct.id}`, payload);
        toast.success('Product updated successfully');
      } else {
        // Create product
        await api.post('/products', payload);
        toast.success('Product created successfully');
      }

      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedProduct(null);
      resetForm();
      loadProducts();
      loadStockAlerts();
    } catch (error) {
      console.error('Failed to save product:', error);
      const msg = Array.isArray(error.response?.data?.message)
        ? error.response.data.message.join('; ')
        : (error.response?.data?.error || error.message || 'Failed to save product');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      sku: product.sku,
      barcode: product.barcode || '',
      price: product.price,
      cost: product.cost || '',
      stock_quantity: product.stock_quantity,
      min_stock_level: product.min_stock_level,
      category: product.category || '',
      categoryId: product.categoryId || '',
      supplier: product.supplier || ''
    });
    setShowEditModal(true);
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/products/${product.id}`);
      toast.success('Product deleted successfully');
      loadProducts();
      loadStockAlerts();
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error('Failed to delete product');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sku: '',
      barcode: '',
      price: '',
      cost: '',
      stock_quantity: '',
      min_stock_level: '10',
      category: '',
      categoryId: '',
      supplier: ''
    });
  };

  const getStockStatus = (product) => {
    if (product.stock_quantity === 0) return { status: 'out', color: 'text-red-600', bg: 'bg-red-100' };
    if (product.stock_quantity <= product.min_stock_level) return { status: 'low', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { status: 'good', color: 'text-green-600', bg: 'bg-green-100' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your product inventory and stock levels
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </button>
      </div>

      {/* Stock Alerts */}
      {(stockAlerts.lowStock.length > 0 || stockAlerts.outOfStock.length > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="text-sm font-medium text-yellow-800">Stock Alerts</h3>
          </div>
          <div className="mt-2 text-sm text-yellow-700">
            {stockAlerts.outOfStock.length > 0 && (
              <p>{stockAlerts.outOfStock.length} products are out of stock</p>
            )}
            {stockAlerts.lowStock.length > 0 && (
              <p>{stockAlerts.lowStock.length} products are running low</p>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                className="input pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <select
              className="input"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.name}>{category.name}</option>
              ))}
            </select>

            {/* Stock Filter */}
            <select
              className="input"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
            >
              <option value="all">All Stock Levels</option>
              <option value="in-stock">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">
            Products ({filteredProducts.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Product</th>
                <th className="table-header-cell">SKU</th>
                <th className="table-header-cell">Category</th>
                <th className="table-header-cell">Price</th>
                <th className="table-header-cell">Stock</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product);
                return (
                  <tr key={product.id} className="table-row">
                    <td className="table-cell">
                      <div>
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.description}</div>
                      </div>
                    </td>
                    <td className="table-cell">{product.sku}</td>
                    <td className="table-cell">{getCategoryName(product) || 'Uncategorized'}</td>
                    <td className="table-cell">${product.price.toFixed(2)}</td>
                    <td className="table-cell">
                      <div>
                        <div className="font-medium">{product.stock_quantity}</div>
                        <div className="text-sm text-gray-500">
                          Min: {product.min_stock_level}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${stockStatus.bg} ${stockStatus.color}`}>
                        {stockStatus.status === 'out' ? 'Out of Stock' :
                         stockStatus.status === 'low' ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No products found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {selectedProduct ? 'Edit Product' : 'Add New Product'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="label">Product Name *</label>
                      <input
                        type="text"
                        name="name"
                        required
                        className="input"
                        value={formData.name}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <label className="label">Description</label>
                      <textarea
                        name="description"
                        rows="3"
                        className="input"
                        value={formData.description}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">SKU *</label>
                        <input
                          type="text"
                          name="sku"
                          required
                          className="input"
                          value={formData.sku}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <label className="label">Barcode</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            name="barcode"
                            className="input flex-1"
                            value={formData.barcode}
                            onChange={handleInputChange}
                            placeholder="Enter barcode or scan"
                          />
                          <button
                            type="button"
                            onClick={isScanning ? stopBarcodeScan : startBarcodeScan}
                            className={`btn px-3 ${isScanning ? 'btn-error' : 'btn-outline'}`}
                            title={isScanning ? 'Stop Scanning' : 'Scan Barcode'}
                          >
                            {isScanning ? <X className="h-4 w-4" /> : <ScanBarcode className="h-4 w-4" />}
                          </button>
                        </div>
                        {isScanning && (
                          <div className="mt-3">
                            {/* Professional Scanner Container */}
                            <div className="relative bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                              {/* Scanner Header */}
                              <div className="bg-gray-100 px-3 py-2 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-xs font-medium text-gray-700">Scanning Active</span>
                                  </div>
                                  <button
                                    onClick={stopBarcodeScan}
                                    className="text-gray-500 hover:text-gray-700 transition-colors"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                              
                              {/* Camera Feed */}
                              <div 
                                ref={scannerRef} 
                                className="w-full h-48 bg-gray-900 relative"
                              >
                                {/* Camera Placeholder */}
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                                  <div className="text-center text-white">
                                    <Camera className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                    <p className="text-xs text-gray-300">Camera Loading...</p>
                                  </div>
                                </div>
                                
                                {/* Professional Scanning Overlay */}
                                <div className="absolute inset-0 pointer-events-none">
                                  {/* Scanning Frame */}
                                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-24 border-2 border-blue-500 rounded">
                                    {/* Corner Indicators */}
                                    <div className="absolute -top-1 -left-1 w-4 h-4 border-l-2 border-t-2 border-blue-500 rounded-tl"></div>
                                    <div className="absolute -top-1 -right-1 w-4 h-4 border-r-2 border-t-2 border-blue-500 rounded-tr"></div>
                                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-l-2 border-b-2 border-blue-500 rounded-bl"></div>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-r-2 border-b-2 border-blue-500 rounded-br"></div>
                                  </div>
                                  
                                  {/* Scanning Line */}
                                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-500 animate-pulse"></div>
                                  
                                  {/* Status Badge */}
                                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                                    <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
                                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                      <span>Scanning</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Scanner Footer */}
                              <div className="bg-gray-100 px-3 py-2 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-600">Position barcode within frame</span>
                                  <span className="text-xs text-gray-500">Code 128, EAN, UPC</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Price *</label>
                        <input
                          type="number"
                          step="0.01"
                          name="price"
                          required
                          className="input"
                          value={formData.price}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <label className="label">Cost</label>
                        <input
                          type="number"
                          step="0.01"
                          name="cost"
                          className="input"
                          value={formData.cost}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Stock Quantity</label>
                        <input
                          type="number"
                          name="stock_quantity"
                          className="input"
                          value={formData.stock_quantity}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <label className="label">Min Stock Level</label>
                        <input
                          type="number"
                          name="min_stock_level"
                          className="input"
                          value={formData.min_stock_level}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Category</label>
                        <div className="flex gap-2">
                          <select
                            name="categoryId"
                            className="input flex-1"
                            value={formData.categoryId}
                            onChange={handleInputChange}
                          >
                            <option value="">Select Category</option>
                            {categories.map(category => (
                              <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => setShowCategoryModal(true)}
                            className="btn btn-outline px-3"
                            title="Add New Category"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="label">Supplier</label>
                        <input
                          type="text"
                          name="supplier"
                          className="input"
                          value={formData.supplier}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary sm:ml-3 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : (selectedProduct ? 'Update Product' : 'Create Product')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setSelectedProduct(null);
                      resetForm();
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Add New Category
                  </h3>
                  <button
                    onClick={() => {
                      setShowCategoryModal(false);
                      setNewCategoryName('');
                      setNewCategoryDescription('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="label">Category Name *</label>
                    <input
                      type="text"
                      className="input"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Enter category name"
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label className="label">Description</label>
                    <textarea
                      className="input"
                      rows="3"
                      value={newCategoryDescription}
                      onChange={(e) => setNewCategoryDescription(e.target.value)}
                      placeholder="Enter category description (optional)"
                    />
                  </div>

                  {/* Existing Categories */}
                  <div>
                    <label className="label">Existing Categories</label>
                    <div className="max-h-40 overflow-y-auto border rounded">
                      {categories.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500">No categories</div>
                      ) : (
                        categories.map((c) => (
                          <div key={c.id} className="flex items-center justify-between p-2 border-b last:border-b-0">
                            <div>
                              <div className="text-sm font-medium">{c.name}</div>
                              {c.description && (
                                <div className="text-xs text-gray-500">{c.description}</div>
                              )}
                            </div>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => deleteCategory(c.id)}
                            >
                              Delete
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={createCategory}
                  className="btn btn-primary sm:ml-3"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Create Category
                </button>
                <button
                  onClick={() => {
                    setShowCategoryModal(false);
                    setNewCategoryName('');
                    setNewCategoryDescription('');
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
