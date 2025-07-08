import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { PasswordField } from './PasswordField';

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onLoginSuccess: (isAdmin?: boolean) => void;
  onForgotPasswordClick: () => void;
}

export const LoginForm = ({ onLoginSuccess, onForgotPasswordClick }: LoginFormProps) => {
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
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

      <PasswordField
        register={form.register}
        errors={form.formState.errors}
        fieldName="password"
      />

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
  );
};