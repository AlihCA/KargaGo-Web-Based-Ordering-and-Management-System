import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useUser } from "@clerk/clerk-react";
import { CreditCard, CheckCircle } from "lucide-react";
import { buildApiUrl } from "../utils/api";


export function CheckoutPage() {
  const { cart, totalPrice, clearCart } = useCart();
  const { user } = useUser();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [address, setAddress] = useState("");
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert("Please sign in to complete your order");
      return;
    }

    if (!address) {
      alert("Please enter your address");
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch(buildApiUrl("/orders"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: {
            id: user.id,
            email: user.emailAddresses[0]?.emailAddress,
            address,
          },
          items: cart,
          totalPrice,
          paymentMethod: "paypal",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Order failed");
      }

      setOrderComplete(true);
      clearCart();

      setTimeout(() => navigate("/"), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to place order");
    } finally {
      setProcessing(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-stone-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-12 text-center">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-stone-900 mb-4">
              Order Confirmed!
            </h2>
            <p className="text-stone-600 mb-6">
              Thank you for your order. We're preparing your items now!
            </p>
            <p className="text-sm text-stone-500">
              Redirecting to home page...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const taxAmount = totalPrice * 0.08;
  const totalWithTax = totalPrice + taxAmount;

  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-stone-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form
              onSubmit={handleSubmitOrder}
              className="bg-white rounded-lg shadow-md p-6 space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-stone-900 mb-4">
                  Contact Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user?.emailAddresses[0]?.emailAddress || ""}
                      readOnly
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg bg-stone-50"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Delivery Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  rows={3}
                  placeholder="Enter your complete address"
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-stone-900 mb-4">
                  Payment Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        required
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                      <CreditCard className="absolute right-3 top-2.5 w-5 h-5 text-stone-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        required
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        CVV
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        required
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      required
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-lg transition-all duration-200 hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing
                  ? "Processing..."
                  : `Pay $${totalWithTax.toFixed(2)}`}
              </button>
            </form>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-2xl font-bold text-stone-900 mb-6">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-stone-600">
                      {item.name} x {item.quantity}
                    </span>
                    <span className="font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-stone-200 pt-4 space-y-3">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Tax (8%)</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-stone-200 pt-3">
                  <div className="flex justify-between text-xl font-bold text-stone-900">
                    <span>Total</span>
                    <span>${totalWithTax.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
