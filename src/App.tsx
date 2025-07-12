import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import React, { Suspense } from 'react';
import { CurrencyProvider } from "./contexts/CurrencyContext"; // ✅ เพิ่มการ Import ที่ขาดหายไป

// ใช้ React.lazy เพื่อแยกโค้ดของแต่ละหน้าแบบ Lazy Loading
const Index = React.lazy(() => import('./pages/Index'));
const Products = React.lazy(() => import('./pages/Products'));
const Auth = React.lazy(() => import('./pages/Auth'));
const Account = React.lazy(() => import('./pages/Account'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const ProtectedRoute = React.lazy(() => import('./components/ProtectedRoute'));
const ContactPage = React.lazy(() => import('./pages/Contact'));
const ProductDetailPage = React.lazy(() => import('./pages/ProductDetailPage'));
const CheckoutPage = React.lazy(() => import('./pages/Checkout'));

const queryClient = new QueryClient();

const AppContent = () => {
  return (
    // ห่อด้วย Suspense เพื่อแสดง fallback UI ขณะโหลด
    <Suspense fallback={<div>กำลังโหลด...</div>}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:productId" element={<ProductDetailPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CurrencyProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </CurrencyProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;