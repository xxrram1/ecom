import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    // สามารถแสดง Loading Spinner หรือ Placeholder ได้ที่นี่
    return <div>กำลังโหลดการยืนยันตัวตน...</div>;
  }

  if (!user) {
    // นำทางไปยังหน้าล็อกอินหากยังไม่ได้เข้าสู่ระบบ
    navigate('/auth');
    return null; // ไม่แสดงเนื้อหาของคอมโพเนนต์จนกว่าจะเข้าสู่ระบบ
  }

  return <>{children}</>;
};

export default ProtectedRoute;