
export interface Profile {
  id: string;
  username?: string;
  email?: string;
  full_name?: string;
  is_verified: boolean;
  provider: string;
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
