# DESIGN SYSTEM SPECIFICATION (DESIGN.MD)
# SMART PARKING SYSTEM – WEB-BASED PARKING RESERVATION & MONITORING

**Nama Dokumen:** Design Specification & UI/UX Style Guide  
**Proyek:** Smart Parking System (ESP32 IoT + Laravel Backend + MySQL + Modern Web Frontend)  
**Versi:** 1.0.0  
**Referensi Utama:**  
1. `PRD.md` (Product Requirements Document Smart Parking System)  
2. Referensi Visual: Dashboard *Harborlight Hotel Reservation System* (Estetika Deep Forest Emerald, Warm Ivory Canvas, Card-based KPI Grid, Clean High-Density Tables, dan Availability Meters).

---

## 1. RINGKASAN EKSEKUTIF & FILOSOFI DESAIN

### 1.1 Filosofi Desain: "Executive Precision meets IoT Telemetry"
Desain Smart Parking System mengadopsi estetika dashboard reservasi premium (terinspirasi dari antarmuka *Harborlight Hotel Reservation*) yang menggabungkan:
- **Ketenangan & Keanggunan (Warm Hospitality Palette):** Dominasi warna *Deep Forest Emerald* (`#0F382C`) pada panel navigasi dan aksen primer, dipadukan dengan kanvas berlatar *Warm Cream / Alabaster* (`#FAF8F5` / `#F4F2EB`) serta kartu putih bersih (`#FFFFFF`).
- **Kejelasan Telemetri IoT (Telemetry Clarity):** Informasi perangkat keras (4 sensor photodiode ESP32 pada slot A01–A04) disajikan dengan presisi tinggi menggunakan angka tabular monospace, indikator heartbeat perangkat, dan visualisasi denah interaktif.
- **Dua Dimensi Status yang Terpisah (Two-Dimensional Status Paradigm):**
  1. **Status Fisik Sensor (Physical Sensor State):** Wajib mengikuti ketentuan **PRD FR-PARK-003**:
     - **Merah (`#DC2626` / `#EF4444`):** Slot Kosong (*Empty*) – menandakan area parkir tidak ada halangan fisik.
     - **Hijau (`#16A34A` / `#22C55E`):** Slot Terisi (*Occupied*) – menandakan kendaraan fisik terdeteksi di atas sensor.
     - **Abu-abu (`#94A3B8`):** Sensor Unknown / ESP32 Offline.
  2. **Status Reservasi (Reservation Schedule State):** Terpisah dari kondisi fisik sensor (Available, Pending Payment, Confirmed, Active, Completed, Cancelled).

---

## 2. ARSITEKTUR ANTARMUKA (UI ARCHITECTURE)

Struktur antarmuka menggunakan **Dual-Zone Layout Architecture** standar SaaS Enterprise:

```text
+-------------------------------------------------------------------------------------------------------+
|  TOP HEADER BAR: [Brand Wordmark / Breadcrumb] ----------- [Live IoT Heartbeat] [Quick Actions] [User]|
+-------------------+-----------------------------------------------------------------------------------+
|                   |                                                                                   |
|  SIDEBAR          |  MAIN CONTENT VIEWPORT (1440px Grid Baseline)                                     |
|  (260px Fixed)    |                                                                                   |
|                   |  [1] Page Greeting & Quick Action Buttons (Baris Atas)                            |
|  - Brand Lockup   |  [2] 8-Card KPI Metric Grid (2 baris x 4 kolom - Meniru gaya Harborlight)         |
|  - Mode Switcher  |  [3] Dua Kolom Konten Utama:                                                      |
|    (Admin / User) |      - Kolom Kiri: Visualisasi Denah 4 Slot Parkir (A01-A04) & Tabel Transaksi    |
|  - Nav Items      |      - Kolom Kanan: Meter Ketersediaan Slot & Log Telemetri Sensor ESP32          |
|  - Profile Badge  |  [4] Modal Konfirmasi Kedatangan Kendaraan (FR-ARR-003 Pop-up)                    |
|                   |                                                                                   |
+-------------------+-----------------------------------------------------------------------------------+
```

### 2.1 Struktur Navigasi Berdasarkan Role

#### A. Admin Workspace (Hak Akses Penuh)
- **Ringkasan (Overview):** 8 Kartu KPI, Grafik Pendapatan harian/bulanan, Status 4 Slot Real-Time.
- **Monitoring Slot (A01–A04):** Denah interaktif, pembacaan nilai ADC sensor, waktu pembaruan terakhir, status koneksi ESP32.
- **Verifikasi Pembayaran:** Tabel transfer manual pengguna, thumbnail bukti pembayaran, aksi setujui (*approve*) atau tolak (*reject*) dengan alasan.
- **Manajemen Reservasi:** Seluruh data pemesanan slot, filter tanggal, status pemesanan, plat nomor kendaraan.
- **Laporan Pendapatan (Revenue Report):** Rekap harian, bulanan, tahunan berdasarkan pembayaran berstatus *approved* (`verified_at`).
- **Telemetri IoT & Sensor Logs:** Tabel histori pembacaan sensor photodiode & pemicu buzzer.
- **Manajemen Pengguna:** Daftar akun terdaftar dan kontrol role.

