import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Plus, Loader2, Minus, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currencyUtils';
import { useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from '@/components/ui/separator';

interface ProductCardProps {
  product: Tables<'products'>;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { selectedCurrency } = useCurrency();
  const queryClient = useQueryClient();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const formatPrice = (price: number) => {
    return formatCurrency(price, selectedCurrency);
  };

  // ✅ **ปรับปรุงฟังก์ชัน `handleConfirmAddToCart` ให้เรียบง่ายและแน่นอน**
  const handleConfirmAddToCart = async () => {
    if (!user) {
      toast({ title: "กรุณาเข้าสู่ระบบก่อน", variant: "destructive" });
      return;
    }
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast({ title: "กรุณาเลือกขนาด", variant: "destructive" });
      return;
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      toast({ title: "กรุณาเลือกสี", variant: "destructive" });
      return;
    }

    setIsAdding(true);
    try {
      const { error } = await supabase.rpc('add_to_cart', {
        p_product_id: product.id,
        p_quantity: quantity,
        p_size: selectedSize,
        p_color: selectedColor,
      });

      if (error) {
        throw error;
      }
      
      // เมื่อสำเร็จ สั่งให้ตะกร้าดึงข้อมูลใหม่
      await queryClient.invalidateQueries({ queryKey: ['cart', user.id] });
      toast({ title: "เพิ่มสินค้าลงตะกร้าแล้ว!" });
      setSheetOpen(false);

    } catch (error) {
      console.error("Add to cart error:", error);
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถเพิ่มสินค้าลงตะกร้าได้", variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  };
  
  const handleSheetTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedSize(product.sizes?.[0] || null);
    setSelectedColor(product.colors?.[0] || null);
    setQuantity(1);
    setSheetOpen(true);
  };

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <div className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow block relative">
            <Link to={`/products/${product.id}`} className="absolute inset-0 z-0" aria-label={`View details for ${product.name}`}></Link>
            <div className="relative z-10">
                <div className="relative aspect-square overflow-hidden">
                    <img src={product.image_url || '/placeholder.svg'} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy"/>
                    {product.is_new && (<Badge className="absolute top-2 left-2 bg-sage-600 text-white">ใหม่</Badge>)}
                    <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1.5">
                        <Button asChild size="icon" variant="secondary" className="h-8 w-8 bg-white/80 backdrop-blur-sm hover:bg-white" onClick={(e) => e.stopPropagation()}>
                            <Link to={`/products/${product.id}`}><Eye className="h-4 w-4 text-gray-800" /></Link>
                        </Button>
                        <SheetTrigger asChild>
                            <Button onClick={handleSheetTriggerClick} disabled={product.stock_quantity !== null && product.stock_quantity <= 0} size="icon" className="h-8 w-8 bg-white/80 backdrop-blur-sm text-gray-900 hover:bg-white disabled:opacity-50">
                            <Plus className="h-4 w-4" />
                            </Button>
                        </SheetTrigger>
                    </div>
                </div>
                <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                    <div className="flex items-center gap-1 mb-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-gray-600">{product.rating || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{formatPrice(product.price)}</span>
                            {product.original_price && (<span className="text-sm text-gray-500 line-through">{formatPrice(product.original_price)}</span>)}
                        </div>
                        {product.stock_quantity !== null && product.stock_quantity === 0 && (<Badge variant="destructive">สินค้าหมด</Badge>)}
                    </div>
                </div>
            </div>
        </div>
      
        <SheetContent side="bottom" className="rounded-t-lg p-4" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <SheetHeader><SheetTitle className="text-center text-lg">เลือกตัวเลือกสินค้า</SheetTitle></SheetHeader>
            <div className="flex items-center gap-4 my-4">
                <img src={product.image_url || '/placeholder.svg'} alt={product.name} className="w-20 h-20 object-cover rounded-lg border" />
                <div className="flex-1">
                    <h3 className="font-medium text-gray-900 line-clamp-2">{product.name}</h3>
                    <p className="text-lg font-semibold text-gray-800">{formatPrice(product.price)}</p>
                </div>
            </div>
            <Separator className="my-4" />
            <div className="space-y-4">
                {product.sizes && product.sizes.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium mb-2">ขนาด</h4>
                        <ToggleGroup type="single" value={selectedSize || ""} onValueChange={(value) => value && setSelectedSize(value)}>
                            {product.sizes.map(size => <ToggleGroupItem key={size} value={size}>{size}</ToggleGroupItem>)}
                        </ToggleGroup>
                    </div>
                )}
                {product.colors && product.colors.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium mb-2">สี</h4>
                        <ToggleGroup type="single" value={selectedColor || ""} onValueChange={(value) => value && setSelectedColor(value)}>
                            {product.colors.map(color => <ToggleGroupItem key={color} value={color}>{color}</ToggleGroupItem>)}
                        </ToggleGroup>
                    </div>
                )}
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">จำนวน</h4>
                    <div className="flex items-center border rounded-md">
                        <Button variant="ghost" size="icon" onClick={() => setQuantity(q => Math.max(1, q - 1))}><Minus className="w-4 w-4" /></Button>
                        <span className="w-12 text-center">{quantity}</span>
                        <Button variant="ghost" size="icon" onClick={() => setQuantity(q => Math.min(product.stock_quantity || 99, q + 1))}><Plus className="h-4 w-4" /></Button>
                    </div>
                </div>
            </div>
            <SheetFooter className="mt-6">
                <Button onClick={handleConfirmAddToCart} disabled={isAdding} className="w-full" size="lg">
                    {isAdding ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                    เพิ่มลงตะกร้า - {formatPrice(product.price * quantity)}
                </Button>
            </SheetFooter>
        </SheetContent>
    </Sheet>
  );
};

export default ProductCard;