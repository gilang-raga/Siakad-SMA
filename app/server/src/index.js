import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import fs from 'node:fs/promises'
import nodemailer from 'nodemailer'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { query } from './db.js'

dotenv.config()

const app = express()
const port = Number(process.env.PORT || 3001)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const databaseDir = path.resolve(__dirname, '..', 'database')
const loginAttempts = new Map()

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
}))
app.use(express.json({ limit: '25mb' }))
app.disable('x-powered-by')
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  next()
})

app.get('/api/health', async (_req, res, next) => {
  try {
    await query('SELECT 1')
    res.json({ status: 'ok' })
  } catch (error) {
    next(error)
  }
})

async function upsertLoginUser(username, password, role, name) {
  await query(
    `INSERT INTO users (username, password_hash, role, name)
     VALUES (?, SHA2(?, 256), ?, ?)
     ON DUPLICATE KEY UPDATE
       password_hash = VALUES(password_hash),
       role = VALUES(role),
       name = VALUES(name)`,
    [username, password, role, name],
  )
}

async function renameLoginUser(oldUsername, newUsername, role, name) {
  await query(
    `UPDATE users
     SET username = ?, name = ?
     WHERE username = ? AND role = ?`,
    [newUsername, name, oldUsername, role],
  )
}

async function deleteLoginUser(username, role) {
  await query('DELETE FROM users WHERE username = ? AND role = ?', [username, role])
}

function normalizeNamePart(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .find(part => !['drs', 'dra', 'spd', 'mpd', 's', 'pd', 'm'].includes(part)) || 'user'
}

function generatedPassword(name, identityNumber) {
  return `${normalizeNamePart(name)}${String(identityNumber || '').slice(-2)}`
}

function todayName() {
  return new Date().toLocaleDateString('id-ID', { weekday: 'long', timeZone: 'Asia/Jakarta' })
}

