import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useGeoLocalization } from '@/hooks/useGeoLocalization';

// Interface สำหรับ Context
interface CurrencyContextType {
  selectedCurrency: string;
  setSelectedCurrency: React.Dispatch<React.SetStateAction<string>>;
}

// สร้าง Context
const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Key สำหรับเก็บข้อมูลใน localStorage
const CURRENCY_STORAGE_KEY = 'urban-threads-selected-currency';

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const { geoData } = useGeoLocalization();

  // ฟังก์ชันสำหรับอ่านค่าเริ่มต้นจาก localStorage
  // ถ้าไม่มีค่าอยู่ จะใช้ 'THB' เป็นค่าเริ่มต้น
  const initializeCurrency = (): string => {
    try {
      const storedCurrency = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
      return storedCurrency ? JSON.parse(storedCurrency) : 'THB';
    } catch (error) {
      console.error('ไม่สามารถอ่านค่าสกุลเงินจาก localStorage:', error);
      return 'THB';
    }
  };

  const [selectedCurrency, setSelectedCurrency] = useState<string>(initializeCurrency);

  // Effect ที่ 1: ตั้งค่าเริ่มต้นจาก Geo-localization
  // จะทำงานก็ต่อเมื่อยังไม่มีการตั้งค่าจากผู้ใช้ใน localStorage
  useEffect(() => {
    const storedCurrency = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (!storedCurrency && geoData?.currency) {
      setSelectedCurrency(geoData.currency);
    }
  }, [geoData]);

  // Effect ที่ 2: บันทึกค่าลง localStorage ทุกครั้งที่ selectedCurrency เปลี่ยน
  useEffect(() => {
    try {
      window.localStorage.setItem(CURRENCY_STORAGE_KEY, JSON.stringify(selectedCurrency));
    } catch (error) {
      console.error('ไม่สามารถบันทึกค่าสกุลเงินลง localStorage:', error);
    }
  }, [selectedCurrency]);

  return (
    <CurrencyContext.Provider value={{ selectedCurrency, setSelectedCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

// Hook สำหรับเรียกใช้ Context
export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};