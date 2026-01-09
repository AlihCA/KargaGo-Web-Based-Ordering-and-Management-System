import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn, useUser } from "@clerk/clerk-react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "./contexts/CartContext";
import { AdminModeProvider } from "./contexts/AdminModeContext";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { HomePage } from "./pages/HomePage";
import { MenuPage } from "./pages/MenuPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import AdminDashboard from "./pages/AdminDashboard";
import { SyncUserToDb } from "./components/SyncUserToDb";
import { OrdersPage } from "./pages/OrdersPage";


const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
};

// Admin Route Component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (user?.publicMetadata?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <SyncUserToDb />
      <AdminModeProvider>
        <CartProvider>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-grow">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/menu" element={<MenuPage />} />
                  
                  {/* Protected Routes (require login) */}
                  <Route
                    path="/cart"
                    element={
                      <ProtectedRoute>
                        <CartPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/checkout"
                    element={
                      <ProtectedRoute>
                        <CheckoutPage />
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Admin Route (requires login + admin role) */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <AdminRoute>
                          <AdminDashboard />
                        </AdminRoute>
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Catch all - redirect to home */}
                  <Route path="*" element={<Navigate to="/" replace />} />

                  <Route path="/orders" element={<OrdersPage />} />

                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
        </CartProvider>
      </AdminModeProvider>
    </ClerkProvider>
  );
}

export default App;
