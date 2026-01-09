import { useUser, useAuth } from "@clerk/clerk-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildApiUrl, parseApiError, readJson } from "../utils/api";

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  image_url: string;
  stock: number;
  in_stock?: boolean;
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

const STATUS_OPTIONS = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "completed",
  "cancelled",
] as const;

const normalizeNumber = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const toMoney = (v: any) => normalizeNumber(v, 0);

const AdminDashboard = () => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"products" | "orders" | "reports">(
    "products"
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  // Product form state
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    category: "",
    price: 0,
    description: "",
    image_url: "",
    stock: 0,
  });

  const isAdmin = useMemo(() => {
    return user?.publicMetadata?.role === "admin";
  }, [user]);

  const getAuthToken = async (): Promise<string> => {
    const token = await getToken();
    if (!token) throw new Error("Please sign in again.");
    return token;
  };

  const fetchWithAuth = async (path: string, options: RequestInit = {}) => {
    const token = await getAuthToken();
    const response = await fetch(buildApiUrl(path), {
      ...options,
      headers: {
        ...(options.headers ?? {}),
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) throw new Error("Session expired. Please sign in again.");
    if (response.status === 403) throw new Error("Admin access required.");

    if (!response.ok) {
      const message = await parseApiError(response, "Request failed.");
      throw new Error(message);
    }

    return response;
  };

  useEffect(() => {
    if (!isLoaded) return;

    if (!isAdmin) {
      navigate("/");
      return;
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isAdmin]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      await Promise.all([fetchProducts(), fetchOrders(), fetchStats()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    const response = await fetchWithAuth("/products");
    const data = await readJson<any>(response);

    const list = Array.isArray(data) ? data : data?.products;
    const normalized: Product[] = (Array.isArray(list) ? list : []).map((p: any) => ({
      id: normalizeNumber(p.id),
      name: String(p.name ?? ""),
      category: String(p.category ?? ""),
      description: String(p.description ?? ""),
      image_url: String(p.image_url ?? ""),
      price: toMoney(p.price),
      stock: normalizeNumber(p.stock),
      in_stock: Boolean(p.in_stock) && normalizeNumber(p.stock) > 0,
    }));

    setProducts(normalized);
  };

  const fetchOrders = async () => {
    const response = await fetchWithAuth("/api/admin/orders");
    const data = await readJson<any>(response);

    const list = Array.isArray(data) ? data : data?.orders;
    const normalized: Order[] = (Array.isArray(list) ? list : []).map((o: any) => ({
      id: normalizeNumber(o.id),
      user_email: String(o.user_email ?? ""),
      total_amount: toMoney(o.total_amount),
      status: String(o.status ?? "pending"),
      payment_method: String(o.payment_method ?? "cod"),
      address: String(o.address ?? ""),
      created_at: String(o.created_at ?? new Date().toISOString()),
      item_count: normalizeNumber(o.item_count),
    }));

    setOrders(normalized);
  };

  const fetchStats = async () => {
    const response = await fetchWithAuth("/api/admin/stats");
    const data = await readJson<any>(response);

    setStats({
      totalProducts: normalizeNumber(data?.totalProducts),
      totalOrders: normalizeNumber(data?.totalOrders),
      totalRevenue: toMoney(data?.totalRevenue),
      pendingOrders: normalizeNumber(data?.pendingOrders),
    });
  };

  // Product CRUD
  const resetProductForm = () => {
    setProductForm({
      name: "",
      category: "",
      price: 0,
      description: "",
      image_url: "",
      stock: 0,
    });
    setEditingProduct(null);
    setShowProductForm(false);
  };

  const startEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      price: product.price,
      description: product.description,
      image_url: product.image_url,
      stock: product.stock,
    });
    setShowProductForm(true);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...productForm,
          price: toMoney(productForm.price),
          stock: normalizeNumber(productForm.stock),
        }),
      });

      await fetchProducts();
      await fetchStats();
      resetProductForm();
      alert("Product created successfully!");
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      await fetchWithAuth(`/api/admin/products/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...productForm,
          price: toMoney(productForm.price),
          stock: normalizeNumber(productForm.stock),
        }),
      });

      await fetchProducts();
      await fetchStats();
      resetProductForm();
      alert("Product updated successfully!");
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await fetchWithAuth(`/api/admin/products/${productId}`, { method: "DELETE" });
      await fetchProducts();
      await fetchStats();
      alert("Product deleted successfully!");
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  // Order status updates
  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      setUpdatingOrderId(orderId);

      await fetchWithAuth(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      // Optimistic UI update
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      // Refresh stats because completed orders may affect revenue counters depending on your backend
      await fetchStats();

      alert("Order status updated!");
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (!isLoaded || loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Error: {error}</div>;
  }

  const avgOrderValue =
    stats && stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0;

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
            <p className="text-3xl font-bold text-purple-600">
              ₱{toMoney(stats.totalRevenue).toFixed(2)}
            </p>
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
          {["products", "orders", "reports"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-2 px-4 font-medium capitalize ${
                activeTab === tab
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Products Tab */}
      {activeTab === "products" && (
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
                  {editingProduct ? "Edit Product" : "Add New Product"}
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
                      onChange={(e) =>
                        setProductForm({ ...productForm, category: e.target.value })
                      }
                      className="w-full p-2 border rounded"
                      required
                    />

                    <input
                      type="number"
                      placeholder="Price"
                      value={productForm.price}
                      onChange={(e) =>
                        setProductForm({ ...productForm, price: parseFloat(e.target.value || "0") })
                      }
                      className="w-full p-2 border rounded"
                      step="0.01"
                      required
                    />

                    <input
                      type="number"
                      placeholder="Stock"
                      value={productForm.stock}
                      onChange={(e) =>
                        setProductForm({ ...productForm, stock: parseInt(e.target.value || "0") })
                      }
                      className="w-full p-2 border rounded"
                      required
                    />

                    <textarea
                      placeholder="Description"
                      value={productForm.description}
                      onChange={(e) =>
                        setProductForm({ ...productForm, description: e.target.value })
                      }
                      className="w-full p-2 border rounded"
                      rows={3}
                      required
                    />

                    <input
                      type="url"
                      placeholder="Image URL"
                      value={productForm.image_url}
                      onChange={(e) =>
                        setProductForm({ ...productForm, image_url: e.target.value })
                      }
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>

                  <div className="flex gap-2 mt-6">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                    >
                      {editingProduct ? "Update" : "Create"}
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
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    </td>
                    <td className="p-3">{product.name}</td>
                    <td className="p-3">{product.category}</td>
                    <td className="p-3">₱{toMoney(product.price).toFixed(2)}</td>
                    <td className="p-3">{normalizeNumber(product.stock)}</td>
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
      {activeTab === "orders" && (
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
                    <td className="p-3">₱{toMoney(order.total_amount).toFixed(2)}</td>

                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-sm ${
                          order.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : order.status === "processing"
                            ? "bg-blue-100 text-blue-800"
                            : order.status === "shipped"
                            ? "bg-purple-100 text-purple-800"
                            : order.status === "delivered"
                            ? "bg-green-100 text-green-800"
                            : order.status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td className="p-3">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>

                    <td className="p-3">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        className="p-2 border rounded"
                        disabled={updatingOrderId === order.id}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s[0].toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>

                      {updatingOrderId === order.id && (
                        <p className="text-xs text-gray-500 mt-1">Updating...</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === "reports" && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Sales Reports</h2>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Total Revenue:</span>
                <span className="text-green-600 font-bold">
                  ₱{toMoney(stats?.totalRevenue).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Total Orders:</span>
                <span className="font-bold">{stats?.totalOrders ?? 0}</span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Average Order Value:</span>
                <span className="font-bold">₱{toMoney(avgOrderValue).toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium">Pending Orders:</span>
                <span className="text-orange-600 font-bold">
                  {stats?.pendingOrders ?? 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
