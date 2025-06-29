
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, Plus, Edit2, Trash2, Calendar, Clock, 
  MapPin, User, Save, X 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { JadwalKuliah as JadwalKuliahType } from '@/types/database';
import { toast } from '@/hooks/use-toast';

const jadwalSchema = z.object({
  mata_kuliah: z.string().min(1, 'Mata kuliah wajib diisi'),
  hari: z.string().min(1, 'Hari wajib dipilih'),
  jam_mulai: z.string().min(1, 'Jam mulai wajib diisi'),
  jam_selesai: z.string().min(1, 'Jam selesai wajib diisi'),
  lokasi: z.string().optional(),
  dosen: z.string().optional(),
});

type JadwalForm = z.infer<typeof jadwalSchema>;

interface JadwalKuliahProps {
  onBackClick: () => void;
}

export const JadwalKuliah = ({ onBackClick }: JadwalKuliahProps) => {
  const { user } = useAuth();
  const [jadwalList, setJadwalList] = useState<JadwalKuliahType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<JadwalForm>({
    resolver: zodResolver(jadwalSchema),
  });

  const hariOptions = [
    'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'
  ];

  useEffect(() => {
    fetchJadwal();
  }, [user]);

  const fetchJadwal = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jadwal_kuliah')
        .select('*')
        .eq('user_id', user.id)
        .order('hari', { ascending: true })
        .order('jam_mulai', { ascending: true });

      if (error) throw error;
      setJadwalList(data || []);
    } catch (error) {
      console.error('Error fetching jadwal:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal memuat jadwal kuliah",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: JadwalForm) => {
    if (!user) return;
    
    setSubmitting(true);
    try {
      if (editingId) {
        // Update existing jadwal
        const { error } = await supabase
          .from('jadwal_kuliah')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId)
          .eq('user_id', user.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Jadwal kuliah berhasil diperbarui",
        });
      } else {
        // Create new jadwal
        const { error } = await supabase
          .from('jadwal_kuliah')
          .insert({
            ...data,
            user_id: user.id,
          });

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Jadwal kuliah berhasil ditambahkan",
        });
      }

      resetForm();
      fetchJadwal();
    } catch (error) {
      console.error('Error saving jadwal:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menyimpan jadwal kuliah",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (jadwal: JadwalKuliahType) => {
    setEditingId(jadwal.id);
    setValue('mata_kuliah', jadwal.mata_kuliah);
    setValue('hari', jadwal.hari);
    setValue('jam_mulai', jadwal.jam_mulai);
    setValue('jam_selesai', jadwal.jam_selesai);
    setValue('lokasi', jadwal.lokasi || '');
    setValue('dosen', jadwal.dosen || '');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('jadwal_kuliah')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Jadwal kuliah berhasil dihapus",
      });

      fetchJadwal();
    } catch (error) {
      console.error('Error deleting jadwal:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menghapus jadwal kuliah",
      });
    }
  };

  const resetForm = () => {
    reset();
    setEditingId(null);
    setShowForm(false);
  };

  const groupedJadwal = hariOptions.reduce((acc, hari) => {
    acc[hari] = jadwalList.filter(jadwal => jadwal.hari === hari);
    return acc;
  }, {} as Record<string, JadwalKuliahType[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={onBackClick}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">Jadwal Kuliah</h1>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="ml-auto bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Jadwal
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {editingId ? 'Edit Jadwal Kuliah' : 'Tambah Jadwal Kuliah'}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetForm}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mata_kuliah">Mata Kuliah</Label>
                    <Input
                      id="mata_kuliah"
                      placeholder="contoh: Pemrograman Web"
                      {...register('mata_kuliah')}
                    />
                    {errors.mata_kuliah && (
                      <p className="text-sm text-red-600">{errors.mata_kuliah.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hari">Hari</Label>
                    <select
                      id="hari"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      {...register('hari')}
                    >
                      <option value="">Pilih Hari</option>
                      {hariOptions.map(hari => (
                        <option key={hari} value={hari}>{hari}</option>
                      ))}
                    </select>
                    {errors.hari && (
                      <p className="text-sm text-red-600">{errors.hari.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jam_mulai">Jam Mulai</Label>
                    <Input
                      id="jam_mulai"
                      type="time"
                      {...register('jam_mulai')}
                    />
                    {errors.jam_mulai && (
                      <p className="text-sm text-red-600">{errors.jam_mulai.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jam_selesai">Jam Selesai</Label>
                    <Input
                      id="jam_selesai"
                      type="time"
                      {...register('jam_selesai')}
                    />
                    {errors.jam_selesai && (
                      <p className="text-sm text-red-600">{errors.jam_selesai.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lokasi">Lokasi</Label>
                    <Input
                      id="lokasi"
                      placeholder="contoh: Ruang A101"
                      {...register('lokasi')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dosen">Dosen</Label>
                    <Input
                      id="dosen"
                      placeholder="contoh: Dr. John Doe"
                      {...register('dosen')}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {submitting ? 'Menyimpan...' : (editingId ? 'Update' : 'Simpan')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Jadwal List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat jadwal...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {hariOptions.map(hari => (
              <Card key={hari}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {hari}
                    <span className="text-sm font-normal text-gray-500">
                      ({groupedJadwal[hari].length} mata kuliah)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {groupedJadwal[hari].length > 0 ? (
                    <div className="space-y-3">
                      {groupedJadwal[hari].map((jadwal) => (
                        <div
                          key={jadwal.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">
                              {jadwal.mata_kuliah}
                            </h3>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {jadwal.jam_mulai} - {jadwal.jam_selesai}
                              </div>
                              {jadwal.lokasi && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {jadwal.lokasi}
                                </div>
                              )}
                              {jadwal.dosen && (
                                <div className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  {jadwal.dosen}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(jadwal)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(jadwal.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      Tidak ada jadwal untuk hari {hari}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
