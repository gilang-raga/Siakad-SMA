import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../../components/DashboardLayout'
import { getGuruDashboard, type GuruDashboardData } from '../../../lib/api'
import { formatActivityTime, getActivities, type ActivityItem } from '../../../lib/frontendActions'
import { getCurrentUser } from '../../../lib/schoolData'

const navSections = [
  { items: [{ path: '/guru/dashboard', label: 'Dashboard', icon: 'bi-grid' }] },
  {
    title: 'Mengajar',
    items: [
      { path: '/guru/materi', label: 'Materi & Tugas', icon: 'bi-folder-plus' },
      { path: '/guru/jadwal', label: 'Jadwal Mengajar', icon: 'bi-calendar-week' },
      { path: '/guru/nilai', label: 'Input Nilai', icon: 'bi-file-earmark-text' },
      { path: '/guru/absensi', label: 'Input Absensi', icon: 'bi-clipboard-check' },
    ]
  },
]

const fallbackActivities: ActivityItem[] = [
  { id: 'guru-fallback-1', action: 'Absensi kelas diperbarui', detail: 'X IPA 2 - sesi hari ini', icon: 'bi-clipboard-check', createdAt: new Date().toISOString() },
  { id: 'guru-fallback-2', action: 'Materi dibagikan', detail: 'Materi pembelajaran terbaru', icon: 'bi-folder-plus', createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
  { id: 'guru-fallback-3', action: 'Nilai siswa disinkronkan', detail: 'Rekap nilai semester genap', icon: 'bi-file-earmark-text', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
]

export default function GuruDashboard() {
  const user = getCurrentUser()
  const [dashboard, setDashboard] = useState<GuruDashboardData | null>(null)
  const [error, setError] = useState('')
  const [activities, setActivities] = useState<ActivityItem[]>(() => getActivities())
  const guruName = dashboard?.guru.nama || user.name || 'Guru'
  const schedule = dashboard?.jadwalHariIni || []
  const recentActivities = activities.length > 0 ? activities.slice(0, 3) : fallbackActivities
  const summary = dashboard?.ringkasan || { totalSiswa: 96, totalKelas: 3, totalMapel: 1, jpMinggu: 21 }
  const todayLabel = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

  useEffect(() => {
    if (!user.username) return

    getGuruDashboard(user.username)
      .then(data => {
        setDashboard(data)
        setError('')
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Gagal memuat dashboard guru dari database')
      })
  }, [user.username])

  useEffect(() => {
    const refreshActivities = () => setActivities(getActivities())
    window.addEventListener('focus', refreshActivities)
    window.addEventListener('storage', refreshActivities)

    return () => {
      window.removeEventListener('focus', refreshActivities)
      window.removeEventListener('storage', refreshActivities)
    }
  }, [])

  return (
    <DashboardLayout role="guru" userName={guruName} navSections={navSections}>
      <div className="page-header">
        <h1>Dashboard Guru</h1>
        <p className="text-muted">Selamat datang, {guruName}. Selamat mengajar hari ini!</p>
      </div>

      {error && (
        <div className="alert alert-warning" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>{error}. Data cadangan ditampilkan.
        </div>
      )}

      <div className="row g-4">
        {/* Schedule Today */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <h6 className="mb-0"><i className="bi bi-calendar-day me-2 text-primary"></i>Jadwal Hari Ini - {todayLabel}</h6>
              <Link to="/guru/jadwal" className="btn btn-sm btn-outline-primary">
                <i className="bi bi-arrow-right-circle me-1"></i>Lihat Detail
              </Link>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {schedule.length === 0 && (
                  <div className="list-group-item py-4 text-center text-muted">
                    Tidak ada jadwal mengajar hari ini.
                  </div>
                )}
                {schedule.map((j, idx) => (
                  <div className="list-group-item d-flex gap-3 align-items-center py-3" key={idx}>
                    <div className="text-center" style={{ minWidth: 100 }}>
                      <small className="text-muted d-block">{j.jam}</small>
                    </div>
                    <div className="flex-grow-1">
                      {j.mapel === 'Istirahat' ? (
                        <span className="text-muted"><i className="bi bi-cup-hot me-2"></i>Istirahat</span>
                      ) : (
                        <>
                          <h6 className="mb-0" style={{ fontSize: '0.9rem' }}>{j.mapel} - {j.kelas}</h6>
                          <small className="text-muted">Ruang: {j.ruang}</small>
                        </>
                      )}
                    </div>
                    {j.status !== '-' && (
                      <span className={`badge ${
                        j.status === 'Selesai' ? 'bg-success' :
                        j.status === 'Sedang Berlangsung' ? 'bg-warning text-dark' : 'bg-primary'
                      }`} style={{ fontSize: '0.7rem' }}>{j.status}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white">
              <h6 className="mb-0"><i className="bi bi-clock-history me-2 text-warning"></i>Recent Activity</h6>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {recentActivities.map((activity, idx) => (
                  <div className="list-group-item py-3" key={idx}>
                    <div className="d-flex gap-3">
                      <div className="d-inline-flex align-items-center justify-content-center rounded-circle" style={{ width: 34, height: 34, background: 'rgba(59,110,255,0.1)' }}>
                        <i className={`bi ${activity.icon} text-primary`}></i>
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="mb-1" style={{ fontSize: '0.85rem' }}>{activity.action}</h6>
                        <small className="text-muted d-block">{activity.detail}</small>
                        <small className="text-muted">{formatActivityTime(activity.createdAt)}</small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body p-4 text-center">
              <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: 60, height: 60, background: 'rgba(59,110,255,0.1)' }}>
                <i className="bi bi-people-fill text-primary fs-2"></i>
              </div>
              <h5 className="mb-1">{summary.totalSiswa} Siswa</h5>
              <p className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>Total siswa yang Anda ajar semester ini</p>
              <div className="row g-2 text-center">
                <div className="col-4">
                  <div className="p-2 rounded" style={{ background: 'var(--inst-bg)' }}>
                    <div className="fw-bold text-primary">{summary.totalKelas}</div>
                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>Kelas</small>
                  </div>
                </div>
                <div className="col-4">
                  <div className="p-2 rounded" style={{ background: 'var(--inst-bg)' }}>
                    <div className="fw-bold text-success">{summary.totalMapel}</div>
                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>Mapel</small>
                  </div>
                </div>
                <div className="col-4">
                  <div className="p-2 rounded" style={{ background: 'var(--inst-bg)' }}>
                    <div className="fw-bold text-warning">{summary.jpMinggu}</div>
                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>JP/Minggu</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
