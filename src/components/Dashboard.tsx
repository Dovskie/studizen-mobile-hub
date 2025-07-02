
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar, BookOpen, CheckCircle, Clock, 
  User, Settings, LogOut, GraduationCap, Menu, X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { JadwalKuliah, Tugas } from '@/types/database';
import { useIsMobile } from '@/hooks/use-mobile';
import { SmartAssistant } from '@/components/SmartAssistant';

interface DashboardProps {
  onJadwalClick: () => void;
  onTugasClick: () => void;
  onProfileClick: () => void;
  onAdminClick?: () => void;
}

export const Dashboard = ({ onJadwalClick, onTugasClick, onProfileClick, onAdminClick }: DashboardProps) => {
  const { user, profile, signOut } = useAuth();
  const [jadwalHariIni, setJadwalHariIni] = useState<JadwalKuliah[]>([]);
  const [tugasRingkasan, setTugasRingkasan] = useState<Tugas[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  // Check if current user is admin
  const isAdmin = user?.email === 'Adminstudizen@studizen.com';

  const hariOptions = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const hariIni = hariOptions[new Date().getDay()];

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch jadwal hari ini
      const { data: jadwalData, error: jadwalError } = await supabase
        .from('jadwal_kuliah')
        .select('*')
        .eq('user_id', user.id)
        .eq('hari', hariIni)
        .order('jam_mulai', { ascending: true });

      if (jadwalError) {
        console.error('Error fetching jadwal:', jadwalError);
      } else {
        setJadwalHariIni(jadwalData || []);
      }

      // Fetch tugas ringkasan (3 tugas terdekat)
      const { data: tugasData, error: tugasError } = await supabase
        .from('tugas')
        .select('*')
        .eq('user_id', user.id)
        .order('deadline', { ascending: true })
        .limit(3);

      if (tugasError) {
        console.error('Error fetching tugas:', tugasError);
      } else {
        setTugasRingkasan((tugasData || []).map(tugas => ({
          ...tugas,
          status: tugas.status as 'pending' | 'in_progress' | 'completed'
        })));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleProfileClick = () => {
    onProfileClick();
    closeMobileMenu();
  };

  const handleLogoutClick = () => {
    handleLogout();
    closeMobileMenu();
  };

  const handleAdminClick = () => {
    if (onAdminClick) {
      onAdminClick();
      closeMobileMenu();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Menu */}
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="p-2 hover:bg-white/20 dark:hover:bg-gray-700/20"
              >
                <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              </Button>
            )}
            
            <div className="bg-blue-600 p-3 rounded-full">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className={`font-bold text-gray-800 dark:text-gray-200 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
                Dashboard
              </h1>
              <p className={`text-gray-600 dark:text-gray-400 ${isMobile ? 'text-sm' : ''}`}>
                Selamat datang, {profile?.full_name || profile?.username || user?.email}!
              </p>
            </div>
          </div>
          
          {/* Desktop Menu */}
          {!isMobile && (
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onAdminClick}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onProfileClick}
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Settings className="h-4 w-4 mr-2" />
                Profile
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Slide Menu Overlay */}
        {isMobile && isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={closeMobileMenu}>
            <div 
              className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Menu</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeMobileMenu}
                    className="p-1"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={closeMobileMenu}
                  >
                    <GraduationCap className="h-5 w-5 mr-3" />
                    Dashboard
                  </Button>
                  
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600"
                      onClick={handleAdminClick}
                    >
                      <Settings className="h-5 w-5 mr-3" />
                      Admin Panel
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={handleProfileClick}
                  >
                    <User className="h-5 w-5 mr-3" />
                    Profile
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600"
                    onClick={handleLogoutClick}
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Smart Assistant */}
        <div className="mb-8">
          <SmartAssistant />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700" onClick={onJadwalClick}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-gray-200">
                <Calendar className="h-5 w-5 text-blue-600" />
                Jadwal Kuliah
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">Kelola jadwal kuliah mingguan Anda</p>
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                Buka Jadwal
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700" onClick={onTugasClick}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-gray-200">
                <BookOpen className="h-5 w-5 text-green-600" />
                Tugas Kuliah
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">Pantau dan kelola tugas kuliah Anda</p>
              <Button className="mt-4 bg-green-600 hover:bg-green-700">
                Buka Tugas
              </Button>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Memuat data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Jadwal Hari Ini */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-gray-200">
                  <Calendar className="h-5 w-5" />
                  Jadwal Hari Ini ({hariIni})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {jadwalHariIni.length > 0 ? (
                  <div className="space-y-3">
                    {jadwalHariIni.map((jadwal) => (
                      <div key={jadwal.id} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">{jadwal.mata_kuliah}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {jadwal.jam_mulai} - {jadwal.jam_selesai}
                          </div>
                          {jadwal.lokasi && (
                            <span>📍 {jadwal.lokasi}</span>
                          )}
                        </div>
                        {jadwal.dosen && (
                          <div className="flex items-center gap-1 mt-1 text-sm text-gray-600 dark:text-gray-400">
                            <User className="h-3 w-3" />
                            {jadwal.dosen}
                          </div>
                        )}
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

            {/* Tugas Mendatang */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-gray-200">
                  <BookOpen className="h-5 w-5" />
                  Tugas Mendatang
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tugasRingkasan.length > 0 ? (
                  <div className="space-y-3">
                    {tugasRingkasan.map((tugas) => (
                      <div key={tugas.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 dark:text-gray-200">{tugas.judul}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{tugas.mata_kuliah}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="h-3 w-3 text-gray-500" />
                              <span className="text-xs text-gray-500">
                                {new Date(tugas.deadline).toLocaleDateString('id-ID')}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {tugas.status === 'completed' ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <div className={`h-2 w-2 rounded-full ${
                                tugas.status === 'in_progress' ? 'bg-blue-500' : 'bg-yellow-500'
                              }`} />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    Tidak ada tugas yang perlu dikerjakan
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
