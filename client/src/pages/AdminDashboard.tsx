import { useUser, useAuth } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  image_url: string;
  stock: number;
}

interface Order {
  id: number;
  user_email: string;
  total_amount: number;
  status: string;
  payment_method: string;
  address: string;
  created_at: string;
  item_count: number;
}

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

const AdminDashboard = () => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  const getAuthToken = async (): Promise<string> => {
  const token = await getToken();
  if (!token) throw new Error('No auth token');
  return token;};

  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'reports'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Product form state
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    price: 0,
    description: '',
    image_url: '',
    stock: 0
  });

  useEffect(() => {
    if (isLoaded && user?.publicMetadata?.role !== 'admin') {
      navigate('/');
      return;
    }
    if (isLoaded && user?.publicMetadata?.role === 'admin') {
      fetchData();
    }
  }, [isLoaded, user, navigate]);

  
  const fetchData = async () => {
    try {
      const token = await getAuthToken();
      await Promise.all([fetchProducts(token), fetchOrders(token), fetchStats(token)]);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setLoading(false);
    }
  };

  const fetchProducts = async (token: string | undefined) => {
    const response = await fetch('http://localhost:5000/products', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch products');
    const data = await response.json();
    setProducts(data);
  };

  const fetchOrders = async (token: string | undefined) => {
    const response = await fetch('http://localhost:5000/api/admin/orders', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch orders');
    const data = await response.json();
    setOrders(data);
  };

  const fetchStats = async (token: string | undefined) => {
    const response = await fetch('http://localhost:5000/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch stats');
    const data = await response.json();
    setStats(data);
  };

  // Product CRUD operations
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getAuthToken();
      const response = await fetch('http://localhost:5000/api/admin/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productForm)
      });
      if (!response.ok) throw new Error('Failed to create product');
      await fetchProducts(token);
      resetProductForm();
      alert('Product created successfully!');
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const token = await getAuthToken();
      const response = await fetch(`http://localhost:5000/api/admin/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productForm)
      });
      if (!response.ok) throw new Error('Failed to update product');
      await fetchProducts(token);
      resetProductForm();
      alert('Product updated successfully!');
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const token = await getAuthToken();
      const response = await fetch(`http://localhost:5000/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete product');
      await fetchProducts(token);
      alert('Product deleted successfully!');
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const startEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      price: product.price,
      description: product.description,
      image_url: product.image_url,
      stock: product.stock
    });
    setShowProductForm(true);
  };

  const resetProductForm = () => {
    setProductForm({ name: '', category: '', price: 0, description: '', image_url: '', stock: 0 });
    setEditingProduct(null);
    setShowProductForm(false);
  };

  // Order operations
  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`http://localhost:5000/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) throw new Error('Failed to update order status');
      await fetchOrders(token);
      alert('Order status updated!');
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (!isLoaded || loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.firstName}!</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-100 p-6 rounded-lg shadow">
            <h3 className="text-sm font-semibold text-gray-600">Total Products</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalProducts}</p>
          </div>
          <div className="bg-green-100 p-6 rounded-lg shadow">
            <h3 className="text-sm font-semibold text-gray-600">Total Orders</h3>
            <p className="text-3xl font-bold text-green-600">{stats.totalOrders}</p>
          </div>
          <div className="bg-purple-100 p-6 rounded-lg shadow">
            <h3 className="text-sm font-semibold text-gray-600">Total Revenue</h3>
            <p className="text-3xl font-bold text-purple-600">₱{stats.totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-orange-100 p-6 rounded-lg shadow">
            <h3 className="text-sm font-semibold text-gray-600">Pending Orders</h3>
            <p className="text-3xl font-bold text-orange-600">{stats.pendingOrders}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          {['products', 'orders', 'reports'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-2 px-4 font-medium capitalize ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Manage Products</h2>
            <button
              onClick={() => setShowProductForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              + Add Product
            </button>
          </div>

          {/* Product Form Modal */}
          {showProductForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
                <h3 className="text-xl font-bold mb-4">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Product Name"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      className="w-full p-2 border rounded"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Category"
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full p-2 border rounded"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) })}
                      className="w-full p-2 border rounded"
                      step="0.01"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Stock"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: parseInt(e.target.value) })}
                      className="w-full p-2 border rounded"
                      required
                    />
                    <textarea
                      placeholder="Description"
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      className="w-full p-2 border rounded"
                      rows={3}
                      required
                    />
                    <input
                      type="url"
                      placeholder="Image URL"
                      value={productForm.image_url}
                      onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div className="flex gap-2 mt-6">
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                      {editingProduct ? 'Update' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={resetProductForm}
                      className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Products Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white shadow rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Image</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Category</th>
                  <th className="p-3 text-left">Price</th>
                  <th className="p-3 text-left">Stock</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-t">
                    <td className="p-3">
                      <img src={product.image_url} alt={product.name} className="w-16 h-16 object-cover rounded" />
                    </td>
                    <td className="p-3">{product.name}</td>
                    <td className="p-3">{product.category}</td>
                    <td className="p-3">₱{product.price.toFixed(2)}</td>
                    <td className="p-3">{product.stock}</td>
                    <td className="p-3">
                      <button
                        onClick={() => startEditProduct(product)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded mr-2 hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Manage Orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white shadow rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Order ID</th>
                  <th className="p-3 text-left">Customer</th>
                  <th className="p-3 text-left">Amount</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t">
                    <td className="p-3">#{order.id}</td>
                    <td className="p-3">{order.user_email}</td>
                    <td className="p-3">₱{order.total_amount.toFixed(2)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-sm ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-3">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="p-3">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        className="p-2 border rounded"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Sales Reports</h2>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Total Revenue:</span>
                <span className="text-green-600 font-bold">₱{stats?.totalRevenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Total Orders:</span>
                <span className="font-bold">{stats?.totalOrders}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Average Order Value:</span>
                <span className="font-bold">
                  ₱{stats ? (stats.totalRevenue / stats.totalOrders).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Pending Orders:</span>
                <span className="text-orange-600 font-bold">{stats?.pendingOrders}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;