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
import { ArrowLeft, User, Mail, Lock, Palette, Trash2, Eye, EyeOff, Star, Crown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePremium } from '@/contexts/PremiumContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { PremiumModal } from './PremiumModal';

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
  const { isPremium, subscription } = usePremium();
  const { language, setLanguage, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

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
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system';
    setTheme(savedTheme);
  }, []);

  useEffect(() => {
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

  const handleLanguageChange = async (newLanguage: 'en' | 'id' | 'zh') => {
    await setLanguage(newLanguage);
    toast({
      title: "Bahasa Berhasil Diubah",
      description: "Pengaturan bahasa telah disimpan",
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
      await supabase.from('profiles').delete().eq('id', user.id);
      await supabase.from('jadwal_kuliah').delete().eq('user_id', user.id);
      await supabase.from('tugas').delete().eq('user_id', user.id);
      await supabase.from('otp_verifications').delete().eq('user_id', user.id);

      toast({
        title: "Akun Berhasil Dihapus",
        description: "Akun dan semua data Anda telah dihapus permanen",
      });

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <Button variant="ghost" size="sm" onClick={onBackClick} className="min-w-[40px]">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200 truncate">
              {t('profile')} & Pengaturan
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
              Kelola informasi akun dan preferensi Anda
            </p>
          </div>
          {isPremium && (
            <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
              <Crown className="h-3 w-3 sm:h-4 sm:w-4" />
              Premium
            </div>
          )}
        </div>

        <Tabs defaultValue="profile" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1">
            <TabsTrigger value="profile" className="text-xs sm:text-sm px-2 py-2">
              Akun
            </TabsTrigger>
            <TabsTrigger value="password" className="text-xs sm:text-sm px-2 py-2">
              Password
            </TabsTrigger>
            <TabsTrigger value="email" className="text-xs sm:text-sm px-2 py-2">
              Email
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm px-2 py-2">
              Pengaturan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-base sm:text-lg">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  Informasi Akun
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="dark:text-gray-300 text-sm">Nama Lengkap</Label>
                    <Input
                      id="full_name"
                      placeholder="Masukkan nama lengkap"
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 h-12"
                      {...profileForm.register('full_name')}
                    />
                    {profileForm.formState.errors.full_name && (
                      <p className="text-sm text-red-600">
                        {profileForm.formState.errors.full_name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username" className="dark:text-gray-300 text-sm">Username</Label>
                    <Input
                      id="username"
                      placeholder="Masukkan username"
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 h-12"
                      {...profileForm.register('username')}
                    />
                    {profileForm.formState.errors.username && (
                      <p className="text-sm text-red-600">
                        {profileForm.formState.errors.username.message}
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

            {/* Premium Subscription Card */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-base sm:text-lg">
                  <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                  Status Premium
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isPremium ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <Crown className="h-5 w-5" />
                      <span className="font-semibold">Akun Premium Aktif</span>
                    </div>
                    {subscription && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <p>Paket: {subscription.plan_type === 'monthly' ? 'Bulanan' : subscription.plan_type === 'quarterly' ? '3 Bulan' : 'Tahunan'}</p>
                        <p>Berakhir: {new Date(subscription.end_date).toLocaleDateString('id-ID')}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Upgrade ke Premium untuk akses fitur eksklusif seperti AI Assistant, Task Breakdown, dan Generate Soal Latihan.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Card className="p-3 text-center border-dashed">
                        <div className="text-lg font-bold">Rp20.000</div>
                        <div className="text-xs text-gray-500">/bulan</div>
                      </Card>
                      <Card className="p-3 text-center border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                        <div className="text-lg font-bold text-blue-600">Rp45.000</div>
                        <div className="text-xs text-blue-500">/3 bulan</div>
                        <div className="text-xs text-green-600 font-medium">Hemat 25%</div>
                      </Card>
                      <Card className="p-3 text-center border-dashed">
                        <div className="text-lg font-bold">Rp60.000</div>
                        <div className="text-xs text-gray-500">/tahun</div>
                        <div className="text-xs text-green-600 font-medium">Hemat 75%</div>
                      </Card>
                    </div>
                    <Button 
                      onClick={() => setShowPremiumModal(true)}
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 h-12"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Upgrade ke Premium
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password" className="space-y-4">
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

          <TabsContent value="email" className="space-y-4">
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

          <TabsContent value="settings" className="space-y-4">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-base sm:text-lg">
                  <Palette className="h-4 w-4 sm:h-5 sm:w-5" />
                  Preferensi Tema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="dark:text-gray-300 text-sm">Pilih Tema</Label>
                    <Select value={theme} onValueChange={handleThemeChange}>
                      <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 h-12">
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

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-base sm:text-lg">
                  🌐 {t('language')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="dark:text-gray-300 text-sm">Pilih Bahasa</Label>
                    <Select value={language} onValueChange={handleLanguageChange}>
                      <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">{t('english')}</SelectItem>
                        <SelectItem value="id">{t('indonesian')}</SelectItem>
                        <SelectItem value="zh">{t('chinese')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Fitur ini gratis untuk semua pengguna. Bahasa yang dipilih akan disimpan di profil Anda.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 dark:border-red-800 dark:bg-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400 text-base sm:text-lg">
                  <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  Zona Bahaya
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4">
                    <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2 text-sm sm:text-base">Hapus Akun</h3>
                    <p className="text-xs sm:text-sm text-red-700 dark:text-red-400 mb-4">
                      Tindakan ini akan menghapus akun Anda secara permanen beserta semua data yang terkait. 
                      Tindakan ini tidak dapat dibatalkan.
                    </p>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={loading}
                      className="w-full sm:w-auto bg-red-600 hover:bg-red-700 h-12"
                    >
                      {loading ? 'Menghapus...' : 'Hapus Akun'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </div>
  );
};
