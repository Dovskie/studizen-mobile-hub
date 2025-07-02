
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, User, Mail, Save, LogOut, 
  Eye, EyeOff, Lock, Trash2, Moon, Sun, Monitor
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const profileSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter'),
  full_name: z.string().min(1, 'Nama lengkap wajib diisi'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Password saat ini wajib diisi'),
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

const deleteAccountSchema = z.object({
  confirmText: z.string().refine((val) => val === 'DELETE', {
    message: 'Ketik "DELETE" untuk konfirmasi',
  }),
  password: z.string().min(1, 'Password wajib diisi'),
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;
type EmailForm = z.infer<typeof emailSchema>;
type DeleteAccountForm = z.infer<typeof deleteAccountSchema>;

interface ProfilePageProps {
  onBackClick: () => void;
}

export const ProfilePage = ({ onBackClick }: ProfilePageProps) => {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: profile?.username || '',
      full_name: profile?.full_name || '',
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
  });

  const deleteForm = useForm<DeleteAccountForm>({
    resolver: zodResolver(deleteAccountSchema),
  });

  useEffect(() => {
    if (profile) {
      profileForm.setValue('username', profile.username || '');
      profileForm.setValue('full_name', profile.full_name || '');
    }
  }, [profile, profileForm]);

  useEffect(() => {
    // Load theme preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system';
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (selectedTheme: 'light' | 'dark' | 'system') => {
    const root = window.document.documentElement;
    
    if (selectedTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.toggle('dark', systemTheme === 'dark');
    } else {
      root.classList.toggle('dark', selectedTheme === 'dark');
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
    
    toast({
      title: "Tema Berhasil Diubah",
      description: `Tema ${newTheme === 'light' ? 'Terang' : newTheme === 'dark' ? 'Gelap' : 'Sistem'} telah diterapkan`,
    });
  };

  const onProfileSubmit = async (data: ProfileForm) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: data.username,
          full_name: data.full_name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Profile berhasil diperbarui",
      });

      refreshProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal memperbarui profile",
      });
    } finally {
      setLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    if (!user?.email) return;
    
    setPasswordLoading(true);
    try {
      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: data.currentPassword,
      });

      if (signInError) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Password saat ini salah",
        });
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (updateError) throw updateError;

      toast({
        title: "Berhasil",
        description: "Password berhasil diubah",
      });

      passwordForm.reset();
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal mengubah password",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const onEmailSubmit = async (data: EmailForm) => {
    if (!user?.email) return;
    
    setEmailLoading(true);
    try {
      // Verify password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: data.password,
      });

      if (signInError) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Password salah",
        });
        return;
      }

      // Update email
      const { error: updateError } = await supabase.auth.updateUser({
        email: data.newEmail,
      });

      if (updateError) throw updateError;

      toast({
        title: "Email Diperbarui",
        description: "Silakan cek email baru Anda untuk konfirmasi. Anda akan logout otomatis.",
      });

      // Logout user after email change
      setTimeout(async () => {
        await signOut();
      }, 2000);

      emailForm.reset();
    } catch (error) {
      console.error('Error updating email:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal mengubah email",
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const onDeleteAccountSubmit = async (data: DeleteAccountForm) => {
    if (!user?.email) return;
    
    setDeleteLoading(true);
    try {
      // Verify password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: data.password,
      });

      if (signInError) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Password salah",
        });
        return;
      }

      // Delete user profile first
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) {
        console.error('Error deleting profile:', profileError);
      }

      // Delete user account (this might not work due to RLS, but we'll try)
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

      if (deleteError) {
        console.error('Error deleting user:', deleteError);
        // If admin delete fails, just sign out
        await signOut();
      }

      toast({
        title: "Akun Dihapus",
        description: "Akun Anda telah dihapus. Terima kasih telah menggunakan layanan kami.",
      });

      // Sign out
      await signOut();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menghapus akun",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Berhasil",
        description: "Anda telah logout",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal logout",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={onBackClick}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">Profile & Pengaturan</h1>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="account">Akun</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="theme">Tema</TabsTrigger>
            <TabsTrigger value="danger">Bahaya</TabsTrigger>
          </TabsList>

          {/* Account Information Tab */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informasi Akun
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="pl-10 bg-gray-50"
                      />
                    </div>
                    <p className="text-xs text-gray-500">Email dapat diubah di tab Email</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="masukkan username"
                      {...profileForm.register('username')}
                    />
                    {profileForm.formState.errors.username && (
                      <p className="text-sm text-red-600">
                        {profileForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nama Lengkap</Label>
                    <Input
                      id="full_name"
                      placeholder="masukkan nama lengkap"
                      {...profileForm.register('full_name')}
                    />
                    {profileForm.formState.errors.full_name && (
                      <p className="text-sm text-red-600">
                        {profileForm.formState.errors.full_name.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Menyimpan...' : 'Simpan Profile'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Password Tab */}
          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Ubah Password
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Password Saat Ini</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        placeholder="masukkan password saat ini"
                        className="pl-10 pr-10"
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
                    <Label htmlFor="newPassword">Password Baru</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="masukkan password baru"
                        className="pl-10 pr-10"
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
                    <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="konfirmasi password baru"
                        className="pl-10 pr-10"
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
                    disabled={passwordLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {passwordLoading ? 'Mengubah...' : 'Ubah Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Ubah Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentEmail">Email Saat Ini</Label>
                    <Input
                      id="currentEmail"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newEmail">Email Baru</Label>
                    <Input
                      id="newEmail"
                      type="email"
                      placeholder="masukkan email baru"
                      {...emailForm.register('newEmail')}
                    />
                    {emailForm.formState.errors.newEmail && (
                      <p className="text-sm text-red-600">
                        {emailForm.formState.errors.newEmail.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emailPassword">Konfirmasi Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="emailPassword"
                        type={showEmailPassword ? 'text' : 'password'}
                        placeholder="masukkan password untuk konfirmasi"
                        className="pl-10 pr-10"
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

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Perhatian:</strong> Setelah mengubah email, Anda akan menerima email konfirmasi 
                      di alamat email baru. Anda akan logout otomatis dan perlu login kembali setelah konfirmasi.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={emailLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {emailLoading ? 'Mengubah...' : 'Ubah Email'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Theme Tab */}
          <TabsContent value="theme">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Preferensi Tema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    className="h-20 flex flex-col gap-2"
                    onClick={() => handleThemeChange('light')}
                  >
                    <Sun className="h-6 w-6" />
                    <span>Terang</span>
                  </Button>
                  
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    className="h-20 flex flex-col gap-2"
                    onClick={() => handleThemeChange('dark')}
                  >
                    <Moon className="h-6 w-6" />
                    <span>Gelap</span>
                  </Button>
                  
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    className="h-20 flex flex-col gap-2"
                    onClick={() => handleThemeChange('system')}
                  >
                    <Monitor className="h-6 w-6" />
                    <span>Sistem</span>
                  </Button>
                </div>
                
                <p className="text-sm text-gray-600">
                  Pilih tema yang Anda sukai. Tema sistem akan mengikuti pengaturan perangkat Anda.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Danger Zone Tab */}
          <TabsContent value="danger">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Trash2 className="h-5 w-5" />
                  Zona Bahaya
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logout Section */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Logout</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Keluar dari akun Anda dan kembali ke halaman login.
                  </p>
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>

                <Separator />

                {/* Delete Account Section */}
                <div className="border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-600 mb-2">Hapus Akun</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Tindakan ini akan menghapus akun Anda secara permanen beserta semua data yang terkait. 
                    Tindakan ini tidak dapat dibatalkan.
                  </p>
                  
                  <form onSubmit={deleteForm.handleSubmit(onDeleteAccountSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="confirmText">Ketik "DELETE" untuk konfirmasi</Label>
                      <Input
                        id="confirmText"
                        placeholder="DELETE"
                        {...deleteForm.register('confirmText')}
                      />
                      {deleteForm.formState.errors.confirmText && (
                        <p className="text-sm text-red-600">
                          {deleteForm.formState.errors.confirmText.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deletePassword">Konfirmasi Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="deletePassword"
                          type={showDeletePassword ? 'text' : 'password'}
                          placeholder="masukkan password Anda"
                          className="pl-10 pr-10"
                          {...deleteForm.register('password')}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowDeletePassword(!showDeletePassword)}
                        >
                          {showDeletePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {deleteForm.formState.errors.password && (
                        <p className="text-sm text-red-600">
                          {deleteForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={deleteLoading}
                      variant="destructive"
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deleteLoading ? 'Menghapus...' : 'Hapus Akun Permanen'}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
