import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const DangerZone = () => {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

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
  );
};