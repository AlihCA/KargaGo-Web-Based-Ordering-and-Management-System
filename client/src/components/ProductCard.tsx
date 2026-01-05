import { ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useCart } from "../contexts/CartContext";
import { useAdminMode } from "../contexts/AdminModeContext";
import type { Products } from "../pages/MenuPage";

interface ProductCardProps {
  product: Products;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { user } = useUser();
  const { adminMode } = useAdminMode();
  const isAdmin = user?.publicMetadata?.role === "admin";
  const showAdminActions = isAdmin && adminMode;

  const handleAddToCart = () => {
    addToCart(product);
    navigate("/cart"); // 🚀 redirect to cart page
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="relative h-64 overflow-hidden">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        {showAdminActions && (
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              type="button"
              className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-stone-900 shadow-sm hover:bg-white"
            >
              Edit
            </button>
            <button
              type="button"
              className="rounded-full bg-red-500/90 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-red-500"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="p-6">
        <span className="text-xs text-amber-600 uppercase">
          {product.category}
        </span>

        <h3 className="text-xl font-bold text-stone-900 mt-2">
          {product.name}
        </h3>

        <p className="text-stone-600 text-sm mb-4">{product.description}</p>

        <button
          onClick={handleAddToCart}
          disabled={!product.in_stock}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition ${
            product.in_stock
              ? "bg-stone-900 text-white hover:bg-stone-800"
              : "bg-stone-200 text-stone-400 cursor-not-allowed"
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          {product.in_stock ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>
    </div>
  );
}
