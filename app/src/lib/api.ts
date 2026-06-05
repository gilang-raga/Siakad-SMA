const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://agent-phrases-healthy-revenue.trycloudflare.com/api'

export interface SiswaData {
  nisn: string
  nama: string
  kelas: string
  jk: string
  status: string
  password?: string
}

export interface GuruData {
  nip: string
  nama: string
  mapel: string
  jk: string
  status: string
  password?: string
}

export interface LoginPayload {
  username: string
  password: string
  role: string
}

export interface UserData {
  id: number
  username: string
  role: string
  name: string
}

export interface AdminDashboardData {
  totalSiswa: number
  totalGuru: number
  totalKelas: number
  totalMapel: number
  kelas: { kelas: string; total: number }[]
  mapel: string[]
}

export interface GuruDashboardData {
  guru: GuruData
  jadwalHariIni: { jam: string; kelas: string; mapel: string; ruang: string; status: string }[]
  tugasMenunggu: { task: string; deadline: string; type: string }[]
  ringkasan: {
    totalSiswa: number
    totalKelas: number
    totalMapel: number
    jpMinggu: number
  }
}

export interface SiswaDashboardData {
  siswa: SiswaData
  jadwalHariIni: { jam: string; mapel: string; guru: string; ruang: string; status: string }[]
  ringkasanNilai: { mapel: string; nh: number; pts: number; na: number }[]
  pengumumanTerbaru: { judul: string; waktu: string; penting: boolean; isi?: string; kategori?: string; sumber?: string }[]
  absensi: { hadir: number; sakit: number; izin: number; alpa: number }
}

export interface JadwalData {
  id?: number
  hari: string
  jamKe: number
  jam: string
  kelas: string
  mapel: string
  guruNip: string
  guru: string
  ruang: string
  status: string
}

export interface MateriTugasApiData {
  id: string
  judul: string
  tipe: 'materi' | 'tugas'
  mapel: string
  kelas: string
  guruNip: string
  guru: string
  tanggal: string
  deskripsi: string
  fileName?: string
  fileType?: string
  fileData?: string
  deadline?: string
}

export interface PengumumanApiData {
  id: string
  judul: string
  kategori: string
  target: string
  tanggal: string
  status: string
  isi: string
  penting?: boolean
}

export interface NilaiApiData {
  nisn: string
  nama?: string
  kelas?: string
  mapel: string
  nh: number
  pts: number
  na: number
}

export interface PrestasiApiData {
  id: string
  judul: string
  kategori: 'akademik' | 'non-akademik'
  deskripsi: string
  gambar?: string
  tanggal: string
}

export interface AbsensiKelasData {
  nisn: string
  nama: string
  hadir: number
  sakit: number
  izin: number
  alpa: number
}

export interface AbsensiSiswaData {
  tanggal: string
  bulan: string
  hadir: number
  sakit: number
  izin: number
  alpa: number
}

export interface SettingsData {
  settings: Record<string, Record<string, unknown>>
  accounts: { username: string; nama: string; role: string; status: string }[]
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.message || 'Permintaan ke server gagal')
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