async function ensurePrestasiTable() {
  await query(
    `CREATE TABLE IF NOT EXISTS prestasi (
      id VARCHAR(40) PRIMARY KEY,
      judul VARCHAR(180) NOT NULL,
      kategori VARCHAR(30) NOT NULL,
      deskripsi TEXT NOT NULL,
      gambar LONGTEXT NULL,
      tanggal VARCHAR(30) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
  )
}

function tooManyLoginAttempts(key) {
  const now = Date.now()
  const entry = loginAttempts.get(key) || { count: 0, firstAt: now }
  if (now - entry.firstAt > 15 * 60 * 1000) {
    loginAttempts.set(key, { count: 1, firstAt: now })
    return false
  }
  entry.count += 1
  loginAttempts.set(key, entry)
  return entry.count > 8
}

function isMailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}

function createMailTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || 'true') === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

app.post('/api/login', async (req, res, next) => {
  try {
    const { username, password, role } = req.body

    if (!username || !password || !role) {
      return res.status(400).json({ message: 'Username, password, dan role wajib diisi' })
    }
    if (!['admin', 'guru', 'siswa'].includes(role)) {
      return res.status(400).json({ message: 'Role tidak valid' })
    }
    const attemptKey = `${req.ip}:${role}:${username}`
    if (tooManyLoginAttempts(attemptKey)) {
      return res.status(429).json({ message: 'Terlalu banyak percobaan login. Coba lagi beberapa menit.' })
    }

    let users = await query(
      `SELECT id, username, role, name
       FROM users
       WHERE username = ? AND role = ? AND password_hash = SHA2(?, 256)
       LIMIT 1`,
      [username, role, password],
    )

    if (users.length === 0 && role === 'siswa') {
      users = await query(
        `SELECT id, nisn AS username, 'siswa' AS role, nama AS name
         FROM siswa
         WHERE nisn = ? AND password_hash = SHA2(?, 256)
         LIMIT 1`,
        [username, password],
      )
    }

    if (users.length === 0 && role === 'guru') {
      users = await query(
        `SELECT id, nip AS username, 'guru' AS role, nama AS name
         FROM guru
         WHERE nip = ? AND password_hash = SHA2(?, 256)
         LIMIT 1`,
        [username, password],
      )
    }

    if (users.length === 0) {
      return res.status(401).json({ message: 'Login gagal. Periksa data login Anda.' })
    }
    loginAttempts.delete(attemptKey)

    res.json({ user: users[0] })
  } catch (error) {
    next(error)
  }
})

app.get('/api/siswa', async (_req, res, next) => {
  try {
    const siswa = await query(
      `SELECT nisn, nama, kelas, jk, status
       FROM siswa
       ORDER BY nama ASC`,
    )

    res.json(siswa)
  } catch (error) {
    next(error)
  }
})

app.post('/api/siswa', async (req, res, next) => {
  try {
    const { nisn, nama, kelas, jk, status = 'Aktif' } = req.body
    const password = req.body.password || generatedPassword(nama, nisn)

    if (!nisn || !nama || !kelas || !jk) {
      return res.status(400).json({ message: 'NISN, nama, kelas, dan jenis kelamin wajib diisi' })
    }

    await query(
      `INSERT INTO siswa (nisn, nama, kelas, jk, status, password_hash)
       VALUES (?, ?, ?, ?, ?, SHA2(?, 256))`,
      [nisn, nama, kelas, jk, status, password],
    )
    await upsertLoginUser(nisn, password, 'siswa', nama)

    res.status(201).json({ nisn, nama, kelas, jk, status })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'NISN sudah digunakan' })
    }
    next(error)
  }
})

app.put('/api/siswa/:nisn', async (req, res, next) => {
  try {
    const { nisn: oldNisn } = req.params
    const { nisn, nama, kelas, jk, status, password } = req.body

    if (!nisn || !nama || !kelas || !jk || !status) {
      return res.status(400).json({ message: 'NISN, nama, kelas, jenis kelamin, dan status wajib diisi' })
    }

    const result = await query(
      `UPDATE siswa
       SET nisn = ?, nama = ?, kelas = ?, jk = ?, status = ?${password ? ', password_hash = SHA2(?, 256)' : ''}
       WHERE nisn = ?`,
      password ? [nisn, nama, kelas, jk, status, password, oldNisn] : [nisn, nama, kelas, jk, status, oldNisn],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Data siswa tidak ditemukan' })
    }
    await renameLoginUser(oldNisn, nisn, 'siswa', nama)
    if (password) {
      await upsertLoginUser(nisn, password, 'siswa', nama)
    }

    res.json({ nisn, nama, kelas, jk, status })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'NISN sudah digunakan' })
    }
    next(error)
  }
})

app.delete('/api/siswa/:nisn', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM siswa WHERE nisn = ?', [req.params.nisn])

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Data siswa tidak ditemukan' })
    }
    await deleteLoginUser(req.params.nisn, 'siswa')

    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

app.get('/api/guru', async (_req, res, next) => {
  try {
    const guru = await query(
      `SELECT nip, nama, mapel, jk, status
       FROM guru
       ORDER BY nama ASC`,
    )

    res.json(guru)
  } catch (error) {
    next(error)
  }
})

app.post('/api/guru', async (req, res, next) => {
  try {
    const { nip, nama, mapel, jk, status = 'Aktif' } = req.body
    const password = req.body.password || generatedPassword(nama, nip)

    if (!nip || !nama || !mapel || !jk) {
      return res.status(400).json({ message: 'NIP, nama, mapel, dan jenis kelamin wajib diisi' })
    }

    await query(
      `INSERT INTO guru (nip, nama, mapel, jk, status, password_hash)
       VALUES (?, ?, ?, ?, ?, SHA2(?, 256))`,
      [nip, nama, mapel, jk, status, password],
    )
    await upsertLoginUser(nip, password, 'guru', nama)

    res.status(201).json({ nip, nama, mapel, jk, status })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'NIP sudah digunakan' })
    }
    next(error)
  }
})

app.put('/api/guru/:nip', async (req, res, next) => {
  try {
    const { nip: oldNip } = req.params
    const { nip, nama, mapel, jk, status, password } = req.body

    if (!nip || !nama || !mapel || !jk || !status) {
      return res.status(400).json({ message: 'NIP, nama, mapel, jenis kelamin, dan status wajib diisi' })
    }

    const result = await query(
      `UPDATE guru
       SET nip = ?, nama = ?, mapel = ?, jk = ?, status = ?${password ? ', password_hash = SHA2(?, 256)' : ''}
       WHERE nip = ?`,
      password ? [nip, nama, mapel, jk, status, password, oldNip] : [nip, nama, mapel, jk, status, oldNip],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Data guru tidak ditemukan' })
    }
    await renameLoginUser(oldNip, nip, 'guru', nama)
    if (password) {
      await upsertLoginUser(nip, password, 'guru', nama)
    }

    res.json({ nip, nama, mapel, jk, status })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'NIP sudah digunakan' })
    }
    next(error)
  }
})

app.delete('/api/guru/:nip', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM guru WHERE nip = ?', [req.params.nip])

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Data guru tidak ditemukan' })
    }
    await deleteLoginUser(req.params.nip, 'guru')

    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

function buildJadwalGuru(guru) {
  if (!guru) return []

  return [
    { jam: '07:00 - 08:30', kelas: 'X IPA 1', mapel: guru.mapel, ruang: 'R-101', status: 'Selesai' },
    { jam: '08:30 - 10:00', kelas: 'X IPA 2', mapel: guru.mapel, ruang: 'R-102', status: 'Sedang Berlangsung' },
    { jam: '10:00 - 10:30', kelas: '-', mapel: 'Istirahat', ruang: '-', status: '-' },
    { jam: '10:30 - 12:00', kelas: 'X IPS 1', mapel: guru.mapel, ruang: 'R-103', status: 'Mendatang' },
  ]
}

function buildJadwalSiswa(guru) {
  const guruMap = new Map(guru.map(item => [item.mapel, item.nama]))

  return [
    { jam: '07:00 - 08:30', mapel: 'Matematika', guru: guruMap.get('Matematika') || '-', ruang: 'R-101', status: 'Selesai' },
    { jam: '08:30 - 10:00', mapel: 'Bahasa Indonesia', guru: guruMap.get('Bahasa Indonesia') || '-', ruang: 'R-101', status: 'Sedang Berlangsung' },
    { jam: '10:00 - 10:30', mapel: 'Istirahat', guru: '-', ruang: '-', status: '-' },
    { jam: '10:30 - 12:00', mapel: 'Biologi', guru: guruMap.get('Biologi') || '-', ruang: 'R-101', status: 'Mendatang' },
  ]
}

app.get('/api/dashboard/admin', async (_req, res, next) => {
  try {
    const [siswaCount] = await query('SELECT COUNT(*) AS total FROM siswa')
    const [guruCount] = await query('SELECT COUNT(*) AS total FROM guru')
    const kelas = await query('SELECT kelas, COUNT(*) AS total FROM siswa GROUP BY kelas ORDER BY kelas ASC')
    const mapel = await query('SELECT DISTINCT mapel FROM guru ORDER BY mapel ASC')

    res.json({
      totalSiswa: Number(siswaCount?.total || 0),
      totalGuru: Number(guruCount?.total || 0),
      totalKelas: kelas.length,
      totalMapel: mapel.length,
      kelas,
      mapel: mapel.map(item => item.mapel),
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/dashboard/guru/:nip', async (req, res, next) => {
  try {
    const guru = await query(
      `SELECT nip, nama, mapel, jk, status
       FROM guru
       WHERE nip = ?
       LIMIT 1`,
      [req.params.nip],
    )

    if (guru.length === 0) {
      return res.status(404).json({ message: 'Data guru tidak ditemukan' })
    }

    const kelas = await query('SELECT kelas, COUNT(*) AS total FROM siswa WHERE status = ? GROUP BY kelas ORDER BY kelas ASC', ['Aktif'])
    const totalSiswa = kelas.reduce((sum, item) => sum + Number(item.total || 0), 0)
    const jadwal = await query(
      `SELECT jam, kelas, mapel, ruang, status
       FROM jadwal
       WHERE guru_nip = ? AND hari = ?
       ORDER BY jam_ke ASC`,
      [req.params.nip, todayName()],
    )

    res.json({
      guru: guru[0],
      jadwalHariIni: jadwal,
      tugasMenunggu: [
        { task: `Input nilai ${guru[0].mapel} kelas X IPA 1`, deadline: 'Hari ini', type: 'nilai' },
        { task: 'Input absensi kelas X IPA 2', deadline: 'Hari ini', type: 'absensi' },
        { task: `Unggah materi ${guru[0].mapel}`, deadline: '22 Jan 2026', type: 'tugas' },
      ],
      ringkasan: {
        totalSiswa,
        totalKelas: kelas.length,
        totalMapel: 1,
        jpMinggu: 12,
      },
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/dashboard/siswa/:nisn', async (req, res, next) => {
  try {
    const siswa = await query(
      `SELECT nisn, nama, kelas, jk, status
       FROM siswa
       WHERE nisn = ?
       LIMIT 1`,
      [req.params.nisn],
    )

    if (siswa.length === 0) {
      return res.status(404).json({ message: 'Data siswa tidak ditemukan' })
    }

    const jadwal = await query(
      `SELECT j.jam, j.mapel, COALESCE(g.nama, '-') AS guru, j.ruang, j.status
       FROM jadwal j
       LEFT JOIN guru g ON g.nip = j.guru_nip
       WHERE j.kelas = ? AND j.hari = ?
       ORDER BY j.jam_ke ASC`,
      [siswa[0].kelas, todayName()],
    )
    const nilai = await query(
      `SELECT mapel, nh, pts, na
       FROM nilai
       WHERE nisn = ?
       ORDER BY id ASC`,
      [req.params.nisn],
    )
    const pengumuman = await query(
      `SELECT judul, isi, kategori, tanggal AS waktu, penting, 'Admin' AS sumber, created_at
       FROM pengumuman
       WHERE status = ?
         AND (target IN ('Semua', 'Siswa') OR target = ?)
       ORDER BY created_at DESC, id DESC`,
      ['Dipublikasikan', siswa[0].kelas],
    )
    const materiTugas = await query(
      `SELECT
         judul,
         deskripsi AS isi,
         CASE WHEN tipe = 'tugas' THEN 'Tugas' ELSE 'Materi' END AS kategori,
         tanggal AS waktu,
         CASE WHEN tipe = 'tugas' THEN 1 ELSE 0 END AS penting,
         guru AS sumber,
         created_at
       FROM materi_tugas
       WHERE kelas = ?
       ORDER BY created_at DESC, id DESC`,
      [siswa[0].kelas],
    )
    const informasiTerbaru = [...pengumuman, ...materiTugas]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .map(item => ({
        judul: item.judul,
        isi: item.isi,
        kategori: item.kategori,
        waktu: item.waktu,
        penting: Boolean(item.penting),
        sumber: item.sumber,
      }))
    const [absensi] = await query(
      `SELECT
         COALESCE(SUM(hadir), 0) AS hadir,
         COALESCE(SUM(sakit), 0) AS sakit,
         COALESCE(SUM(izin), 0) AS izin,
         COALESCE(SUM(alpa), 0) AS alpa
       FROM absensi
       WHERE nisn = ?`,
      [req.params.nisn],
    )

    res.json({
      siswa: siswa[0],
      jadwalHariIni: jadwal,
      ringkasanNilai: nilai,
      pengumumanTerbaru: informasiTerbaru,
      absensi: absensi || { hadir: 0, sakit: 0, izin: 0, alpa: 0 },
    })
  } catch (error) {
    next(error)
  }
})

const jamPelajaran = [
  { jam: '07:00 - 07:45', ke: 1 },
  { jam: '07:45 - 08:30', ke: 2 },
  { jam: '08:30 - 09:15', ke: 3 },
  { jam: '09:30 - 10:15', ke: 4 },
  { jam: '10:15 - 11:00', ke: 5 },
  { jam: '11:15 - 12:00', ke: 6 },
  { jam: '12:00 - 12:45', ke: 7 },
]

function jamForKe(jamKe) {
  return jamPelajaran.find(item => item.ke === Number(jamKe))?.jam || ''
}

app.get('/api/jadwal', async (req, res, next) => {
  try {
    const { kelas, guru_nip } = req.query
    const params = []
    const where = []

    if (kelas) {
      where.push('j.kelas = ?')
      params.push(kelas)
    }
    if (guru_nip) {
      where.push('j.guru_nip = ?')
      params.push(guru_nip)
    }

    const jadwal = await query(
      `SELECT j.id, j.hari, j.jam_ke AS jamKe, j.jam, j.kelas, j.mapel, j.guru_nip AS guruNip,
              COALESCE(g.nama, '-') AS guru, j.ruang, j.status
       FROM jadwal j
       LEFT JOIN guru g ON g.nip = j.guru_nip
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY FIELD(j.hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'), j.jam_ke, j.kelas`,
      params,
    )

    res.json(jadwal)
  } catch (error) {
    next(error)
  }
})

