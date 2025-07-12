import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Truck, Shield, RefreshCw, Shirt, Package, Footprints, Layers, Sparkles, ShoppingBag, Grid3x3, User, Coffee, Zap, Gem } from 'lucide-react';
import Navigation from '@/components/Navigation';
import ProductCard from '@/components/ProductCard';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Tables } from '@/integrations/supabase/types';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currencyUtils';
import Footer from '@/components/Footer';

// ... (ส่วนอื่นๆ ของไฟล์เหมือนเดิม)
const categoryIcons = {
  'เสื้อเชิ้ต': Shirt,
  'เสื้อยืด': User,
  'แจ็คเก็ต': Package,
  'ฮู้ด': ShoppingBag,
  'กางเกง': Coffee,
  'เดรส': Layers,
  'รองเท้า': Footprints,
  'เครื่องประดับ': Sparkles,
  'กระโปรง': Zap,
  'เสื้อกันหนาว': Gem,
  // English equivalents
  'Pants': Coffee,
  'T-Shirts': User,
  'Jackets': Package,
  'Accessories': Sparkles,
  'Dresses': Layers,
  'Shirts': Shirt,
  'Hoodies': ShoppingBag,
  'Skirts': Zap,
  'Sweaters': Gem,
  'Shoes': Footprints,
};

// Color mapping for categories - ปรับเป็นโทน sage/gray
const categoryColors = {
  'เสื้อเชิ้ต': 'from-sage-50 to-sage-100 border-sage-200 hover:from-sage-100 hover:to-sage-150',
  'เสื้อยืด': 'from-gray-50 to-gray-100 border-gray-200 hover:from-gray-100 hover:to-gray-150',
  'แจ็คเก็ต': 'from-slate-50 to-slate-100 border-slate-200 hover:from-slate-100 hover:to-slate-150',
  'ฮู้ด': 'from-sage-50 to-sage-100 border-sage-200 hover:from-sage-100 hover:to-sage-150',
  'กางเกง': 'from-gray-50 to-gray-100 border-gray-200 hover:from-gray-100 hover:to-gray-150',
  'เดรส': 'from-slate-50 to-slate-100 border-slate-200 hover:from-slate-100 hover:to-slate-150',
  'รองเท้า': 'from-sage-50 to-sage-100 border-sage-200 hover:from-sage-100 hover:to-sage-150',
  'เครื่องประดับ': 'from-gray-50 to-gray-100 border-gray-200 hover:from-gray-100 hover:to-gray-150',
  'กระโปรง': 'from-slate-50 to-slate-100 border-slate-200 hover:from-slate-100 hover:to-slate-150',
  'เสื้อกันหนาว': 'from-sage-50 to-sage-100 border-sage-200 hover:from-sage-100 hover:to-sage-150',
};


