import { useEffect, useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import CRUDDrawer from '../../../components/CRUDDrawer'
import { addActivity, readStored, store } from '../../../lib/frontendActions'
import { deleteJadwal, getGuru, getJadwal, upsertJadwal, type GuruData, type JadwalData } from '../../../lib/api'

const navSections = [
  { items: [{ path: '/admin/dashboard', label: 'Dashboard', icon: 'bi-grid' }] },
  { title: 'Data Master', items: [
    { path: '/admin/siswa', label: 'Kelola Siswa', icon: 'bi-people' },
    { path: '/admin/guru', label: 'Kelola Guru', icon: 'bi-person-badge' },
    { path: '/admin/kelas', label: 'Kelola Kelas', icon: 'bi-building' },
    { path: '/admin/mapel', label: 'Mata Pelajaran', icon: 'bi-book' },
        { path: '/admin/prestasi', label: 'Kelola Prestasi', icon: 'bi-trophy' },
    { path: '/admin/jadwal', label: 'Kelola Jadwal', icon: 'bi-calendar-week' },
    { path: '/admin/tahun-ajaran', label: 'Tahun Ajaran', icon: 'bi-calendar-event' },
  ]},
  { title: 'Pengaturan', items: [
    { path: '/admin/pengumuman', label: 'Pengumuman', icon: 'bi-megaphone' },
    { path: '/admin/laporan', label: 'Laporan & Ekspor', icon: 'bi-file-earmark-bar-graph' },
    { path: '/admin/pengaturan', label: 'Pengaturan Sistem', icon: 'bi-gear' },
  ]},
]

const hari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']
const jamPelajaran = [
  { jam: '07:00 - 07:45', ke: 1 },
  { jam: '07:45 - 08:30', ke: 2 },
  { jam: '08:30 - 09:15', ke: 3 },
  { jam: '09:15 - 09:30', ke: 0 },
  { jam: '09:30 - 10:15', ke: 4 },
  { jam: '10:15 - 11:00', ke: 5 },
  { jam: '11:00 - 11:15', ke: 0 },
  { jam: '11:15 - 12:00', ke: 6 },
  { jam: '12:00 - 12:45', ke: 7 },
]

const defaultJadwal: Record<string, string> = {
  'X IPA 1-Senin-1': 'Matematika', 'X IPA 1-Senin-2': 'Matematika', 'X IPA 1-Senin-3': 'Bahasa Indonesia', 'X IPA 1-Senin-4': 'Bahasa Indonesia', 'X IPA 1-Senin-5': 'Biologi',
  'X IPA 1-Senin-6': 'Biologi', 'X IPA 1-Senin-7': 'Pendidikan Agama Islam',
  'X IPA 1-Selasa-1': 'Fisika', 'X IPA 1-Selasa-2': 'Fisika', 'X IPA 1-Selasa-3': 'Bahasa Inggris', 'X IPA 1-Selasa-4': 'Bahasa Inggris', 'X IPA 1-Selasa-5': 'Sejarah',
  'X IPA 1-Selasa-6': 'Sejarah', 'X IPA 1-Selasa-7': 'Penjasorkes',
  'X IPA 1-Rabu-1': 'Kimia', 'X IPA 1-Rabu-2': 'Kimia', 'X IPA 1-Rabu-3': 'Matematika', 'X IPA 1-Rabu-4': 'Bahasa Indonesia', 'X IPA 1-Rabu-5': 'Bahasa Inggris',
  'X IPA 1-Rabu-6': 'PPKn', 'X IPA 1-Rabu-7': 'Bimbingan Konseling',
  'X IPA 1-Kamis-1': 'Matematika', 'X IPA 1-Kamis-2': 'Fisika', 'X IPA 1-Kamis-3': 'Kimia', 'X IPA 1-Kamis-4': 'Biologi', 'X IPA 1-Kamis-5': 'Bahasa Inggris',
  'X IPA 1-Kamis-6': 'Seni Budaya', 'X IPA 1-Kamis-7': 'Teknologi Informasi',
  'X IPA 1-Jumat-1': 'Bahasa Indonesia', 'X IPA 1-Jumat-2': 'Matematika', 'X IPA 1-Jumat-3': 'Pendidikan Agama Islam', 'X IPA 1-Jumat-4': 'PPKn', 'X IPA 1-Jumat-5': 'Penjasorkes',
}

interface MapelData {
  kode: string
  nama: string
  kelompok: string
  kelas: string
  jpm: number
}

interface KelasData {
  nama: string
  wali: string
  jmlSiswa: number
  kapasitas: number
  ruang: string
}

type JadwalForm = { hari: string; ke: number; mapel: string; guruNip: string; ruang: string }

const defaultMapel: MapelData[] = [
  { kode: 'MTK', nama: 'Matematika', kelompok: 'A', kelas: 'X, XI, XII', jpm: 4 },
  { kode: 'BIND', nama: 'Bahasa Indonesia', kelompok: 'A', kelas: 'X, XI, XII', jpm: 4 },
  { kode: 'BING', nama: 'Bahasa Inggris', kelompok: 'A', kelas: 'X, XI, XII', jpm: 4 },
  { kode: 'FIS', nama: 'Fisika', kelompok: 'A', kelas: 'X, XI, XII', jpm: 4 },
  { kode: 'KIM', nama: 'Kimia', kelompok: 'A', kelas: 'X, XI, XII', jpm: 4 },
  { kode: 'BIO', nama: 'Biologi', kelompok: 'A', kelas: 'X, XI, XII', jpm: 4 },
  { kode: 'SEJ', nama: 'Sejarah', kelompok: 'A', kelas: 'X, XI, XII', jpm: 3 },
  { kode: 'PAI', nama: 'Pendidikan Agama Islam', kelompok: 'A', kelas: 'X, XI, XII', jpm: 2 },
  { kode: 'PPKn', nama: 'PPKn', kelompok: 'A', kelas: 'X, XI, XII', jpm: 2 },
  { kode: 'PJOK', nama: 'Penjasorkes', kelompok: 'B', kelas: 'X, XI, XII', jpm: 3 },
  { kode: 'SBK', nama: 'Seni Budaya', kelompok: 'B', kelas: 'X, XI, XII', jpm: 2 },
  { kode: 'TIK', nama: 'Teknologi Informasi', kelompok: 'B', kelas: 'X, XI, XII', jpm: 2 },
  { kode: 'BK', nama: 'Bimbingan Konseling', kelompok: 'B', kelas: 'X, XI, XII', jpm: 1 },
]

const defaultKelas: KelasData[] = [
  { nama: 'X IPA 1', wali: 'Drs. Hadi Wijaya, M.Pd.', jmlSiswa: 32, kapasitas: 32, ruang: 'R-101' },
  { nama: 'X IPA 2', wali: 'Dra. Siti Aminah, M.Pd.', jmlSiswa: 30, kapasitas: 32, ruang: 'R-102' },
  { nama: 'X IPS 1', wali: 'Dra. Rina Marlina, M.Pd.', jmlSiswa: 31, kapasitas: 32, ruang: 'R-103' },
  { nama: 'X IPS 2', wali: 'Drs. Agus Pratama, M.Pd.', jmlSiswa: 28, kapasitas: 32, ruang: 'R-104' },
  { nama: 'XI IPA 1', wali: 'S.Pd. Budi Hartono', jmlSiswa: 32, kapasitas: 32, ruang: 'R-201' },
  { nama: 'XI IPA 2', wali: 'Dra. Maya Sari, M.Pd.', jmlSiswa: 29, kapasitas: 32, ruang: 'R-202' },
  { nama: 'XI IPS 1', wali: 'S.Pd. Andi Wijaya', jmlSiswa: 30, kapasitas: 32, ruang: 'R-203' },
  { nama: 'XI IPS 2', wali: 'Drs. Slamet Riyadi, M.Pd.', jmlSiswa: 31, kapasitas: 32, ruang: 'R-204' },
  { nama: 'XII IPA 1', wali: 'S.Pd. Dedi Kurniawan', jmlSiswa: 32, kapasitas: 32, ruang: 'R-301' },
  { nama: 'XII IPS 1', wali: 'S.Pd. Nurul Hidayah', jmlSiswa: 30, kapasitas: 32, ruang: 'R-302' },
]

function getMapelOptions() {
  return readStored<MapelData[]>('siakad_mapel', defaultMapel).map(mapel => mapel.nama)
}

function getKelasOptions() {
  return readStored<KelasData[]>('siakad_kelas', defaultKelas).map(kelas => kelas.nama)
}

export default function AdminJadwal() {
  const [kelasOptions, setKelasOptions] = useState<string[]>(() => getKelasOptions())
  const [kelas, setKelas] = useState(() => getKelasOptions()[0] || '')
  const [mapelOptions, setMapelOptions] = useState<string[]>(() => getMapelOptions())
  const [jadwal, setJadwal] = useState<Record<string, JadwalData>>({})
  const [guruOptions, setGuruOptions] = useState<GuruData[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [form, setForm] = useState<JadwalForm>({ hari: 'Senin', ke: 1, mapel: getMapelOptions()[0] || '', guruNip: '', ruang: 'R-101' })
  const [error, setError] = useState('')

  const loadJadwal = async (kelasAktif = kelas) => {
    const rows = await getJadwal({ kelas: kelasAktif })
    const next = Object.fromEntries(rows.map(item => [`${item.kelas}-${item.hari}-${item.jamKe}`, item]))
    setJadwal(next)
    store('siakad_jadwal', Object.fromEntries(rows.map(item => [`${item.kelas}-${item.hari}-${item.jamKe}`, item.mapel])))
  }

  useEffect(() => {
    const refreshOptions = () => {
      const latestMapel = getMapelOptions()
      const latestKelas = getKelasOptions()

      setMapelOptions(latestMapel)
      setKelasOptions(latestKelas)
      setKelas(current => latestKelas.includes(current) ? current : latestKelas[0] || '')
    }

    refreshOptions()
    window.addEventListener('storage', refreshOptions)
    window.addEventListener('focus', refreshOptions)

    return () => {
      window.removeEventListener('storage', refreshOptions)
      window.removeEventListener('focus', refreshOptions)
    }
  }, [])

  useEffect(() => {
    getGuru().then(setGuruOptions).catch(() => setGuruOptions(readStored('siakad_guru', [])))
  }, [])

  useEffect(() => {
    if (!kelas) return
    void Promise.resolve().then(() => loadJadwal(kelas)).catch(() => {
      const local = readStored<Record<string, string>>('siakad_jadwal', defaultJadwal)
      setJadwal(Object.fromEntries(Object.entries(local).map(([key, mapel]) => {
        const [kelasKey, hariKey, keKey] = key.split('-')
        return [key, { kelas: kelasKey, hari: hariKey, jamKe: Number(keKey), jam: '', mapel, guruNip: '', guru: '-', ruang: '-', status: 'Mendatang' }]
      })))
    })
  }, [kelas])

  const keyFor = (h: string, ke: number) => `${kelas}-${h}-${ke}`
  const getItem = (h: string, ke: number) => jadwal[keyFor(h, ke)]
  const getMapel = (h: string, ke: number) => getItem(h, ke)?.mapel || '-'
  const guruForMapel = (mapel: string) => guruOptions.filter(guru => guru.mapel === mapel)

  const openAdd = () => {
    const latestMapel = getMapelOptions()
    const latestKelas = getKelasOptions()
    setMapelOptions(latestMapel)
    setKelasOptions(latestKelas)
    if (latestKelas.length === 0) {
      alert('Belum ada kelas. Tambahkan kelas dulu di menu Kelola Kelas.')
      return
    }
    const mapel = getMapel('Senin', 1) === '-' ? latestMapel[0] || '' : getMapel('Senin', 1)
    const guru = guruForMapel(mapel)[0]
    setForm({ hari: 'Senin', ke: 1, mapel, guruNip: guru?.nip || '', ruang: 'R-101' })
    setDrawerOpen(true)
  }

  const openCell = (h: string, ke: number) => {
    const latestMapel = getMapelOptions()
    const item = getItem(h, ke)
    const mapel = item?.mapel || latestMapel[0] || ''
    const guru = item?.guruNip || guruForMapel(mapel)[0]?.nip || ''
    setMapelOptions(latestMapel)
    setForm({ hari: h, ke, mapel, guruNip: guru, ruang: item?.ruang || 'R-101' })
    setDrawerOpen(true)
  }

  const saveJadwal = async () => {
    if (!form.mapel || !form.guruNip) {
      alert('Pilih mata pelajaran dan guru terlebih dahulu')
      return
    }

    try {
      setError('')
      const saved = await upsertJadwal({ hari: form.hari, jamKe: form.ke, kelas, mapel: form.mapel, guruNip: form.guruNip, ruang: form.ruang })
      setJadwal(prev => ({ ...prev, [keyFor(form.hari, form.ke)]: saved }))
      addActivity('Jadwal diperbarui', `${kelas} - ${form.hari} jam ke-${form.ke}: ${form.mapel}`, 'bi-calendar-check')
      setDrawerOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan jadwal')
    }
  }

  const clearJadwal = async () => {
    await deleteJadwal({ hari: form.hari, jamKe: form.ke, kelas })
    setJadwal(prev => {
      const next = { ...prev }
      delete next[keyFor(form.hari, form.ke)]
      return next
    })
    addActivity('Jadwal dikosongkan', `${kelas} - ${form.hari} jam ke-${form.ke}`, 'bi-calendar-x')
    setDrawerOpen(false)
  }

  return (
    <DashboardLayout role="admin" userName="Administrator" navSections={navSections}>
      <div className="page-header">
        <h1>Kelola Jadwal</h1>
        <p className="text-muted">Pengaturan jadwal pelajaran per kelas</p>
      </div>

      {error && <div className="alert alert-danger"><i className="bi bi-exclamation-circle me-2"></i>{error}</div>}

      <div className="row g-3 mb-4 align-items-end">
        <div className="col-md-3">
          <label className="form-label">Tahun Ajaran</label>
          <select className="form-select"><option>2025/2026</option></select>
        </div>
        <div className="col-md-3">
          <label className="form-label">Semester</label>
          <select className="form-select"><option>Genap</option></select>
        </div>
        <div className="col-md-3">
          <label className="form-label">Kelas</label>
          <select className="form-select" value={kelas} onChange={e => setKelas(e.target.value)} disabled={kelasOptions.length === 0}>
            {kelasOptions.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          {kelasOptions.length === 0 && (
            <small className="text-danger">Belum ada kelas. Tambahkan kelas dulu di menu Kelola Kelas.</small>
          )}
        </div>
        <div className="col-md-3 text-end">
          <button className="btn btn-primary" onClick={openAdd}><i className="bi bi-plus-lg me-2"></i>Tambah Jadwal</button>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-bordered mb-0" style={{ fontSize: '0.8rem' }}>
              <thead className="table-dark">
                <tr>
                  <th style={{ width: 120 }}>Jam Ke</th>
                  {hari.map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {jamPelajaran.map((jp, idx) => (
                  <tr key={idx} style={jp.ke === 0 ? { background: '#f8f9fa' } : {}}>
                    <td className="fw-medium">
                      {jp.ke === 0 ? <span className="text-muted"><i className="bi bi-cup-hot me-1"></i>Istirahat</span> : <>{jp.ke}. {jp.jam}</>}
                    </td>
                    {hari.map(h => (
                      <td key={h} className={jp.ke === 0 ? 'text-center text-muted' : 'text-center'}>
                        {jp.ke === 0 ? '-' : (
                          <button className="btn btn-sm btn-light border-0" onClick={() => openCell(h, jp.ke)} title="Edit jadwal">
                            <span className="badge bg-primary bg-opacity-10 text-primary">{getMapel(h, jp.ke)}</span>
                            {getItem(h, jp.ke)?.guru && <div className="small text-muted mt-1">{getItem(h, jp.ke)?.guru}</div>}
                          </button>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CRUDDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={`Atur Jadwal ${kelas}`}>
        <div className="mb-3"><label className="form-label">Hari</label><select className="form-select" value={form.hari} onChange={e => setForm({ ...form, hari: e.target.value })}>{hari.map(h => <option key={h}>{h}</option>)}</select></div>
        <div className="mb-3"><label className="form-label">Jam Ke</label><select className="form-select" value={form.ke} onChange={e => setForm({ ...form, ke: Number(e.target.value) })}>{jamPelajaran.filter(j => j.ke > 0).map(j => <option key={j.ke} value={j.ke}>{j.ke}. {j.jam}</option>)}</select></div>
        <div className="mb-3">
          <label className="form-label">Mata Pelajaran</label>
          <select className="form-select" value={form.mapel} onChange={e => {
            const mapel = e.target.value
            setForm({ ...form, mapel, guruNip: guruForMapel(mapel)[0]?.nip || '' })
          }} disabled={mapelOptions.length === 0}>
            <option value="">Pilih Mapel</option>
            {mapelOptions.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          {mapelOptions.length === 0 && (
            <small className="text-danger">Belum ada mapel. Tambahkan mata pelajaran dulu di menu Mata Pelajaran.</small>
          )}
        </div>
        <div className="mb-3">
          <label className="form-label">Guru Pengajar</label>
          <select className="form-select" value={form.guruNip} onChange={e => setForm({ ...form, guruNip: e.target.value })}>
            <option value="">Pilih Guru</option>
            {guruForMapel(form.mapel).map(guru => <option key={guru.nip} value={guru.nip}>{guru.nama}</option>)}
          </select>
          {guruForMapel(form.mapel).length > 1 && <small className="text-muted">Pilih salah satu guru agar jadwal tidak bertabrakan.</small>}
        </div>
        <div className="mb-4"><label className="form-label">Ruang</label><input className="form-control" value={form.ruang} onChange={e => setForm({ ...form, ruang: e.target.value })} /></div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary flex-fill" onClick={saveJadwal}><i className="bi bi-check-lg me-2"></i>Simpan</button>
          <button className="btn btn-outline-danger" onClick={clearJadwal}>Kosongkan</button>
          <button className="btn btn-outline-secondary" onClick={() => setDrawerOpen(false)}>Batal</button>
        </div>
      </CRUDDrawer>
    </DashboardLayout>
  )
}
