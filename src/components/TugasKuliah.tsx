import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Plus, Edit, Trash2, Calendar, 
  BookOpen, CheckCircle, Clock, AlertTriangle, User
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
  const [tugas, setTugas] = useState<Tugas[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTugas, setSelectedTugas] = useState<Tugas | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'semua' | 'pending' | 'in_progress' | 'completed'>('semua');

  const form = useForm<TugasForm>({
    resolver: zodResolver(tugasSchema),
    defaultValues: {
      judul: '',
      deskripsi: '',
      mata_kuliah: '',
      nama_dosen: '',
      deadline: '',
      status: 'pending',
    },
  });

  useEffect(() => {
    if (user) {
      fetchTugas();
    }
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

      // Type casting untuk memastikan status sesuai dengan type yang diharapkan
      const typedTugas: Tugas[] = (data || []).map(tugas => ({
        ...tugas,
        status: tugas.status as 'pending' | 'in_progress' | 'completed',
        priority: tugas.priority as 'high' | 'medium' | 'low',
        file_attachments: tugas.file_attachments as any[]
      }));

      setTugas(typedTugas);
    } catch (error) {
      console.error('Error fetching tugas:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal memuat data tugas",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: TugasForm) => {
    if (!user) return;

    try {
      if (selectedTugas) {
        // Update existing tugas
        const { error } = await supabase
          .from('tugas')
          .update({
            judul: data.judul,
            deskripsi: data.deskripsi,
            mata_kuliah: data.mata_kuliah,
            nama_dosen: data.nama_dosen,
            deadline: data.deadline,
            status: data.status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedTugas.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Tugas berhasil diperbarui",
        });
      } else {
        // Create new tugas
        const { error } = await supabase
          .from('tugas')
          .insert([{
            judul: data.judul,
            deskripsi: data.deskripsi,
            mata_kuliah: data.mata_kuliah,
            nama_dosen: data.nama_dosen,
            deadline: data.deadline,
            status: data.status,
            user_id: user.id,
          }]);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Tugas berhasil ditambahkan",
        });
      }

      form.reset();
      setSelectedTugas(null);
      setIsDialogOpen(false);
      fetchTugas();
    } catch (error) {
      console.error('Error saving tugas:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menyimpan tugas",
      });
    }
  };

  const handleEdit = (tugasItem: Tugas) => {
    setSelectedTugas(tugasItem);
    form.reset({
      judul: tugasItem.judul,
      deskripsi: tugasItem.deskripsi || '',
      mata_kuliah: tugasItem.mata_kuliah,
      nama_dosen: tugasItem.nama_dosen,
      deadline: tugasItem.deadline,
      status: tugasItem.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus tugas ini?')) return;

    try {
      const { error } = await supabase
        .from('tugas')
        .delete()
        .eq('id', id);

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

  const handleNewTugas = () => {
    setSelectedTugas(null);
    form.reset({
      judul: '',
      deskripsi: '',
      mata_kuliah: '',
      nama_dosen: '',
      deadline: '',
      status: 'pending',
    });
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Selesai</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Sedang Dikerjakan</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Menunggu</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">Unknown</Badge>;
    }
  };

  const getFilteredTugas = () => {
    if (activeTab === 'semua') return tugas;
    return tugas.filter(t => t.status === activeTab);
  };

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date() && new Date(deadline).toDateString() !== new Date().toDateString();
  };

  const isDueToday = (deadline: string) => {
    return new Date(deadline).toDateString() === new Date().toDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBackClick}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Tugas Kuliah</h1>
              <p className="text-gray-600 dark:text-gray-400">Kelola tugas kuliah Anda</p>
            </div>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewTugas} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Tugas
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {selectedTugas ? 'Edit Tugas' : 'Tambah Tugas Baru'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="judul">Judul Tugas</Label>
                  <Input
                    id="judul"
                    placeholder="masukkan judul tugas"
                    {...form.register('judul')}
                  />
                  {form.formState.errors.judul && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.judul.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deskripsi">Deskripsi (Opsional)</Label>
                  <Textarea
                    id="deskripsi"
                    placeholder="deskripsi tugas"
                    {...form.register('deskripsi')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mata_kuliah">Mata Kuliah</Label>
                  <Input
                    id="mata_kuliah"
                    placeholder="nama mata kuliah"
                    {...form.register('mata_kuliah')}
                  />
                  {form.formState.errors.mata_kuliah && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.mata_kuliah.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nama_dosen">Nama Dosen</Label>
                  <Input
                    id="nama_dosen"
                    placeholder="nama dosen"
                    {...form.register('nama_dosen')}
                  />
                  {form.formState.errors.nama_dosen && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.nama_dosen.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    {...form.register('deadline')}
                  />
                  {form.formState.errors.deadline && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.deadline.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={form.watch('status')}
                    onValueChange={(value: 'pending' | 'in_progress' | 'completed') => 
                      form.setValue('status', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Menunggu</SelectItem>
                      <SelectItem value="in_progress">Sedang Dikerjakan</SelectItem>
                      <SelectItem value="completed">Selesai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                  <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                    {selectedTugas ? 'Perbarui' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="mb-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="semua">Semua ({tugas.length})</TabsTrigger>
            <TabsTrigger value="pending">
              Menunggu ({tugas.filter(t => t.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              Dikerjakan ({tugas.filter(t => t.status === 'in_progress').length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Selesai ({tugas.filter(t => t.status === 'completed').length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Content */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Memuat tugas...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredTugas().length > 0 ? (
              getFilteredTugas().map((tugasItem) => (
                <Card key={tugasItem.id} className="hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg dark:text-gray-200">{tugasItem.judul}</CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(tugasItem)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(tugasItem.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(tugasItem.status)}
                      {isOverdue(tugasItem.deadline) && tugasItem.status !== 'completed' && (
                        <Badge variant="destructive">Terlambat</Badge>
                      )}
                      {isDueToday(tugasItem.deadline) && tugasItem.status !== 'completed' && (
                        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Hari Ini</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <BookOpen className="h-4 w-4" />
                        {tugasItem.mata_kuliah}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <User className="h-4 w-4" />
                        {tugasItem.nama_dosen}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4" />
                        {new Date(tugasItem.deadline).toLocaleDateString('id-ID')}
                      </div>
                      {tugasItem.deskripsi && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">
                          {tugasItem.deskripsi}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {activeTab === 'semua' 
                    ? 'Belum ada tugas yang ditambahkan'
                    : `Tidak ada tugas dengan status ${activeTab === 'pending' ? 'menunggu' : 
                        activeTab === 'in_progress' ? 'sedang dikerjakan' : 'selesai'}`
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
