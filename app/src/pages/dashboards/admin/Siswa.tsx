import { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import DashboardLayout from '../../../components/DashboardLayout'
import CRUDDrawer from '../../../components/CRUDDrawer'
import DeleteModal from '../../../components/DeleteModal'
import { createSiswa, deleteSiswa, getSiswa, updateSiswa, type SiswaData } from '../../../lib/api'
import { addActivity, exportCsv, readStored, store } from '../../../lib/frontendActions'

interface KelasData {
  nama: string
  wali: string
  jmlSiswa: number
  kapasitas: number
  ruang: string
}

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

const siswaImportAliases: Record<keyof SiswaData, string[]> = {
  nisn: ['nisn', 'noinduksiswanasional'],
  nama: ['nama', 'namalengkap', 'namasiswa'],
  kelas: ['kelas'],
  jk: ['jk', 'jeniskelamin', 'gender'],
  status: ['status'],
  password: ['password', 'passwordlogin'],
}

function normalizeHeader(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[_-]/g, '')
}

function splitDelimitedLine(line: string, delimiter: string) {
  const cells: string[] = []
  let current = ''
  let quoted = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"' && quoted && next === '"') {
      current += '"'
      i += 1
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === delimiter && !quoted) {
      cells.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  cells.push(current.trim())
  return cells
}

function detectDelimiter(line: string) {
  const delimiters = [',', ';', '\t']
  return delimiters
    .map(delimiter => ({ delimiter, count: line.split(delimiter).length }))
    .sort((a, b) => b.count - a.count)[0]?.delimiter || ','
}

function parseDelimited(text: string) {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter(line => line.trim())
  const delimiter = detectDelimiter(lines[0] || '')

  return lines.map(line => splitDelimitedLine(line, delimiter))
}

function parseHtmlTable(text: string) {
  const doc = new DOMParser().parseFromString(text, 'text/html')
  const tableRows = Array.from(doc.querySelectorAll('tr'))
  return tableRows
    .map(row => Array.from(row.querySelectorAll('th,td')).map(cell => cell.textContent?.trim() || ''))
    .filter(row => row.some(Boolean))
}

function rowsToSiswa(rows: string[][]) {
  if (rows.length < 2) return []

  const headerIndex = rows.findIndex(row => {
    const normalized = row.map(header => normalizeHeader(header))
    return siswaImportAliases.nisn.some(alias => normalized.includes(alias))
      && siswaImportAliases.nama.some(alias => normalized.includes(alias))
      && siswaImportAliases.kelas.some(alias => normalized.includes(alias))
      && siswaImportAliases.jk.some(alias => normalized.includes(alias))
  })

  if (headerIndex < 0) return []

  const headerMap = rows[headerIndex].map(header => normalizeHeader(header))
  return rows.slice(headerIndex + 1).map((row, index) => {
    const record: Partial<SiswaData> & { rowNumber: number } = { rowNumber: headerIndex + index + 2 }
    Object.entries(siswaImportAliases).forEach(([field, aliases]) => {
      const columnIndex = aliases.map(alias => headerMap.indexOf(alias)).find(item => item >= 0) ?? -1
      if (columnIndex >= 0 && row[columnIndex]) {
        record[field as keyof SiswaData] = String(row[columnIndex]).trim()
      }
    })
    return record
  }).filter(row => row.nisn || row.nama || row.kelas || row.jk || row.password)
}

async function readWorkbookRows(file: File) {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
  const firstSheet = workbook.SheetNames[0]
  if (!firstSheet) return []

  return XLSX.utils.sheet_to_json<string[]>(workbook.Sheets[firstSheet], {
    header: 1,
    raw: false,
    defval: '',
  })
}

function readTextFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Gagal membaca file import'))
    reader.readAsText(file)
  })
}

function getKelasOptions() {
  return readStored<KelasData[]>('siakad_kelas', defaultKelas).map(kelas => kelas.nama)
}

function getKelasList() {
  return readStored<KelasData[]>('siakad_kelas', defaultKelas)
}

function sortSiswaByNisn(rows: SiswaData[]) {
  return [...rows].sort((a, b) => a.nisn.localeCompare(b.nisn, 'id-ID', { numeric: true }))
}

