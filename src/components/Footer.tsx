import React from 'react';
import { Link } from 'react-router-dom';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ✅ **ลบ import SVG ทั้งหมดออก**

const Footer = () => {
  const { selectedCurrency, setSelectedCurrency } = useCurrency();

  const countries = [
    { name: 'Thailand', currency: 'THB' },
    { name: 'United States', currency: 'USD' },
    { name: 'United Kingdom', currency: 'GBP' },
    { name: 'Germany', currency: 'EUR' },
    { name: 'Japan', currency: 'JPY' },
    { name: 'Australia', currency: 'AUD' },
  ];

  // ✅ **เปลี่ยนไปใช้ URL ของรูปภาพจาก CDN แทน**
  const paymentMethods = [
{ name: 'Visa', iconUrl: 'https://www.freepnglogos.com/uploads/visa-card-logo-9.png' },
{ name: 'Mastercard', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/MasterCard_Logo.svg/2000px-MasterCard_Logo.svg.png' },
{ name: 'American Express', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/American_Express_logo.svg/1200px-American_Express_logo.svg.png' },
{ name: 'Apple Pay', iconUrl: 'https://logo-marque.com/wp-content/uploads/2022/03/Apple-Pay-Logo-2016.jpg' },
{ name: 'Google Pay', iconUrl: 'https://1000logos.net/wp-content/uploads/2022/05/Google-Wallet-Logo.png' },
];

  return (
    <footer className="bg-gray-900 text-gray-300 py-12 border-t border-gray-800 rounded-t-lg">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-lg font-semibold text-white-900 mb-4">Urban Threads</h3>
            <p className="text-gray-500 text-sm">Minimal fashion for the modern era.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white-900 mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/contact" className="hover:text-gray-900 transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-gray-900 transition-colors">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white-900 mb-4">Customer Service</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="#" className="hover:text-gray-900 transition-colors">FAQ</Link></li>
              <li><Link to="#" className="hover:text-gray-900 transition-colors">Return Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white-900 mb-4">Policies</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="#" className="hover:text-gray-900 transition-colors">Privacy Policy</Link></li>
              <li><Link to="#" className="hover:text-gray-900 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 flex flex-col items-center gap-6">
          <div className="flex flex-wrap justify-center gap-2">
            {/* ✅ **เปลี่ยน src ให้ดึงจาก iconUrl** */}
            {paymentMethods.map((method) => (
              <div key={method.name} className="bg-white rounded-md p-1 border border-gray-200">
                <img src={method.iconUrl} alt={method.name} className="h-6 w-auto" />
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-gray-500">
            <span>&copy; 2024 Urban Threads. All Rights Reserved.</span>
            <div className="flex items-center gap-2">
                <span>Country/region:</span>
                <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                  <SelectTrigger className="w-auto bg-transparent border-none p-1 h-auto focus:ring-0">
                    <SelectValue placeholder="Select a currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.name} value={country.currency}>
                        {country.name} | {country.currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;