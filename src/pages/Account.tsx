import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  LogOut, 
  MapPin, 
  ArrowLeft, 
  Edit3, 
  Shield, 
  Package, 
  Settings, 
  Phone, 
  Mail, 
  Calendar, 
  Eye, 
  EyeOff,
  Save,
  Loader2,
  CheckCircle,
  Plus,
  Home,
  Clock,
  Star
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Footer from '@/components/Footer';

const profileSchema = z.object({
  fullName: z.string().min(2, "กรุณากรอกชื่อ-นามสกุล"),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, "รหัสผ่านปัจจุบันต้องมีอย่างน้อย 6 ตัวอักษร"),
  newPassword: z.string().min(6, "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร"),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "รหัสผ่านใหม่ไม่ตรงกัน",
  path: ["confirmNewPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

interface ProfileData {
  id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

interface AddressData {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  province: string;
  postal_code: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

const Account = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [hasLoadingTimeout, setHasLoadingTimeout] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const queryClient = useQueryClient();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      phone: "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  // Query for fetching user addresses
  const { data: addresses, isLoading: isLoadingAddresses } = useQuery<AddressData[]>({
    queryKey: ['addresses', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Query for fetching user profile
  const { data: profile, isLoading: isLoadingProfile } = useQuery<ProfileData>({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated.");
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (!data) {
        const userMetadata = user.user_metadata || {};
        const newProfile = {
          id: user.id,
          full_name: userMetadata.full_name || null,
          phone: userMetadata.phone || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { data: insertedData, error: insertError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();
          
        if (insertError) {
          return newProfile;
        }
        
        return insertedData;
      }
      
      return data;
    },
    enabled: !!user,
    staleTime: 0,
    cacheTime: 0,
    onSuccess: (data) => {
      if (data) {
        form.reset({
          fullName: data.full_name || "",
          phone: data.phone || "",
        });
      }
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading || isLoadingProfile) {
        setHasLoadingTimeout(true);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [loading, isLoadingProfile]);

  const handleUpdateProfile = async (data: ProfileFormData) => {
    if (!user) return;

    setIsUpdating(true);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          full_name: data.fullName,
          phone: data.phone || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        await supabase.from('profiles').delete().eq('id', user.id);
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: data.fullName,
            phone: data.phone || null,
            created_at: profile?.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          throw insertError;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      setIsEditing(false);
      
      toast({
        title: "✅ บันทึกสำเร็จ",
        description: "ข้อมูลโปรไฟล์ได้รับการอัปเดตแล้ว",
        duration: 3000,
      });

    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลได้",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (data: PasswordFormData) => {
    if (!user) return;

    setIsChangingPassword(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: data.currentPassword,
      });

      if (signInError) {
        toast({
          title: "รหัสผ่านปัจจุบันไม่ถูกต้อง",
          description: "กรุณาตรวจสอบรหัสผ่านปัจจุบันของคุณ",
          variant: "destructive",
        });
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (updateError) {
        toast({
          title: "ไม่สามารถเปลี่ยนรหัสผ่านได้",
          description: updateError.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "เปลี่ยนรหัสผ่านสำเร็จ",
        description: "รหัสผ่านของคุณได้รับการอัปเดตแล้ว",
      });

      passwordForm.reset();
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
      try {
        const { error: directSignOutError } = await supabase.auth.signOut();
        if (directSignOutError) throw directSignOutError;
        
        toast({
          title: "ออกจากระบบสำเร็จ",
          description: "ขอบคุณที่ใช้บริการ Urban Threads",
        });
        
        queryClient.clear();
        navigate('/');
      } catch (finalError) {
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
        queryClient.clear();
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      }
    }
  };

  // Enhanced Loading State
  if (loading || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
        {/* Header with skeleton */}
        <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-px bg-gray-200"></div>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="w-24 h-9 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </header>
        
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center space-y-6 p-8">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900">กำลังโหลดข้อมูลบัญชี</h3>
              <p className="text-gray-600">กรุณารอสักครู่...</p>
            </div>
            {hasLoadingTimeout && (
              <div className="space-y-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-700">การโหลดข้อมูลใช้เวลานานกว่าปกติ</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="text-amber-700 border-amber-300 hover:bg-amber-100"
                >
                  รีเฟรชหน้า
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getInitials = (name: string | null) => {
    if (!name) return user.email?.charAt(0).toUpperCase() || "U";
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Enhanced Header */}
      <header className="border-b bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">กลับหน้าหลัก</span>
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h2 className="text-2xl font-light text-gray-900">Urban Threads</h2>
            </div>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Enhanced Profile Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-6">
            <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
              <AvatarImage src="" alt={profile?.full_name || "User"} />
              <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-slate-600 to-slate-700 text-white">
                {getInitials(profile?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-light text-gray-900">
              {profile?.full_name ? (
                <>สวัสดี, {profile.full_name}</>
              ) : (
                "ยินดีต้อนรับ"
              )}
            </h1>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              {profile?.created_at && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>สมาชิกตั้งแต่ {formatDate(profile.created_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit lg:mx-auto bg-white shadow-sm border rounded-lg">
            <TabsTrigger value="profile" className="flex items-center gap-2 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">โปรไฟล์</span>
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex items-center gap-2 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">ที่อยู่</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">คำสั่งซื้อ</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">ความปลอดภัย</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    ข้อมูลส่วนตัว
                  </CardTitle>
                  <Button
                    variant={isEditing ? "outline" : "ghost"}
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    {isEditing ? "ยกเลิก" : "แก้ไข"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleUpdateProfile)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">ชื่อ-นามสกุล</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="กรอกชื่อ-นามสกุล"
                                disabled={!isEditing}
                                className={`transition-all duration-200 ${
                                  !isEditing ? 'bg-gray-50 border-gray-200' : 'border-blue-200 focus:border-blue-500'
                                }`}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">เบอร์โทรศัพท์</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                  placeholder="0xx-xxx-xxxx"
                                  disabled={!isEditing}
                                  className={`pl-10 transition-all duration-200 ${
                                    !isEditing ? 'bg-gray-50 border-gray-200' : 'border-slate-300 focus:border-slate-500'
                                  }`}
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {isEditing && (
                      <div className="flex gap-3 pt-4">
                        <Button
                          type="submit"
                          disabled={isUpdating}
                          className="flex-1 bg-slate-900 hover:bg-slate-800 text-white shadow-lg transition-colors duration-200"
                        >
                          {isUpdating ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              กำลังบันทึก...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              บันทึกข้อมูล
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          className="px-6"
                        >
                          ยกเลิก
                        </Button>
                      </div>
                    )}
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-slate-600" />
                  ที่อยู่สำหรับจัดส่ง
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAddresses ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
                    <span className="ml-2 text-gray-600">กำลังโหลดที่อยู่...</span>
                  </div>
                ) : addresses && addresses.length > 0 ? (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <div key={address.id} className="border border-gray-200 p-6 rounded-lg bg-gray-50 hover:shadow-md transition-all duration-200">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <Home className="w-4 h-4 text-gray-500" />
                              <p className="font-semibold text-gray-900">{address.full_name}</p>
                              {address.is_default && (
                                <Badge className="bg-slate-100 text-slate-800">
                                  ที่อยู่เริ่มต้น
                                </Badge>
                              )}
                            </div>
                            {address.phone && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="w-3 h-3" />
                                <span>{address.phone}</span>
                              </div>
                            )}
                            <div className="text-gray-700">
                              <p>{address.address_line_1}</p>
                              {address.address_line_2 && <p>{address.address_line_2}</p>}
                              <p>{address.city}, {address.province} {address.postal_code}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-700">
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button 
                      className="w-full border-2 border-dashed border-gray-300 bg-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                      onClick={() => {
                        toast({
                          title: "กำลังพัฒนา",
                          description: "ฟีเจอร์เพิ่มที่อยู่ใหม่กำลังอยู่ในระหว่างการพัฒนา",
                        });
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      เพิ่มที่อยู่ใหม่
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีที่อยู่จัดส่ง</h3>
                    <p className="text-gray-600 mb-6">เพิ่มที่อยู่เพื่อให้การสั่งซื้อสะดวกขึ้น</p>
                    <Button 
                      className="bg-slate-900 hover:bg-slate-800 text-white"
                      onClick={() => {
                        toast({
                          title: "กำลังพัฒนา",
                          description: "ฟีเจอร์เพิ่มที่อยู่ใหม่กำลังอยู่ในระหว่างการพัฒนา",
                        });
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      เพิ่มที่อยู่แรก
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Package className="h-5 w-5 text-slate-600" />
                  ประวัติการสั่งซื้อ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีประวัติการสั่งซื้อ</h3>
                  <p className="text-gray-600 mb-6">เมื่อคุณสั่งซื้อสินค้า ประวัติจะแสดงที่นี่</p>
                  <Button 
                    className="bg-slate-900 hover:bg-slate-800 text-white"
                    onClick={() => navigate('/products')}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    เริ่มช้อปปิ้ง
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Shield className="h-5 w-5 text-slate-600" />
                  ความปลอดภัยของบัญชี
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Account Security Status */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-green-900">บัญชีของคุณปลอดภัย</h4>
                      <p className="text-sm text-green-700">อีเมลได้รับการยืนยันแล้ว</p>
                    </div>
                  </div>
                </div>

                {/* Change Password Form */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    เปลี่ยนรหัสผ่าน
                  </h3>
                  
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">รหัสผ่านปัจจุบัน</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showCurrentPassword ? "text" : "password"}
                                  placeholder="กรอกรหัสผ่านปัจจุบัน"
                                  className="pr-10 border-gray-200 focus:border-slate-400 transition-all duration-200"
                                  {...field}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                  {showCurrentPassword ? (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-gray-400" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">รหัสผ่านใหม่</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showNewPassword ? "text" : "password"}
                                  placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                                  className="pr-10 border-gray-200 focus:border-slate-400 transition-all duration-200"
                                  {...field}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                  {showNewPassword ? (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-gray-400" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={passwordForm.control}
                        name="confirmNewPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">ยืนยันรหัสผ่านใหม่</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showConfirmPassword ? "text" : "password"}
                                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                                  className="pr-10 border-gray-200 focus:border-slate-400 transition-all duration-200"
                                  {...field}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                  {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-gray-400" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        disabled={isChangingPassword}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-lg transition-colors duration-200"
                      >
                        {isChangingPassword ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            กำลังเปลี่ยนรหัสผ่าน...
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4 mr-2" />
                            เปลี่ยนรหัสผ่าน
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </div>

                {/* Security Tips */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <h4 className="font-medium text-slate-900 mb-2">เคล็ดลับความปลอดภัย</h4>
                  <ul className="text-sm text-slate-700 space-y-1">
                    <li>• ใช้รหัสผ่านที่มีความยาวอย่างน้อย 8 ตัวอักษร</li>
                    <li>• ผสมผสานตัวอักษรใหญ่ เล็ก ตัวเลข และสัญลักษณ์</li>
                    <li>• หลีกเลี่ยงการใช้ข้อมูลส่วนตัวในรหัสผ่าน</li>
                    <li>• เปลี่ยนรหัสผ่านเป็นประจำทุก 3-6 เดือน</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>


  );
};

export default Account;