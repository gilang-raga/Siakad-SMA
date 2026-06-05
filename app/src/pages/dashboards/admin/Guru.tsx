import { useEffect, useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import CRUDDrawer from '../../../components/CRUDDrawer'
import DeleteModal from '../../../components/DeleteModal'
import { addActivity, exportCsv, readStored, store } from '../../../lib/frontendActions'
import { createGuru, deleteGuru, getGuru, updateGuru } from '../../../lib/api'
import { defaultGuru, defaultMapel, type MapelData } from '../../../lib/schoolData'

interface GuruData {
  nip: string
  nama: string
  mapel: string
  jk: string
  status: string
  password?: string
}

function getMapelOptions() {
  return readStored<MapelData[]>('siakad_mapel', defaultMapel).map(mapel => mapel.nama)
}

const navSections = [
  { items: [{ path: '/admin/dashboard', label: 'Dashboard', icon: 'bi-grid' }] },
  {
    title: 'Data Master',
    items: [
      { path: '/admin/siswa', label: 'Kelola Siswa', icon: 'bi-people' },
      { path: '/admin/guru', label: 'Kelola Guru', icon: 'bi-person-badge' },
      { path: '/admin/kelas', label: 'Kelola Kelas', icon: 'bi-building' },
      { path: '/admin/mapel', label: 'Mata Pelajaran', icon: 'bi-book' },
        { path: '/admin/prestasi', label: 'Kelola Prestasi', icon: 'bi-trophy' },
      { path: '/admin/jadwal', label: 'Kelola Jadwal', icon: 'bi-calendar-week' },
      { path: '/admin/tahun-ajaran', label: 'Tahun Ajaran', icon: 'bi-calendar-event' },
    ]
  },
  {
    title: 'Pengaturan',
    items: [
      { path: '/admin/pengumuman', label: 'Pengumuman', icon: 'bi-megaphone' },
      { path: '/admin/laporan', label: 'Laporan & Ekspor', icon: 'bi-file-earmark-bar-graph' },
      { path: '/admin/pengaturan', label: 'Pengaturan Sistem', icon: 'bi-gear' },
    ]
  },
]

export default function AdminGuru() {
  const [data, setData] = useState<GuruData[]>(() => readStored('siakad_guru', defaultGuru))
  const [mapelOptions, setMapelOptions] = useState<string[]>(() => getMapelOptions())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState<GuruData | null>(null)
  const [deleting, setDeleting] = useState<GuruData | null>(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<Partial<GuruData>>({ status: 'Aktif' })
  const [loading, setLoading] = useState(true)

  useEffect(() => store('siakad_guru', data), [data])

  useEffect(() => {
    getGuru()
      .then(guru => setData(guru))
      .catch(() => setData(readStored('siakad_guru', defaultGuru)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const refreshMapel = () => setMapelOptions(getMapelOptions())

    refreshMapel()
    window.addEventListener('storage', refreshMapel)
    window.addEventListener('focus', refreshMapel)

    return () => {
      window.removeEventListener('storage', refreshMapel)
      window.removeEventListener('focus', refreshMapel)
    }
  }, [])

  const filtered = data.filter(g => g.nama.toLowerCase().includes(search.toLowerCase()) || g.nip.includes(search))

  const openAdd = () => {
    const latestMapel = getMapelOptions()
    setMapelOptions(latestMapel)
    setEditing(null)
    setForm({ status: 'Aktif', jk: 'Laki-laki', mapel: latestMapel[0] || '' })
    setDrawerOpen(true)
  }

  const openEdit = (guru: GuruData) => {
    setMapelOptions(getMapelOptions())
    setEditing(guru)
    setForm(guru)
    setDrawerOpen(true)
  }

  const syncMapelGuru = (guru: GuruData) => {
    const mapel = readStored<MapelData[]>('siakad_mapel', defaultMapel)
    store('siakad_mapel', mapel.map(m => m.nama === guru.mapel ? { ...m, guru: guru.nama } : m))
  }

  const saveGuru = async () => {
    if (!form.nip || !form.nama || !form.mapel || !form.jk) {
      alert('NIP, nama, mapel, dan jenis kelamin wajib diisi')
      return
    }

    const payload: GuruData = {
      nip: form.nip,
      nama: form.nama,
      mapel: form.mapel,
      jk: form.jk,
      status: form.status || 'Aktif',
      password: form.password || undefined,
    }

    try {
      if (editing) {
        const updated = await updateGuru(editing.nip, payload)
        setData(prev => prev.map(g => g.nip === editing.nip ? { ...updated, password: payload.password } : g))
        addActivity('Data guru diperbarui', `${payload.nama} - ${payload.mapel}`, 'bi-pencil-square')
      } else {
        if (data.some(g => g.nip === payload.nip)) {
          alert('NIP sudah digunakan')
          return
        }
        const created = await createGuru(payload)
        setData(prev => [...prev, { ...created, password: payload.password }])
        addActivity('Data guru baru ditambahkan', `${payload.nama} - ${payload.mapel}`, 'bi-person-badge')
      }
      syncMapelGuru(payload)
      setDrawerOpen(false)
    } catch (err) {
      if (editing) {
        setData(prev => prev.map(g => g.nip === editing.nip ? payload : g))
      } else {
        setData(prev => [...prev, payload])
      }
      syncMapelGuru(payload)
      setDrawerOpen(false)
      alert(err instanceof Error ? `${err.message}. Data disimpan lokal.` : 'Data disimpan lokal.')
    }
  }

  const confirmDelete = async () => {
    if (deleting) {
      try {
        await deleteGuru(deleting.nip)
        setData(prev => prev.filter(g => g.nip !== deleting.nip))
        addActivity('Data guru dihapus', `${deleting.nama} - ${deleting.mapel}`, 'bi-trash')
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Gagal menghapus data guru')
      }
    }
    setDeleteOpen(false)
  }

  return (
    <DashboardLayout role="admin" userName="Administrator" navSections={navSections}>
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h1>Kelola Data Guru</h1>
          <p className="text-muted mb-0">Manajemen data guru dan tenaga pendidik</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <i className="bi bi-plus-lg me-2"></i>Tambah Data
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
            <input type="text" className="form-control" placeholder="Cari NIP atau nama..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="col-md-6 text-end">
          <button className="btn btn-outline-secondary" onClick={() => exportCsv('data-guru', filtered)}>
            <i className="bi bi-download me-2"></i>Ekspor
          </button>
        </div>
      </div>

      <div className="siakad-table">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr><th>No</th><th>NIP</th><th>Nama Lengkap</th><th>Mata Pelajaran</th><th>Jenis Kelamin</th><th>Status</th><th>Password</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="text-center py-4 text-muted">Memuat data...</td></tr>}
              {!loading && filtered.map((g, idx) => (
                <tr key={g.nip}>
                  <td>{idx + 1}</td>
                  <td className="font-monospace small">{g.nip}</td>
                  <td className="fw-medium">{g.nama}</td>
                  <td>{g.mapel}</td>
                  <td>{g.jk}</td>
                  <td><span className={`badge-siakad ${g.status === 'Aktif' ? 'success' : 'warning'}`}>{g.status}</span></td>
                  <td className="font-monospace small">{g.password ? 'Tersimpan' : '-'}</td>
                  <td>
                    <button className="btn btn-link text-muted p-0 me-2" onClick={() => openEdit(g)}><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-link text-danger p-0" onClick={() => { setDeleting(g); setDeleteOpen(true) }}><i className="bi bi-trash"></i></button>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && <tr><td colSpan={8} className="text-center py-4 text-muted">Tidak ada data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <CRUDDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? 'Edit Data Guru' : 'Tambah Data Guru'}>
        <div className="mb-3"><label className="form-label">NIP</label><input type="text" className="form-control" value={form.nip || ''} onChange={e => setForm({ ...form, nip: e.target.value })} /></div>
        <div className="mb-3"><label className="form-label">Nama Lengkap</label><input type="text" className="form-control" value={form.nama || ''} onChange={e => setForm({ ...form, nama: e.target.value })} /></div>
        <div className="mb-3">
          <label className="form-label">Mata Pelajaran</label>
          <select className="form-select" value={form.mapel || ''} onChange={e => setForm({ ...form, mapel: e.target.value })} disabled={mapelOptions.length === 0}>
            <option value="">Pilih Mapel</option>
            {mapelOptions.map(mapel => <option key={mapel} value={mapel}>{mapel}</option>)}
          </select>
          {mapelOptions.length === 0 && (
            <small className="text-danger">Belum ada mapel. Tambahkan mata pelajaran dulu di menu Mata Pelajaran.</small>
          )}
        </div>
        <div className="mb-3"><label className="form-label">Jenis Kelamin</label><select className="form-select" value={form.jk || 'Laki-laki'} onChange={e => setForm({ ...form, jk: e.target.value })}><option>Laki-laki</option><option>Perempuan</option></select></div>
        <div className="mb-4"><label className="form-label">Status</label><select className="form-select" value={form.status || 'Aktif'} onChange={e => setForm({ ...form, status: e.target.value })}><option>Aktif</option><option>Cuti</option><option>Pensiun</option></select></div>
        <div className="mb-4"><label className="form-label">Password Login</label><input type="text" className="form-control" placeholder={editing ? 'Kosongkan jika tidak diubah' : 'Otomatis: nama + 2 digit NIP'} value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary flex-fill" onClick={saveGuru}><i className="bi bi-check-lg me-2"></i>Simpan</button>
          <button className="btn btn-outline-secondary" onClick={() => setDrawerOpen(false)}>Batal</button>
        </div>
      </CRUDDrawer>

      <DeleteModal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={confirmDelete} />
    </DashboardLayout>
  )
}