#### B. User Workspace (Pengguna Fasilitas Parkir)
- **Dashboard Saya:** Ringkasan slot yang sedang dipesan, status verifikasi transfer, notifikasi aktif.
- **Ketersediaan & Reservasi:** Pemilihan slot A01–A04, penentuan tanggal, jam mulai, jam selesai, nomor polisi, kalkulasi tarif otomatis.
- **Pembayaran Transfer:** Info rekening admin, upload file bukti transfer (JPG/PNG), status verifikasi.
- **Riwayat Reservasi:** Daftar pemesanan aktif dan lampau beserta kode unik reservasi (format: `RSV-YYYYMMDD-XXXX`).
- **Konfirmasi Kedatangan:** Layar pop-up interaktif saat kendaraan tiba di slot fisik.

---

## 3. SKEMA WARNA & PALET DESAIN (COLOR SYSTEM)

Mengacu pada prinsip **60-30-10 Color Distribution** dan harmoni visual dari gambar referensi:

```
[ 60% Neutral Canvas ]       [ 30% Structural Surfaces ]    [ 10% Accents & Semantics ]
Warm Cream (#FAF8F5)         Deep Emerald (#0F382C)         Slot Kosong Merah (#DC2626)
Pure White Card (#FFFFFF)    Forest Pine (#164E3F)          Slot Terisi Hijau (#16A34A)
Border Sand (#E6E3D8)        Sidebar Text Slate (#D1E0DA)   Amber Warning (#D97706)
```

### 3.1 Tabel Token Warna

| Token Name | Hex Code | Penggunaan Komponen |
|---|---|---|
| **Primary Base (Forest Emerald)** | `#0F382C` | Latar belakang sidebar, tombol aksi utama (+ New Reservation), badge header |
| **Primary Hover (Deep Pine)** | `#164E3F` | Efek hover tombol utama, background item sidebar aktif |
| **Primary Surface Dark** | `#0B2820` | Sudut bawah sidebar, container akun profil pengguna |
| **Neutral Background (Canvas)** | `#FAF8F5` | Background halaman konten utama (warm cream lembut) |
| **Card Surface (White)** | `#FFFFFF` | Latar kartu metrik KPI, tabel data, modal popup |
| **Card Border (Sand Hairline)** | `#E6E3D8` | Border 1px pada kartu metrik dan kontainer tabel |
| **Text Primary (Deep Slate)** | `#192A24` | Judul halaman, angka besar KPI, label utama |
| **Text Secondary (Muted Sage)** | `#5C6F67` | Subtitle, label kecil KPI, header kolom tabel |
| **Text Monospace (Code/Telemetry)**| `#2D433A` | Nilai ADC, kode reservasi, plat nomor, tanggal/jam |
| **Slot Fisik: KOSONG (PRD)** | `#DC2626` | Warna visual website untuk kondisi fisik slot **EMPTY** (Merah) |
| **Slot Fisik: TERISI (PRD)** | `#16A34A` | Warna visual website untuk kondisi fisik slot **OCCUPIED** (Hijau) |
| **Slot Fisik: UNKNOWN** | `#94A3B8` | Kondisi sensor offline atau belum terdeteksi (Abu-abu) |
| **Status: Waiting / Pending** | `#D97706` | Menunggu pembayaran / verifikasi (Amber Warm) |
| **Status: Confirmed / Active** | `#0F382C` | Reservasi disetujui / sesi aktif (Emerald Dark) |
| **Status: Cancelled / Expired** | `#991B1B` | Pembayaran ditolak atau reservasi dibatalkan |

---

## 4. SISTEM TIPOGRAFI & PERLAKUAN NUMERIK

Mengikuti *2+1 Font Rule*:
1. **Display & Heading Font:** `Plus Jakarta Sans` (atau `Outfit`), dipadukan dengan aksen *Editorial Serif* elegan pada judul branding layaknya pada referensi Harborlight Hotel.
2. **Body & Controls Font:** `Plus Jakarta Sans` / `DM Sans` untuk legibilitas optimal pada ukuran 12px–15px.
3. **Telemetry & Numeric Font:** Monospace berfitur `tabular-nums` (`font-mono`) untuk nilai sensor, harga, jam, dan kode transaksi.

### 4.1 Hirarki Tipografi

