import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { buildApiUrl } from "../utils/api";
import { Link } from "react-router-dom";

interface OrderItem {
  product_id: number;
  name: string;
  quantity: number;
  price: number;
  image_url: string;
}

interface Order {
  id: number;
  total_amount: number;
  status: string;
  payment_method: string;
  address: string;
  created_at: string;
  items: OrderItem[];
}

function normalizeOrders(data: any): Order[] {
  const list = Array.isArray(data) ? data : data?.orders;
  if (!Array.isArray(list)) return [];

  return list.map((o: any) => {
    const itemsRaw = Array.isArray(o?.items) ? o.items : [];

    const items: OrderItem[] = itemsRaw.map((it: any) => ({
      product_id: Number(it.product_id),
      name: String(it.name ?? ""),
      quantity: Number(it.quantity) || 0,
      price: Number(it.price) || 0,
      image_url: String(it.image_url ?? ""),
    }));

    return {
      id: Number(o.id),
      total_amount: Number(o.total_amount) || 0,
      status: String(o.status ?? "pending"),
      payment_method: String(o.payment_method ?? "cod"),
      address: String(o.address ?? ""),
      created_at: String(o.created_at ?? new Date().toISOString()),
      items,
    };
  });
}

export function OrdersPage() {
  const { getToken, isSignedIn } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) {
      setLoading(false);
      setOrders([]);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const token = await getToken();
        if (!token) throw new Error("Session expired. Please sign in again.");

        const res = await fetch(buildApiUrl("/api/orders/me"), {
          headers: { Authorization: `Bearer ${token}` },
        });

        const text = await res.text();
        const data = text ? JSON.parse(text) : null;

        if (!res.ok) {
          const message =
            data?.error || data?.message || "Failed to fetch orders";
          throw new Error(message);
        }

        const normalized = normalizeOrders(data);

        if (!cancelled) {
          setOrders(normalized);
        }
      } catch (err) {
        console.error("Failed to fetch orders", err);
        if (!cancelled) {
          setOrders([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [getToken, isSignedIn]);

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-stone-50 py-12 text-center">
        <p className="text-lg">Please sign in to view your orders.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-stone-900 mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-stone-600 mb-4">You haven’t placed any orders yet.</p>
            <Link
              to="/menu"
              className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-6 rounded-lg"
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="font-semibold text-stone-900">Order #{order.id}</p>
                    <p className="text-sm text-stone-500">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>

                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 text-amber-700">
                    {order.status}
                  </span>
                </div>

                <div className="divide-y">
                  {order.items.map((item) => (
                    <div key={item.product_id} className="flex items-center gap-4 py-4">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-16 h-16 rounded object-cover"
                      />
                      <div className="flex-grow">
                        <p className="font-medium text-stone-900">{item.name}</p>
                        <p className="text-sm text-stone-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">
                        ₱{(Number(item.price) * Number(item.quantity)).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <p className="text-stone-600">
                    Payment: {String(order.payment_method).toUpperCase()}
                  </p>
                  <p className="text-xl font-bold text-stone-900">
                    ₱{Number(order.total_amount).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
