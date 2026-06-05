import { useEffect, useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import { downloadText } from '../../../lib/frontendActions'
import { getDatabaseBackup, getSettings, resetDatabase, updateSettings } from '../../../lib/api'

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

export default function AdminPengaturan() {
  const [activeTab, setActiveTab] = useState('umum')
  const [accountSearch, setAccountSearch] = useState('')
  const [accounts, setAccounts] = useState<{ username: string; nama: string; role: string; status: string }[]>([])
  const [umum, setUmum] = useState({
    namaAplikasi: 'SIAKAD SMAN 3 Surabaya',
    zonaWaktu: 'Asia/Jakarta (WIB)',
    formatTanggal: 'DD/MM/YYYY',
    modePemeliharaan: false,
  })
  const [sekolah, setSekolah] = useState({
    namaSekolah: 'SMA Negeri 3 Surabaya',
    nss: '301056013003',
    npsn: '20533158',
    akreditasi: 'A (Nilai 93)',
    alamat: 'Jl. Memet Sastrowiryo No.54, Komp. Kenjeran, Kec. Bulak, Surabaya, Jawa Timur 60121',
    telepon: '(031) 5678901',
    email: 'seccondgilang@gmail.com',
  })

  useEffect(() => {
    getSettings().then(data => {
      setAccounts(data.accounts)
      if (data.settings.umum) setUmum(current => ({ ...current, ...data.settings.umum }))
      if (data.settings.sekolah) setSekolah(current => ({ ...current, ...data.settings.sekolah }))
    }).catch(() => undefined)
  }, [])

  const saveSettings = async (key: 'umum' | 'sekolah') => {
    await updateSettings(key, key === 'umum' ? umum : sekolah)
    alert('Pengaturan berhasil disimpan dan tersinkron ke database.')
  }

  const backupData = async () => {
    const backup = await getDatabaseBackup()
    downloadText(`backup-siakad-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(backup, null, 2), 'application/json;charset=utf-8')
  }

  const resetSystem = async () => {
    if (!confirm('Reset database website ke data awal? Data saat ini akan diganti oleh seed database.')) return
    await resetDatabase()
    Object.keys(localStorage).filter(key => key.startsWith('siakad_')).forEach(key => localStorage.removeItem(key))
    alert('Database berhasil direset. Refresh halaman untuk melihat data awal.')
  }

  const filteredAccounts = accounts.filter(account => `${account.username} ${account.nama}`.toLowerCase().includes(accountSearch.toLowerCase()))

  return (
    <DashboardLayout role="admin" userName="Administrator" navSections={navSections}>
      <div className="page-header">
        <h1>Pengaturan Sistem</h1>
        <p className="text-muted">Konfigurasi teknis dan manajemen akun</p>
      </div>

      <div className="row">
        <div className="col-lg-3 mb-4">
          <div className="list-group">
            {[
              { id: 'umum', label: 'Umum', icon: 'bi-gear' },
              { id: 'sekolah', label: 'Data Sekolah', icon: 'bi-building' },
              { id: 'akun', label: 'Manajemen Akun', icon: 'bi-people' },
              { id: 'backup', label: 'Backup & Restore', icon: 'bi-cloud-arrow-up' },
            ].map(tab => (
              <button 
                key={tab.id}
                className={`list-group-item list-group-item-action d-flex align-items-center gap-2 ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <i className={`bi ${tab.icon}`}></i>{tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="col-lg-9">
          {activeTab === 'umum' && (
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <h6 className="mb-4">Pengaturan Umum</h6>
                <div className="mb-3">
                  <label className="form-label">Nama Aplikasi</label>
                  <input type="text" className="form-control" value={umum.namaAplikasi} onChange={e => setUmum({ ...umum, namaAplikasi: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Zona Waktu</label>
                  <select className="form-select" value={umum.zonaWaktu} onChange={e => setUmum({ ...umum, zonaWaktu: e.target.value })}><option>Asia/Jakarta (WIB)</option></select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Format Tanggal</label>
                  <select className="form-select" value={umum.formatTanggal} onChange={e => setUmum({ ...umum, formatTanggal: e.target.value })}><option>DD/MM/YYYY</option><option>YYYY-MM-DD</option></select>
                </div>
                <div className="mb-3">
                  <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" id="maint" checked={umum.modePemeliharaan} onChange={e => setUmum({ ...umum, modePemeliharaan: e.target.checked })} />
                    <label className="form-check-label" htmlFor="maint">Mode Pemeliharaan</label>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={() => saveSettings('umum')}><i className="bi bi-check-lg me-2"></i>Simpan Perubahan</button>
              </div>
            </div>
          )}

          {activeTab === 'sekolah' && (
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <h6 className="mb-4">Data Sekolah</h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Nama Sekolah</label>
                    <input type="text" className="form-control" value={sekolah.namaSekolah} onChange={e => setSekolah({ ...sekolah, namaSekolah: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">NSS</label>
                    <input type="text" className="form-control" value={sekolah.nss} onChange={e => setSekolah({ ...sekolah, nss: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">NPSN</label>
                    <input type="text" className="form-control" value={sekolah.npsn} onChange={e => setSekolah({ ...sekolah, npsn: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Akreditasi</label>
                    <input type="text" className="form-control" value={sekolah.akreditasi} onChange={e => setSekolah({ ...sekolah, akreditasi: e.target.value })} />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label">Alamat</label>
                    <textarea className="form-control" rows={2} value={sekolah.alamat} onChange={e => setSekolah({ ...sekolah, alamat: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Telepon</label>
                    <input type="text" className="form-control" value={sekolah.telepon} onChange={e => setSekolah({ ...sekolah, telepon: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" value={sekolah.email} onChange={e => setSekolah({ ...sekolah, email: e.target.value })} />
                  </div>
                </div>
                <div className="mt-4">
                  <button className="btn btn-primary" onClick={() => saveSettings('sekolah')}><i className="bi bi-check-lg me-2"></i>Simpan Perubahan</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'akun' && (
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <h6 className="mb-4">Manajemen Akun Pengguna</h6>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <input type="text" className="form-control w-50" placeholder="Cari akun..." value={accountSearch} onChange={e => setAccountSearch(e.target.value)} />
                  <span className="text-muted small">Akun otomatis mengikuti data admin, guru, dan siswa di database.</span>
                </div>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead><tr><th>Username</th><th>Nama</th><th>Role</th><th>Status</th><th>Aksi</th></tr></thead>
                    <tbody>
                      {filteredAccounts.map(account => (
                        <tr key={account.username}>
                          <td>{account.username}</td>
                          <td>{account.nama}</td>
                          <td><span className={`badge ${account.role === 'admin' ? 'bg-danger' : account.role === 'guru' ? 'bg-primary' : 'bg-info'}`}>{account.role}</span></td>
                          <td><span className={`badge ${account.status === 'Aktif' ? 'bg-success' : 'bg-secondary'}`}>{account.status}</span></td>
                          <td><span className="text-muted small">Kelola dari menu data master</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <h6 className="mb-4">Backup & Restore Data</h6>
                <div className="mb-4">
                  <h6>Backup Database</h6>
                  <p className="text-muted small">Download backup database lengkap sistem SIAKAD.</p>
                  <button className="btn btn-outline-primary" onClick={backupData}><i className="bi bi-download me-2"></i>Download Backup</button>
                </div>
                <hr />
                <div className="mb-4">
                  <h6>Restore Database</h6>
                  <p className="text-muted small">Upload file backup untuk memulihkan data sistem.</p>
                  <div className="input-group">
                    <input type="file" className="form-control" accept=".sql,.zip" />
                    <button className="btn btn-outline-success" onClick={() => alert('File backup dipilih. Restore database asli perlu endpoint backend/admin khusus.')}><i className="bi bi-upload me-2"></i>Restore</button>
                  </div>
                </div>
                <hr />
                <div>
                  <h6 className="text-danger">Zona Berbahaya</h6>
                  <p className="text-muted small">Hapus semua data dan reset sistem ke kondisi awal.</p>
                  <button className="btn btn-outline-danger" onClick={resetSystem}><i className="bi bi-exclamation-triangle me-2"></i>Reset Sistem</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
