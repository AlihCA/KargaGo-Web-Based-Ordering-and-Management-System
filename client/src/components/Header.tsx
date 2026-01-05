import { Link } from "react-router-dom";
import {
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import { Truck, ShoppingCart } from "lucide-react";
import { useCart } from "../contexts/CartContext";

export function Header() {
  const { isSignedIn } = useUser();
  const { totalItems } = useCart();

  return (
    <header className="bg-stone-900 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-2xl font-bold hover:text-amber-400 transition-colors"
          >
            <Truck className="w-8 h-8" />
            <span>KargaGo</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="hover:text-amber-400 transition-colors font-medium"
            >
              Home
            </Link>
            <Link
              to="/menu"
              className="hover:text-amber-400 transition-colors font-medium"
            >
              Menu
            </Link>
            <Link
              to="/cart"
              className="hover:text-amber-400 transition-colors font-medium relative"
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                <span>Cart</span>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                )}
              </div>
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {isSignedIn ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <div className="flex items-center gap-3">
                <SignInButton mode="modal">
                  <button className="px-4 py-2 text-sm font-medium hover:text-amber-400 transition-colors">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="px-4 py-2 text-sm font-medium bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors">
                    Sign Up
                  </button>
                </SignUpButton>
              </div>
            )}
          </div>
        </div>

        <nav className="md:hidden flex items-center justify-around mt-4 pt-4 border-t border-stone-700">
          <Link to="/" className="hover:text-amber-400 transition-colors">
            Home
          </Link>
          <Link to="/menu" className="hover:text-amber-400 transition-colors">
            Menu
          </Link>
          <Link
            to="/cart"
            className="hover:text-amber-400 transition-colors relative"
          >
            <div className="flex items-center gap-1">
              <ShoppingCart className="w-4 h-4" />
              <span>Cart</span>
              {totalItems > 0 && (
                <span className="ml-1 bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </div>
          </Link>
        </nav>
      </div>
    </header>
  );
}