| Level | Size / Weight | Line Height | Tracking | Penggunaan |
|---|---|---|---|---|
| **Display 1** | `28px` / Bold (700) | `1.2` | `-0.02em` | Judul Dashboard ("Ringkasan Operasional Parkir") |
| **Heading 2** | `20px` / SemiBold (600) | `1.3` | `-0.01em` | Header bagian ("Denah Slot Parkir", "Laporan Pendapatan") |
| **Metric Large** | `26px` / Bold (700) Monospace | `1.1` | `normal` | Angka pada 8 Kartu KPI (`font-mono tabular-nums`) |
| **Body Regular** | `14px` / Regular (400) | `1.5` | `normal` | Isi tabel, form label, deskripsi modal |
| **Micro Label** | `11px` / Medium (500) | `1.4` | `+0.03em` | Label metrik atas KPI ("TOTAL SLOT", "PENDAPATAN HARI INI") |
| **Code / Telemetry**| `12px` / Medium (500) Monospace | `1.2` | `normal` | `RSV-20261110-0001`, `B 1234 XYZ`, `ADC: 1240` |

---

## 5. PANDUAN GAYA KOMPONEN VISUAL (COMPONENT STYLE GUIDE)

### 5.1 Kartu Metrik KPI (8-Grid Metrics Strip)
Diadaptasi langsung dari baris kartu statistik pada gambar referensi Harborlight Hotel:
- **Layout:** Grid 4 kolom x 2 baris pada desktop (`grid-cols-2 lg:grid-cols-4 gap-4`).
- **Dimensi & Spacing:** Padding `p-4` atau `p-5`, sudut membulat `rounded-xl`, border tipis `border border-[#E6E3D8]`, latar belakang putih bersih `bg-white`, bayangan halus `shadow-[0_1px_3px_rgba(0,0,0,0.04)]`.
- **Anatomi Kartu:**
  1. *Header:* Ikon fungsional bersahaja di sudut kiri atas (ukuran 16px dengan latar pastel lembut).
  2. *Label:* Teks muted huruf kecil/title case (misal: "Slot Kosong Hari Ini", "Menunggu Verifikasi").
  3. *Nilai Angka Utama:* Teks tebal ukuran besar (`text-2xl font-bold font-mono tracking-tight text-[#192A24]`).
  4. *Keterangan Bawah:* Teks mikro penjelas (misal: "Dari total 4 slot ESP32", "Perlu tindakan admin").

```text
+----------------------------------------+
| [Icon]                                 |
| TOTAL SLOT TERSEDIA                    |
| 3                                      |
| 1 slot terisi kendaraan fisik          |
+----------------------------------------+
```

### 5.2 Visualisasi Denah 4 Slot Parkir (A01 - A04)
Menampilkan 4 slot dengan jelas dan presisi sesuai arsitektur perangkat keras:
- **Tata Letak:** 2 baris x 2 kolom (`A01`, `A02` di baris atas; `A03`, `A04` di baris bawah).
- **Aturan Warna Fisik (PRD 5.2 FR-PARK-003):**
  - **Slot Kosong (Empty):** Kotak bertinta **Merah** (`bg-red-50 border-red-500 text-red-700`). Merah = Area lapang siap ditempati.
  - **Slot Terisi (Occupied):** Kotak bertinta **Hijau** (`bg-emerald-50 border-emerald-600 text-emerald-800`). Hijau = Mobil terdeteksi di atas photodiode.
  - **Slot Unknown:** Kotak bertinta **Abu-abu** (`bg-slate-100 border-slate-300 text-slate-500`).
- **Informasi di dalam Setiap Slot:**
  - Kode Slot (`A01` s/d `A04`) dengan tipografi berukuran besar.
  - Status Fisik Badge ("Fisik: KOSONG" atau "Fisik: TERISI").
  - Status Jadwal Reservasi ("Tersedia untuk Booking", "Dipesan: B 1234 XYZ", atau "Sesi Aktif").
  - Nilai Mentah ADC Sensor Photodiode (misal: `ADC: 3100` / `ADC: 1100`).
  - Waktu Pembacaan Terakhir (misal: `10 detik lalu`).

### 5.3 Meter Ketersediaan Slot (Availability Progress Bars)
Mengadopsi komponen grafik horizontal kanan bawah pada gambar referensi ("Availability by room type"):
- Batang progress horizontal tipis elegan dengan warna aksen Forest Emerald (`#0F382C`) dan Amber (`#D97706`).
- Menunjukkan utilitas slot per jam atau per sesi (misal: Slot A01: 75% terisi hari ini, Slot A02: 25% terisi hari ini).

### 5.4 Tombol & Kontrol Interaktif
- **Primary Action Button (+ Reservasi Baru / Setujui):**
  - Gaya: `bg-[#0F382C] hover:bg-[#164E3F] text-white font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap shadow-sm text-sm`.
