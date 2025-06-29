
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, Plus, Edit2, Trash2, BookOpen, Calendar, 
  User, Save, X, AlertCircle, CheckCircle, Clock
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tugas } from '@/types/database';
import { toast } from '@/hooks/use-toast';

const tugasSchema = z.object({
  judul: z.string().min(1, 'Judul tugas wajib diisi'),
  deskripsi: z.string().optional(),
  mata_kuliah: z.string().min(1, 'Mata kuliah wajib diisi'),
  nama_dosen: z.string().min(1, 'Nama dosen wajib diisi'),
  deadline: z.string().min(1, 'Deadline wajib diisi'),
  status: z.enum(['pending', 'in_progress', 'completed']),
});

type TugasForm = z.infer<typeof tugasSchema>;

interface TugasKuliahProps {
  onBackClick: () => void;
}

export const TugasKuliah = ({ onBackClick }: TugasKuliahProps) => {
  const { user } = useAuth();
  const [tugasList, setTugasList] = useState<Tugas[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TugasForm>({
    resolver: zodResolver(tugasSchema),
    defaultValues: {
      status: 'pending',
    },
  });

  const statusOptions = [
    { value: 'pending', label: 'Belum Dikerjakan', icon: AlertCircle, color: 'text-red-600' },
    { value: 'in_progress', label: 'Sedang Dikerjakan', icon: Clock, color: 'text-yellow-600' },
    { value: 'completed', label: 'Selesai', icon: CheckCircle, color: 'text-green-600' },
  ];

  useEffect(() => {
    fetchTugas();
  }, [user]);

  const fetchTugas = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tugas')
        .select('*')
        .eq('user_id', user.id)
        .order('deadline', { ascending: true });

      if (error) throw error;
      
      // Type assertion to ensure status matches our union type
      setTugasList((data || []).map(tugas => ({
        ...tugas,
        status: tugas.status as 'pending' | 'in_progress' | 'completed'
      })));
    } catch (error) {
      console.error('Error fetching tugas:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal memuat tugas kuliah",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: TugasForm) => {
    if (!user) return;
    
    setSubmitting(true);
    try {
      if (editingId) {
        // Update existing tugas
        const { error } = await supabase
          .from('tugas')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId)
          .eq('user_id', user.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Tugas berhasil diperbarui",
        });
      } else {
        // Create new tugas
        const { error } = await supabase
          .from('tugas')
          .insert({
            ...data,
            user_id: user.id,
          });

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Tugas berhasil ditambahkan",
        });
      }

      resetForm();
      fetchTugas();
    } catch (error) {
      console.error('Error saving tugas:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menyimpan tugas",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (tugas: Tugas) => {
    setEditingId(tugas.id);
    setValue('judul', tugas.judul);
    setValue('deskripsi', tugas.deskripsi || '');
    setValue('mata_kuliah', tugas.mata_kuliah);
    setValue('nama_dosen', tugas.nama_dosen);
    setValue('deadline', tugas.deadline);
    setValue('status', tugas.status);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('tugas')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Tugas berhasil dihapus",
      });

      fetchTugas();
    } catch (error) {
      console.error('Error deleting tugas:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menghapus tugas",
      });
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'pending' | 'in_progress' | 'completed') => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('tugas')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Status tugas berhasil diperbarui",
      });

      fetchTugas();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal memperbarui status tugas",
      });
    }
  };

  const resetForm = () => {
    reset();
    setEditingId(null);
    setShowForm(false);
  };

  const filteredTugas = filterStatus === 'all' 
    ? tugasList 
    : tugasList.filter(tugas => tugas.status === filterStatus);

  const getStatusInfo = (status: string) => {
    return statusOptions.find(option => option.value === status) || statusOptions[0];
  };

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date() && Date.now() > new Date(deadline).getTime();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={onBackClick}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">Tugas Kuliah</h1>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="ml-auto bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Tugas
          </Button>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('all')}
          >
            Semua ({tugasList.length})
          </Button>
          {statusOptions.map(status => {
            const count = tugasList.filter(tugas => tugas.status === status.value).length;
            return (
              <Button
                key={status.value}
                variant={filterStatus === status.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus(status.value as any)}
              >
                {status.label} ({count})
              </Button>
            );
          })}
        </div>

        {/* Form */}
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {editingId ? 'Edit Tugas' : 'Tambah Tugas'}
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
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="judul">Judul Tugas</Label>
                    <Input
                      id="judul"
                      placeholder="contoh: Essay tentang Pemrograman Web"
                      {...register('judul')}
                    />
                    {errors.judul && (
                      <p className="text-sm text-red-600">{errors.judul.message}</p>
                    )}
                  </div>

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
                    <Label htmlFor="nama_dosen">Nama Dosen</Label>
                    <Input
                      id="nama_dosen"
                      placeholder="contoh: Dr. John Doe"
                      {...register('nama_dosen')}
                    />
                    {errors.nama_dosen && (
                      <p className="text-sm text-red-600">{errors.nama_dosen.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input
                      id="deadline"
                      type="date"
                      {...register('deadline')}
                    />
                    {errors.deadline && (
                      <p className="text-sm text-red-600">{errors.deadline.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      {...register('status')}
                    >
                      {statusOptions.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="deskripsi">Deskripsi (Opsional)</Label>
                    <textarea
                      id="deskripsi"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md h-24"
                      placeholder="Deskripsi tugas..."
                      {...register('deskripsi')}
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

        {/* Tugas List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat tugas...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTugas.length > 0 ? (
              filteredTugas.map((tugas) => {
                const statusInfo = getStatusInfo(tugas.status);
                const StatusIcon = statusInfo.icon;
                const overdue = isOverdue(tugas.deadline) && tugas.status !== 'completed';
                
                return (
                  <Card key={tugas.id} className={overdue ? 'border-red-200 bg-red-50' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                            <h3 className="font-semibold text-gray-800">
                              {tugas.judul}
                            </h3>
                            {overdue && (
                              <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">
                                TERLAMBAT
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-4 w-4" />
                              {tugas.mata_kuliah}
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {tugas.nama_dosen}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(tugas.deadline).toLocaleDateString('id-ID')}
                            </div>
                          </div>

                          {tugas.deskripsi && (
                            <p className="text-sm text-gray-600 mb-3">
                              {tugas.deskripsi}
                            </p>
                          )}

                          <div className="flex items-center gap-2">
                            <select
                              value={tugas.status}
                              onChange={(e) => handleStatusChange(tugas.id, e.target.value as any)}
                              className="text-xs px-2 py-1 border border-gray-300 rounded"
                            >
                              {statusOptions.map(status => (
                                <option key={status.value} value={status.value}>
                                  {status.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(tugas)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(tugas.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {filterStatus === 'all' ? 'Belum ada tugas' : `Tidak ada tugas dengan status ${statusOptions.find(s => s.value === filterStatus)?.label.toLowerCase()}`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
