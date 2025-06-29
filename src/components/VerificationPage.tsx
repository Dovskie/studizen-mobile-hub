
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface VerificationPageProps {
  email: string;
  onBackClick: () => void;
  onVerificationSuccess: () => void;
}

export const VerificationPage = ({ email, onBackClick, onVerificationSuccess }: VerificationPageProps) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 4) {
      toast({
        variant: "destructive",
        title: "Kode OTP Tidak Lengkap",
        description: "Masukkan 4 digit kode OTP",
      });
      return;
    }

    setLoading(true);
    
    try {
      // In a real app, you would verify OTP with your backend
      // For now, we'll simulate verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Verifikasi Berhasil",
        description: "Akun Anda telah diverifikasi",
      });
      
      onVerificationSuccess();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Verifikasi Gagal",
        description: "Kode OTP tidak valid",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendCooldown(60);
    
    try {
      // In a real app, you would resend OTP via your backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Kode Dikirim",
        description: "Kode verifikasi baru telah dikirim ke email Anda",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal mengirim ulang kode verifikasi",
      });
    }
  };

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="sm" onClick={onBackClick}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl">Verifikasi</CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            
            <p className="text-gray-600 text-sm leading-relaxed">
              Kode verifikasi telah dikirim ke email kamu di{' '}
              <span className="font-semibold text-blue-600">{maskedEmail}</span>.
              Silakan masukkan kode tersebut untuk melanjutkan.
            </p>
          </div>

          <div className="flex justify-center gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            ))}
          </div>

          <Button
            onClick={handleVerify}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
            disabled={loading}
          >
            {loading ? 'VERIFYING...' : 'VERIFY'}
          </Button>

          <div className="text-center">
            <Button
              variant="link"
              onClick={handleResendCode}
              disabled={resendCooldown > 0}
              className="text-blue-600 hover:text-blue-700"
            >
              {resendCooldown > 0 
                ? `Resend Code (${resendCooldown}s)` 
                : 'Resend Code'
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
