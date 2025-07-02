
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

type LoginForm = z.infer<typeof loginSchema>;

interface LoginPageProps {
  onBackClick: () => void;
  onForgotPasswordClick: () => void;
  onLoginSuccess: (isAdmin?: boolean) => void;
}

export const LoginPage = ({ onBackClick, onForgotPasswordClick, onLoginSuccess }: LoginPageProps) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    
    try {
      // Check if this is admin login
      const isAdmin = data.email === 'Adminstudizen@studizen.com' && data.password === 'admin123';
      
      if (isAdmin) {
        // Admin login - simulate successful login
        toast({
          title: "Login Berhasil",
          description: "Selamat datang, Admin!",
        });
        onLoginSuccess(true);
        return;
      }

      // Regular user login
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Login Gagal",
          description: error.message === 'Invalid login credentials' 
            ? 'Email atau password salah' 
            : error.message,
        });
        return;
      }

      if (!authData.user) {
        toast({
          variant: "destructive",
          title: "Login Gagal",
          description: "Tidak dapat masuk ke akun",
        });
        return;
      }

      // Check if user is verified
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_verified')
        .eq('id', authData.user.id)
        .single();

      if (profile && !profile.is_verified) {
        toast({
          variant: "destructive",
          title: "Akun Belum Diverifikasi",
          description: "Silakan verifikasi akun Anda terlebih dahulu",
        });
        
        // Sign out unverified user
        await supabase.auth.signOut();
        return;
      }

      toast({
        title: "Login Berhasil",
        description: "Selamat datang kembali!",
      });
      
      onLoginSuccess(false);
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Terjadi kesalahan saat login",
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
            <CardTitle className="text-2xl dark:text-gray-200">Login</CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="dark:text-gray-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="masukkan email"
                  className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  {...form.register('email')}
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.email.message}
                </p>
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
                  {...form.register('password')}
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
              {form.formState.errors.password && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="link"
                onClick={onForgotPasswordClick}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 px-0"
              >
                Lupa Password?
              </Button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