app.post('/api/jadwal/upsert', async (req, res, next) => {
  try {
    const { hari, jamKe, kelas, mapel, guruNip, ruang = 'R-101', status = 'Mendatang' } = req.body

    if (!hari || !jamKe || !kelas || !mapel || !guruNip) {
      return res.status(400).json({ message: 'Hari, jam, kelas, mapel, dan guru wajib diisi' })
    }

    const guru = await query('SELECT nip, nama, mapel FROM guru WHERE nip = ? LIMIT 1', [guruNip])
    if (guru.length === 0) {
      return res.status(404).json({ message: 'Guru tidak ditemukan' })
    }

    const conflicts = await query(
      `SELECT j.kelas, j.hari, j.jam_ke AS jamKe, g.nama AS guru
       FROM jadwal j
       LEFT JOIN guru g ON g.nip = j.guru_nip
       WHERE j.hari = ? AND j.jam_ke = ? AND j.guru_nip = ? AND j.kelas <> ?
       LIMIT 1`,
      [hari, jamKe, guruNip, kelas],
    )

    if (conflicts.length > 0) {
      return res.status(409).json({ message: `${guru[0].nama} sudah mengajar ${conflicts[0].kelas} pada ${hari} jam ke-${jamKe}` })
    }

    await query(
      `INSERT INTO jadwal (hari, jam_ke, jam, kelas, mapel, guru_nip, ruang, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         jam = VALUES(jam),
         mapel = VALUES(mapel),
         guru_nip = VALUES(guru_nip),
         ruang = VALUES(ruang),
         status = VALUES(status)`,
      [hari, jamKe, jamForKe(jamKe), kelas, mapel, guruNip, ruang, status],
    )

    const [saved] = await query(
      `SELECT j.id, j.hari, j.jam_ke AS jamKe, j.jam, j.kelas, j.mapel, j.guru_nip AS guruNip,
              g.nama AS guru, j.ruang, j.status
       FROM jadwal j
       LEFT JOIN guru g ON g.nip = j.guru_nip
       WHERE j.hari = ? AND j.jam_ke = ? AND j.kelas = ?
       LIMIT 1`,
      [hari, jamKe, kelas],
    )

    res.json(saved)
  } catch (error) {
    next(error)
  }
})

