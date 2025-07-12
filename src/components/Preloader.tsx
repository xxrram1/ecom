// src/components/Preloader.tsx

import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button"; // ✅ นำเข้า Button component

interface PreloaderProps {
  isLoading: boolean;
}

const Preloader: React.FC<PreloaderProps> = ({ isLoading }) => {
  const [showLongLoadMessage, setShowLongLoadMessage] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isLoading) {
      // ✅ เริ่มจับเวลา 10 วินาทีเมื่อ Preloader เริ่มแสดง
      timer = setTimeout(() => {
        setShowLongLoadMessage(true);
      }, 10000); // 10000 มิลลิวินาที = 10 วินาที
    } else {
      // ✅ ยกเลิกการจับเวลาเมื่อ Preloader หายไป
      setShowLongLoadMessage(false);
      clearTimeout(timer);
    }

    // ✅ Cleanup function เพื่อป้องกัน Memory Leak
    return () => clearTimeout(timer);
  }, [isLoading]);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div id="preloader" className={cn({ hidden: !isLoading })}>
      <div id="preloader-animation">
        {/* Your creative preloader SVG goes here */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150">
          <circle cx="75" cy="75" r="70" stroke="var(--sage-500)" strokeWidth="3" fill="none" opacity="0.2" />
          <path className="thread" d="M 40 75 A 35 35 0 1 1 110 75" fill="none" stroke="var(--sage-600)" strokeWidth="4" strokeLinecap="round" />
          <path className="thread" d="M 40 75 A 35 35 0 1 0 110 75" fill="none" stroke="var(--sage-600)" strokeWidth="4" strokeLinecap="round" />
          <path className="needle" d="M 75 40 L 75 110" stroke="var(--gray-500)" strokeWidth="5" strokeLinecap="round" />
          <path className="needle" d="M 70 45 A 5 5 0 0 1 80 45" stroke="var(--gray-500)" strokeWidth="5" strokeLinecap="round" />
          <circle className="needle-eye" cx="75" cy="48" r="3" fill="var(--gray-500)" />
        </svg>

        <p>กำลังโหลด...</p>

        {/* ✅ แสดงข้อความและปุ่มเมื่อโหลดนานเกิน 10 วินาที */}
        {showLongLoadMessage && (
          <div className="mt-4 text-center">
            <p className="text-red-500 mb-2">
              โหลดนานไป โปรดทำการรีเฟรชหน้าจอ
            </p>
            <Button onClick={handleRefresh}>
              รีเฟรชหน้าจอ
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Preloader;