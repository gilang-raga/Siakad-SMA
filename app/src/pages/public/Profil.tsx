import { useState } from 'react'
import PublicNavbar from '../../components/PublicNavbar'
import PublicFooter from '../../components/PublicFooter'

export default function Profil() {
  const [activeTab, setActiveTab] = useState('visi')

  const tabs = [
    { id: 'visi', label: 'Visi & Misi' },
    { id: 'sejarah', label: 'Sejarah' },
    { id: 'struktur', label: 'Struktur Organisasi' },
    { id: 'sarana', label: 'Sarana & Prasarana' },
  ]

  const saranaData = [
    { icon: 'bi-building', name: 'Ruang Kelas', desc: '24 ruang kelas dengan kapasitas 32 siswa, dilengkapi AC dan proyektor' },
    { icon: 'bi-book', name: 'Perpustakaan', desc: 'Koleksi 15.000+ buku dengan sistem digital' },
    { icon: 'bi-virus', name: 'Laboratorium Biologi', desc: 'Peralatan lengkap untuk praktikum biologi' },
    { icon: 'bi-magnet', name: 'Laboratorium Fisika', desc: 'Peralatan lengkap untuk praktikum fisika' },
    { icon: 'bi-droplet', name: 'Laboratorium Kimia', desc: 'Peralatan lengkap untuk praktikum kimia' },
    { icon: 'bi-pc-display', name: 'Laboratorium Komputer', desc: '40 unit komputer dengan koneksi internet' },
    { icon: 'bi-globe', name: 'Laboratorium Bahasa', desc: 'Peralatan audio-lingual modern' },
    { icon: 'bi-heart-pulse', name: 'Ruang UKS', desc: 'Unit Kesehatan Sekolah dengan tenaga medis' },
    { icon: 'bi-easel', name: 'Aula', desc: 'Aula multifungsi dengan kapasitas 500 orang' },
    { icon: 'bi-tree', name: 'Gazebo', desc: 'Area belajar outdoor yang nyaman' },
    { icon: 'bi-circle', name: 'Lapangan Basket', desc: 'Lapangan basket standar dengan tribun' },
    { icon: 'bi-hexagon', name: 'Lapangan Futsal', desc: 'Lapangan futsal dengan rumput sintetis' },
    { icon: 'bi-triangle', name: 'Lapangan Voli', desc: 'Lapangan voli indoor dan outdoor' },
    { icon: 'bi-car-front', name: 'Tempat Parkir', desc: 'Parkir luas untuk siswa, guru, dan tamu' },
    { icon: 'bi-shop', name: 'Kantin Sekolah', desc: 'Kantin bersih dengan menu bergizi' },
    { icon: 'bi-moon', name: 'Masjid', desc: 'Masjid Al-Ikhlas untuk kegiatan ibadah' },
  ]

  return (
    <div>
      <PublicNavbar />
      
      {/* Page Header */}
      <section style={{ background: 'var(--inst-navy)', color: 'white', padding: '3rem 0' }}>
        <div className="container">
          <h1 className="mb-2">Profil Sekolah</h1>
          <p className="mb-0 opacity-75">Mengenal lebih dekat SMA Negeri 3 Surabaya</p>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          {/* Tab Navigation */}
          <div className="d-flex gap-2 mb-4 flex-wrap">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Visi & Misi */}
          {activeTab === 'visi' && (
            <div className="row g-4">
              <div className="col-lg-6">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 48, height: 48, background: 'rgba(59,110,255,0.1)' }}>
                        <i className="bi bi-eye text-primary fs-4"></i>
                      </div>
                      <h4 className="mb-0">Visi</h4>
                    </div>
                    <p className="lead">
                      "Unggul, Berakhlak Mulia, Berintegritas, Kritis, Kreatif, dan Peduli Lingkungan serta Berpijak pada Budaya Bangsa."
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 48, height: 48, background: 'rgba(16,185,129,0.1)' }}>
                        <i className="bi bi-bullseye text-success fs-4"></i>
                      </div>
                      <h4 className="mb-0">Misi</h4>
                    </div>
                    <ol className="mb-0">
                      <li className="mb-2">Meningkatkan penghayatan dan pengamalan terhadap ajaran agama yang dianutnya.</li>
                      <li className="mb-2">Meningkatkan sikap jujur, adil dan bertanggungjawab.</li>
                      <li className="mb-2">Melaksanakan pembelajaran kritis, kreatif, komunikatif dan kolaboratif.</li>
                      <li className="mb-2">Meningkatkan budaya literasi.</li>
                      <li className="mb-2">Membudidayakan sikap gotong royong.</li>
                      <li className="mb-2">Melaksanakan pelestarian lingkungan, mencegah kerusakan lingkungan dan mencegah pencemaran lingkungan.</li>
                      <li className="mb-2">Membudidayakan senyum, sapa dan salam sesama warga sekolah di lingkungan sekolah.</li>
                      <li>Mencetak lulusan yang kompetitif, inovatif, dan berwawasan global.</li>
                    </ol>
                  </div>
                </div>
              </div>
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-body p-4">
                    <h5 className="mb-3">Motto</h5>
                    <div className="row g-3">
                      {[
                        { title: 'Berkarakter', desc: 'Di belakang memberikan dorongan' },
                        { title: 'Berprestasi', desc: 'Di depan memberi teladan' },
                        { title: 'Berintegritas', desc: 'Di tengah membangun semangat' },
                      ].map((motto, idx) => (
                        <div className="col-md-4" key={idx}>
                          <div className="p-3 rounded" style={{ background: 'var(--inst-bg)' }}>
                            <h6 className="text-primary mb-1">{motto.title}</h6>
                            <p className="mb-0 small text-muted">{motto.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sejarah */}
          {activeTab === 'sejarah' && (
            <div className="row">
              <div className="col-lg-10 mx-auto">
                <div className="card border-0 shadow-sm">
                  <div className="card-body p-4">
                    <h4 className="text-primary mb-3">Sejarah Singkat</h4>

                    <p>
                      SMA Negeri 3 Surabaya didirikan pada tanggal 17 Agustus 1985 berdasarkan
                      Surat Keputusan Menteri Pendidikan dan Kebudayaan Republik Indonesia.
                      Sekolah ini merupakan salah satu SMA Negeri tertua dan paling berprestasi
                      di wilayah Surabaya.
                    </p>

                    <p>
                      Sejak berdirinya, SMA Negeri 3 Surabaya telah meluluskan ribuan alumni
                      yang tersebar di berbagai perguruan tinggi ternama baik di dalam maupun
                      luar negeri. Sekolah ini dikenal sebagai lembaga pendidikan yang
                      menghasilkan lulusan berkualitas dengan prestasi akademik dan
                      non-akademik yang gemilang.
                    </p>

                    <p className="mb-0">
                      Dengan motto <strong>"Berkarakter, Berprestasi, dan Berintegritas"</strong>,
                      SMA Negeri 3 Surabaya terus berkomitmen untuk memberikan pendidikan terbaik
                      bagi generasi muda Indonesia.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Struktur Organisasi */}
          {activeTab === 'struktur' && (
            <div className="text-center">
              <div className="card border-0 shadow-sm mb-4 mx-auto" style={{ maxWidth: 400 }}>
                <div className="card-body p-4">
                  <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary text-white mb-3" style={{ width: 64, height: 64 }}>
                    <i className="bi bi-person-fill fs-2"></i>
                  </div>
                  <h6 className="mb-1">Agus Dwi Pamungkas, S.Si., M.Pd</h6>
                  <p className="text-muted mb-0 small">Kepala Sekolah</p>
                </div>
              </div>
              
              <div className="row g-3 justify-content-center mb-4">
                {[
                  { name: 'Hadi Sunyoto, S.Sos.', role: 'Wakasek Kurikulum' },
                  { name: 'Agus Setiadi, S.Pd', role: 'Wakasek Kesiswaan' },
                  { name: 'Aries Afandri, S.Pd', role: 'Wakasek Sarana Prasarana' },
                  { name: 'Theo. Gunawan Wahana, S.S., M.Pd', role: 'Wakasek Humas' },
                ].map((item, idx) => (
                  <div className="col-md-3" key={idx}>
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-body p-3">
                        <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-secondary text-white mb-2" style={{ width: 48, height: 48 }}>
                          <i className="bi bi-person-fill fs-4"></i>
                        </div>
                        <h6 className="mb-1 small">{item.name}</h6>
                        <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>{item.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="row g-3">
                {[
                  { name: 'Komite Sekolah', role: 'Pengawas Eksternal' },
                  { name: 'Kepala TU', role: 'Tata Usaha' },
                  { name: 'Kepala Perpustakaan', role: 'Literasi' },
                  { name: 'Kepala Lab', role: 'Praktikum' },
                  { name: 'Pembina OSIS', role: 'Organisasi Siswa' },
                  { name: 'Koordinator Ekskul', role: 'Ekstrakurikuler' },
                ].map((item, idx) => (
                  <div className="col-md-4 col-lg-2" key={idx}>
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-body p-3">
                        <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-light text-secondary mb-2" style={{ width: 40, height: 40 }}>
                          <i className="bi bi-people-fill fs-5"></i>
                        </div>
                        <h6 className="mb-1 small">{item.name}</h6>
                        <p className="text-muted mb-0" style={{ fontSize: '0.7rem' }}>{item.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sarana & Prasarana */}
          {activeTab === 'sarana' && (
            <div className="row g-3">
              {saranaData.map((item, idx) => (
                <div className="col-md-6 col-lg-4 col-xl-3" key={idx}>
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body p-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 48, height: 48, background: 'rgba(59,110,255,0.1)', minWidth: 48 }}>
                          <i className={`bi ${item.icon} text-primary fs-4`}></i>
                        </div>
                        <div>
                          <h6 className="mb-1">{item.name}</h6>
                          <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>{item.desc}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
