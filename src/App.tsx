// src/App.tsx

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useIsFetching } from "@tanstack/react-query"; // ✅ เพิ่ม useIsFetching
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import React, { Suspense, useState, useEffect } from 'react';
import { CurrencyProvider } from "./contexts/CurrencyContext";
import Preloader from "./components/Preloader";

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
  const isFetching = useIsFetching(); // ✅ ตรวจสอบสถานะการดึงข้อมูลของ react-query
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // กำหนดให้ Preloader แสดงเมื่อมีการเปลี่ยนเส้นทางหรือมีการดึงข้อมูล
    if (isFetching > 0) {
      setIsLoading(true);
    } else {
      // ซ่อน Preloader เมื่อไม่มีการดึงข้อมูลแล้ว
      setIsLoading(false);
    }
  }, [isFetching, location.pathname]); // ✅ ตรวจจับการเปลี่ยนแปลงทั้ง isFetching และ location

  return (
    <>
      {/* Preloader จะแสดงเมื่อ isLoading เป็น true */}
      <Preloader isLoading={isLoading} />
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
    </>
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