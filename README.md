# 📸 Boothopia

Boothopia adalah aplikasi photobooth berbasis web modern dan interaktif yang memungkinkan pengguna untuk mengambil foto menggunakan webcam, menerapkan bingkai (frame) dan filter kustom, meninjau hasil foto, serta mengunduh atau membagikan hasil akhirnya. Didesain dengan antarmuka pengguna yang bersih dan responsif, Boothopia menghadirkan pengalaman photobooth klasik langsung ke peramban (browser) Anda.

## ✨ Fitur Utama

- **Alur Pengambilan Foto Interaktif**: Antarmuka kamera yang menyenangkan dan sederhana dilengkapi dengan penghitung waktu mundur (countdown), efek kilatan cahaya (flash), dan pengambilan beberapa foto sekaligus.
- **Bingkai (Frame) yang Dapat Disesuaikan**: Pilih dari berbagai pilihan tata letak dan gaya bingkai yang telah ditentukan, atau sesuaikan agar cocok dengan tema acara Anda.
- **Dashboard Admin Bingkai**: Halaman manajemen lengkap untuk mengunggah bingkai baru, menyesuaikan margin tata letak, dan mengonfigurasi dimensi bingkai.
- **Filter Foto Real-Time**: Terapkan filter klasik dan modern (Grayscale, Sepia, Retro, Vintage, dll.) secara instan pada foto Anda.
- **Ekspor Berkualitas Tinggi**: Proses rendering dan pengunduhan gambar yang bersih didukung oleh pustaka `html-to-image` dan `html2canvas`.
- **Desain Responsif**: Dioptimalkan dengan sangat baik untuk tampilan desktop maupun layar perangkat seluler.

## 🛠️ Tech Stack (Teknologi)

- **Framework Utama**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vite.dev/)
- **Ikon**: [Lucide React](https://lucide.dev/)
- **Rendering & Ekspor**: `html-to-image` & `html2canvas`
- **Styling**: Vanilla CSS

## 🚀 Memulai Proyek

### Prasyarat

Pastikan Anda telah menginstal [Node.js](https://nodejs.org/) di komputer Anda.

### Instalasi

1. Klon repositori ini:
   ```bash
   git clone https://github.com/revzoo/Boothopia.git
   cd Boothopia
   ```

2. Instal dependensi proyek:
   ```bash
   npm install
   ```

### Menjalankan Server Lokal

Untuk menjalankan aplikasi dalam mode pengembangan:
   ```bash
   npm run dev
   ```
Aplikasi akan berjalan secara lokal, biasanya di alamat `http://localhost:5173`.

### Membuat Build Produksi

Untuk mengompilasi proyek menjadi aset siap produksi:
   ```bash
   npm run build
   ```
Hasil build yang siap dideploy akan dibuat di dalam direktori `dist`.

## 📂 Struktur Proyek

```text
photobooth/
├── public/              # Aset statis
├── src/
│   ├── assets/          # Aset gaya (styling) & grafis
│   ├── components/      # Modul utama aplikasi
│   │   ├── Home.jsx         # Halaman beranda / titik masuk utama
│   │   ├── Capture.jsx      # Tampilan kamera & logika pengambilan foto
│   │   ├── Review.jsx       # Kustomisasi, filter, & fitur ekspor foto
│   │   └── FrameAdmin.jsx   # Dashboard unggah & konfigurasi bingkai
│   ├── utils/           # Fungsi pembantu (helper)
│   ├── App.jsx          # Komponen utama aplikasi
│   ├── index.css        # Gaya CSS global & token desain
│   └── main.jsx         # Titik masuk React ke DOM
├── package.json         # Dependensi NPM & skrip proyek
└── vite.config.js       # Konfigurasi Vite
```

## 📄 Lisensi

Proyek ini bersifat open-source dan dirilis di bawah lisensi [MIT License](LICENSE).
