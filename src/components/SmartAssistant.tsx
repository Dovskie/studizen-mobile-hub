
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, Calendar, Clock, TrendingUp, 
  AlertTriangle, CheckCircle, BookOpen
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tugas, JadwalKuliah } from '@/types/database';

interface AssistantInsight {
  type: 'reminder' | 'statistic' | 'recommendation' | 'notification';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  icon: React.ReactNode;
}

export const SmartAssistant = () => {
  const { user } = useAuth();
  const [insights, setInsights] = useState<AssistantInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      generateInsights();
    }
  }, [user]);

  const generateInsights = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch tugas dan jadwal
      const [tugasResult, jadwalResult] = await Promise.all([
        supabase.from('tugas').select('*').eq('user_id', user.id),
        supabase.from('jadwal_kuliah').select('*').eq('user_id', user.id)
      ]);

      const tugas: Tugas[] = (tugasResult.data || []).map(t => ({
        ...t,
        status: t.status as 'pending' | 'in_progress' | 'completed'
      }));
      const jadwal: JadwalKuliah[] = jadwalResult.data || [];

      const newInsights: AssistantInsight[] = [];

      // 1. Reminder tugas mendekati deadline
      const urgentTasks = tugas.filter(t => {
        const deadline = new Date(t.deadline);
        const today = new Date();
        const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 3 && diffDays >= 0 && t.status !== 'completed';
      });

      if (urgentTasks.length > 0) {
        newInsights.push({
          type: 'reminder',
          title: 'Tugas Mendekati Deadline!',
          message: `${urgentTasks.length} tugas harus diselesaikan dalam 3 hari ke depan`,
          priority: 'high',
          icon: <AlertTriangle className="h-4 w-4" />
        });
      }

      // 2. Statistik mingguan
      const completedThisWeek = tugas.filter(t => {
        if (t.status !== 'completed') return false;
        const updated = new Date(t.updated_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return updated >= weekAgo;
      }).length;

      if (completedThisWeek > 0) {
        newInsights.push({
          type: 'statistic',
          title: 'Produktivitas Minggu Ini',
          message: `Selamat! Anda telah menyelesaikan ${completedThisWeek} tugas minggu ini`,
          priority: 'medium',
          icon: <CheckCircle className="h-4 w-4" />
        });
      }

      // 3. Rekomendasi waktu terbaik
      const hariTersibuk = getHariTersibuk(jadwal);
      if (hariTersibuk) {
        newInsights.push({
          type: 'recommendation',
          title: 'Rekomendasi Waktu Belajar',
          message: `${hariTersibuk} adalah hari tersibuk Anda. Pertimbangkan mengerjakan tugas di hari lain`,
          priority: 'low',
          icon: <TrendingUp className="h-4 w-4" />
        });
      }

      // 4. Notifikasi ringkasan
      const pendingTasks = tugas.filter(t => t.status === 'pending').length;
      const todayClasses = jadwal.filter(j => j.hari === getHariIni()).length;

      newInsights.push({
        type: 'notification',
        title: 'Ringkasan Hari Ini',
        message: `Anda memiliki ${todayClasses} kelas dan ${pendingTasks} tugas yang menunggu`,
        priority: 'medium',
        icon: <Calendar className="h-4 w-4" />
      });

      setInsights(newInsights);
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHariTersibuk = (jadwal: JadwalKuliah[]) => {
    const hariCount: Record<string, number> = {};
    jadwal.forEach(j => {
      hariCount[j.hari] = (hariCount[j.hari] || 0) + 1;
    });
    
    let maxCount = 0;
    let hariTersibuk = '';
    Object.entries(hariCount).forEach(([hari, count]) => {
      if (count > maxCount) {
        maxCount = count;
        hariTersibuk = hari;
      }
    });
    
    return hariTersibuk;
  };

  const getHariIni = () => {
    const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return hari[new Date().getDay()];
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Smart Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          Smart Assistant
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.length > 0 ? (
            insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {insight.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm text-gray-800">{insight.title}</h4>
                    <Badge className={getPriorityColor(insight.priority)}>
                      {insight.priority === 'high' ? 'Tinggi' : 
                       insight.priority === 'medium' ? 'Sedang' : 'Rendah'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{insight.message}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                Tambahkan jadwal dan tugas untuk mendapatkan insight yang lebih baik
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
