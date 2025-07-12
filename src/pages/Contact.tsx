import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import emailjs from '@emailjs/browser';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
const ContactPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<string | null>(null);

  // Initialize EmailJS
  useEffect(() => {
    // ใส่ Public Key ของ EmailJS ตรงนี้
    emailjs.init("sXtQUVA9ZlyAcXFqn"); // จะต้องเปลี่ยนเป็น key จริง
  }, []);

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setSubmissionResult('กรุณากรอกชื่อ');
      return;
    }

    if (!email.trim() || !isValidEmail(email)) {
      setSubmissionResult('กรุณากรอกอีเมลที่ถูกต้อง');
      return;
    }

    if (!comment.trim()) {
      setSubmissionResult('กรุณากรอกข้อความ');
      return;
    }

    setIsSubmitting(true);
    setSubmissionResult(null);

    // Template parameters สำหรับ EmailJS (ให้ตรงกับ template ที่คุณออกแบบ)
    const templateParams = {
      name: name,           // {{name}} ในชื่อและข้อความ
      message: comment,     // {{message}} ในเนื้อหา
      time: new Date().toLocaleString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Bangkok'
      }), // {{time}} เวลาที่ส่งข้อความ
      from_email: email,    // สำหรับ reply-to
      phone: phone || 'ไม่ได้ระบุ', // ข้อมูลเพิ่มเติม
      reply_to: email,
    };

    try {
      // ส่งอีเมลผ่าน EmailJS
      const result = await emailjs.send(
        'service_4ih2503',    // Service ID จาก EmailJS
        'template_wvcqlo3',   // Template ID จาก EmailJS
        templateParams
      );

      console.log('EmailJS result:', result);
      
      if (result.status === 200) {
        setSubmissionResult('✅ ข้อความของคุณส่งสำเร็จแล้ว! ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง');
        setName('');
        setEmail('');
        setPhone('');
        setComment('');
      } else {
        throw new Error('Failed to send email');
      }

    } catch (error: any) {
      console.error('Error sending email:', error);
      setSubmissionResult('❌ เกิดข้อผิดพลาดในการส่งข้อความ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
      
      setTimeout(() => {
        setSubmissionResult(null);
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-gray-900 mb-4">ติดต่อเรา</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            มีคำถามหรือข้อเสนอแนะ? เราพร้อมรับฟังและช่วยเหลือคุณ
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">ข้อมูลการติดต่อ</h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-sage-100 rounded-lg flex items-center justify-center">
                    <Mail className="h-6 w-6 text-sage-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">อีเมล</h3>
                    <p className="text-gray-600">urbanthreads@example.com</p>
                    <p className="text-sm text-gray-500">เราจะตอบกลับภายใน 24 ชั่วโมง</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-sage-100 rounded-lg flex items-center justify-center">
                    <Phone className="h-6 w-6 text-sage-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">โทรศัพท์</h3>
                    <p className="text-gray-600">02-xxx-xxxx</p>
                    <p className="text-sm text-gray-500">จันทร์-ศุกร์ 9:00-18:00 น.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-sage-100 rounded-lg flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-sage-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">ที่อยู่</h3>
                    <p className="text-gray-600">123 ถนนสุขุมวิท แขวงคลองเตย<br />เขตคลองเตย กรุงเทพฯ 10110</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-sage-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-sage-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">เวลาทำการ</h3>
                    <p className="text-gray-600">จันทร์-ศุกร์: 9:00-18:00 น.</p>
                    <p className="text-gray-600">เสาร์-อาทิตย์: 10:00-16:00 น.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">ส่งข้อความถึงเรา</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-gray-700 font-medium">ชื่อ-นามสกุล *</Label>
                  <Input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="กรอกชื่อ-นามสกุลของคุณ"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-gray-700 font-medium">อีเมล *</Label>
                  <Input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-gray-700 font-medium">เบอร์โทรศัพท์</Label>
                  <Input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08x-xxx-xxxx (ไม่บังคับ)"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="comment" className="text-gray-700 font-medium">ข้อความ *</Label>
                  <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="กรุณาเขียนข้อความ คำถาม หรือข้อเสนอแนะของคุณ..."
                    rows={5}
                    className="mt-1"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      กำลังส่ง...
                    </span>
                  ) : (
                    'ส่งข้อความ'
                  )}
                </Button>

                {submissionResult && (
                  <div className={`p-4 rounded-lg text-center font-medium ${
                    submissionResult.startsWith('✅') 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {submissionResult}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ContactPage;