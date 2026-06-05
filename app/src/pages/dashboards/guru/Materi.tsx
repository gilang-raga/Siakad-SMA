import { useEffect, useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import CRUDDrawer from '../../../components/CRUDDrawer'
import DeleteModal from '../../../components/DeleteModal'
import { addActivity, readStored, store } from '../../../lib/frontendActions'
import { deleteMateriTugas, getMateriTugas, saveMateriTugas, type MateriTugasApiData } from '../../../lib/api'
import { defaultGuru, defaultKelas, defaultMapel, getCurrentUser, getStoredMateriTugas, type MateriTugasData } from '../../../lib/schoolData'

const navSections = [
  { items: [{ path: '/guru/dashboard', label: 'Dashboard', icon: 'bi-grid' }] },
  { title: 'Mengajar', items: [
    { path: '/guru/materi', label: 'Materi & Tugas', icon: 'bi-folder-plus' },
    { path: '/guru/jadwal', label: 'Jadwal Mengajar', icon: 'bi-calendar-week' },
    { path: '/guru/nilai', label: 'Input Nilai', icon: 'bi-file-earmark-text' },
    { path: '/guru/absensi', label: 'Input Absensi', icon: 'bi-clipboard-check' },
  ]},
]

export default function GuruMateri() {
  const user = getCurrentUser()
  const guru = readStored('siakad_guru', defaultGuru).find(item => item.nip === user.username) || defaultGuru[0]
  const kelasOptions = readStored('siakad_kelas', defaultKelas).map(kelas => kelas.nama)
  const mapelOptions = readStored('siakad_mapel', defaultMapel)
    .filter(mapel => !mapel.guru || mapel.guru === guru.nama || mapel.nama === guru.mapel)
    .map(mapel => mapel.nama)

  const [data, setData] = useState<MateriTugasData[]>(() => getStoredMateriTugas())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState<MateriTugasData | null>(null)
  const [deleting, setDeleting] = useState<MateriTugasData | null>(null)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState<Partial<MateriTugasData>>({
    tipe: 'materi',
    kelas: kelasOptions[0] || '',
    mapel: mapelOptions[0] || guru.mapel,
  })
  const [fileMeta, setFileMeta] = useState<{ fileName?: string; fileType?: string; fileData?: string }>({})
  const [loading, setLoading] = useState(true)

  const mine = data.filter(item => item.guru === guru.nama)
  const filtered = filter === 'all' ? mine : mine.filter(item => item.tipe === filter)

  const persist = (next: MateriTugasData[]) => {
    setData(next)
    store('siakad_materi_tugas', next)
  }

  useEffect(() => {
    if (!user.username) return

    getMateriTugas({ guruNip: user.username })
      .then(items => {
        const mapped = items.map(item => ({
          id: item.id,
          judul: item.judul,
          tipe: item.tipe,
          mapel: item.mapel,
          kelas: item.kelas,
          guru: item.guru,
          tanggal: item.tanggal,
          deskripsi: item.deskripsi,
          file: item.fileName,
          deadline: item.deadline,
          fileName: item.fileName,
          fileType: item.fileType,
          fileData: item.fileData,
        })) as MateriTugasData[]
        persist(mapped)
      })
      .finally(() => setLoading(false))
  }, [user.username])

  const openAdd = () => {
    setEditing(null)
    setForm({ tipe: 'materi', kelas: kelasOptions[0] || '', mapel: mapelOptions[0] || guru.mapel })
    setFileMeta({})
    setDrawerOpen(true)
  }

  const openEdit = (item: MateriTugasData) => {
    setEditing(item)
    setForm(item)
    setFileMeta({
      fileName: (item as MateriTugasApiData).fileName || item.file,
      fileType: (item as MateriTugasApiData).fileType,
      fileData: (item as MateriTugasApiData).fileData,
    })
    setDrawerOpen(true)
  }

  const handleFile = (file?: File) => {
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setFileMeta({
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileData: String(reader.result),
      })
      setForm(current => ({ ...current, file: file.name }))
    }
    reader.readAsDataURL(file)
  }

  const saveItem = async () => {
    if (!form.judul || !form.tipe || !form.kelas || !form.mapel || !form.deskripsi) {
      alert('Judul, tipe, kelas, mapel, dan deskripsi wajib diisi')
      return
    }
    if (form.tipe === 'tugas' && !form.deadline) {
      alert('Deadline wajib diisi untuk tugas')
      return
    }

    const payload: MateriTugasData = {
      id: editing?.id || crypto.randomUUID(),
      judul: form.judul,
      tipe: form.tipe,
      kelas: form.kelas,
      mapel: form.mapel,
      guru: guru.nama,
      tanggal: editing?.tanggal || new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      deskripsi: form.deskripsi,
      file: fileMeta.fileName || form.file,
      deadline: form.tipe === 'tugas' ? form.deadline : undefined,
    } as MateriTugasData

    const apiPayload: MateriTugasApiData = {
      ...payload,
      guruNip: user.username || guru.nip,
      fileName: fileMeta.fileName || form.file,
      fileType: fileMeta.fileType,
      fileData: fileMeta.fileData,
    }

    const saved = await saveMateriTugas(apiPayload)
    const nextPayload = {
      ...payload,
      id: saved.id,
      file: saved.fileName,
      fileName: saved.fileName,
      fileType: saved.fileType,
      fileData: saved.fileData,
    } as MateriTugasData
    const next = editing ? data.map(item => item.id === editing.id ? nextPayload : item) : [nextPayload, ...data]
    persist(next)
    addActivity(editing ? 'Materi/tugas diperbarui' : 'Materi/tugas ditambahkan', `${payload.judul} untuk ${payload.kelas}`, 'bi-folder-plus')
    setDrawerOpen(false)
  }

  const confirmDelete = async () => {
    if (deleting) {
      await deleteMateriTugas(deleting.id)
      persist(data.filter(item => item.id !== deleting.id))
      addActivity('Materi/tugas dihapus', deleting.judul, 'bi-trash')
    }
    setDeleteOpen(false)
  }

  return (
    <DashboardLayout role="guru" userName={guru.nama} navSections={navSections}>
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h1>Materi & Tugas</h1>
          <p className="text-muted mb-0">Unggah materi dan tugas agar muncul di dashboard siswa sesuai kelas</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><i className="bi bi-plus-lg me-2"></i>Tambah</button>
      </div>

      <div className="d-flex gap-2 mb-4">
        {[{ id: 'all', label: 'Semua' }, { id: 'materi', label: 'Materi' }, { id: 'tugas', label: 'Tugas' }].map(item => (
          <button key={item.id} className={`btn btn-sm ${filter === item.id ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setFilter(item.id)}>{item.label}</button>
        ))}
      </div>

      <div className="siakad-table">
        <div className="table-responsive">
          <table className="table">
            <thead><tr><th>No</th><th>Judul</th><th>Tipe</th><th>Kelas</th><th>Mapel</th><th>File/Deadline</th><th>Aksi</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="text-center py-4 text-muted">Memuat data...</td></tr>}
              {!loading && filtered.map((item, idx) => (
                <tr key={item.id}>
                  <td>{idx + 1}</td>
                  <td><div className="fw-medium">{item.judul}</div><small className="text-muted">{item.deskripsi}</small></td>
                  <td><span className={`badge ${item.tipe === 'materi' ? 'bg-primary' : 'bg-warning text-dark'}`}>{item.tipe === 'materi' ? 'Materi' : 'Tugas'}</span></td>
                  <td>{item.kelas}</td>
                  <td>{item.mapel}</td>
                  <td>{item.tipe === 'materi' ? (item.file || '-') : item.deadline}</td>
                  <td>
                    <button className="btn btn-link text-muted p-0 me-2" onClick={() => openEdit(item)}><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-link text-danger p-0" onClick={() => { setDeleting(item); setDeleteOpen(true) }}><i className="bi bi-trash"></i></button>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && <tr><td colSpan={7} className="text-center py-4 text-muted">Belum ada materi atau tugas</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <CRUDDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? 'Edit Materi/Tugas' : 'Tambah Materi/Tugas'}>
        <div className="mb-3"><label className="form-label">Tipe</label><select className="form-select" value={form.tipe || 'materi'} onChange={e => setForm({ ...form, tipe: e.target.value as 'materi' | 'tugas' })}><option value="materi">Materi</option><option value="tugas">Tugas</option></select></div>
        <div className="mb-3"><label className="form-label">Judul</label><input className="form-control" value={form.judul || ''} onChange={e => setForm({ ...form, judul: e.target.value })} /></div>
        <div className="mb-3"><label className="form-label">Kelas</label><select className="form-select" value={form.kelas || ''} onChange={e => setForm({ ...form, kelas: e.target.value })}>{kelasOptions.map(kelas => <option key={kelas}>{kelas}</option>)}</select></div>
        <div className="mb-3"><label className="form-label">Mata Pelajaran</label><select className="form-select" value={form.mapel || ''} onChange={e => setForm({ ...form, mapel: e.target.value })}>{mapelOptions.map(mapel => <option key={mapel}>{mapel}</option>)}</select></div>
        <div className="mb-3"><label className="form-label">Deskripsi</label><textarea className="form-control" rows={4} value={form.deskripsi || ''} onChange={e => setForm({ ...form, deskripsi: e.target.value })} /></div>
        {form.tipe === 'tugas' && (
          <div className="mb-3"><label className="form-label">Deadline</label><input type="date" className="form-control" value={form.deadline || ''} onChange={e => setForm({ ...form, deadline: e.target.value })} /></div>
        )}
        <div className="mb-4">
          <label className="form-label">{form.tipe === 'tugas' ? 'File Tugas' : 'File Materi'}</label>
          <input type="file" className="form-control" onChange={e => handleFile(e.target.files?.[0])} />
          {(fileMeta.fileName || form.file) && <small className="text-muted">File dipilih: {fileMeta.fileName || form.file}</small>}
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary flex-fill" onClick={saveItem}><i className="bi bi-check-lg me-2"></i>Simpan</button>
          <button className="btn btn-outline-secondary" onClick={() => setDrawerOpen(false)}>Batal</button>
        </div>
      </CRUDDrawer>

      <DeleteModal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={confirmDelete} />
    </DashboardLayout>
  )
}
