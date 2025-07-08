import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

const profileSchema = z.object({
  full_name: z.string().min(1, 'Nama lengkap wajib diisi'),
  username: z.string().min(3, 'Username minimal 3 karakter'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export const ProfileForm = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      username: profile?.username || '',
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        full_name: profile.full_name || '',
        username: profile.username || '',
      });
    }
  }, [profile, form]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          username: data.username,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      
      toast({
        title: "Profil Berhasil Diperbarui",
        description: "Informasi profil Anda telah disimpan",
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Gagal Memperbarui Profil",
        description: error.message || "Terjadi kesalahan saat memperbarui profil",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-base sm:text-lg">
          <User className="h-4 w-4 sm:h-5 sm:w-5" />
          Informasi Akun
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name" className="dark:text-gray-300 text-sm">Nama Lengkap</Label>
            <Input
              id="full_name"
              placeholder="Masukkan nama lengkap"
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 h-12"
              {...form.register('full_name')}
            />
            {form.formState.errors.full_name && (
              <p className="text-sm text-red-600">
                {form.formState.errors.full_name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username" className="dark:text-gray-300 text-sm">Username</Label>
            <Input
              id="username"
              placeholder="Masukkan username"
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 h-12"
              {...form.register('username')}
            />
            {form.formState.errors.username && (
              <p className="text-sm text-red-600">
                {form.formState.errors.username.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="dark:text-gray-300 text-sm">Email</Label>
            <Input
              value={user?.email || ''}
              disabled
              className="bg-gray-100 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-300 h-12"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Email tidak dapat diubah di sini. Gunakan tab "Email" untuk mengubah email.
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 h-12"
          >
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};