- **Secondary Action Button (Kalender Reservasi / Export):**
  - Gaya: `bg-white hover:bg-[#F5F3ED] text-[#0F382C] border border-[#D5D2C7] font-medium px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap text-sm`.
- **Danger Action Button (Tolak Pembayaran / Batal):**
  - Gaya: `bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-medium px-3.5 py-2 rounded-lg transition-colors text-sm`.

### 5.5 Tabel Data Reservasi & Pembayaran
- **Tampilan Bersih (Clean High-Density Data Grid):**
  - Header tabel dengan latar lembut `#F4F2EB`, border tipis bawah `#E6E3D8`.
  - Baris tabel berjarak rapi (`py-3 px-4`), efek hover baris halus (`hover:bg-[#FAF9F6]`).
  - Nomor plat kendaraan diberi kotak kode monospace (`bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono text-xs`).
  - Nominal harga disejajarkan rata kanan dengan `tabular-nums`.

### 5.6 Modal Pop-Up Konfirmasi Kedatangan (FR-ARR-003)
Muncul secara otomatis ketika photodiode mendeteksi mobil memasuki slot yang cocok dengan reservasi pengguna:
- **Latar Belakang:** Backdrop gelap semi-transparan dengan efek blur lembut (`backdrop-blur-sm bg-black/40`).
- **Header:** Latar hijau zamrud gelap (`bg-[#0F382C] text-white p-5 rounded-t-xl`).
- **Badge Slot:** Penanda slot besar (misal: badge `A01` merah/hijau mencolok).
- **Detail Reservasi:**
  - Kode Reservasi: `RSV-20261110-0001`
  - Waktu Deteksi: `10 Nov 2026, 14:02 WIB`
  - Plat Nomor: `B 9876 ABC`
- **Aksi Konfirmasi:**
  - Tombol Primer: `[ YA, KONFIRMASI KEDATANGAN ]` (Warna Emerald).
  - Tombol Sekunder: `[ BUKAN SAYA ]` (Warna Slate Netral).
- **Indikator Buzzer:** Teks visual yang mengonfirmasi bahwa bunyi buzzer aktif selama proses autentikasi berlangsung.

---

## 6. SPESIFIKASI RESPONSIVITAS (RESPONSIVE BREAKPOINTS)

| Breakpoint | Ukuran Layar | Adaptasi Tata Letak |
|---|---|---|
| **Desktop Wide** | $\ge 1280\text{px}$ | Sidebar 260px tetap, 8 Kartu KPI (4 kolom x 2 baris), Kolom Slot 2x2 sejajar dengan Tabel & Widget. |
| **Laptop / Desktop** | $1024\text{px} - 1279\text{px}$ | Sidebar 240px tetap, 8 Kartu KPI (4 kolom x 2 baris), layout konten flex dinamis. |
| **Tablet** | $768\text{px} - 1023\text{px}$ | Sidebar dapat diciutkan (*collapsible drawer*), KPI 2 kolom x 4 baris, slot parkir 2 kolom. |
| **Mobile** | $< 768\text{px}$ | Top bar dengan hamburger menu, KPI 1-2 kolom, denah slot stack vertikal, tabel scroll horizontal. |

---

## 7. MATRIKS KESESUAIAN DENGAN PRD (TRACEABILITY MATRIX)

| Modul PRD | Kebutuhan Fungsional | Elemen Desain & Komponen UI |
|---|---|---|
| **5.1 Auth** | Login & Registrasi User/Admin | Halaman login minimalis bertema Forest Emerald & form input bersih |
| **5.2 Parking** | 4 Slot Parkir (A01–A04) & Sensor | Denah visual 2x2, warna Merah (Kosong), Hijau (Terisi), Nilai ADC |
| **5.2 IoT Heartbeat** | Status ESP32 Online / Offline | Indikator status koneksi ESP32 di Top Bar dengan waktu heartbeat |
| **5.3 Reservation** | Pembuatan kode `RSV-...` & slot | Form reservasi tanggal/jam, kalkulator tarif, pencegah double-booking |
| **5.4 Payment** | Transfer manual & Verifikasi Admin | Kartu rekening bank, modal upload bukti transfer, tombol verifikasi admin |
| **5.5 Arrival** | Deteksi sensor & Konfirmasi User | Pop-up konfirmasi interaktif dengan simulasi buzzer dan validasi akun |
| **5.6 Buzzer** | Indikator suara fisik ESP32 | Banner notifikasi status audio buzzer (Short beep / Alert / Success) |
| **5.7 Reports** | Pendapatan harian/bulanan/tahunan | Kartu rekapitulasi nominal, filter tanggal, tabel breakdown transaksi |

---

*Dokumen ini dirancang sebagai acuan standar implementasi frontend antarmuka Smart Parking System agar konsisten, modern, dan selaras dengan arsitektur IoT ESP32 serta backend Laravel.*
