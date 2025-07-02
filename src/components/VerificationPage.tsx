
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { generateOTP, getOTPExpirationTime, isOTPExpired } from '@/utils/otpUtils';

interface VerificationPageProps {
  email: string;
  onBackClick: () => void;
  onVerificationSuccess: () => void;
}

export const VerificationPage = ({ email, onBackClick, onVerificationSuccess }: VerificationPageProps) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [attempts, setAttempts] = useState(0);
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

  const sendOTPEmail = async (email: string, otp: string) => {
    try {
      const response = await fetch('/api/send-otp-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send OTP email');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending OTP email:', error);
      throw error;
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

    if (attempts >= 5) {
      toast({
        variant: "destructive",
        title: "Terlalu Banyak Percobaan",
        description: "Anda telah mencoba 5 kali. Silakan minta kode baru.",
      });
      return;
    }

    setLoading(true);
    setAttempts(prev => prev + 1);
    
    try {
      // Verify OTP from database
      const { data: otpData, error: otpError } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('email', email)
        .eq('otp_code', otpCode)
        .eq('is_used', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (otpError || !otpData) {
        toast({
          variant: "destructive",
          title: "Kode OTP Tidak Valid",
          description: "Kode OTP yang Anda masukkan salah",
        });
        return;
      }

      // Check if OTP is expired
      if (isOTPExpired(otpData.expires_at)) {
        toast({
          variant: "destructive",
          title: "Kode OTP Kedaluwarsa",
          description: "Kode OTP telah kedaluwarsa. Silakan minta kode baru.",
        });
        return;
      }

      // Mark OTP as used
      const { error: updateError } = await supabase
        .from('otp_verifications')
        .update({ is_used: true })
        .eq('id', otpData.id);

      if (updateError) {
        console.error('Error updating OTP:', updateError);
      }

      // Update user profile as verified
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', otpData.user_id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
      }

      toast({
        title: "Verifikasi Berhasil",
        description: "Akun Anda telah diverifikasi",
      });
      
      onVerificationSuccess();
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        variant: "destructive",
        title: "Verifikasi Gagal",
        description: "Terjadi kesalahan saat verifikasi",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    
    setResendCooldown(60);
    setAttempts(0); // Reset attempts when resending
    
    try {
      // Generate new OTP
      const newOtp = generateOTP();
      const expiresAt = getOTPExpirationTime();

      // Get user ID from email
      const { data: userData } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (!userData) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "User tidak ditemukan",
        });
        return;
      }

      // Mark old OTPs as used
      await supabase
        .from('otp_verifications')
        .update({ is_used: true })
        .eq('email', email)
        .eq('is_used', false);

      // Insert new OTP
      const { error: otpError } = await supabase
        .from('otp_verifications')
        .insert([{
          user_id: userData.id,
          email: email,
          otp_code: newOtp,
          expires_at: expiresAt,
        }]);

      if (otpError) {
        console.error('Error saving new OTP:', otpError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Gagal menyimpan kode verifikasi baru",
        });
        return;
      }

      // Send new OTP via email
      try {
        await sendOTPEmail(email, newOtp);
        toast({
          title: "Kode Dikirim",
          description: "Kode verifikasi baru telah dikirim ke email Anda",
        });
      } catch (emailError) {
        console.error('Error sending OTP email:', emailError);
        toast({
          title: "Kode Dibuat",
          description: "Kode verifikasi baru: " + newOtp,
        });
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal mengirim ulang kode verifikasi",
      });
    }
  };

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-lg dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="sm" onClick={onBackClick}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl dark:text-gray-200">Verifikasi</CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              Kode verifikasi telah dikirim ke email kamu di{' '}
              <span className="font-semibold text-blue-600 dark:text-blue-400">{maskedEmail}</span>.
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
                className="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            ))}
          </div>

          {attempts > 0 && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Percobaan: {attempts}/5
            </p>
          )}

          <Button
            onClick={handleVerify}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
            disabled={loading || attempts >= 5}
          >
            {loading ? 'MEMVERIFIKASI...' : 'VERIFIKASI'}
          </Button>

          <div className="text-center">
            <Button
              variant="link"
              onClick={handleResendCode}
              disabled={resendCooldown > 0}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {resendCooldown > 0 
                ? `Kirim Ulang Kode (${resendCooldown}s)` 
                : 'Kirim Ulang Kode'
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
