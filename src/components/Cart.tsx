import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"; // ++ เพิ่ม SheetClose
import { ShoppingBag, Minus, Plus, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tables } from '@/integrations/supabase/types';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currencyUtils';
import { Link } from 'react-router-dom'; // ++ เพิ่ม import

// ... (interface CartItem และ fetchCartDataOptimized เหมือนเดิม)

interface CartItem {
  id: string;
  quantity: number;
  product_id: string;
  selected_size: string | null;
  selected_color: string | null;
  products: Tables<'products'>;
}

const fetchCartDataOptimized = async (userId: string): Promise<CartItem[]> => {
  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      id,
      quantity,
      product_id,
      selected_size, 
      selected_color, 
      products!inner (
        id,
        name,
        price,
        image_url,
        stock_quantity
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

const Cart = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedCurrency } = useCurrency();

  const { data: cartItems, isLoading, isError } = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: () => fetchCartDataOptimized(user!.id),
    enabled: !!user,
    staleTime: 1000 * 30, 
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });

  // ... (ส่วน useEffect และ handleUpdateQuantity เหมือนเดิม)
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('cart-items-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cart_items', filter: `user_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['cart', user.id] });
        }
      )
      .subscribe();
    
    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [user, queryClient]);

  const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
    try {
      if (newQuantity > 0) {
        const { error } = await supabase.from('cart_items').update({ quantity: newQuantity }).eq('id', cartItemId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('cart_items').delete().eq('id', cartItemId);
        if (error) throw error;
        toast({ title: "ลบสินค้าสำเร็จ" });
      }
      await queryClient.invalidateQueries({ queryKey: ['cart', user.id] });
    } catch (error) {
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถอัปเดตตะกร้าได้", variant: "destructive" });
    }
  };
  
  const cartItemCount = cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const total = cartItems?.reduce((sum, item) => sum + ((item.products?.price || 0) * item.quantity), 0) || 0;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <ShoppingBag className="h-4 w-4 text-gray-600" />
          {cartItemCount > 0 && (
            <Badge className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center p-0">
              {cartItemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>ตะกร้าสินค้า ({cartItemCount} รายการ)</SheetTitle>
        </SheetHeader>
        
        {/* ... (ส่วนแสดงรายการสินค้าเหมือนเดิม) */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4 custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>
          ) : cartItems && cartItems.length > 0 ? (
            <div className="space-y-4">
              {cartItems.map((item) => (
                item.products && (
                  <div key={item.id} className="flex items-start space-x-4 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <img 
                      src={item.products.image_url || '/placeholder.svg'} 
                      alt={item.products.name} 
                      className="w-16 h-16 object-cover rounded-md border"
                      loading="lazy"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm line-clamp-2">{item.products.name}</h4>
                      
                      <div className="text-xs text-gray-500 mt-1 space-x-2">
                        {item.selected_size && <span>Size: {item.selected_size}</span>}
                        {item.selected_color && <span>Color: {item.selected_color}</span>}
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1 font-semibold">
                        {formatCurrency(item.products.price, selectedCurrency)}
                      </p>
                      
                      <div className="flex items-center space-x-2 mt-2">
                        <Button 
                          variant="outline" size="icon" className="h-7 w-7" 
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <Button 
                          variant="outline" size="icon" className="h-7 w-7" 
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={item.products.stock_quantity !== null && item.quantity >= item.products.stock_quantity}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <Button 
                      variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors" 
                      onClick={() => handleUpdateQuantity(item.id, 0)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">ตะกร้าสินค้าของคุณว่างเปล่า</p>
              <p className="text-gray-400 text-sm mt-1">เพิ่มสินค้าเพื่อเริ่มต้นการช้อปปิ้ง</p>
            </div>
          )}
        </div>
        
        {cartItems && cartItems.length > 0 && (
          <div className="border-t pt-4 space-y-4 bg-white">
            <div className="flex justify-between items-center text-lg">
              <span className="font-medium text-gray-800">ยอดรวม:</span>
              <span className="font-semibold text-xl text-gray-900">{formatCurrency(total, selectedCurrency)}</span>
            </div>
            {/* ++ แก้ไขปุ่มให้เป็น Link และปิด Sheet เมื่อคลิก ++ */}
            <SheetClose asChild>
              <Button asChild className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 text-base font-medium" size="lg">
                <Link to="/checkout">ดำเนินการชำระเงิน</Link>
              </Button>
            </SheetClose>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default Cart;