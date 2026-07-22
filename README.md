# 🚀 DONEFAST Tracer — Ojol Management & Service KIR Tracker (v3.5)

![Version](https://img.shields.io/badge/version-3.5-red.svg?style=for-the-badge)
![Platform](https://img.shields.io/badge/platform-Android%20%7C%20PWA-blue.svg?style=for-the-badge)
![Status](https://img.shields.io/badge/status-Production%20Ready-success.svg?style=for-the-badge)

**DONEFAST Tracer** adalah aplikasi asisten pintar yang dirancang khusus untuk driver Ojek Online (Gojek, Grab, Maxim, ShopeeFood, Lalamove, inDrive) untuk mencatat pendapatan harian, mengelola pengeluaran operasional, serta memantau jadwal servis kendaraan & uji berkala KIR secara presisi.

---

## 📥 Link Akses & Download Aplikasi

| Metode | Link Akses / Download | Keterangan |
|---|---|---|
| 📱 **Download APK (Android)** | [**Download ojol-kir.apk**](https://raw.githubusercontent.com/MUHULILAMRI/MUHULILAMRI.github.io/master/ojol-kir.apk) | Aplikasi Native Android (TWA APK Signed) |
| 🌐 **Web App (PWA)** | [**muhulilamri.github.io/ojol-kir**](https://muhulilamri.github.io/ojol-kir/) | Langsung buka di browser HP & install ke Home Screen |

---

## ✨ Fitur-Fitur Utama

### 1. 🚀 Onboarding & Profil Driver
- **Pilihan Platform Mitra**: Pilih platform utama Anda (*Gojek, Grab, Maxim, ShopeeFood, Lalamove, inDrive*) lengkap dengan badge warna identitas platform.
- **Input Odometer Awal**: Masukkan KM odometer awal kendaraan saat pertama kali mengunduh.
- **Setting Batas Servis Kustom**: Tentukan batas jarak (KM) sesuai kebutuhan spesifik kendaraan Anda (misal: Oli Mesin per 2.000 KM, Oli Gardan per 4.000 KM, dll).

### 2. 🎯 Target Pendapatan Harian
- Indikator kemajuan target harian real-time dengan bar warna dinamis:
  - 🟢 **Hijau**: Target tercapai (≥ 100%)
  - 🟡 **Kuning**: Target mendekati (≥ 70%)
  - 🔴 **Merah**: Masih di bawah target (< 70%)
- Target harian dapat disesuaikan kapan saja melalui menu **Pengaturan**.

### 3. 🛠️ Pengingat Perawatan & Uji KIR Perkala
- Melacak batas KM untuk komponen penting:
  - 🛢️ **Oli Mesin & Gardan**
  - ⚡ **Busi & Filter Udara**
  - ⚙️ **Vanbelt / Rantai & CVT**
  - 🛞 **Ban & Sistem Pengereman**
  - 📋 **Uji Berkala KIR & Pajak**
- Status visual pintar: `Normal` (Hijau), `Perlu Perhatian` (Kuning), dan `SERVIS SEKARANG` (Merah).

### 4. 📍 Pelacak Jarak Real-Time (GPS Live Tracking)
- Banner status pelacakan GPS aktif di layar utama dengan animasi pulse live.
- Menghitung jarak tempuh secara otomatis saat menarik / narik ojol dan menambahkan KM ke odometer secara real-time.

### 5. 🔔 Notifikasi System Pop-Up (Luar Aplikasi)
- Notifikasi push sistem otomatis di HP saat jarak servis sudah tercapai.
- Pengingat penginputan pendapatan harian agar catatan keuangan tetap rapi.

### 6. 📊 Grafik 7 Hari & Proyeksi Bulanan
- Visualisasi grafik batang interaktif pendapatan 7 hari terakhir (Chart.js).
- Menghitung rata-rata harian dan estimasi total pendapatan bulanan secara otomatis.

---

## 🛠️ Spesifikasi & Teknologi

- **Frontend**: HTML5, Vanilla CSS3 (Custom Glassmorphic System, Color Tokens), JavaScript ES6+
- **Database & Storage**: `localStorage` (Offline-first data retention)
- **Charts**: Chart.js v4.4
- **Web APIs**: Web Push Notification API, Geolocation Tracking API, Service Worker Cache (v20)
- **Android Integration**: Trusted Web Activity (TWA), Android SDK API 34+

---

## 📖 Panduan Penggunaan Pertama Kali

1. **Unduh & Install APK** atau **Buka Web App** di browser HP.
2. Saat aplikasi terbuka pertama kali, ikuti **Modal Onboarding**:
   - Pilih **Platform Ojol** Anda.
   - Masukkan **Nama**, **Jenis Kendaraan**, dan **Kilometer Odometer** saat ini.
   - Atur **Target Pendapatan Harian** dan **Batas KM Servis**.
3. Klik **Simpan & Mulai**, aplikasi siap digunakan!
4. Untuk mencatat pendapatan atau pengeluaran harian, klik tombol **+ Catat Pendapatan** di halaman beranda.

---

## ⚙️ Lisensi & Pengembang

Dikembangkan untuk memberikan kemudahan manajemen operasional bagi rekan-rekan driver ojek online di Indonesia.

- **Developer**: [MUHULILAMRI](https://github.com/MUHULILAMRI)
- **Versi**: 3.5 (Production Release)
