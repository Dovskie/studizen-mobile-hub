
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar, BookOpen, CheckCircle, Clock, 
  User, Settings, LogOut, GraduationCap
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { JadwalKuliah, Tugas } from '@/types/database';

interface DashboardProps {
  onJadwalClick: () => void;
  onTugasClick: () => void;
  onProfileClick: () => void;
}

export const Dashboard = ({ onJadwalClick, onTugasClick, onProfileClick }: DashboardProps) => {
  const { user, profile, signOut } = useAuth();
  const [jadwalHariIni, setJadwalHariIni] = useState<JadwalKuliah[]>([]);
  const [tugasRingkasan, setTugasRingkasan] = useState<Tugas[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-3 rounded-full">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
              <p className="text-gray-600">
                Selamat datang, {profile?.full_name || profile?.username || user?.email}!
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onProfileClick}
              className="text-gray-600 hover:text-gray-800"
            >
              <Settings className="h-4 w-4 mr-2" />
              Profile
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-800"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onJadwalClick}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Jadwal Kuliah
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Kelola jadwal kuliah mingguan Anda</p>
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                Buka Jadwal
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onTugasClick}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-green-600" />
                Tugas Kuliah
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Pantau dan kelola tugas kuliah Anda</p>
              <Button className="mt-4 bg-green-600 hover:bg-green-700">
                Buka Tugas
              </Button>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Jadwal Hari Ini */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Jadwal Hari Ini ({hariIni})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {jadwalHariIni.length > 0 ? (
                  <div className="space-y-3">
                    {jadwalHariIni.map((jadwal) => (
                      <div key={jadwal.id} className="p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">{jadwal.mata_kuliah}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {jadwal.jam_mulai} - {jadwal.jam_selesai}
                          </div>
                          {jadwal.lokasi && (
                            <span>📍 {jadwal.lokasi}</span>
                          )}
                        </div>
                        {jadwal.dosen && (
                          <div className="flex items-center gap-1 mt-1 text-sm text-gray-600">
                            <User className="h-3 w-3" />
                            {jadwal.dosen}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Tidak ada jadwal kuliah hari ini
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Tugas Mendatang */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Tugas Mendatang
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tugasRingkasan.length > 0 ? (
                  <div className="space-y-3">
                    {tugasRingkasan.map((tugas) => (
                      <div key={tugas.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800">{tugas.judul}</h4>
                            <p className="text-sm text-gray-600">{tugas.mata_kuliah}</p>
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
                  <p className="text-gray-500 text-center py-4">
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
