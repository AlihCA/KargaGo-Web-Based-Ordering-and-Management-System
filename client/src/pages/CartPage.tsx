import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useUser } from "@clerk/clerk-react";

export function CartPage() {
  const { cart, removeFromCart, updateQuantity, totalPrice } = useCart();
  const { isSignedIn } = useUser();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!isSignedIn) {
      alert("Please sign in to complete your order");
      return;
    }
    navigate("/checkout");
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center py-20">
            <ShoppingBag className="w-24 h-24 mx-auto text-stone-300 mb-6" />
            <h2 className="text-3xl font-bold text-stone-900 mb-4">
              Your Cart is Empty
            </h2>
            <p className="text-stone-600 mb-8">
              Looks like you haven't added any items to your cart yet
            </p>
            <Link
              to="/menu"
              className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 hover:shadow-lg"
            >
              Browse Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-stone-900 mb-8">
          Shopping Cart
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => {
              const maxReached = item.quantity >= Number(item.stock);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-md p-6 flex flex-col sm:flex-row gap-6 hover:shadow-lg transition-shadow"
                >
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full sm:w-32 h-32 object-cover rounded-lg flex-shrink-0"
                  />

                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-xl font-bold text-stone-900">
                          {item.name}
                        </h3>
                        <p className="text-sm text-stone-600 capitalize">
                          {item.category}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-4 h-4" />
                        </button>

                        <span className="font-semibold text-lg min-w-[2rem] text-center">
                          {item.quantity}
                        </span>

                        <div className="flex flex-col">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            disabled={maxReached}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              maxReached
                                ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                                : "bg-stone-100 hover:bg-stone-200"
                            }`}
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-4 h-4" />
                          </button>

                          {maxReached && (
                            <p className="text-xs text-red-600 mt-2">
                              Max stock reached ({item.stock}).
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-stone-600">
                          ₱{Number(item.price).toFixed(2)} each
                        </p>
                        <p className="text-xl font-bold text-stone-900">
                          ₱{(Number(item.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-2xl font-bold text-stone-900 mb-6">
                Order Summary
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span>₱{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Tax (8%)</span>
                  <span>₱{(totalPrice * 0.08).toFixed(2)}</span>
                </div>
                <div className="border-t border-stone-200 pt-3 mt-3">
                  <div className="flex justify-between text-xl font-bold text-stone-900">
                    <span>Total</span>
                    <span>₱{(totalPrice * 1.08).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-lg transition-all duration-200 hover:shadow-lg active:scale-95"
              >
                Proceed to Checkout
              </button>

              <Link
                to="/menu"
                className="block text-center text-stone-600 hover:text-stone-900 mt-4 font-medium transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