app.delete('/api/jadwal', async (req, res, next) => {
  try {
    const { hari, jamKe, kelas } = req.body
    await query('DELETE FROM jadwal WHERE hari = ? AND jam_ke = ? AND kelas = ?', [hari, jamKe, kelas])
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

app.get('/api/materi-tugas', async (req, res, next) => {
  try {
    const { guru_nip, kelas } = req.query
    const params = []
    const where = []

    if (guru_nip) {
      where.push('guru_nip = ?')
      params.push(guru_nip)
    }
    if (kelas) {
      where.push('kelas = ?')
      params.push(kelas)
    }

    const rows = await query(
      `SELECT id, judul, tipe, mapel, kelas, guru_nip AS guruNip, guru, tanggal, deskripsi,
              file_name AS fileName, file_type AS fileType, file_data AS fileData, deadline
       FROM materi_tugas
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY created_at DESC`,
      params,
    )

    res.json(rows)
  } catch (error) {
    next(error)
  }
})

app.post('/api/materi-tugas', async (req, res, next) => {
  try {
    const { id, judul, tipe, mapel, kelas, guruNip, guru, tanggal, deskripsi, fileName, fileType, fileData, deadline } = req.body

    if (!judul || !tipe || !mapel || !kelas || !guruNip || !guru || !deskripsi) {
      return res.status(400).json({ message: 'Judul, tipe, mapel, kelas, guru, dan deskripsi wajib diisi' })
    }

    const itemId = id || crypto.randomUUID()
    await query(
      `INSERT INTO materi_tugas (id, judul, tipe, mapel, kelas, guru_nip, guru, tanggal, deskripsi, file_name, file_type, file_data, deadline)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         judul = VALUES(judul),
         tipe = VALUES(tipe),
         mapel = VALUES(mapel),
         kelas = VALUES(kelas),
         guru_nip = VALUES(guru_nip),
         guru = VALUES(guru),
         tanggal = VALUES(tanggal),
         deskripsi = VALUES(deskripsi),
         file_name = VALUES(file_name),
         file_type = VALUES(file_type),
         file_data = VALUES(file_data),
         deadline = VALUES(deadline)`,
      [itemId, judul, tipe, mapel, kelas, guruNip, guru, tanggal || new Date().toLocaleDateString('id-ID'), deskripsi, fileName || null, fileType || null, fileData || null, tipe === 'tugas' ? deadline || null : null],
    )

    res.status(201).json({ id: itemId, judul, tipe, mapel, kelas, guruNip, guru, tanggal, deskripsi, fileName, fileType, fileData, deadline })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/materi-tugas/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM materi_tugas WHERE id = ?', [req.params.id])
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

app.get('/api/pengumuman', async (_req, res, next) => {
  try {
    const rows = await query(
      `SELECT id, judul, kategori, target, tanggal, status, isi, penting
       FROM pengumuman
       ORDER BY created_at DESC, id DESC`,
    )
    res.json(rows.map(item => ({ ...item, penting: Boolean(item.penting) })))
  } catch (error) {
    next(error)
  }
})

app.post('/api/pengumuman', async (req, res, next) => {
  try {
    const { id, judul, kategori, target, tanggal, status = 'Dipublikasikan', isi, penting = false } = req.body

    if (!judul || !kategori || !target || !isi) {
      return res.status(400).json({ message: 'Judul, kategori, target, dan isi pengumuman wajib diisi' })
    }

    const itemId = id || crypto.randomUUID()
    const itemTanggal = tanggal || new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    await query(
      `INSERT INTO pengumuman (id, judul, kategori, target, tanggal, penting, status, isi)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         judul = VALUES(judul),
         kategori = VALUES(kategori),
         target = VALUES(target),
         tanggal = VALUES(tanggal),
         penting = VALUES(penting),
         status = VALUES(status),
         isi = VALUES(isi)`,
      [itemId, judul, kategori, target, itemTanggal, penting ? 1 : 0, status, isi],
    )

    res.status(201).json({ id: itemId, judul, kategori, target, tanggal: itemTanggal, status, isi, penting: Boolean(penting) })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/pengumuman/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM pengumuman WHERE id = ?', [req.params.id])
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

app.get('/api/nilai', async (req, res, next) => {
  try {
    const { nisn } = req.query
    const rows = await query(
      `SELECT n.nisn, s.nama, s.kelas, n.mapel, n.nh, n.pts, n.na
       FROM nilai n
       LEFT JOIN siswa s ON s.nisn = n.nisn
       ${nisn ? 'WHERE n.nisn = ?' : ''}
       ORDER BY n.mapel ASC`,
      nisn ? [nisn] : [],
    )
    res.json(rows)
  } catch (error) {
    next(error)
  }
})

app.post('/api/nilai/bulk', async (req, res, next) => {
  try {
    const { entries } = req.body
    if (!Array.isArray(entries)) {
      return res.status(400).json({ message: 'Data nilai tidak valid' })
    }

    for (const entry of entries) {
      const { nisn, mapel, nh = 0, pts = 0, na = 0 } = entry
      if (!nisn || !mapel) continue
      await query(
        `INSERT INTO nilai (nisn, mapel, nh, pts, na)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           nh = VALUES(nh),
           pts = VALUES(pts),
           na = VALUES(na)`,
        [nisn, mapel, Number(nh) || 0, Number(pts) || 0, Number(na) || 0],
      )
    }

    res.json({ saved: entries.length })
  } catch (error) {
    next(error)
  }
})

app.get('/api/prestasi', async (_req, res, next) => {
  try {
    await ensurePrestasiTable()
    const rows = await query(
      `SELECT id, judul, kategori, deskripsi, gambar, tanggal
       FROM prestasi
       ORDER BY created_at DESC, id DESC`,
    )
    res.json(rows)
  } catch (error) {
    next(error)
  }
})

app.post('/api/prestasi', async (req, res, next) => {
  try {
    await ensurePrestasiTable()
    const { id, judul, kategori, deskripsi, gambar, tanggal } = req.body
    if (!judul || !kategori || !deskripsi) {
      return res.status(400).json({ message: 'Judul, kategori, dan deskripsi prestasi wajib diisi' })
    }

    const itemId = id || crypto.randomUUID()
    const itemTanggal = tanggal || new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    await query(
      `INSERT INTO prestasi (id, judul, kategori, deskripsi, gambar, tanggal)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         judul = VALUES(judul),
         kategori = VALUES(kategori),
         deskripsi = VALUES(deskripsi),
         gambar = VALUES(gambar),
         tanggal = VALUES(tanggal)`,
      [itemId, judul, kategori, deskripsi, gambar || null, itemTanggal],
    )

    res.status(201).json({ id: itemId, judul, kategori, deskripsi, gambar, tanggal: itemTanggal })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/prestasi/:id', async (req, res, next) => {
  try {
    await ensurePrestasiTable()
    await query('DELETE FROM prestasi WHERE id = ?', [req.params.id])
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

app.get('/api/absensi/kelas/:kelas', async (req, res, next) => {
  try {
    const tanggal = req.query.tanggal || new Date().toISOString().slice(0, 10)
    const siswa = await query(
      `SELECT s.nisn, s.nama, COALESCE(a.hadir, 0) AS hadir, COALESCE(a.sakit, 0) AS sakit,
              COALESCE(a.izin, 0) AS izin, COALESCE(a.alpa, 0) AS alpa
       FROM siswa s
       LEFT JOIN absensi a ON a.nisn = s.nisn AND a.tanggal = ?
       WHERE s.kelas = ? AND s.status = 'Aktif'
       ORDER BY s.nama ASC`,
      [tanggal, req.params.kelas],
    )
    res.json(siswa)
  } catch (error) {
    next(error)
  }
})

app.post('/api/absensi', async (req, res, next) => {
  try {
    const { tanggal = new Date().toISOString().slice(0, 10), entries = [] } = req.body
    const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
    const bulan = namaBulan[Number(String(tanggal).slice(5, 7)) - 1] || 'Januari'

    for (const entry of entries) {
      await query(
        `INSERT INTO absensi (nisn, tanggal, bulan, hadir, sakit, izin, alpa)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           bulan = VALUES(bulan),
           hadir = VALUES(hadir),
           sakit = VALUES(sakit),
           izin = VALUES(izin),
           alpa = VALUES(alpa)`,
        [entry.nisn, tanggal, bulan, entry.hadir || 0, entry.sakit || 0, entry.izin || 0, entry.alpa || 0],
      )
    }

    res.json({ saved: entries.length })
  } catch (error) {
    next(error)
  }
})

app.get('/api/absensi/siswa/:nisn', async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT tanggal, bulan, hadir, sakit, izin, alpa
       FROM absensi
       WHERE nisn = ?
       ORDER BY tanggal DESC, id DESC`,
      [req.params.nisn],
    )
    res.json(rows)
  } catch (error) {
    next(error)
  }
})

app.post('/api/contact', async (req, res, next) => {
  try {
    const { nama, email, subjek, telepon = '', pesan } = req.body
    if (!nama || !email || !subjek || !pesan) {
      return res.status(400).json({ message: 'Nama, email, subjek, dan pesan wajib diisi' })
    }

    const tujuanEmail = process.env.CONTACT_TO_EMAIL || 'seccondgilang@gmail.com'
    await query(
      `INSERT INTO pesan_kontak (nama, email, subjek, telepon, pesan, tujuan_email)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nama, email, subjek, telepon, pesan, tujuanEmail],
    )

    if (!isMailConfigured()) {
      return res.status(503).json({
        message: 'Pesan tersimpan, tetapi email belum terkirim karena SMTP Gmail belum dikonfigurasi di server.',
      })
    }

    const transporter = createMailTransporter()
    await transporter.sendMail({
      from: `"SIAKAD SMAN 3 Surabaya" <${process.env.SMTP_USER}>`,
      to: tujuanEmail,
      replyTo: email,
      subject: `[Kontak SIAKAD] ${subjek}`,
      text: [
        `Nama: ${nama}`,
        `Email: ${email}`,
        `Telepon: ${telepon || '-'}`,
        `Subjek: ${subjek}`,
        '',
        pesan,
      ].join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2>Pesan Baru dari Form Kontak SIAKAD</h2>
          <p><strong>Nama:</strong> ${escapeHtml(nama)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Telepon:</strong> ${escapeHtml(telepon || '-')}</p>
          <p><strong>Subjek:</strong> ${escapeHtml(subjek)}</p>
          <hr />
          <p>${escapeHtml(pesan).replace(/\n/g, '<br />')}</p>
        </div>
      `,
    })

    res.status(201).json({ message: `Pesan berhasil dikirim langsung ke ${tujuanEmail}` })
  } catch (error) {
    next(error)
  }
})

app.get('/api/settings', async (_req, res, next) => {
  try {
    const settings = await query('SELECT setting_key AS settingKey, setting_value AS settingValue FROM settings')
    const accounts = await query(
      `SELECT username, name AS nama, role, 'Aktif' AS status
       FROM users
       ORDER BY FIELD(role, 'admin', 'guru', 'siswa'), name ASC`,
    )

    res.json({
      settings: Object.fromEntries(settings.map(item => [item.settingKey, typeof item.settingValue === 'string' ? JSON.parse(item.settingValue) : item.settingValue])),
      accounts,
    })
  } catch (error) {
    next(error)
  }
})

app.put('/api/settings/:key', async (req, res, next) => {
  try {
    await query(
      `INSERT INTO settings (setting_key, setting_value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [req.params.key, JSON.stringify(req.body)],
    )

    res.json({ settingKey: req.params.key, settingValue: req.body })
  } catch (error) {
    next(error)
  }
})

app.get('/api/admin/backup', async (_req, res, next) => {
  try {
    const tables = ['users', 'siswa', 'guru', 'jadwal', 'nilai', 'absensi', 'pengumuman', 'materi_tugas', 'prestasi', 'pesan_kontak', 'settings']
    const data = {}
    for (const table of tables) {
      data[table] = await query(`SELECT * FROM ${table}`)
    }
    res.json({ exportedAt: new Date().toISOString(), data })
  } catch (error) {
    next(error)
  }
})

app.post('/api/admin/reset-database', async (_req, res, next) => {
  try {
    const seed = await fs.readFile(path.join(databaseDir, 'seed.sql'), 'utf8')
    const statements = seed
      .split(/;\s*(?:\r?\n|$)/)
      .map(statement => statement.trim())
      .filter(Boolean)

    for (const statement of statements) {
      await query(statement)
    }

    res.json({ message: 'Database berhasil direset ke data awal' })
  } catch (error) {
    next(error)
  }
})

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ message: 'Terjadi kesalahan pada server' })
})

app.listen(port, () => {
  console.log(`SIAKAD API berjalan di http://localhost:${port}`)
})
