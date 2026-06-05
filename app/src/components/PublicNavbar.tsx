import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function PublicNavbar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  const navLinks = [
    { path: '/profil', label: 'Profil' },
    { path: '/berita', label: 'Berita' },
    { path: '/ekstrakurikuler', label: 'Ekstrakurikuler' },
    { path: '/prestasi', label: 'Prestasi' },
    { path: '/kalender', label: 'Kalender' },
    { path: '/kontak', label: 'Kontak' },
    { path: '/bantuan', label: 'Bantuan' },
  ]

  return (
    <nav className="public-navbar navbar navbar-expand-lg sticky-top">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <img src="/assets/logo-sman3.png" alt="SMAN 3 Surabaya" />
          <span>SMA Negeri 3<br /><small style={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.7 }}>SURABAYA</small></span>
        </Link>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className={`collapse navbar-collapse ${isOpen ? 'show' : ''}`}>
          <ul className="navbar-nav mx-auto">
            {navLinks.map(link => (
              <li className="nav-item" key={link.path}>
                <Link 
                  className={`nav-link ${isActive(link.path) ? 'active' : ''}`} 
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/login" className="btn-login">
            <i className="bi bi-box-arrow-in-right me-2"></i>
            Login
          </Link>
        </div>
      </div>
    </nav>
  )
}
