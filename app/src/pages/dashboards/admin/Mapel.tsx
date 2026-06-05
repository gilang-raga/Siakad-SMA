import { useEffect, useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import CRUDDrawer from '../../../components/CRUDDrawer'
import DeleteModal from '../../../components/DeleteModal'
import { addActivity, readStored, store } from '../../../lib/frontendActions'
import { defaultGuru, defaultMapel, type GuruData } from '../../../lib/schoolData'

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

interface MapelData {
  kode: string
  nama: string
  kelompok: string
  kelas: string
  jpm: number
  guru?: string
}

export default function AdminMapel() {
  const [data, setData] = useState<MapelData[]>(() => readStored('siakad_mapel', defaultMapel))
  const [guruOptions, setGuruOptions] = useState<GuruData[]>(() => readStored('siakad_guru', defaultGuru))
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState<MapelData | null>(null)
  const [deleting, setDeleting] = useState<MapelData | null>(null)
  const [form, setForm] = useState<Partial<MapelData>>({ kelompok: 'A', kelas: 'X, XI, XII', jpm: 2 })

  useEffect(() => store('siakad_mapel', data), [data])

  useEffect(() => {
    const refreshGuru = () => setGuruOptions(readStored('siakad_guru', defaultGuru))
    window.addEventListener('storage', refreshGuru)
    window.addEventListener('focus', refreshGuru)
    return () => {
      window.removeEventListener('storage', refreshGuru)
      window.removeEventListener('focus', refreshGuru)
    }
  }, [])

  const filtered = data.filter(m => `${m.kode} ${m.nama}`.toLowerCase().includes(search.toLowerCase()))

  const openAdd = () => {
    setEditing(null)
    setGuruOptions(readStored('siakad_guru', defaultGuru))
    setForm({ kelompok: 'A', kelas: 'X, XI, XII', jpm: 2, guru: '' })
    setDrawerOpen(true)
  }

  const openEdit = (mapel: MapelData) => {
    setEditing(mapel)
    setGuruOptions(readStored('siakad_guru', defaultGuru))
    setForm(mapel)
    setDrawerOpen(true)
  }

  const saveMapel = () => {
    if (!form.kode || !form.nama || !form.kelompok || !form.kelas || !form.jpm) {
      alert('Semua field mapel wajib diisi')
      return
    }

    const payload: MapelData = {
      kode: form.kode,
      nama: form.nama,
      kelompok: form.kelompok,
      kelas: form.kelas,
      jpm: Number(form.jpm),
      guru: form.guru || '',
    }

    if (editing) {
      setData(prev => prev.map(m => m.kode === editing.kode ? payload : m))
      addActivity('Mata pelajaran diperbarui', `${payload.kode} - ${payload.nama}`, 'bi-book')
    } else {
      if (data.some(m => m.kode === payload.kode)) {
        alert('Kode mapel sudah digunakan')
        return
      }
      setData(prev => [...prev, payload])
      addActivity('Mata pelajaran baru ditambahkan', `${payload.kode} - ${payload.nama}`, 'bi-book')
    }

    setDrawerOpen(false)
  }

  const confirmDelete = () => {
    if (deleting) {
      setData(prev => prev.filter(m => m.kode !== deleting.kode))
      addActivity('Mata pelajaran dihapus', `${deleting.kode} - ${deleting.nama}`, 'bi-trash')
    }
    setDeleteOpen(false)
  }

  return (
    <DashboardLayout role="admin" userName="Administrator" navSections={navSections}>
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h1>Kelola Mata Pelajaran</h1>
          <p className="text-muted mb-0">Daftar mata pelajaran berdasarkan kurikulum</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><i className="bi bi-plus-lg me-2"></i>Tambah Mapel</button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
            <input type="text" className="form-control" placeholder="Cari mata pelajaran..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="siakad-table">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr><th>No</th><th>Kode</th><th>Nama Mata Pelajaran</th><th>Guru</th><th>Kelompok</th><th>Kelas</th><th>JPM</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {filtered.map((m, idx) => (
                <tr key={m.kode}>
                  <td>{idx + 1}</td>
                  <td className="font-monospace fw-medium">{m.kode}</td>
                  <td>{m.nama}</td>
                  <td>{m.guru || '-'}</td>
                  <td><span className="badge bg-info">{m.kelompok}</span></td>
                  <td>{m.kelas}</td>
                  <td>{m.jpm} x</td>
                  <td>
                    <button className="btn btn-link text-muted p-0 me-2" onClick={() => openEdit(m)}><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-link text-danger p-0" onClick={() => { setDeleting(m); setDeleteOpen(true) }}><i className="bi bi-trash"></i></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-4 text-muted">Tidak ada data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <CRUDDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}>
        <div className="mb-3"><label className="form-label">Kode</label><input className="form-control" value={form.kode || ''} onChange={e => setForm({ ...form, kode: e.target.value.toUpperCase() })} /></div>
        <div className="mb-3"><label className="form-label">Nama Mata Pelajaran</label><input className="form-control" value={form.nama || ''} onChange={e => setForm({ ...form, nama: e.target.value })} /></div>
        <div className="mb-3"><label className="form-label">Guru Pengajar</label><select className="form-select" value={form.guru || ''} onChange={e => setForm({ ...form, guru: e.target.value })}><option value="">Pilih Guru</option>{guruOptions.map(g => <option key={g.nip} value={g.nama}>{g.nama}</option>)}</select></div>
        <div className="mb-3"><label className="form-label">Kelompok</label><select className="form-select" value={form.kelompok || 'A'} onChange={e => setForm({ ...form, kelompok: e.target.value })}><option>A</option><option>B</option><option>Peminatan</option></select></div>
        <div className="mb-3"><label className="form-label">Kelas</label><input className="form-control" value={form.kelas || ''} onChange={e => setForm({ ...form, kelas: e.target.value })} /></div>
        <div className="mb-4"><label className="form-label">JPM</label><input type="number" min={1} className="form-control" value={form.jpm || 1} onChange={e => setForm({ ...form, jpm: Number(e.target.value) })} /></div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary flex-fill" onClick={saveMapel}><i className="bi bi-check-lg me-2"></i>Simpan</button>
          <button className="btn btn-outline-secondary" onClick={() => setDrawerOpen(false)}>Batal</button>
        </div>
      </CRUDDrawer>

      <DeleteModal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={confirmDelete} />
    </DashboardLayout>
  )
}
