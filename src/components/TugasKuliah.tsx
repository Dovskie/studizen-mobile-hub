
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, Plus, Edit2, Trash2, BookOpen, Clock, 
  User, Save, X, CheckCircle, Circle, AlertCircle 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tugas } from '@/types/database';
import { toast } from '@/hooks/use-toast';

const tugasSchema = z.object({
  judul: z.string().min(1, 'Judul tugas wajib diisi'),
  mata_kuliah: z.string().min(1, 'Mata kuliah wajib diisi'),
  nama_dosen: z.string().min(1, 'Nama dosen wajib diisi'),
  deadline: z.string().min(1, 'Deadline wajib diisi'),
  deskripsi: z.string().optional(),
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');

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
    { value: 'pending', label: 'Pending', color: 'text-yellow-600' },
    { value: 'in_progress', label: 'In Progress', color: 'text-blue-600' },
    { value: 'completed', label: 'Completed', color: 'text-green-600' },
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
      setTugasList(data || []);
    } catch (error) {
      console.error('Error fetching tugas:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal memuat daftar tugas",
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
            judul: data.judul,
            mata_kuliah: data.mata_kuliah,
            nama_dosen: data.nama_dosen,
            deadline: data.deadline,
            deskripsi: data.deskripsi || null,
            status: data.status,
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
            judul: data.judul,
            mata_kuliah: data.mata_kuliah,
            nama_dosen: data.nama_dosen,
            deadline: data.deadline,
            deskripsi: data.deskripsi || null,
            status: data.status,
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
    setValue('mata_kuliah', tugas.mata_kuliah);
    setValue('nama_dosen', tugas.nama_dosen);
    setValue('deadline', tugas.deadline);
    setValue('deskripsi', tugas.deskripsi || '');
    setValue('status', tugas.status as 'pending' | 'in_progress' | 'completed');
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

  const resetForm = () => {
    reset();
    setEditingId(null);
    setShowForm(false);
  };

  const filteredTugas = tugasList.filter(tugas => {
    if (statusFilter === 'all') return true;
    return tugas.status === statusFilter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Circle className="h-4 w-4 text-blue-600" />;
      default:
        return <Circle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date() && deadline !== '';
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
        <div className="mb-6">
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              Semua
            </Button>
            {statusOptions.map(option => (
              <Button
                key={option.value}
                variant={statusFilter === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(option.value as any)}
              >
                {option.label}
              </Button>
            ))}
          </div>
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
                  <div className="space-y-2">
                    <Label htmlFor="judul">Judul Tugas</Label>
                    <Input
                      id="judul"
                      placeholder="contoh: Essay Pemrograman Web"
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
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.status && (
                      <p className="text-sm text-red-600">{errors.status.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deskripsi">Deskripsi (Opsional)</Label>
                  <Textarea
                    id="deskripsi"
                    placeholder="Deskripsi tugas..."
                    rows={3}
                    {...register('deskripsi')}
                  />
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
              filteredTugas.map((tugas) => (
                <Card key={tugas.id} className={isOverdue(tugas.deadline) && tugas.status !== 'completed' ? 'border-red-200 bg-red-50' : ''}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(tugas.status)}
                          <h3 className="font-semibold text-gray-800">{tugas.judul}</h3>
                          {isOverdue(tugas.deadline) && tugas.status !== 'completed' && (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            {tugas.mata_kuliah}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {tugas.nama_dosen}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(tugas.deadline).toLocaleDateString('id-ID')}
                            {isOverdue(tugas.deadline) && tugas.status !== 'completed' && (
                              <span className="text-red-600 font-medium">(Terlambat)</span>
                            )}
                          </div>
                        </div>
                        
                        {tugas.deskripsi && (
                          <p className="mt-2 text-sm text-gray-700">{tugas.deskripsi}</p>
                        )}
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
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">
                    {statusFilter === 'all' ? 'Belum ada tugas' : `Tidak ada tugas dengan status ${statusFilter}`}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
