
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, User, Mail, Lock, Palette, Trash2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const profileSchema = z.object({
  full_name: z.string().min(1, 'Nama lengkap wajib diisi'),
  username: z.string().min(3, 'Username minimal 3 karakter'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Password lama wajib diisi'),
  newPassword: z.string().min(6, 'Password baru minimal 6 karakter'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Password baru tidak sama",
  path: ["confirmPassword"],
});

const emailSchema = z.object({
  newEmail: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi untuk mengubah email'),
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;
type EmailForm = z.infer<typeof emailSchema>;

interface ProfilePageProps {
  onBackClick: () => void;
}

export const ProfilePage = ({ onBackClick }: ProfilePageProps) => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      username: profile?.username || '',
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      newEmail: '',
      password: '',
    },
  });

  useEffect(() => {
    // Load theme preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system';
    setTheme(savedTheme);
  }, []);

  useEffect(() => {
    // Update form values when profile changes
    if (profile) {
      profileForm.reset({
        full_name: profile.full_name || '',
        username: profile.username || '',
      });
    }
  }, [profile, profileForm]);

  const applyTheme = (selectedTheme: 'light' | 'dark' | 'system') => {
    const root = window.document.documentElement;
    
    if (selectedTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.toggle('dark', systemTheme === 'dark');
    } else {
      root.classList.toggle('dark', selectedTheme === 'dark');
    }
    
    localStorage.setItem('theme', selectedTheme);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    applyTheme(newTheme);
    toast({
      title: "Tema Berhasil Diubah",
      description: `Tema telah diubah ke ${newTheme === 'light' ? 'terang' : newTheme === 'dark' ? 'gelap' : 'sistem'}`,
    });
  };

  const onProfileSubmit = async (data: ProfileForm) => {
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

  const onPasswordSubmit = async (data: PasswordForm) => {
    setLoading(true);
    try {
      // Verify current password by attempting to sign in
      if (user?.email) {
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: data.currentPassword,
        });

        if (verifyError) {
          toast({
            variant: "destructive",
            title: "Password Lama Salah",
            description: "Password lama yang Anda masukkan tidak benar",
          });
          return;
        }
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) throw error;

      passwordForm.reset();
      
      toast({
        title: "Password Berhasil Diubah",
        description: "Password Anda telah diperbarui",
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        variant: "destructive",
        title: "Gagal Mengubah Password",
        description: error.message || "Terjadi kesalahan saat mengubah password",
      });
    } finally {
      setLoading(false);
    }
  };

  const onEmailSubmit = async (data: EmailForm) => {
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

      emailForm.reset();
      
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

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    const confirmation = prompt(
      'Untuk menghapus akun, ketik "HAPUS AKUN" (tanpa tanda petik):'
    );
    
    if (confirmation !== 'HAPUS AKUN') {
      toast({
        variant: "destructive",
        title: "Konfirmasi Gagal",
        description: "Konfirmasi tidak sesuai. Penghapusan akun dibatalkan.",
      });
      return;
    }

    setLoading(true);
    try {
      // Delete profile data
      await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      // Delete user data from other tables
      await supabase
        .from('jadwal_kuliah')
        .delete()
        .eq('user_id', user.id);

      await supabase
        .from('tugas')
        .delete()
        .eq('user_id', user.id);

      await supabase
        .from('otp_verifications')
        .delete()
        .eq('user_id', user.id);

      toast({
        title: "Akun Berhasil Dihapus",
        description: "Akun dan semua data Anda telah dihapus permanen",
      });

      // Sign out user
      await signOut();
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        variant: "destructive",
        title: "Gagal Menghapus Akun",
        description: error.message || "Terjadi kesalahan saat menghapus akun",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={onBackClick}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Profil & Pengaturan</h1>
            <p className="text-gray-600 dark:text-gray-400">Kelola informasi akun dan preferensi Anda</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Informasi Akun</TabsTrigger>
            <TabsTrigger value="password">Ubah Password</TabsTrigger>
            <TabsTrigger value="email">Ubah Email</TabsTrigger>
            <TabsTrigger value="settings">Pengaturan</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-gray-200">
                  <User className="h-5 w-5" />
                  Informasi Akun
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="dark:text-gray-300">Nama Lengkap</Label>
                    <Input
                      id="full_name"
                      placeholder="Masukkan nama lengkap"
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      {...profileForm.register('full_name')}
                    />
                    {profileForm.formState.errors.full_name && (
                      <p className="text-sm text-red-600">
                        {profileForm.formState.errors.full_name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username" className="dark:text-gray-300">Username</Label>
                    <Input
                      id="username"
                      placeholder="Masukkan username"
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      {...profileForm.register('username')}
                    />
                    {profileForm.formState.errors.username && (
                      <p className="text-sm text-red-600">
                        {profileForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="dark:text-gray-300">Email</Label>
                    <Input
                      value={user?.email || ''}
                      disabled
                      className="bg-gray-100 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-300"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Email tidak dapat diubah di sini. Gunakan tab "Ubah Email" untuk mengubah email.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-gray-200">
                  <Lock className="h-5 w-5" />
                  Ubah Password
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="dark:text-gray-300">Password Lama</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        placeholder="Masukkan password lama"
                        className="pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        {...passwordForm.register('currentPassword')}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="text-sm text-red-600">
                        {passwordForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="dark:text-gray-300">Password Baru</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Masukkan password baru"
                        className="pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        {...passwordForm.register('newPassword')}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-sm text-red-600">
                        {passwordForm.formState.errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="dark:text-gray-300">Konfirmasi Password Baru</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Konfirmasi password baru"
                        className="pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        {...passwordForm.register('confirmPassword')}
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
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-600">
                        {passwordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? 'Mengubah...' : 'Ubah Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-gray-200">
                  <Mail className="h-5 w-5" />
                  Ubah Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
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
                      {...emailForm.register('newEmail')}
                    />
                    {emailForm.formState.errors.newEmail && (
                      <p className="text-sm text-red-600">
                        {emailForm.formState.errors.newEmail.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="dark:text-gray-300">Password untuk Konfirmasi</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showEmailPassword ? 'text' : 'password'}
                        placeholder="Masukkan password"
                        className="pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        {...emailForm.register('password')}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowEmailPassword(!showEmailPassword)}
                      >
                        {showEmailPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {emailForm.formState.errors.password && (
                      <p className="text-sm text-red-600">
                        {emailForm.formState.errors.password.message}
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
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-gray-200">
                    <Palette className="h-5 w-5" />
                    Preferensi Tema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="dark:text-gray-300">Pilih Tema</Label>
                      <Select value={theme} onValueChange={handleThemeChange}>
                        <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Terang</SelectItem>
                          <SelectItem value="dark">Gelap</SelectItem>
                          <SelectItem value="system">Ikuti Sistem</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200 dark:border-red-800 dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <Trash2 className="h-5 w-5" />
                    Zona Bahaya
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">Hapus Akun</h3>
                      <p className="text-sm text-red-700 dark:text-red-400 mb-4">
                        Tindakan ini akan menghapus akun Anda secara permanen beserta semua data yang terkait. 
                        Tindakan ini tidak dapat dibatalkan.
                      </p>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {loading ? 'Menghapus...' : 'Hapus Akun'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
