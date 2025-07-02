
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Calendar, BookOpen, BarChart3, 
  ArrowLeft, Eye, Trash2, UserCheck
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Profile, JadwalKuliah, Tugas } from '@/types/database';
import { toast } from '@/hooks/use-toast';

interface AdminPanelProps {
  onBackClick: () => void;
}

export const AdminPanel = ({ onBackClick }: AdminPanelProps) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [jadwal, setJadwal] = useState<JadwalKuliah[]>([]);
  const [tugas, setTugas] = useState<Tugas[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalJadwal: 0,
    totalTugas: 0,
    completedTugas: 0
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Fetch jadwal
      const { data: jadwalData, error: jadwalError } = await supabase
        .from('jadwal_kuliah')
        .select('*')
        .order('created_at', { ascending: false });

      if (jadwalError) throw jadwalError;

      // Fetch tugas
      const { data: tugasData, error: tugasError } = await supabase
        .from('tugas')
        .select('*')
        .order('created_at', { ascending: false });

      if (tugasError) throw tugasError;

      const typedTugas: Tugas[] = (tugasData || []).map(t => ({
        ...t,
        status: t.status as 'pending' | 'in_progress' | 'completed'
      }));

      setUsers(usersData || []);
      setJadwal(jadwalData || []);
      setTugas(typedTugas);

      // Calculate stats
      setStats({
        totalUsers: usersData?.length || 0,
        totalJadwal: jadwalData?.length || 0,
        totalTugas: tugasData?.length || 0,
        completedTugas: typedTugas.filter(t => t.status === 'completed').length
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal memuat data admin",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "User berhasil dihapus",
      });

      fetchAdminData();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menghapus user",
      });
    }
  };

  const handleDeleteJadwal = async (jadwalId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return;

    try {
      const { error } = await supabase
        .from('jadwal_kuliah')
        .delete()
        .eq('id', jadwalId);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Jadwal berhasil dihapus",
      });

      fetchAdminData();
    } catch (error) {
      console.error('Error deleting jadwal:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menghapus jadwal",
      });
    }
  };

  const handleDeleteTugas = async (tugasId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus tugas ini?')) return;

    try {
      const { error } = await supabase
        .from('tugas')
        .delete()
        .eq('id', tugasId);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Tugas berhasil dihapus",
      });

      fetchAdminData();
    } catch (error) {
      console.error('Error deleting tugas:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menghapus tugas",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data admin...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={onBackClick}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
            <p className="text-gray-600">Kelola sistem dan pengguna</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-sm text-gray-600">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalJadwal}</p>
                  <p className="text-sm text-gray-600">Total Jadwal</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalTugas}</p>
                  <p className="text-sm text-gray-600">Total Tugas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.completedTugas}</p>
                  <p className="text-sm text-gray-600">Tugas Selesai</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">Kelola Users</TabsTrigger>
            <TabsTrigger value="jadwal">Kelola Jadwal</TabsTrigger>
            <TabsTrigger value="tugas">Kelola Tugas</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Daftar Pengguna</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserCheck className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{user.full_name || user.username || 'No Name'}</h4>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant={user.is_verified ? "default" : "secondary"}>
                              {user.is_verified ? 'Verified' : 'Unverified'}
                            </Badge>
                            <Badge variant="outline">{user.provider}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Jadwal Tab */}
          <TabsContent value="jadwal">
            <Card>
              <CardHeader>
                <CardTitle>Daftar Jadwal Kuliah</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jadwal.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{item.mata_kuliah}</h4>
                        <p className="text-sm text-gray-600">
                          {item.hari} • {item.jam_mulai} - {item.jam_selesai}
                        </p>
                        {item.lokasi && (
                          <p className="text-sm text-gray-600">📍 {item.lokasi}</p>
                        )}
                        {item.dosen && (
                          <p className="text-sm text-gray-600">👨‍🏫 {item.dosen}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteJadwal(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tugas Tab */}
          <TabsContent value="tugas">
            <Card>
              <CardHeader>
                <CardTitle>Daftar Tugas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tugas.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{item.judul}</h4>
                        <p className="text-sm text-gray-600">{item.mata_kuliah} • {item.nama_dosen}</p>
                        <p className="text-sm text-gray-600">
                          Deadline: {new Date(item.deadline).toLocaleDateString('id-ID')}
                        </p>
                        <Badge 
                          className={
                            item.status === 'completed' ? 'bg-green-100 text-green-800' :
                            item.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {item.status === 'completed' ? 'Selesai' :
                           item.status === 'in_progress' ? 'Dikerjakan' : 'Menunggu'}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTugas(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
