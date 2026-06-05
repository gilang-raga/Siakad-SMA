import { Link } from 'react-router-dom'

export default function PublicFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-4 col-md-6">
            <div className="d-flex align-items-center gap-3 mb-3">
              <img src="/assets/logo-sman3.png" alt="Logo" style={{ width: 56, height: 56 }} />
              <div>
                <h6 className="mb-0">SMA Negeri 3 Surabaya</h6>
                <small>Unggul dalam IMTAQ dan IPTEK</small>
              </div>
            </div>
            <p className="small">
              Jl. Memet Sastrowiryo No.54, Komp. Kenjeran, Kec. Bulak, Surabaya, Jawa Timur 60121<br />
              Telp: (031) 5678901<br />
              Email: info@sman3surabaya.sch.id
            </p>
          </div>
          
          <div className="col-lg-2 col-md-6">
            <h6>Tautan</h6>
            <ul className="list-unstyled small">
              <li className="mb-2"><Link to="/profil">Profil Sekolah</Link></li>
              <li className="mb-2"><Link to="/berita">Berita</Link></li>
              <li className="mb-2"><Link to="/ekstrakurikuler">Ekstrakurikuler</Link></li>
              <li className="mb-2"><Link to="/prestasi">Prestasi</Link></li>
              <li className="mb-2"><Link to="/kalender">Kalender</Link></li>
            </ul>
          </div>
          
          <div className="col-lg-3 col-md-6">
            <h6>Layanan</h6>
            <ul className="list-unstyled small">
              <li className="mb-2"><Link to="/login">Login SIAKAD</Link></li>
              <li className="mb-2"><Link to="/tata-tertib">Tata Tertib</Link></li>
              <li className="mb-2"><Link to="/kontak">Kontak & Lokasi</Link></li>
              <li className="mb-2"><Link to="/bantuan">Bantuan</Link></li>
            </ul>
          </div>
          
          <div className="col-lg-3 col-md-6">
            <h6>Media Sosial</h6>
            <div className="d-flex gap-3">
              <a href="#" className="fs-5"><i className="bi bi-facebook"></i></a>
              <a href="#" className="fs-5"><i className="bi bi-instagram"></i></a>
              <a href="#" className="fs-5"><i className="bi bi-twitter-x"></i></a>
              <a href="#" className="fs-5"><i className="bi bi-youtube"></i></a>
            </div>
            <div className="mt-3">
              <small>Akreditasi: A (Nilai 93)</small><br />
              <small>NSS: 301056013003</small>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p className="mb-0">
            &copy; {new Date().getFullYear()} SMA Negeri 3 Surabaya. Sistem Informasi Akademik.
          </p>
        </div>
      </div>
    </footer>
  )
}
