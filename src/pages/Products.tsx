import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Navigation from '@/components/Navigation';
import ProductCard from '@/components/ProductCard';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Footer from '@/components/Footer';

// ... (ส่วน ProductSkeleton และ categoryTranslations ไม่มีการเปลี่ยนแปลง)
const ProductSkeleton = () => (
  <div className="bg-white rounded-lg overflow-hidden shadow-sm animate-pulse">
    <div className="aspect-square bg-gray-200"></div>
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
    </div>
  </div>
);

const categoryTranslations: { [key: string]: string } = {
  'Shirts': 'เสื้อเชิ้ต',
  'T-Shirts': 'เสื้อยืด',
  'Jackets': 'แจ็คเก็ต',
  'Hoodies': 'ฮู้ด',
  'Pants': 'กางเกง',
  'Dresses': 'เดรส',
  'Shoes': 'รองเท้า',
  'Accessories': 'เครื่องประดับ',
  'Skirts': 'กระโปรง',
  'Sweaters': 'เสื้อกันหนาว',
};


const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'name');
  const selectedCategory = searchParams.get('category') || 'all';

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ✅ **แก้ไข Query เพื่อ Debug โดยเฉพาะ**
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories-debug'], // เปลี่ยน key เพื่อให้ดึงข้อมูลใหม่
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_category_counts');
      
      if (error) {
        console.error("Error fetching categories via RPC:", error);
        throw new Error('ไม่สามารถโหลดหมวดหมู่สินค้าได้');
      }

      console.log("===== RAW DATA FROM DATABASE =====");
      console.table(data); // พิมพ์ข้อมูลที่ได้จาก DB เป็นตารางใน Console

      const processedCategories = data
        .filter((cat: any) => cat.category && typeof cat.category === 'string' && cat.category.trim() !== '' && cat.product_count > 0)
        .map((cat: any) => {
          const trimmedCategory = cat.category.trim();
          
          // ** DEBUG: ใช้ชื่อภาษาอังกฤษโดยตรงเพื่อทดสอบ **
          const label = trimmedCategory; 

          return {
            category: trimmedCategory,
            product_count: cat.product_count,
            label: label
          };
        });

      console.log("===== PROCESSED CATEGORIES =====");
      console.table(processedCategories); // พิมพ์ข้อมูลที่ผ่านการประมวลผลแล้ว

      const totalProducts = data.reduce((sum: number, cat: any) => sum + (cat.product_count || 0), 0);
      
      return [
        { category: 'all', label: 'สินค้าทั้งหมด', product_count: totalProducts },
        ...processedCategories.sort((a, b) => a.label.localeCompare(b.label))
      ];
    },
    staleTime: 0, // ไม่ใช้ cache
    cacheTime: 0,
  });

  // ✅ **แก้ไข Query ของ สินค้า ให้ดึง sizes และ colors มาด้วย**
  const { data: products, isLoading, isError, error } = useQuery({
    queryKey: ['products', selectedCategory, debouncedSearchTerm, sortBy],
    queryFn: async () => {
      let query = supabase
        .from('products')
        // ++ เพิ่ม sizes, colors ใน select statement ++
        .select('id, name, price, original_price, image_url, rating, is_new, stock_quantity, category, sizes, colors');

      if (selectedCategory && selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }
      if (debouncedSearchTerm.trim()) {
        query = query.ilike('name', `%${debouncedSearchTerm.trim()}%`);
      }
      query = query.gte('stock_quantity', 0);

      switch (sortBy) {
        case 'price-low': query = query.order('price', { ascending: true }); break;
        case 'price-high': query = query.order('price', { ascending: false }); break;
        case 'rating': query = query.order('rating', { ascending: false, nullsFirst: false }); break;
        case 'newest': query = query.order('created_at', { ascending: false }); break;
        default: query = query.order('name', { ascending: true });
      }

      query = query.limit(100);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
  
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
    if (debouncedSearchTerm) params.set('q', debouncedSearchTerm);
    if (sortBy) params.set('sort', sortBy);
    setSearchParams(params, { replace: true });
  }, [selectedCategory, debouncedSearchTerm, sortBy, setSearchParams]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSortBy('name');
    setSearchParams(new URLSearchParams(), { replace: true });
  };
  
  const handleCategoryChange = (categoryValue: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (categoryValue === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', categoryValue);
    }
    setSearchParams(newParams);
  };

  const getCurrentCategoryLabel = () => {
    if (!selectedCategory || selectedCategory === 'all') return 'สินค้าทั้งหมด';
    const category = categories?.find(cat => cat.category === selectedCategory);
    return category ? (categoryTranslations[category.label] || category.label) : 'สินค้าทั้งหมด';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-light text-gray-900 mb-2">
            {isLoadingCategories ? 'กำลังโหลด...' : getCurrentCategoryLabel()}
          </h1>
          <p className="text-gray-600">ค้นพบคอลเลกชันแฟชั่นสำหรับทุกโอกาส</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input placeholder="ค้นหาสินค้า..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
          </div>
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full md:w-56"><SelectValue placeholder="เลือกหมวดหมู่" /></SelectTrigger>
            <SelectContent>
              {isLoadingCategories ? (
                <SelectItem value="loading" disabled>กำลังโหลด...</SelectItem>
              ) : categories && categories.length > 0 ? (
                categories.map((category) => (
                  <SelectItem key={category.category} value={category.category}>
                    {category.label} ({category.product_count})
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-categories" disabled>ไม่พบหมวดหมู่</SelectItem>
              )}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="เรียงตาม" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">ชื่อ A-Z</SelectItem>
              <SelectItem value="price-low">ราคา: ต่ำ-สูง</SelectItem>
              <SelectItem value="price-high">ราคา: สูง-ต่ำ</SelectItem>
              <SelectItem value="rating">คะแนนสูงสุด</SelectItem>
              <SelectItem value="newest">ใหม่ล่าสุด</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => <ProductSkeleton key={index} />)}
          </div>
        ) : isError ? (
            <div className="text-center py-12 text-red-500"><p>เกิดข้อผิดพลาดในการโหลดข้อมูล: {error?.message}</p></div>
        ) : products?.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <XCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">ไม่พบสินค้า</h3>
            <p className="mt-1 text-sm text-gray-500">ไม่พบสินค้าที่ตรงตามเงื่อนไขที่คุณเลือก</p>
            <div className="mt-6"><Button onClick={handleResetFilters}>ล้างตัวกรองทั้งหมด</Button></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products?.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </div>

      <Footer />
    </div>
    
  );
};

export default ProductsPage;