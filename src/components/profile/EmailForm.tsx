import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const emailSchema = z.object({
  newEmail: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi untuk mengubah email'),
});

type EmailFormData = z.infer<typeof emailSchema>;

export const EmailForm = () => {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      newEmail: '',
      password: '',
    },
  });

  const onSubmit = async (data: EmailFormData) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Verify password first
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: data.password,
      });

      if (verifyError) {
        toast({
          variant: "destructive",
          title: "Password Salah",
          description: "Password yang Anda masukkan tidak benar",
        });
        return;
      }

      // Update email
      const { error } = await supabase.auth.updateUser({
        email: data.newEmail,
      });

      if (error) throw error;

      // Update profile table
      await supabase
        .from('profiles')
        .update({
          email: data.newEmail,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      form.reset();
      
      toast({
        title: "Email Berhasil Diubah",
        description: "Email Anda telah diperbarui. Silakan periksa email baru untuk konfirmasi.",
      });

      // Sign out user to re-authenticate with new email
      setTimeout(() => {
        signOut();
      }, 2000);
    } catch (error: any) {
      console.error('Error updating email:', error);
      toast({
        variant: "destructive",
        title: "Gagal Mengubah Email",
        description: error.message || "Terjadi kesalahan saat mengubah email",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-gray-200">
          <Mail className="h-5 w-5" />
          Ubah Email
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label className="dark:text-gray-300">Email Saat Ini</Label>
            <Input
              value={user?.email || ''}
              disabled
              className="bg-gray-100 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newEmail" className="dark:text-gray-300">Email Baru</Label>
            <Input
              id="newEmail"
              type="email"
              placeholder="Masukkan email baru"
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              {...form.register('newEmail')}
            />
            {form.formState.errors.newEmail && (
              <p className="text-sm text-red-600">
                {form.formState.errors.newEmail.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="dark:text-gray-300">Password untuk Konfirmasi</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan password"
                className="pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
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

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Peringatan:</strong> Setelah mengubah email, Anda akan diminta untuk login ulang dengan email baru.
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Mengubah...' : 'Ubah Email'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};