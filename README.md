# 📸 Boothopia

Boothopia adalah aplikasi web photobooth sederhana untuk mengambil foto menggunakan webcam, memasang bingkai (frame), menerapkan filter, dan mengunduh hasilnya. Proyek ini dibuat menggunakan React dan terintegrasi dengan Supabase untuk manajemen bingkai serta pengumuman di halaman depan.

---

## ✨ Fitur Utama

- **Pengambilan Foto**: Jepret beberapa foto menggunakan webcam dengan countdown dan efek flash.
- **Penyimpanan Lokal untuk Foto**: Hasil akhir foto strip diunduh langsung ke galeri/penyimpanan perangkat Anda. Foto tidak di-upload ke server untuk menghemat ruang penyimpanan.
- **Pilihan Share Lokal**: Di HP/Tablet, terdapat tombol Share untuk mengirim foto lewat WhatsApp, AirDrop, dll. secara lokal (menggunakan Web Share API).
- **Sistem Admin Terproteksi**: Panel manajemen di rute `/admin` dan `/login` dilindungi dengan sistem login Email & Password (menggunakan Supabase Auth).
- **Upload Bingkai (Batch)**: Admin bisa mengunggah beberapa file gambar bingkai (`.png`) sekaligus.
- **Editor Tata Letak Bingkai**:
  - Atur posisi foto langsung dengan menggeser kotak secara visual di atas gambar bingkai.
  - Klik langsung pada kotak preview untuk memilih slot foto.
  - Geser presisi kotak terpilih menggunakan tombol arah keyboard (Arrow Keys).
- **Daftar Bingkai & Berita Dinamis**: Template bingkai dan berita "What's New" dimuat dinamis dari database Supabase.
- **Filter Foto**: Pilihan filter sederhana seperti Grayscale, Sepia, Retro, Vintage, dll.
- **Responsif**: Tampilan antarmuka yang menyesuaikan layar HP maupun komputer.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vite.dev/)
- **Backend / Database**: [Supabase](https://supabase.com/) (PostgreSQL Database, Storage, & Auth)
- **Ikon**: [Lucide React](https://lucide.dev/)
- **Ekspor Gambar**: `html-to-image` & `html2canvas`
- **Styling**: Vanilla CSS

---

## 🚀 Memulai Proyek

### Prasyarat

Pastikan Anda sudah menginstal [Node.js](https://nodejs.org/) di komputer Anda.

### Instalasi

1. Klon repositori ini:
   ```bash
   git clone https://github.com/revzoo/Boothopia.git
   cd Boothopia
   ```

2. Instal dependensi:
   ```bash
   npm install
   ```

3. Buat file bernama `.env.local` di root folder dan tambahkan kredensial Supabase Anda:
   ```env
   VITE_SUPABASE_URL="https://your-project-id.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-supabase-publishable-anon-key"
   ```

4. Jalankan script SQL pembuatan tabel dan kebijakan RLS (Row Level Security) yang terdapat di berkas **[walkthrough.md](file:///C:/Users/ACER/.gemini/antigravity-ide/brain/cff8e27b-2d05-464c-bf75-c4fb54fbecae/walkthrough.md)** pada SQL Editor Supabase Anda. Jangan lupa buat satu bucket storage publik bernama `frames`.

### Menjalankan Aplikasi

Menjalankan server lokal untuk development:
   ```bash
   npm run dev
   ```
Aplikasi dapat diakses di `http://localhost:5173`.

### Build Produksi

Untuk membuat file siap deploy:
   ```bash
   npm run build
   ```
Hasil build akan berada di folder `/dist`.

---

## 📂 Struktur Proyek

```text
photobooth/
├── public/              # Aset gambar statis
├── src/
│   ├── assets/          # CSS styling
│   ├── components/      # Komponen aplikasi
│   │   ├── Home.jsx         # Halaman utama & pengumuman
│   │   ├── Capture.jsx      # Kamera & pengambilan foto
│   │   ├── Review.jsx       # Customizer filter/layout & download
│   │   └── FrameAdmin.jsx   # Login & edit konfigurasi bingkai
│   ├── utils/           # Supabase client & config loader
│   ├── App.jsx          # Titik masuk utama & router sederhana
│   ├── index.css        # CSS global
│   └── main.jsx         # Render DOM React
├── package.json         # Konfigurasi dependensi
├── vercel.json          # SPA routing rule untuk deployment Vercel
└── vite.config.js       # Konfigurasi Vite
```

---

## 📄 Lisensi

Proyek ini menggunakan lisensi [MIT License](LICENSE).
