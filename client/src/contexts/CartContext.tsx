import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { Products } from "../pages/MenuPage";

export interface CartItem extends Products {
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Products) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (product: Products) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);

      const fixedProduct = {
        ...product,
        price: Number(product.price), 
      };

      if (existingItem) {
        if (existingItem.quantity >= Number(existingItem.stock)) {
          return prevCart;
        }

        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }


      return [...prevCart, { ...fixedProduct, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    setCart((prev) => {
      const item = prev.find((it) => it.id === productId);
      if (!item) return prev;

      if (quantity <= 0) {
        return prev.filter((it) => it.id !== productId);
      }

      const max = Number(item.stock);
      const nextQty = Math.min(quantity, Number.isFinite(max) ? max : quantity);

      return prev.map((it) =>
        it.id === productId ? { ...it, quantity: nextQty } : it
      );
    });
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
