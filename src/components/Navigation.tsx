import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { User, LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Cart from './Cart';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from '@/contexts/CurrencyContext';
import { SearchDialog } from './SearchDialog'; // ตรวจสอบว่า import ถูกต้อง

// Component สำหรับตัวเลือกสกุลเงิน
const CurrencySelector = () => {
  const { selectedCurrency, setSelectedCurrency } = useCurrency();
  const countries = [
    { name: 'Thailand', currency: 'THB' },
    { name: 'United States', currency: 'USD' },
    { name: 'United Kingdom', currency: 'GBP' },
    { name: 'Germany', currency: 'EUR' },
    { name: 'Japan', currency: 'JPY' },
    { name: 'Australia', currency: 'AUD' },
  ];

  const selectedCountry = countries.find(c => c.currency === selectedCurrency);

  return (
    <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
      <SelectTrigger className="w-auto border-none bg-transparent text-sm text-gray-600 hover:text-gray-900 focus:ring-0 gap-1 px-2 h-9">
        <SelectValue placeholder="Select currency">
          {selectedCountry ? `${selectedCountry.name} | ${selectedCountry.currency}` : `${selectedCurrency}`}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-white">
        {countries.map((country) => (
          <SelectItem key={country.name} value={country.currency}>
            {country.name} | {country.currency}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};


const Navigation = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `text-sm transition-colors hover:text-gray-900 ${
      isActive ? 'text-gray-900 font-medium underline underline-offset-4' : 'text-gray-500'
    }`;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-3 items-center h-16">

          {/* === คอลัมน์ที่ 1: ซ้าย (โลโก้ Desktop, เมนู Mobile) === */}
          <div className="flex items-center justify-start">
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">เปิดเมนู</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full sm:max-w-xs flex flex-col p-0">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle className="text-xl font-light">Urban Threads</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-2 p-4 flex-grow overflow-y-auto">
                    <SheetClose asChild><NavLink to="/" className={({ isActive }) => `block py-3 px-3 rounded-md text-base ${isActive ? 'bg-gray-100 font-semibold' : ''}`}>หน้าแรก</NavLink></SheetClose>
                    <SheetClose asChild><NavLink to="/products" className={({ isActive }) => `block py-3 px-3 rounded-md text-base ${isActive ? 'bg-gray-100 font-semibold' : ''}`}>สินค้าทั้งหมด</NavLink></SheetClose>
                    <SheetClose asChild><NavLink to="/contact" className={({ isActive }) => `block py-3 px-3 rounded-md text-base ${isActive ? 'bg-gray-100 font-semibold' : ''}`}>ติดต่อเรา</NavLink></SheetClose>
                  </div>
                  <div className="mt-auto border-t p-4 flex flex-col gap-2">
                    <div className="w-full"><CurrencySelector /></div>
                    {user ? (
                      <>
                        <SheetClose asChild><Button variant="ghost" onClick={() => navigate('/account')} className="w-full justify-start text-base"><User className="mr-2 h-4 w-4" /> บัญชีของฉัน</Button></SheetClose>
                        <SheetClose asChild><Button variant="ghost" onClick={handleSignOut} className="w-full justify-start text-base text-red-500 hover:text-red-600"><LogOut className="mr-2 h-4 w-4" /> ออกจากระบบ</Button></SheetClose>
                      </>
                    ) : (
                      <SheetClose asChild><Button onClick={() => navigate('/auth')} className="w-full bg-gray-900 hover:bg-gray-800 text-white text-base">เข้าสู่ระบบ / สมัครสมาชิก</Button></SheetClose>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <NavLink to="/" className="hidden md:block text-2xl font-light text-gray-900 hover:text-gray-700 transition-colors">
              Urban Threads
            </NavLink>
          </div>

          {/* === คอลัมน์ที่ 2: กลาง (โลโก้ Mobile, ลิงก์ Desktop) === */}
          <div className="flex items-center justify-center">
            <NavLink to="/" className="md:hidden text-xl font-light text-gray-900">
              Urban Threads
            </NavLink>
            <div className="hidden md:flex items-center justify-center gap-8">
              <NavLink to="/" className={navLinkClasses}>หน้าแรก</NavLink>
              <NavLink to="/products" className={navLinkClasses}>สินค้าทั้งหมด</NavLink>
              <NavLink to="/contact" className={navLinkClasses}>ติดต่อเรา</NavLink>
            </div>
          </div>

          {/* === คอลัมน์ที่ 3: ขวา (ไอคอน Actions) === */}
          <div className="flex items-center justify-end gap-1">
            {/* Actions สำหรับ Desktop */}
            <div className="hidden md:flex items-center gap-2">
              <CurrencySelector />
              {/* ✅ **แก้ไข: ใช้ SearchDialog แทนปุ่มเดิม** */}
              <SearchDialog />
              <Cart />
              {user ? (
                <Button variant="ghost" size="icon" onClick={() => navigate('/account')} className="h-9 w-9">
                  <User className="h-4 w-4 text-gray-600" />
                </Button>
              ) : (
                <Button variant="ghost" size="icon" onClick={() => navigate('/auth')} className="h-9 w-9">
                  <User className="h-4 w-4 text-gray-600" />
                </Button>
              )}
            </div>

            {/* Actions สำหรับ Mobile */}
            <div className="flex items-center md:hidden">
              {/* ✅ **แก้ไข: ใช้ SearchDialog แทนปุ่มเดิม** */}
              <SearchDialog />
              <Cart />
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navigation;