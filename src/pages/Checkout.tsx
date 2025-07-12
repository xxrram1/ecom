import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currencyUtils';
import { useToast } from "@/hooks/use-toast";

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, CreditCard, QrCode, ShoppingBag, AlertCircle, Home } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { Badge } from "@/components/ui/badge";

// ✅ **แก้ไข Schema: เปลี่ยนจาก firstName, lastName เป็น fullName**
const checkoutSchema = z.object({
  email: z.string().email("กรุณากรอกอีเมลที่ถูกต้อง"),
  phone: z.string().min(9, "กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง"),
  fullName: z.string().min(2, "กรุณากรอกชื่อ-นามสกุล"),
  addressLine1: z.string().min(5, "กรุณากรอกที่อยู่"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "กรุณากรอกเขต/อำเภอ"),
  province: z.string().min(2, "กรุณากรอกจังหวัด"),
  postalCode: z.string().min(5, "รหัสไปรษณีย์ต้องมี 5 หลัก").max(5, "รหัสไปรษณีย์ต้องมี 5 หลัก"),
  paymentMethod: z.enum(['credit_card', 'mobile_banking'], {
    required_error: "กรุณาเลือกวิธีการชำระเงิน"
  }),
  saveInfo: z.boolean().default(false).optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

// ... (interface CartItem และ fetchCartData เหมือนเดิม) ...
interface CartItem {
  id: string;
  quantity: number;
  selected_size: string | null;
  selected_color: string | null;
  products: Tables<'products'>;
}


const fetchCartData = async (userId: string): Promise<CartItem[]> => {
  const { data, error } = await supabase
    .from('cart_items')
    .select(`id, quantity, selected_size, selected_color, products!inner(*)`)
    .eq('user_id', userId);
  if (error) throw error;
  return data as CartItem[];
};


const CheckoutPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { selectedCurrency } = useCurrency();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: user?.email || '',
      phone: '',
      fullName: '', // ✅ เปลี่ยน default value
      addressLine1: '',
      addressLine2: '',
      city: '',
      province: '',
      postalCode: '',
      paymentMethod: 'credit_card',
      saveInfo: false,
    },
  });
  
  const { data: cartItems, isLoading: isLoadingCart } = useQuery<CartItem[]>({
    queryKey: ['cart', user?.id],
    queryFn: () => fetchCartData(user!.id),
    enabled: !!user,
  });

  const { data: initialData, isLoading: isLoadingInitialData } = useQuery({
      queryKey: ['checkoutInitialData', user?.id],
      queryFn: async () => {
          if (!user) return null;
          const { data: address } = await supabase.from('addresses').select('*').eq('user_id', user.id).eq('is_default', true).single();
          const { data: profile } = await supabase.from('profiles').select('full_name, phone').eq('id', user.id).single();
          return { address, profile };
      },
      enabled: !!user,
  });

  useEffect(() => {
    if (initialData) {
      const { address, profile } = initialData;
      let formValues: Partial<CheckoutFormData> = { email: user?.email || '' };

      if (address) {
        // ✅ **แก้ไขการตั้งค่าฟอร์ม: ใช้ fullName โดยตรง**
        formValues = {
          ...formValues,
          fullName: address.full_name || '',
          phone: address.phone || profile?.phone || '',
          addressLine1: address.address_line_1 || '',
          addressLine2: address.address_line_2 || '',
          city: address.city || '',
          province: address.province || '',
          postalCode: address.postal_code || '',
        };
      } else if (profile) {
        formValues = {
            ...formValues,
            fullName: profile.full_name || '',
            phone: profile.phone || '',
        };
      }
      
      form.reset(formValues);
    }
  }, [initialData, user, form]);


  const subtotal = cartItems?.reduce((sum, item) => sum + item.products.price * item.quantity, 0) || 0;
  const shippingFee = 5000;
  const total = subtotal + shippingFee;

  const handlePlaceOrder = async (data: CheckoutFormData) => {
    if (!user || !cartItems || cartItems.length === 0) return;
    setIsSubmitting(true);
    
    try {
      // ✅ **แก้ไขการสร้าง shippingAddress: ใช้ fullName**
      const shippingAddress = {
        full_name: data.fullName,
        phone: data.phone,
        address_line_1: data.addressLine1,
        address_line_2: data.addressLine2,
        city: data.city,
        province: data.province,
        postal_code: data.postalCode,
      };

      const { data: orderData, error: orderError } = await supabase.from('orders').insert({
          user_id: user.id,
          total_amount: total,
          status: 'pending_payment',
          shipping_address: shippingAddress,
          payment_method: data.paymentMethod,
          payment_status: 'pending'
        }).select('id').single();

      if (orderError) throw orderError;
      const orderId = orderData.id;

      const orderItems = cartItems.map(item => ({
        order_id: orderId,
        product_id: item.products.id,
        quantity: item.quantity,
        price: item.products.price,
        selected_size: item.selected_size,
        selected_color: item.selected_color,
      }));

      await supabase.from('order_items').insert(orderItems);
      await supabase.from('cart_items').delete().eq('user_id', user.id);
      await queryClient.invalidateQueries({ queryKey: ['cart', user.id] });
      toast({ title: "✅ สั่งซื้อสำเร็จ!", description: "ขอบคุณที่สั่งซื้อสินค้ากับเรา" });
      navigate('/account');

    } catch (error) {
      toast({ title: "❌ เกิดข้อผิดพลาด", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // ... (useEffect ตรวจสอบตะกร้าว่าง และ Loading state เหมือนเดิม) ...
  useEffect(() => {
    if (!isLoadingCart && (!cartItems || cartItems.length === 0)) {
      toast({
        title: "ตะกร้าของคุณว่างเปล่า",
        description: "กำลังนำคุณกลับไปหน้าสินค้า...",
        variant: "destructive"
      });
      setTimeout(() => navigate('/products'), 2000);
    }
  }, [cartItems, isLoadingCart, navigate, toast]);


  if (isLoadingCart || isLoadingInitialData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handlePlaceOrder)} className="grid grid-cols-1 lg:grid-cols-2 lg:gap-12">
            
            {/* Left Side - Form */}
            <div className="order-2 lg:order-1">
              <Card>
                <CardHeader><CardTitle>ข้อมูลการติดต่อและจัดส่ง</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>อีเมล</FormLabel><FormControl><Input placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>เบอร์โทรศัพท์</FormLabel><FormControl><Input placeholder="08x-xxx-xxxx" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader><CardTitle>ที่อยู่สำหรับจัดส่ง</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    {/* ✅ **แก้ไขฟอร์ม: รวมเป็นช่องเดียว** */}
                    <FormField control={form.control} name="fullName" render={({ field }) => (
                        <FormItem><FormLabel>ชื่อ-นามสกุล</FormLabel><FormControl><Input placeholder="กรอกชื่อ-นามสกุลผู้รับ" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="addressLine1" render={({ field }) => (
                        <FormItem><FormLabel>ที่อยู่</FormLabel><FormControl><Input placeholder="บ้านเลขที่, หมู่, ถนน" {...field} /></FormControl><FormMessage /></FormItem>
                     )} />
                     <FormField control={form.control} name="addressLine2" render={({ field }) => (
                        <FormItem><FormLabel>ที่อยู่เพิ่มเติม (ไม่บังคับ)</FormLabel><FormControl><Input placeholder="อาคาร, ชั้น, ห้อง" {...field} /></FormControl><FormMessage /></FormItem>
                     )} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="city" render={({ field }) => (
                            <FormItem><FormLabel>เขต/อำเภอ</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="province" render={({ field }) => (
                           <FormItem><FormLabel>จังหวัด</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="postalCode" render={({ field }) => (
                            <FormItem><FormLabel>รหัสไปรษณีย์</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                </CardContent>
              </Card>
              
             {/* ... (ส่วน Payment และปุ่มชำระเงิน เหมือนเดิม) ... */}
              <Card className="mt-6">
                <CardHeader><CardTitle>การชำระเงิน</CardTitle></CardHeader>
                <CardContent>
                  <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                          {/* Credit Card Option */}
                          <FormItem className="flex items-center space-x-3 space-y-0 opacity-50 cursor-not-allowed">
                            <FormControl>
                              <RadioGroupItem value="credit_card" disabled />
                            </FormControl>
                            <FormLabel className="font-normal flex items-center gap-2"><CreditCard className="w-5 h-5"/> บัตรเครดิต/เดบิต (ปิดปรับปรุงชั่วคราว)</FormLabel>
                          </FormItem>
                           {/* Mobile Banking Option */}
                          <FormItem className="flex items-center space-x-3 space-y-0 opacity-50 cursor-not-allowed">
                            <FormControl>
                              <RadioGroupItem value="mobile_banking" disabled />
                            </FormControl>
                            <FormLabel className="font-normal flex items-center gap-2"><QrCode className="w-5 h-5"/> Mobile Banking (QR Code) (ปิดปรับปรุงชั่วคราว)</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              <div className="mt-6">
                <Button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isSubmitting ? 'กำลังดำเนินการ...' : `ชำระเงิน ${formatCurrency(total, selectedCurrency)}`}
                </Button>
              </div>

            </div>

            {/* ... (ส่วน Order Summary เหมือนเดิม) ... */}
            <div className="order-1 lg:order-2 mb-8 lg:mb-0">
              <Card className="sticky top-24">
                <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingBag className="w-6 h-6"/> สรุปรายการสั่งซื้อ</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                    {cartItems?.map(item => (
                      <div key={item.id} className="flex items-start gap-4">
                        <div className="relative">
                          <img src={item.products.image_url || '/placeholder.svg'} alt={item.products.name} className="w-16 h-16 rounded-md object-cover border"/>
                          <Badge className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-600 text-white">{item.quantity}</Badge>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm line-clamp-2">{item.products.name}</p>
                          <p className="text-xs text-gray-500">
                            {item.selected_size && `Size: ${item.selected_size}`}
                            {item.selected_size && item.selected_color && ', '}
                            {item.selected_color && `Color: ${item.selected_color}`}
                          </p>
                        </div>
                        <p className="text-sm font-semibold">{formatCurrency(item.products.price * item.quantity, selectedCurrency)}</p>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-4"/>
                  <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                          <span className="text-gray-600">ยอดรวม</span>
                          <span>{formatCurrency(subtotal, selectedCurrency)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                          <span className="text-gray-600">ค่าจัดส่ง</span>
                          <span>{formatCurrency(shippingFee, selectedCurrency)}</span>
                      </div>
                  </div>
                  <Separator className="my-4"/>
                  <div className="flex justify-between font-semibold text-lg">
                      <span>ยอดสุทธิ</span>
                      <span>{formatCurrency(total, selectedCurrency)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </form>
        </Form>
      </div>
      <Footer />
    </div>
  );
};

export default CheckoutPage;