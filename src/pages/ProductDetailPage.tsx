import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Star, Plus, Minus, Share2, Loader2 } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currencyUtils';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import ProductCard from '@/components/ProductCard';
import Footer from '@/components/Footer';
import { Skeleton } from '@/components/ui/skeleton';

// Fetch a single product by its ID
const fetchProduct = async (productId: string) => {
  const { data, error } = await supabase.from('products').select('*').eq('id', productId).single();
  if (error) throw new Error(error.message);
  return data;
};

// Fetch related products from the same category
const fetchRelatedProducts = async (category: string, currentProductId: string) => {
    if (!category) return [];
    const { data, error } = await supabase
        .from('products')
        .select('id, name, price, original_price, image_url, rating, is_new, stock_quantity, sizes, colors')
        .eq('category', category)
        .neq('id', currentProductId)
        .limit(4);
    if (error) throw new Error(error.message);
    return data;
};

const ProductDetailPage = () => {
    const { productId } = useParams<{ productId: string }>();
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { selectedCurrency } = useCurrency();
    
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    
    const { data: product, isLoading, isError, error } = useQuery({
        queryKey: ['product', productId],
        queryFn: async () => {
            const productData = await fetchProduct(productId!);
            if (productData?.category) {
                queryClient.prefetchQuery({
                    queryKey: ['relatedProducts', productData.category, productId],
                    queryFn: () => fetchRelatedProducts(productData.category, productId!),
                });
            }
            return productData;
        },
        enabled: !!productId,
    });
    
    const { data: relatedProducts, isLoading: isLoadingRelated } = useQuery({
        queryKey: ['relatedProducts', product?.category, productId],
        queryFn: () => fetchRelatedProducts(product!.category, productId!),
        enabled: !!product,
        staleTime: 1000 * 60 * 5,
    });

    const handleAddToCart = async () => {
        if (!product || !user) {
            toast({ title: "กรุณาเข้าสู่ระบบก่อน", variant: "destructive" });
            return;
        }
        if (product.sizes && !selectedSize) {
            toast({ title: "กรุณาเลือกขนาด", variant: "destructive" });
            return;
        }
        if (product.colors && !selectedColor) {
            toast({ title: "กรุณาเลือกสี", variant: "destructive" });
            return;
        }

        try {
            await supabase.rpc('add_to_cart', {
                p_product_id: product.id,
                p_quantity: quantity,
                p_size: selectedSize,
                p_color: selectedColor,
            });
            await queryClient.invalidateQueries({ queryKey: ['cart', user.id] });
            toast({ title: "เพิ่มสินค้าลงตะกร้าแล้ว" });
        } catch (err) {
            toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" });
        }
    };

    if (isLoading) return <PageSkeleton />;
    if (isError) return <div className="flex items-center justify-center h-screen">เกิดข้อผิดพลาด: {error?.message}</div>;
    if (!product) return <div className="flex items-center justify-center h-screen">ไม่พบสินค้า</div>;

    const discountPercentage = product.original_price ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : 0;

    return (
        // ✅ **แก้ไขโครงสร้างหลักตรงนี้**
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navigation />
            <main className="container mx-auto px-4 py-8 flex-grow">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    {/* Product Image Section */}
                    <div className="aspect-square bg-white rounded-lg shadow-sm p-4">
                        <img src={product.image_url || '/placeholder.svg'} alt={product.name} className="w-full h-full object-contain rounded-lg" />
                    </div>
                    {/* Product Details Section */}
                    <div className="flex flex-col space-y-4 py-4">
                        <h1 className="text-3xl lg:text-4xl font-light text-gray-900">{product.name}</h1>
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-semibold text-gray-900">{formatCurrency(product.price, selectedCurrency)}</span>
                                {product.original_price && <span className="text-lg text-gray-400 line-through">{formatCurrency(product.original_price, selectedCurrency)}</span>}
                            </div>
                            {discountPercentage > 0 && <Badge variant="destructive">Sale {discountPercentage}%</Badge>}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span>{product.rating || 'N/A'}</span>
                            <span className="text-gray-300">|</span>
                            {product.stock_quantity && product.stock_quantity > 0 ? <span className="text-green-600">มีสินค้า ({product.stock_quantity} ชิ้น)</span> : <span className="text-red-600">สินค้าหมด</span>}
                        </div>
                        <p className="text-gray-700 leading-relaxed">{product.description}</p>
                        {/* Size and Color Toggles */}
                        {product.sizes && product.sizes.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium mb-2">ขนาด: <span className="text-gray-600 font-normal">{selectedSize || 'กรุณาเลือก'}</span></h3>
                                <ToggleGroup type="single" value={selectedSize || ""} onValueChange={(value) => value && setSelectedSize(value)}>
                                    {product.sizes.map(size => <ToggleGroupItem key={size} value={size}>{size}</ToggleGroupItem>)}
                                </ToggleGroup>
                            </div>
                        )}
                        {product.colors && product.colors.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium mb-2">สี: <span className="text-gray-600 font-normal">{selectedColor || 'กรุณาเลือก'}</span></h3>
                                <ToggleGroup type="single" value={selectedColor || ""} onValueChange={(value) => value && setSelectedColor(value)}>
                                    {product.colors.map(color => <ToggleGroupItem key={color} value={color}>{color}</ToggleGroupItem>)}
                                </ToggleGroup>
                            </div>
                        )}
                        {/* Quantity and Action Buttons */}
                        <div className="flex items-center gap-4 pt-4">
                            <div className="flex items-center border rounded-md">
                                <Button variant="ghost" size="icon" onClick={() => setQuantity(q => Math.max(1, q - 1))}><Minus className="w-4 h-4" /></Button>
                                <Input type="number" value={quantity} readOnly className="w-12 text-center border-0 focus-visible:ring-0" />
                                <Button variant="ghost" size="icon" onClick={() => setQuantity(q => Math.min(product.stock_quantity || 99, q + 1))}><Plus className="w-4 h-4" /></Button>
                            </div>
                            <Button size="lg" className="flex-1 bg-gray-900 hover:bg-gray-800 text-white" onClick={handleAddToCart} disabled={!product.stock_quantity || product.stock_quantity <= 0}>
                                เพิ่มลงตะกร้า
                            </Button>
                        </div>
                        <Button variant="outline" className="w-full"><Share2 className="w-4 h-4 mr-2" /> แชร์สินค้า</Button>
                    </div>
                </div>
                {/* Related Products Section */}
                {relatedProducts && relatedProducts.length > 0 && (
                    <div className="mt-16 lg:mt-24">
                        <h2 className="text-2xl font-light text-center mb-8">สินค้าที่คล้ายกัน</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {isLoadingRelated ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-96" />) : relatedProducts.map(related => <ProductCard key={related.id} product={related} />)}
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

const PageSkeleton = () => (
    <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navigation />
        <main className="container mx-auto px-4 py-8 flex-grow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                <Skeleton className="aspect-square rounded-lg" />
                <div className="space-y-6">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-6 w-1/2" />
                    <div className="space-y-2 pt-4"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></div>
                    <Skeleton className="h-10 w-1/3 pt-4" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
        </main>
        <Footer />
    </div>
);

export default ProductDetailPage;