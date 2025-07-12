import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const loginSchema = z.object({
  email: z.string().email("กรุณากรอกอีเมลที่ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
});

const signupSchema = z.object({
  fullName: z.string().min(2, "กรุณากรอกชื่อ-นามสกุล"),
  email: z.string().email("กรุณากรอกอีเมลที่ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
  confirmPassword: z.string(),
  phone: z.string().optional(),
  // เพิ่มฟิลด์สำหรับข้อมูลที่อยู่
  addressLine1: z.string().min(1, "กรุณากรอกที่อยู่ 1"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "กรุณากรอกเมือง/เขต"),
  province: z.string().min(1, "กรุณากรอกจังหวัด"),
  postalCode: z.string().min(5, "กรุณากรอกรหัสไปรษณีย์ 5 หลัก"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "รหัสผ่านไม่ตรงกัน",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      province: "",
      postalCode: "",
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast({
          title: "ไม่สามารถเข้าสู่ระบบได้",
          description: error.message === "Invalid login credentials"
            ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
            : error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "เข้าสู่ระบบสำเร็จ",
        description: "ยินดีต้อนรับสู่ Urban Threads",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      const { data: userData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone || null,
          },
        },
      });

      if (signUpError) {
        console.error('Signup error:', signUpError);
        if (signUpError.message.includes("User already registered")) {
          toast({
            title: "ไม่สามารถสมัครสมาชิกได้",
            description: "อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น",
            variant: "destructive",
          });
        } else {
          toast({
            title: "ไม่สามารถสมัครสมาชิกได้",
            description: signUpError.message,
            variant: "destructive",
          });
        }
        return;
      }

      console.log('User data after signup:', userData);

      if (!userData?.user) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถสร้างบัญชีผู้ใช้ได้",
          variant: "destructive",
        });
        return;
      }

      if (userData.session) {
        await createUserDataAfterSignup(userData.user.id, data);
      } else {
        console.log('User not automatically logged in, attempting login...');
        
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (loginError) {
          console.error('Auto login error:', loginError);
          toast({
            title: "สมัครสมาชิกสำเร็จ",
            description: "กรุณาตรวจสอบอีเมลเพื่อยืนยันการสมัครสมาชิก จากนั้นเข้าสู่ระบบและเพิ่มข้อมูลที่อยู่",
          });
          setIsLogin(true);
          signupForm.reset();
          return;
        }

        if (loginData.user) {
          console.log('Auto login successful');
          await createUserDataAfterSignup(loginData.user.id, data);
        }
      }

      toast({
        title: "สมัครสมาชิกสำเร็จ",
        description: "บัญชีของคุณพร้อมใช้งานแล้ว ข้อมูลและที่อยู่ได้รับการบันทึกแล้ว",
      });

      signupForm.reset();
      setIsLogin(true);

    } catch (error) {
      console.error('Unexpected error during signup:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createUserDataAfterSignup = async (userId: string, formData: SignupFormData) => {
    console.log('Creating user data for user ID:', userId);

    try {
      // สร้าง profile record
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: formData.fullName,
          phone: formData.phone || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error('Profile insert error:', profileError);
        throw profileError;
      } else {
        console.log('Profile created successfully');
      }

      // สร้าง address record
      const { error: addressError } = await supabase
        .from('addresses')
        .insert({
          user_id: userId,
          full_name: formData.fullName,
          phone: formData.phone || null,
          address_line_1: formData.addressLine1,
          address_line_2: formData.addressLine2 || null,
          city: formData.city,
          province: formData.province,
          postal_code: formData.postalCode,
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (addressError) {
        console.error('Address insert error:', addressError);
        throw addressError;
      } else {
        console.log('Address created successfully');
      }

    } catch (error) {
      console.error('Error creating user data:', error);
      toast({
        title: "สมัครสมาชิกสำเร็จ แต่บันทึกข้อมูลเพิ่มเติมไม่ได้",
        description: "คุณสามารถเพิ่มข้อมูลส่วนตัวและที่อยู่ภายหลังในหน้าบัญชีได้",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 to-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-light text-gray-900 mb-2">Urban Threads</h1>
          <p className="text-gray-600">
            {isLogin ? "เข้าสู่ระบบเพื่อดำเนินการต่อ" : "สร้างบัญชีใหม่ของคุณ"}
          </p>
        </div>

        <Card className="p-8 shadow-2xl border-warm-gray-200 hover-lift transition-all duration-300">
          {isLogin ? (
            <div key="login-form" className="animate-fade-in">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>อีเมล</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="กรอกอีเมลของคุณ"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>รหัสผ่าน</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="กรอกรหัสผ่าน"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-sage-green hover:bg-sage-green/90 text-white transform hover:scale-105 transition-transform"
                    disabled={isLoading}
                  >
                    {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                  </Button>
                </form>
              </Form>
            </div>
          ) : (
            <div key="signup-form" className="animate-fade-in">
              <Form {...signupForm}>
                <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-6">
                  {/* ส่วนข้อมูลส่วนตัว */}
                  <h2 className="text-lg font-semibold text-gray-900">ข้อมูลส่วนตัว</h2>
                  <Separator className="my-4" />
                  <FormField
                    control={signupForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ชื่อ-นามสกุล</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="กรอกชื่อ-นามสกุล"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signupForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>อีเมล</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="กรอกอีเมลของคุณ"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signupForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>เบอร์โทรศัพท์</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="กรอกเบอร์โทรศัพท์ (ไม่บังคับ)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* ส่วนข้อมูลที่อยู่ */}
                  <h2 className="text-lg font-semibold text-gray-900 pt-4">ข้อมูลที่อยู่</h2>
                  <Separator className="my-4" />
                  <FormField
                    control={signupForm.control}
                    name="addressLine1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ที่อยู่ 1</FormLabel>
                        <FormControl>
                          <Input placeholder="บ้านเลขที่, หมู่, ซอย, ถนน" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="addressLine2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ที่อยู่ 2 (ไม่บังคับ)</FormLabel>
                        <FormControl>
                          <Input placeholder="อาคาร, ชั้น, ห้อง, หมู่บ้าน" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={signupForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>เมือง/เขต</FormLabel>
                          <FormControl>
                            <Input placeholder="เมือง/เขต" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="province"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>จังหวัด</FormLabel>
                          <FormControl>
                            <Input placeholder="จังหวัด" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={signupForm.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>รหัสไปรษณีย์</FormLabel>
                        <FormControl>
                          <Input placeholder="รหัสไปรษณีย์" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* ส่วนข้อมูลรหัสผ่าน */}
                  <h2 className="text-lg font-semibold text-gray-900 pt-4">ข้อมูลรหัสผ่าน</h2>
                  <Separator className="my-4" />
                  <FormField
                    control={signupForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>รหัสผ่าน</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="กรอกรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signupForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ยืนยันรหัสผ่าน</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="กรอกรหัสผ่านอีกครั้ง"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-sage-green hover:bg-sage-green/90 text-white transform hover:scale-105 transition-transform"
                    disabled={isLoading}
                  >
                    {isLoading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
                  </Button>
                </form>
              </Form>
            </div>
          )}

          <div className="mt-6 text-center">
            <Button
              variant="link"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-sage-green hover:underline"
            >
              {isLogin
                ? "ยังไม่มีบัญชี? สมัครสมาชิก"
                : "มีบัญชีแล้ว? เข้าสู่ระบบ"
              }
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Auth;