import { useEffect, useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import CRUDDrawer from '../../../components/CRUDDrawer'
import DeleteModal from '../../../components/DeleteModal'
import { getSiswa, type SiswaData } from '../../../lib/api'
import { addActivity, readStored, store } from '../../../lib/frontendActions'

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

interface KelasData {
  nama: string
  wali: string
  jmlSiswa: number
  kapasitas: number
  ruang: string
}

interface GuruData {
  nip: string
  nama: string
  mapel: string
  jk: string
  status: string
}

const initialData: KelasData[] = [
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

const defaultGuru: GuruData[] = [
  { nip: '196805152000121002', nama: 'Drs. Hadi Wijaya, M.Pd.', mapel: 'Matematika', jk: 'Laki-laki', status: 'Aktif' },
  { nip: '197203201998032005', nama: 'Dra. Siti Aminah, M.Pd.', mapel: 'Bahasa Indonesia', jk: 'Perempuan', status: 'Aktif' },
  { nip: '198001102005012003', nama: 'Dra. Rina Marlina, M.Pd.', mapel: 'Biologi', jk: 'Perempuan', status: 'Aktif' },
  { nip: '197510052002121004', nama: 'Drs. Agus Pratama, M.Pd.', mapel: 'Fisika', jk: 'Laki-laki', status: 'Aktif' },
  { nip: '198506152010012006', nama: 'S.Pd. Budi Hartono', mapel: 'Kimia', jk: 'Laki-laki', status: 'Aktif' },
  { nip: '197811202003122007', nama: 'Dra. Maya Sari, M.Pd.', mapel: 'Bahasa Inggris', jk: 'Perempuan', status: 'Aktif' },
  { nip: '199003102015121008', nama: 'S.Pd. Andi Wijaya', mapel: 'Sejarah', jk: 'Laki-laki', status: 'Aktif' },
  { nip: '197412052001122009', nama: 'Drs. Slamet Riyadi, M.Pd.', mapel: 'Pendidikan Agama', jk: 'Laki-laki', status: 'Aktif' },
]

function getGuruOptions() {
  return readStored<GuruData[]>('siakad_guru', defaultGuru)
    .filter(guru => guru.status !== 'Pensiun')
    .map(guru => guru.nama)
}

export default function AdminKelas() {
  const [data, setData] = useState<KelasData[]>(() => readStored('siakad_kelas', initialData))
  const [siswaData, setSiswaData] = useState<SiswaData[]>([])
  const [guruOptions, setGuruOptions] = useState<string[]>(() => getGuruOptions())
  const [tingkat, setTingkat] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState<KelasData | null>(null)
  const [deleting, setDeleting] = useState<KelasData | null>(null)
  const [form, setForm] = useState<Partial<KelasData>>({ kapasitas: 32, jmlSiswa: 0 })

  useEffect(() => store('siakad_kelas', data), [data])

  const loadSiswa = async () => {
    try {
      setSiswaData(await getSiswa())
    } catch {
      setSiswaData([])
    }
  }

  useEffect(() => {
    loadSiswa()

    const refreshSiswa = () => loadSiswa()
    window.addEventListener('focus', refreshSiswa)

    return () => window.removeEventListener('focus', refreshSiswa)
  }, [])

  useEffect(() => {
    const refreshGuru = () => setGuruOptions(getGuruOptions())

    refreshGuru()
    window.addEventListener('storage', refreshGuru)
    window.addEventListener('focus', refreshGuru)

    return () => {
      window.removeEventListener('storage', refreshGuru)
      window.removeEventListener('focus', refreshGuru)
    }
  }, [])

  const filtered = tingkat ? data.filter(k => k.nama.startsWith(tingkat)) : data
  const countSiswa = (namaKelas: string) => siswaData.filter(siswa => siswa.kelas === namaKelas).length

  const openAdd = () => {
    const latestGuru = getGuruOptions()
    setGuruOptions(latestGuru)
    setEditing(null)
    setForm({ kapasitas: 32, jmlSiswa: 0, wali: latestGuru[0] || '' })
    setDrawerOpen(true)
  }

  const openEdit = (kelas: KelasData) => {
    setGuruOptions(getGuruOptions())
    setEditing(kelas)
    setForm({ ...kelas, jmlSiswa: countSiswa(kelas.nama) })
    setDrawerOpen(true)
  }

  const saveKelas = () => {
    if (!form.nama || !form.wali || !form.ruang || form.kapasitas === undefined) {
      alert('Semua field kelas wajib diisi')
      return
    }

    const jumlahSiswaAktual = editing && editing.nama !== form.nama
      ? countSiswa(editing.nama)
      : countSiswa(form.nama)

    const payload: KelasData = {
      nama: form.nama,
      wali: form.wali,
      ruang: form.ruang,
      kapasitas: Number(form.kapasitas),
      jmlSiswa: jumlahSiswaAktual,
    }

    if (jumlahSiswaAktual > payload.kapasitas) {
      alert(`Kapasitas tidak boleh lebih kecil dari jumlah siswa saat ini (${jumlahSiswaAktual} siswa).`)
      return
    }

    if (editing) {
      setData(prev => prev.map(k => k.nama === editing.nama ? payload : k))
      addActivity('Data kelas diperbarui', `${payload.nama} - ${payload.ruang}`, 'bi-building')
    } else {
      if (data.some(k => k.nama === payload.nama)) {
        alert('Nama kelas sudah digunakan')
        return
      }
      setData(prev => [...prev, payload])
      addActivity('Kelas baru ditambahkan', `${payload.nama} - ${payload.ruang}`, 'bi-building-add')
    }

    setDrawerOpen(false)
  }

  const confirmDelete = () => {
    if (deleting) {
      setData(prev => prev.filter(k => k.nama !== deleting.nama))
      addActivity('Kelas dihapus', `${deleting.nama} - ${deleting.ruang}`, 'bi-trash')
    }
    setDeleteOpen(false)
  }

  return (
    <DashboardLayout role="admin" userName="Administrator" navSections={navSections}>
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h1>Kelola Kelas</h1>
          <p className="text-muted mb-0">Pengaturan pembagian ruang kelas</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><i className="bi bi-plus-lg me-2"></i>Tambah Kelas</button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <select className="form-select" value={tingkat} onChange={e => setTingkat(e.target.value)}>
            <option value="">Semua Tingkat</option>
            <option value="X ">Kelas X</option>
            <option value="XI ">Kelas XI</option>
            <option value="XII ">Kelas XII</option>
          </select>
        </div>
      </div>

      <div className="row g-3">
        {filtered.map((k) => (
          <div className="col-md-6 col-lg-4" key={k.nama}>
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 48, height: 48, background: 'rgba(59,110,255,0.1)' }}>
                    <i className="bi bi-building text-primary fs-4"></i>
                  </div>
                  <span className="badge bg-primary bg-opacity-10 text-primary">{k.ruang}</span>
                </div>
                <h6 className="mb-1">{k.nama}</h6>
                <p className="text-muted mb-3" style={{ fontSize: '0.8rem' }}>Wali Kelas: {k.wali}</p>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-people text-muted"></i>
                  <span className="small">{countSiswa(k.nama)}/{k.kapasitas} siswa</span>
                  </div>
                  <div className="progress flex-grow-1 mx-2" style={{ height: 6 }}>
                    <div className={`progress-bar ${countSiswa(k.nama) >= k.kapasitas ? 'bg-danger' : 'bg-primary'}`} style={{ width: `${Math.min((countSiswa(k.nama) / k.kapasitas) * 100, 100)}%` }}></div>
                  </div>
                </div>
                {countSiswa(k.nama) >= k.kapasitas && (
                  <div className="alert alert-danger py-2 px-3 mt-3 mb-0 small">Kelas penuh</div>
                )}
                <div className="d-flex gap-2 mt-3">
                  <button className="btn btn-sm btn-outline-primary flex-fill" onClick={() => openEdit(k)}><i className="bi bi-pencil me-1"></i>Edit</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => { setDeleting(k); setDeleteOpen(true) }}><i className="bi bi-trash"></i></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <CRUDDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? 'Edit Kelas' : 'Tambah Kelas'}>
        <div className="mb-3"><label className="form-label">Nama Kelas</label><input className="form-control" value={form.nama || ''} onChange={e => setForm({ ...form, nama: e.target.value })} /></div>
        <div className="mb-3">
          <label className="form-label">Wali Kelas</label>
          <select className="form-select" value={form.wali || ''} onChange={e => setForm({ ...form, wali: e.target.value })} disabled={guruOptions.length === 0}>
            <option value="">Pilih Guru</option>
            {guruOptions.map(guru => <option key={guru} value={guru}>{guru}</option>)}
          </select>
          {guruOptions.length === 0 && (
            <small className="text-danger">Belum ada guru. Tambahkan guru dulu di menu Kelola Guru.</small>
          )}
        </div>
        <div className="mb-3"><label className="form-label">Ruang</label><input className="form-control" value={form.ruang || ''} onChange={e => setForm({ ...form, ruang: e.target.value })} /></div>
        <div className="row g-3 mb-4">
          <div className="col-6"><label className="form-label">Jumlah Siswa</label><input type="number" className="form-control" value={editing ? countSiswa(editing.nama) : 0} readOnly /></div>
          <div className="col-6"><label className="form-label">Kapasitas</label><input type="number" className="form-control" value={form.kapasitas ?? 32} onChange={e => setForm({ ...form, kapasitas: Number(e.target.value) })} /></div>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary flex-fill" onClick={saveKelas}><i className="bi bi-check-lg me-2"></i>Simpan</button>
          <button className="btn btn-outline-secondary" onClick={() => setDrawerOpen(false)}>Batal</button>
        </div>
      </CRUDDrawer>

      <DeleteModal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={confirmDelete} />
    </DashboardLayout>
  )
}
