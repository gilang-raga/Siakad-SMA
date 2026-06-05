import { useState } from 'react'
import PublicNavbar from '../../components/PublicNavbar'
import PublicFooter from '../../components/PublicFooter'

export default function Ekstrakurikuler() {
  const [filter, setFilter] = useState('all')

  const ekskulData = [
    { name: 'TELUMANIA', category: 'akademik', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTETzOliTIQmh6TVtAhrZgOcfa3EPPIT0f1yw&s', desc: 'Kelompok suporter pendukung tim basket SMAN 3 Surabaya.' },
    { name: 'Palang Merah Remaja', category: 'sosial', image: 'https://sman12berau.sch.id/wp-content/uploads/2020/08/300X4001.jpg', desc: 'PMR membentuk karakter kemanusiaan dan kesiapsiagaan bencana.' },
    { name: 'Cheerleader', category: 'olahraga', image: '/img/cheerleader_smaga.png', desc: 'Mengembangkan bakat tari, akrobatik, dan sportivitas.' },
    { name: 'Paskibraka', category: 'kepemimpinan', image: 'https://www.sman3surabaya.sch.id/assets/post/487799f2dce73a2bc6b9d9e8a2b3a23b.JPG', desc: 'Pasukan pengibar bendera pada upacara resmi.' },
    { name: 'Basket', category: 'olahraga', image: 'https://www.dbl.id/thumbs/medium/uploads/post/2025/09/21/hasil-dbl-surabaya-21-sept-2025.jpg', desc: 'Tim basket yang rutin berlatih dan berkompetisi.' },
    { name: 'Futsal', category: 'olahraga', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2iIQ-0DSia2gqlxlvK2e3HyD2aw36jRgflw&s', desc: 'Tim futsal putra dan putri berprestasi.' },
    { name: 'Pencak Silat', category: 'olahraga', image: 'https://smkn3-sby.sch.id/wp-content/uploads/2020/07/pencak-silat.jpg', desc: 'Melatih bela diri dan disiplin.' },
    { name: 'Dayung', category: 'olahraga', image: 'https://sman22sby.sch.id/po-content/uploads/dayung_1.jpg', desc: 'Tim dayung yang berkompetisi nasional.' },
    { name: 'Marching Band', category: 'seni', image: 'https://i.ytimg.com/vi/HpO0lhJ-0N8/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLBK0LJKKxW9MNSvplJ2Zp1WNWzLMQ', desc: 'Grup musik drumband spektakuler.' },
    { name: 'Pramuka Minat', category: 'kepemimpinan', image: 'https://www.sman3surabaya.sch.id/assets/post/0b855980707f0227a96b01b9725c0f4e.jpeg', desc: 'Membentuk karakter mandiri dan disiplin.' },
    { name: 'Karya Ilmiah Remaja', category: 'akademik', image: '/img/kir_smaga.jpeg', desc: 'Mengembangkan karya tulis ilmiah.' },
    { name: 'Flag Football', category: 'olahraga', image: 'https://asset.tribunnews.com/_kN8YyqokoAg2vOAg9cWAqRe7qc=/1200x675/filters:upscale():quality(30):format(webp):focal(0.5x0.5:0.5x0.5)/surabaya/foto/bank/originals/pertandingan-yang-berlangsung-di-Lapangan-Hoki-Dharmawangsa-Surabaya.jpg', desc: 'Olahraga strategi dan teamwork.' },
    { name: 'Tari Tradisional', category: 'seni', image: 'https://www.sman3surabaya.sch.id/assets/post/686513dc4d0007195c642b4b2499afb2.jpeg', desc: 'Melestarikan seni tari Indonesia.' },
    { name: 'Bola Voli', category: 'olahraga', image: '/img/voli_smaga.png', desc: 'Tim voli aktif berkompetisi.' },
    { name: 'Modern Dance', category: 'seni', image: 'https://www.dbl.id/thumbs/extra-large/uploads/post/2019/09/07/WhatsApp_Image_2019-09-07_at_16.31_.13_.jpeg', desc: 'Tari modern penuh kreativitas.' },
    { name: 'SMAGAWARA', category: 'seni', image: 'https://i.ytimg.com/vi/v5Tv4DLI7rI/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLBCbzerlasSMNCXwagM0SRAOi0s3g', desc: 'Grup musik dan paduan suara.' },
    { name: 'Sie Kerohanian Islam', category: 'keagamaan', image: 'https://www.sman3surabaya.sch.id/assets/post/043fb8ce06a8eb056318d623403346c5.png', desc: 'Kegiatan keagamaan Islam.' },
    { name: 'Sie Kerohanian Kristen', category: 'keagamaan', image: '/img/sk_smaga.png', desc: 'Kegiatan keagamaan Kristen.' },
  ]

  const categories = [
    { id: 'all', label: 'Semua' },
    { id: 'olahraga', label: 'Olahraga' },
    { id: 'seni', label: 'Seni' },
    { id: 'akademik', label: 'Akademik' },
    { id: 'kepemimpinan', label: 'Kepemimpinan' },
    { id: 'keagamaan', label: 'Keagamaan' },
    { id: 'sosial', label: 'Sosial' },
  ]

  const filteredEkskul =
    filter === 'all'
      ? ekskulData
      : ekskulData.filter(e => e.category === filter)

  return (
    <>
      <style>{`
        .ekskul-card {
          border-radius: 14px;
          overflow: hidden;
          background: white;
          box-shadow: 0 6px 18px rgba(0,0,0,0.08);
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .ekskul-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.15);
        }

        .ekskul-image-wrapper {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          overflow: hidden;
        }

        .ekskul-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .ekskul-card:hover .ekskul-img {
          transform: scale(1.08);
        }

        .ekskul-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.5), transparent);
        }

        .ekskul-badge {
          position: absolute;
          bottom: 10px;
          left: 10px;
          background: #2563eb;
          color: white;
          font-size: 0.7rem;
          padding: 4px 10px;
          border-radius: 999px;
        }

        .ekskul-body {
          padding: 1rem;
        }

        .ekskul-title {
          font-weight: 600;
          margin-bottom: 6px;
        }

        .ekskul-desc {
          font-size: 0.85rem;
          color: #6b7280;
        }
      `}</style>

      <PublicNavbar />

      <section className="py-5">
        <div className="container">

          {/* FILTER */}
          <div className="d-flex gap-2 mb-4 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`btn btn-sm ${filter === cat.id ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setFilter(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* GRID */}
          <div className="row g-4">
            {filteredEkskul.map((item, idx) => (
              <div className="col-md-6 col-lg-4 col-xl-3" key={idx}>
                <div className="ekskul-card">

                  <div className="ekskul-image-wrapper">
                    <img src={item.image} alt={item.name} className="ekskul-img" />
                    <div className="ekskul-overlay"></div>
                    <span className="ekskul-badge">{item.category.toUpperCase()}</span>
                  </div>

                  <div className="ekskul-body">
                    <h6 className="ekskul-title">{item.name}</h6>
                    <p className="ekskul-desc">{item.desc}</p>
                  </div>

                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      <PublicFooter />
    </>
  )
}