export function login(payload: LoginPayload) {
  return request<{ user: UserData }>('/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getSiswa() {
  return request<SiswaData[]>('/siswa')
}

export function createSiswa(payload: SiswaData) {
  return request<SiswaData>('/siswa', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateSiswa(nisn: string, payload: SiswaData) {
  return request<SiswaData>(`/siswa/${encodeURIComponent(nisn)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteSiswa(nisn: string) {
  return request<void>(`/siswa/${encodeURIComponent(nisn)}`, {
    method: 'DELETE',
  })
}

export function getGuru() {
  return request<GuruData[]>('/guru')
}

export function createGuru(payload: GuruData) {
  return request<GuruData>('/guru', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateGuru(nip: string, payload: GuruData) {
  return request<GuruData>(`/guru/${encodeURIComponent(nip)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteGuru(nip: string) {
  return request<void>(`/guru/${encodeURIComponent(nip)}`, {
    method: 'DELETE',
  })
}

export function getAdminDashboard() {
  return request<AdminDashboardData>('/dashboard/admin')
}

export function getGuruDashboard(nip: string) {
  return request<GuruDashboardData>(`/dashboard/guru/${encodeURIComponent(nip)}`)
}

export function getSiswaDashboard(nisn: string) {
  return request<SiswaDashboardData>(`/dashboard/siswa/${encodeURIComponent(nisn)}`)
}

export function getJadwal(params: { kelas?: string; guruNip?: string } = {}) {
  const query = new URLSearchParams()
  if (params.kelas) query.set('kelas', params.kelas)
  if (params.guruNip) query.set('guru_nip', params.guruNip)
  return request<JadwalData[]>(`/jadwal${query.toString() ? `?${query}` : ''}`)
}

export function upsertJadwal(payload: { hari: string; jamKe: number; kelas: string; mapel: string; guruNip: string; ruang?: string; status?: string }) {
  return request<JadwalData>('/jadwal/upsert', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deleteJadwal(payload: { hari: string; jamKe: number; kelas: string }) {
  return request<void>('/jadwal', {
    method: 'DELETE',
    body: JSON.stringify(payload),
  })
}

export function getMateriTugas(params: { guruNip?: string; kelas?: string } = {}) {
  const query = new URLSearchParams()
  if (params.guruNip) query.set('guru_nip', params.guruNip)
  if (params.kelas) query.set('kelas', params.kelas)
  return request<MateriTugasApiData[]>(`/materi-tugas${query.toString() ? `?${query}` : ''}`)
}

export function saveMateriTugas(payload: MateriTugasApiData) {
  return request<MateriTugasApiData>('/materi-tugas', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deleteMateriTugas(id: string) {
  return request<void>(`/materi-tugas/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export function getPengumuman() {
  return request<PengumumanApiData[]>('/pengumuman')
}

export function savePengumuman(payload: PengumumanApiData) {
  return request<PengumumanApiData>('/pengumuman', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deletePengumuman(id: string) {
  return request<void>(`/pengumuman/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export function getNilai(params: { nisn?: string } = {}) {
  const query = new URLSearchParams()
  if (params.nisn) query.set('nisn', params.nisn)
  return request<NilaiApiData[]>(`/nilai${query.toString() ? `?${query}` : ''}`)
}

export function saveNilaiBulk(entries: NilaiApiData[]) {
  return request<{ saved: number }>('/nilai/bulk', {
    method: 'POST',
    body: JSON.stringify({ entries }),
  })
}

export function getPrestasi() {
  return request<PrestasiApiData[]>('/prestasi')
}

export function savePrestasi(payload: PrestasiApiData) {
  return request<PrestasiApiData>('/prestasi', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deletePrestasi(id: string) {
  return request<void>(`/prestasi/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export function getAbsensiKelas(kelas: string, tanggal = new Date().toISOString().slice(0, 10)) {
  return request<AbsensiKelasData[]>(`/absensi/kelas/${encodeURIComponent(kelas)}?tanggal=${encodeURIComponent(tanggal)}`)
}

export function saveAbsensi(payload: { tanggal: string; entries: AbsensiKelasData[] }) {
  return request<{ saved: number }>('/absensi', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getAbsensiSiswa(nisn: string) {
  return request<AbsensiSiswaData[]>(`/absensi/siswa/${encodeURIComponent(nisn)}`)
}

export function sendContactMessage(payload: { nama: string; email: string; subjek: string; telepon?: string; pesan: string }) {
  return request<{ message: string }>('/contact', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getSettings() {
  return request<SettingsData>('/settings')
}

export function updateSettings(key: string, payload: Record<string, unknown>) {
  return request<{ settingKey: string; settingValue: Record<string, unknown> }>(`/settings/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function getDatabaseBackup() {
  return request<{ exportedAt: string; data: Record<string, unknown[]> }>('/admin/backup')
}

export function resetDatabase() {
  return request<{ message: string }>('/admin/reset-database', {
    method: 'POST',
  })
}
