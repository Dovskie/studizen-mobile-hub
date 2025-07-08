
export interface Profile {
  id: string;
  username?: string;
  email?: string;
  full_name?: string;
  is_verified: boolean;
  provider: string;
  language?: 'en' | 'id' | 'zh';
  created_at: string;
  updated_at: string;
}

export interface JadwalKuliah {
  id: string;
  user_id: string;
  mata_kuliah: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  lokasi?: string;
  dosen?: string;
  created_at: string;
  updated_at: string;
}

export interface Tugas {
  id: string;
  user_id: string;
  judul: string;
  deskripsi?: string;
  mata_kuliah: string;
  nama_dosen: string;
  deadline: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority?: 'high' | 'medium' | 'low';
  estimated_hours?: number;
  file_attachments?: any[];
  created_at: string;
  updated_at: string;
}

export interface Subtask {
  id: string;
  tugas_id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface PremiumSubscription {
  id: string;
  user_id: string;
  plan_type: 'monthly' | 'quarterly' | 'yearly';
  price: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OTPVerification {
  id: string;
  user_id?: string;
  email: string;
  otp_code: string;
  expires_at: string;
  is_used: boolean;
  created_at: string;
}
