import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Menu, Calendar, BookOpen, User, LogOut, 
  Moon, Sun, Clock, AlertCircle 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { JadwalKuliah, Tugas } from '@/types/database';
import { toast } from '@/hooks/use-toast';

interface DashboardProps {
  onJadwalClick: () => void;
  onTugasClick: () => void;
}

export const Dashboard = ({ onJadwalClick, onTugasClick }: DashboardProps) => {
  const { user, profile, signOut } = useAuth();
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [jadwalRingkasan, setJadwalRingkasan] = useState<JadwalKuliah[]>([]);
  const [tugasRingkasan, setTugasRingkasan] = useState<Tugas[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRingkasanData();
  }, [user]);

  const fetchRingkasanData = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Fetch jadwal kuliah hari ini
      const today = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
      const { data: jadwalData } = await supabase
        .from('jadwal_kuliah')
        .select('*')
        .eq('user_id', user.id)
        .eq('hari', today)
        .order('jam_mulai', { ascending: true })
        .limit(3);

      // Fetch tugas yang belum selesai
      const { data: tugasData } = await supabase
        .from('tugas')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'completed')
        .order('deadline', { ascending: true })
        .limit(3);

      setJadwalRingkasan(jadwalData || []);
      // Type assertion to ensure status matches our union type
      setTugasRingkasan((tugasData || []).map(tugas => ({
        ...tugas,
        status: tugas.status as 'pending' | 'in_progress' | 'completed'
      })));
    } catch (error) {
      console.error('Error fetching ringkasan data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logout Berhasil",
        description: "Sampai jumpa lagi!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal logout",
      });
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSideMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
              Dashboard
            </h1>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Selamat datang, {profile?.username || 'Mahasiswa'}!
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Jadwal Hari Ini</p>
                  <p className="text-lg font-semibold dark:text-white">{jadwalRingkasan.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tugas Aktif</p>
                  <p className="text-lg font-semibold dark:text-white">{tugasRingkasan.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Jadwal Kuliah Ringkasan */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Jadwal Kuliah Hari Ini
              </span>
              <Button variant="outline" size="sm" onClick={onJadwalClick}>
                Lihat Semua
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-500 dark:text-gray-400">Loading...</p>
            ) : jadwalRingkasan.length > 0 ? (
              <div className="space-y-3">
                {jadwalRingkasan.map((jadwal) => (
                  <div key={jadwal.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <div className="flex-1">
                      <p className="font-medium dark:text-white">{jadwal.mata_kuliah}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {jadwal.jam_mulai} - {jadwal.jam_selesai}
                        {jadwal.lokasi && ` • ${jadwal.lokasi}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                Tidak ada jadwal kuliah hari ini
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tugas Ringkasan */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Tugas Terbaru
              </span>
              <Button variant="outline" size="sm" onClick={onTugasClick}>
                Lihat Semua
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-500 dark:text-gray-400">Loading...</p>
            ) : tugasRingkasan.length > 0 ? (
              <div className="space-y-3">
                {tugasRingkasan.map((tugas) => (
                  <div key={tugas.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <div className="flex-1">
                      <p className="font-medium dark:text-white">{tugas.judul}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {tugas.mata_kuliah} • {tugas.nama_dosen}
                      </p>
                      <p className="text-xs text-orange-600 dark:text-orange-400">
                        Deadline: {new Date(tugas.deadline).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                Tidak ada tugas aktif
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Side Menu Overlay */}
      {sideMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={() => setSideMenuOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 w-80 h-full shadow-lg transform transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold dark:text-white">Menu</h2>
            </div>
            
            <div className="p-4 space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3"
                onClick={() => {
                  setSideMenuOpen(false);
                  // Navigate to profile
                }}
              >
                <User className="h-5 w-5" />
                Profil
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start gap-3"
                onClick={() => {
                  setSideMenuOpen(false);
                  onJadwalClick();
                }}
              >
                <Calendar className="h-5 w-5" />
                Jadwal Kuliah
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start gap-3"
                onClick={() => {
                  setSideMenuOpen(false);
                  onTugasClick();
                }}
              >
                <BookOpen className="h-5 w-5" />
                Tugas Kuliah
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start gap-3"
                onClick={toggleDarkMode}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