export default function AdminSiswa() {
  const [data, setData] = useState<SiswaData[]>([])
  const [kelasList, setKelasList] = useState<KelasData[]>(() => getKelasList())
  const [kelasOptions, setKelasOptions] = useState<string[]>(() => getKelasOptions())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState<SiswaData | null>(null)
  const [deleting, setDeleting] = useState<SiswaData | null>(null)
  const [search, setSearch] = useState('')
  const [filterKelas, setFilterKelas] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const importInputRef = useRef<HTMLInputElement | null>(null)

  const [form, setForm] = useState<Partial<SiswaData>>({})

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

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      const siswa = await getSiswa()
      const sorted = sortSiswaByNisn(siswa)
      setData(sorted)
      store('siakad_siswa', sorted)
    } catch (err) {
      setData(sortSiswaByNisn(readStored<SiswaData[]>('siakad_siswa', [])))
      setError(err instanceof Error ? err.message : 'Gagal memuat data siswa')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const refreshKelas = () => {
      const latestKelas = getKelasList()
      setKelasList(latestKelas)
      setKelasOptions(latestKelas.map(kelas => kelas.nama))
    }

    refreshKelas()
    window.addEventListener('storage', refreshKelas)
    window.addEventListener('focus', refreshKelas)

    return () => {
      window.removeEventListener('storage', refreshKelas)
      window.removeEventListener('focus', refreshKelas)
    }
  }, [])

  const filtered = sortSiswaByNisn(data.filter(s => {
    const matchSearch = s.nama.toLowerCase().includes(search.toLowerCase()) || s.nisn.includes(search)
    const matchKelas = !filterKelas || s.kelas === filterKelas
    return matchSearch && matchKelas
  }))

  const openAdd = () => {
    const latestKelas = getKelasList()
    setEditing(null)
    setKelasList(latestKelas)
    setKelasOptions(latestKelas.map(kelas => kelas.nama))
    setForm({ status: 'Aktif', kelas: latestKelas[0]?.nama || '' })
    setDrawerOpen(true)
  }

  const openEdit = (s: SiswaData) => {
    const latestKelas = getKelasList()
    setKelasList(latestKelas)
    setKelasOptions(latestKelas.map(kelas => kelas.nama))
    setEditing(s)
    setForm({ ...s })
    setDrawerOpen(true)
  }

  const openDelete = (s: SiswaData) => {
    setDeleting(s)
    setDeleteOpen(true)
  }

  const handleSave = async () => {
    if (!form.nisn || !form.nama || !form.kelas || !form.jk) {
      setError('NISN, nama, kelas, dan jenis kelamin wajib diisi')
      return
    }

    const payload: SiswaData = {
      nisn: form.nisn,
      nama: form.nama,
      kelas: form.kelas,
      jk: form.jk,
      status: form.status || 'Aktif',
      password: form.password || undefined,
    }

    const selectedKelas = kelasList.find(kelas => kelas.nama === payload.kelas)
    if (!selectedKelas) {
      setError('Kelas tidak ditemukan. Tambahkan kelas dulu di menu Kelola Kelas.')
      return
    }

    const jumlahSiswaDiKelas = data.filter(s => s.kelas === payload.kelas && (!editing || s.nisn !== editing.nisn)).length
    if (jumlahSiswaDiKelas >= selectedKelas.kapasitas) {
      setError(`Kelas ${selectedKelas.nama} sudah penuh (${selectedKelas.kapasitas}/${selectedKelas.kapasitas} siswa). Pilih kelas lain atau tambah kapasitas kelas.`)
      return
    }

    try {
      setSaving(true)
      setError('')
      if (editing) {
        const updated = await updateSiswa(editing.nisn, payload)
        setData(prev => {
          const next = sortSiswaByNisn(prev.map(s => s.nisn === editing.nisn ? { ...updated, password: payload.password } : s))
          store('siakad_siswa', next)
          return next
        })
        addActivity('Data siswa diperbarui', `${payload.nama} - ${payload.kelas}`, 'bi-pencil-square')
      } else {
        const created = await createSiswa(payload)
        setData(prev => {
          const next = sortSiswaByNisn([...prev, { ...created, password: payload.password }])
          store('siakad_siswa', next)
          return next
        })
        addActivity('Data siswa baru ditambahkan', `${payload.nama} masuk ${payload.kelas}`, 'bi-person-plus')
      }
      setDrawerOpen(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan data siswa'
      setError(message)
      alert(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (deleting) {
      try {
        setError('')
        await deleteSiswa(deleting.nisn)
        setData(prev => {
          const next = sortSiswaByNisn(prev.filter(s => s.nisn !== deleting.nisn))
          store('siakad_siswa', next)
          return next
        })
        addActivity('Data siswa dihapus', `${deleting.nama} dari ${deleting.kelas}`, 'bi-trash')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal menghapus data siswa')
      }
    }
    setDeleteOpen(false)
  }

  const downloadTemplate = () => {
    window.open('/templates/template-import-siswa.xlsx', '_blank')
  }

  const handleImport = async (file: File | undefined) => {
    if (!file) return

    try {
      setImporting(true)
      setError('')
      const fileName = file.name.toLowerCase()
      let tableRows: string[][]

      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
        tableRows = await readWorkbookRows(file)
      } else {
        const text = await readTextFile(file)
        const htmlRows = parseHtmlTable(text)
        tableRows = htmlRows.length > 0 ? htmlRows : parseDelimited(text)
      }

      const importedRows = rowsToSiswa(tableRows)

      if (importedRows.length === 0) {
        throw new Error('File import kosong atau header tidak ditemukan. Pastikan ada kolom: nisn, nama, kelas, jk, status, password.')
      }

      const latestKelas = getKelasList()
      const kelasNames = new Set(latestKelas.map(kelas => kelas.nama))
      const normalizedRows = importedRows.map(row => ({
        rowNumber: row.rowNumber,
        nisn: row.nisn?.trim() || '',
        nama: row.nama?.trim() || '',
        kelas: row.kelas?.trim() || '',
        jk: row.jk?.trim() || '',
        status: row.status?.trim() || 'Aktif',
        password: row.password?.trim() || undefined,
      }))

      const invalid = normalizedRows.find(row => !row.nisn || !row.nama || !row.kelas || !row.jk)
      if (invalid) {
        throw new Error(`Baris ${invalid.rowNumber || '-'} belum lengkap. Kolom wajib: NISN, nama, kelas, dan jenis kelamin.`)
      }

      const invalidKelas = normalizedRows.find(row => !kelasNames.has(row.kelas))
      if (invalidKelas) {
        throw new Error(`Kelas ${invalidKelas.kelas} tidak ditemukan. Tambahkan kelas dulu di menu Kelola Kelas.`)
      }

      const dedupedRows = Array.from(new Map(normalizedRows.map(row => [row.nisn, row])).values())
      const existingByNisn = new Map(data.map(siswa => [siswa.nisn, siswa]))
      const savedRows: SiswaData[] = []

      for (const row of dedupedRows) {
        const payload: SiswaData = {
          nisn: row.nisn,
          nama: row.nama,
          kelas: row.kelas,
          jk: row.jk,
          status: row.status,
          password: row.password,
        }
        const existing = existingByNisn.get(row.nisn)
        const saved = existing ? await updateSiswa(existing.nisn, payload) : await createSiswa(payload)
        savedRows.push({ ...saved, password: payload.password })
      }

      setData(prev => {
        const nextByNisn = new Map(prev.map(siswa => [siswa.nisn, siswa]))
        savedRows.forEach(row => nextByNisn.set(row.nisn, row))
        const next = sortSiswaByNisn(Array.from(nextByNisn.values()))
        store('siakad_siswa', next)
        return next
      })
      addActivity('Import data siswa', `${savedRows.length} data siswa diproses dari Excel`, 'bi-file-earmark-arrow-up')
      alert(`Import selesai. ${savedRows.length} data siswa berhasil diproses.`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal import data siswa'
      setError(message)
      alert(message)
    } finally {
      setImporting(false)
      if (importInputRef.current) importInputRef.current.value = ''
    }
  }

  return (
    <DashboardLayout role="admin" userName="Administrator" navSections={navSections}>
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h1>Kelola Data Siswa</h1>
          <p className="text-muted mb-0">Manajemen data seluruh siswa SMA Negeri 3 Surabaya</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <i className="bi bi-plus-lg me-2"></i>Tambah Data
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-circle me-2"></i>{error}
        </div>
      )}

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
            <input
              type="text"
              className="form-control"
              placeholder="Cari NISN atau nama..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-3">
          <select className="form-select" value={filterKelas} onChange={e => setFilterKelas(e.target.value)}>
            <option value="">Semua Kelas</option>
            {kelasOptions.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div className="col-md-3 text-end">
          <input
            ref={importInputRef}
            type="file"
            className="d-none"
            accept=".xlsx,.xls,.csv,.html,.tsv"
            onChange={event => handleImport(event.target.files?.[0])}
          />
          <div className="btn-group">
            <button className="btn btn-outline-primary" onClick={() => importInputRef.current?.click()} disabled={importing || saving}>
              <i className="bi bi-file-earmark-arrow-down me-2"></i>{importing ? 'Import...' : 'Import'}
            </button>
            <button className="btn btn-outline-secondary" onClick={downloadTemplate} title="Unduh template import siswa">
              <i className="bi bi-file-earmark-spreadsheet"></i>
            </button>
            <button className="btn btn-outline-secondary" onClick={() => exportCsv('data-siswa', filtered)}>
              <i className="bi bi-file-earmark-arrow-up me-2"></i>Ekspor
            </button>
          </div>
        </div>
      </div>

      <div className="siakad-table">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>No</th>
                <th>NISN</th>
                <th>Nama Lengkap</th>
                <th>Kelas</th>
                <th>Jenis Kelamin</th>
                <th>Status</th>
                <th>Password</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-muted">Memuat data...</td>
                </tr>
              )}
              {!loading && filtered.map((s, idx) => (
                <tr key={s.nisn}>
                  <td>{idx + 1}</td>
                  <td className="font-monospace">{s.nisn}</td>
                  <td className="fw-medium">{s.nama}</td>
                  <td>{s.kelas}</td>
                  <td>{s.jk}</td>
                  <td>
                    <span className={`badge-siakad ${
                      s.status === 'Aktif' ? 'success' :
                      s.status === 'Cuti' ? 'warning' :
                      s.status === 'Pindah' ? 'primary' : 'danger'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="font-monospace small">{s.password ? 'Tersimpan' : '-'}</td>
                  <td>
                    <div className="dropdown">
                      <button className="btn btn-link text-muted p-0" data-bs-toggle="dropdown">
                        <i className="bi bi-three-dots-vertical"></i>
                      </button>
                      <ul className="dropdown-menu dropdown-menu-end">
                        <li><button className="dropdown-item" onClick={() => openEdit(s)}><i className="bi bi-pencil me-2"></i>Edit</button></li>
                        <li><button className="dropdown-item text-danger" onClick={() => openDelete(s)}><i className="bi bi-trash me-2"></i>Hapus</button></li>
                      </ul>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-muted">Tidak ada data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="d-flex justify-content-between align-items-center p-3 border-top">
          <small className="text-muted">Menampilkan {filtered.length} dari {data.length} data</small>
        </div>
      </div>

      <CRUDDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? 'Edit Data Siswa' : 'Tambah Data Siswa'}>
        <div className="mb-3">
          <label className="form-label">NISN</label>
          <input type="text" className="form-control" value={form.nisn || ''} onChange={e => setForm({ ...form, nisn: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className="form-label">Nama Lengkap</label>
          <input type="text" className="form-control" value={form.nama || ''} onChange={e => setForm({ ...form, nama: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className="form-label">Kelas</label>
          <select className="form-select" value={form.kelas || ''} onChange={e => setForm({ ...form, kelas: e.target.value })} disabled={kelasOptions.length === 0}>
            <option value="">Pilih Kelas</option>
            {kelasOptions.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          {kelasOptions.length === 0 && (
            <small className="text-danger">Belum ada kelas. Tambahkan kelas dulu di menu Kelola Kelas.</small>
          )}
        </div>
        <div className="mb-3">
          <label className="form-label">Jenis Kelamin</label>
          <select className="form-select" value={form.jk || ''} onChange={e => setForm({ ...form, jk: e.target.value })}>
            <option value="">Pilih</option>
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="form-label">Status</label>
          <select className="form-select" value={form.status || 'Aktif'} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="Aktif">Aktif</option>
            <option value="Cuti">Cuti</option>
            <option value="Pindah">Pindah</option>
            <option value="Drop Out">Drop Out</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="form-label">Password Login</label>
          <input type="text" className="form-control" placeholder={editing ? 'Kosongkan jika tidak diubah' : 'Otomatis: nama + 2 digit NISN'} value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} />
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary flex-fill" onClick={handleSave} disabled={saving}>
            <i className="bi bi-check-lg me-2"></i>{saving ? 'Menyimpan...' : 'Simpan'}
          </button>
          <button className="btn btn-outline-secondary" onClick={() => setDrawerOpen(false)}>Batal</button>
        </div>
      </CRUDDrawer>

      <DeleteModal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} />
    </DashboardLayout>
  )
}