const Index = () => {
  const { selectedCurrency, setSelectedCurrency } = useCurrency();

  const { data: featuredProducts, isLoading: isLoadingFeatured, error: featuredError } = useQuery<Tables<'products'>[]>({
    queryKey: ['featuredProducts'],
    queryFn: async () => {
      console.log('🔄 Fetching featured products...');
      const startTime = performance.now();
      
      const { data, error } = await supabase
        .from('products')
        // ✅ **แก้ไขตรงนี้: เพิ่ม sizes และ colors เข้าไปใน select statement**
        .select('id, name, price, original_price, image_url, rating, is_new, stock_quantity, sizes, colors')
        .not('image_url', 'is', null)
        .gte('stock_quantity', 1)
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(8);

      const endTime = performance.now();
      console.log(`✅ Featured products loaded in ${(endTime - startTime).toFixed(2)}ms`);

      if (error) {
        console.error('❌ Query error:', error);
        throw error;
      }
      
      console.log(`📦 Fetched ${data?.length || 0} products`);
      return data || [];
    },
    staleTime: 1000 * 60 * 30, 
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    retryDelay: 1000,
  });
  
  // ... (ส่วนที่เหลือของไฟล์เหมือนเดิม)
  const { data: categories, isLoading: isLoadingCategories, error: categoriesError } = useQuery<any[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      console.log('🔄 Fetching categories...');
      const startTime = performance.now();
      
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .not('category', 'is', null)
        .gte('stock_quantity', 0);
      
      if (error) throw error;
      
      // Process categories in client
      const categoryMap = new Map<string, number>();
      data.forEach(product => {
        if (product.category && product.category.trim()) {
          categoryMap.set(product.category, (categoryMap.get(product.category) || 0) + 1);
        }
      });
      
      const categoryArray = Array.from(categoryMap.entries()).map(([category, count]) => ({
        category,
        product_count: count
      }));
      
      const endTime = performance.now();
      console.log(`✅ Categories processed in ${(endTime - startTime).toFixed(2)}ms`);
      
      return categoryArray;
    },
    staleTime: 1000 * 60 * 60, // 1 ชั่วโมง
    gcTime: 1000 * 60 * 120, // 2 ชั่วโมง
    refetchOnWindowFocus: false,
  });

  const getIcon = (category: string) => {
    const Icon = categoryIcons?.[category as keyof typeof categoryIcons];
    return Icon ? <Icon className="h-8 w-8 text-sage-600" /> : <Grid3x3 className="h-8 w-8 text-sage-600" />;
  };

  const getCategoryColors = (category: string) => {
    return categoryColors[category as keyof typeof categoryColors] || 'from-sage-50 to-sage-100 border-sage-200 hover:from-sage-100 hover:to-sage-150';
  };

  const countries = [
    { name: 'Thailand', currency: 'THB' },
    { name: 'United States', currency: 'USD' },
    { name: 'United Kingdom', currency: 'GBP' },
    { name: 'Germany', currency: 'EUR' },
    { name: 'Japan', currency: 'JPY' },
    { name: 'Australia', currency: 'AUD' },
  ];

  const paymentLogos = [
    'https://cdn.jsdelivr.net/npm/@primer/octicons@17.7.0/build/svg/credit-card-16.svg',
    'https://cdn.jsdelivr.net/npm/@primer/octicons@17.7.0/build/svg/credit-card-16.svg',
    'https://cdn.jsdelivr.net/npm/@primer/octicons@17.7.0/build/svg/credit-card-16.svg',
    'https://cdn.jsdelivr.net/npm/@primer/octicons@17.7.0/build/svg/credit-card-16.svg',
  ];

  const ProductSkeleton = () => (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm animate-pulse">
      <div className="aspect-square bg-gray-300"></div>
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/3"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section
        className="relative py-20 bg-cover bg-center"
        style={{ backgroundImage: `url('https://i.postimg.cc/m2hqFRCn/wmremove-transformed.png')` }}
      >
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="container mx-auto px-4 text-center relative z-10 text-white">
          <h1 className="text-5xl md:text-6xl font-light mb-6">
            Urban Threads
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            แฟชั่นมินิมอลสำหรับคนยุคใหม่ ดีไซน์เรียบง่าย คุณภาพเยี่ยม
          </p>
          <Button className="bg-sage-600 hover:bg-sage-700 text-white px-8 py-3 text-lg" asChild>
            <Link to="/products" className="flex items-center">
              <span>เลือกซื้อสินค้า</span>
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Featured Products / สินค้าแนะนำ */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-light text-center mb-12">สินค้าแนะนำ</h2>
          
          {isLoadingFeatured ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <ProductSkeleton key={index} />
              ))}
            </div>
          ) : featuredError ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">เกิดข้อผิดพลาดในการโหลดสินค้า</div>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                ลองใหม่อีกครั้ง
              </Button>
            </div>
          ) : featuredProducts && featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">ไม่พบสินค้าแนะนำในขณะนี้</div>
              <Button variant="outline" asChild>
                <Link to="/products">ดูสินค้าทั้งหมด</Link>
              </Button>
            </div>
          )}
          
          {featuredProducts && featuredProducts.length > 0 && (
            <div className="text-center mt-12">
              <Button 
                  className="
                    px-8 py-3 bg-sage-600 text-white rounded-xl
                    hover:bg-sage-700 transition-all duration-300
                    font-medium text-lg shadow-lg hover:shadow-xl
                    transform hover:scale-105
                  "
                  asChild
                >
                  <Link to="/products" className="flex items-center gap-2 text-white font-semibold">
                    <span className="text-black">ดูสินค้าทั้งหมด</span>
                    <ArrowRight className="h-5 w-5 text-white" />
                  </Link>
                </Button>
            </div>
          )}
        </div>
      </section>

      {/* Categories - ปรับปรุงใหม่ */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-gray-900 mb-4">หมวดหมู่สินค้า</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              เลือกซื้อสินค้าแฟชั่นคุณภาพสูง ดีไซน์ทันสมัยสำหรับทุกโอกาส
            </p>
          </div>

          {isLoadingCategories ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="bg-gray-200 rounded-xl p-6 animate-pulse">
                  <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2 mx-auto"></div>
                </div>
              ))}
            </div>
          ) : categoriesError ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-500 text-2xl">!</span>
              </div>
              <div className="text-red-500 mb-2 font-medium">เกิดข้อผิดพลาดในการโหลดหมวดหมู่</div>
              <p className="text-sm text-gray-600 mb-6">กรุณาตรวจสอบการตั้งค่าฐานข้อมูลของคุณ</p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                ลองใหม่อีกครั้ง
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {categories?.map((category: any) => (
                  <Link 
                    to={`/products?category=${category.category}`} 
                    key={category.category} 
                    className="group block transform transition-all duration-300 hover:scale-105"
                  >
                    <Card className={`
                      bg-gradient-to-br ${getCategoryColors(category.category)}
                      border-2 transition-all duration-300 
                      group-hover:shadow-xl group-hover:shadow-gray-200/50
                      relative overflow-hidden rounded-xl
                    `}>
                      <CardContent className="p-6 text-center relative">
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full -mr-10 -mt-10"></div>
                        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-8 -mb-8"></div>
                        
                        {/* Icon container */}
                        <div className="
                          w-16 h-16 mx-auto mb-4 
                          bg-white/90 backdrop-blur-sm 
                          rounded-full flex items-center justify-center
                          transition-all duration-300
                          group-hover:bg-white group-hover:scale-110
                          shadow-sm border border-white/50
                        ">
                          {getIcon(category.category)}
                        </div>
                        
                        {/* Category name */}
                        <h3 className="
                          font-semibold text-sage-800 mb-2 text-lg
                          transition-colors duration-300
                          group-hover:text-sage-900
                        ">
                          {category.category}
                        </h3>
                        
                        {/* Product count */}
                        <p className="
                          text-sage-600 text-sm font-medium
                          transition-colors duration-300
                          group-hover:text-sage-700
                        ">
                          {category.product_count} รายการ
                        </p>

                        {/* Hover indicator */}
                        <div className="
                          absolute top-3 right-3 w-2 h-2 
                          bg-sage-400 rounded-full opacity-0
                          transition-all duration-300
                          group-hover:opacity-100 group-hover:scale-150 group-hover:bg-sage-600
                        "></div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Call to action */}
              <div className="text-center mt-16">
                <Button 
                  className="
                    px-8 py-3 bg-sage-600 text-white rounded-xl
                    hover:bg-sage-700 transition-all duration-300
                    font-medium text-lg shadow-lg hover:shadow-xl
                    transform hover:scale-105
                  "
                  asChild
                >
                  <Link to="/products" className="flex items-center gap-2 text-white font-semibold">
                    <span className="text-black">ดูสินค้าทั้งหมด</span>
                    <ArrowRight className="h-5 w-5 text-white" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-sage-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">จัดส่งฟรี</h3>
              <p className="text-gray-600">สั่งซื้อครบ 1,500 บาท</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-sage-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">รับประกันคุณภาพ</h3>
              <p className="text-gray-600">ผ้าคุณภาพดี ทนทาน</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="h-8 w-8 text-sage-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">แลกเปลี่ยนง่าย</h3>
              <p className="text-gray-600">ภายใน 7 วัน หากไม่พอใจ</p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-light text-center mb-12">รีวิวจากลูกค้า</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'คุณสมใจ',
                review: 'เสื้อผ้าคุณภาพดีมาก ใส่สบาย ดีไซน์สวย แนะนำเลยค่ะ',
                rating: 5
              },
              {
                name: 'คุณมาลี',
                review: 'บริการดีเยี่ยม จัดส่งเร็ว บรรจุภัณฑ์ดูดี',
                rating: 5
              },
              {
                name: 'คุณวิทย์',
                review: 'ราคาคุ้มค่า ผ้าไม่หด สีไม่ตก ประทับใจมาก',
                rating: 5
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white rounded-lg p-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">"{testimonial.review}"</p>
                <p className="font-medium text-gray-900">- {testimonial.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer/>
    </div>
  );
};

export default Index;