
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, User, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { generateOTP, getOTPExpirationTime } from '@/utils/otpUtils';

const registerSchema = z.object({
  email: z.string().email('Email tidak valid'),
  username: z.string().min(3, 'Username minimal 3 karakter'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak sama",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

interface RegisterPageProps {
  onBackClick: () => void;
  onRegisterSuccess: (email: string) => void;
}

export const RegisterPage = ({ onBackClick, onRegisterSuccess }: RegisterPageProps) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const sendOTPEmail = async (email: string, otp: string, name: string) => {
    try {
      const response = await fetch('/api/send-otp-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp,
          name,
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

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', data.email)
        .single();

      if (existingUser) {
        toast({
          variant: "destructive",
          title: "Registrasi Gagal",
          description: "Email sudah terdaftar",
        });
        return;
      }

      // Create user account with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            full_name: data.username,
          },
        },
      });

      if (authError) {
        toast({
          variant: "destructive",
          title: "Registrasi Gagal",
          description: authError.message,
        });
        return;
      }

      if (!authData.user) {
        toast({
          variant: "destructive",
          title: "Registrasi Gagal",
          description: "Gagal membuat akun",
        });
        return;
      }

      // Generate and save OTP
      const otp = generateOTP();
      const expiresAt = getOTPExpirationTime();

      const { error: otpError } = await supabase
        .from('otp_verifications')
        .insert([{
          user_id: authData.user.id,
          email: data.email,
          otp_code: otp,
          expires_at: expiresAt,
        }]);

      if (otpError) {
        console.error('Error saving OTP:', otpError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Gagal menyimpan kode verifikasi",
        });
        return;
      }

      // Send OTP via email
      try {
        await sendOTPEmail(data.email, otp, data.username);
        
        toast({
          title: "Registrasi Berhasil",
          description: "Kode verifikasi telah dikirim ke email Anda",
        });
        
        onRegisterSuccess(data.email);
      } catch (emailError) {
        console.error('Error sending OTP email:', emailError);
        toast({
          title: "Registrasi Berhasil",
          description: "Akun berhasil dibuat. Silakan masukkan kode OTP: " + otp,
        });
        onRegisterSuccess(data.email);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Terjadi kesalahan saat registrasi",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-lg dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="sm" onClick={onBackClick}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl dark:text-gray-200">Register</CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="dark:text-gray-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="masukkan email"
                  className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="dark:text-gray-300">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="masukkan username"
                  className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  {...register('username')}
                />
              </div>
              {errors.username && (
                <p className="text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="dark:text-gray-300">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="masukkan password"
                  className="pl-10 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  {...register('password')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="dark:text-gray-300">Konfirmasi Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="konfirmasi password"
                  className="pl-10 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  {...register('confirmPassword')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
