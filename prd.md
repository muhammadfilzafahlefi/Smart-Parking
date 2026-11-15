# PRODUCT REQUIREMENTS DOCUMENT (PRD)
# SMART PARKING SYSTEM

**Nama Proyek:** Smart Parking – Web-Based Parking Reservation System  
**Versi Dokumen:** 1.0.0  
**Status:** Initial Product Specification  
**Platform:** Web Application + Internet of Things (IoT)  
**Mikrokontroler:** ESP32  
**Backend:** Laravel  
**Database:** MySQL  
**Frontend:** HTML, CSS, JavaScript  
**Komunikasi IoT:** HTTP REST API  
**Deployment:** Localhost (Development), kemudian Online Hosting

---

# 1. PROJECT OVERVIEW

## 1.1 Latar Belakang

Smart Parking System merupakan sebuah sistem reservasi dan monitoring parkir mobil berbasis website yang terintegrasi dengan teknologi Internet of Things (IoT).

Sistem ini dirancang untuk memudahkan pengguna dalam mencari ketersediaan tempat parkir, melakukan reservasi slot parkir, melakukan pembayaran, serta memantau kondisi slot parkir secara real-time.

Sistem menggunakan ESP32 sebagai mikrokontroler utama yang terhubung dengan empat sensor photodiode. Sensor tersebut digunakan untuk mendeteksi keberadaan kendaraan pada setiap slot parkir.

Data hasil pembacaan sensor dikirimkan ke server melalui koneksi Wi-Fi menggunakan protokol HTTP. Backend Laravel kemudian memproses data dan menyimpannya ke dalam database MySQL untuk ditampilkan pada website.

Aplikasi memiliki dua jenis pengguna, yaitu Admin dan User.

Admin memiliki tanggung jawab dalam mengelola sistem, memverifikasi pembayaran, memantau kondisi parkir, serta melihat laporan pendapatan.

User dapat melakukan registrasi, login, melihat ketersediaan slot parkir, melakukan reservasi, mengunggah bukti pembayaran, serta melakukan konfirmasi kedatangan kendaraan melalui akun masing-masing.

## 1.2 Project Objectives

Tujuan pengembangan sistem ini adalah:

1. Membangun sistem reservasi parkir mobil berbasis website.
2. Mengimplementasikan autentikasi pengguna dengan dua hak akses, yaitu Admin dan User.
3. Mengintegrasikan ESP32 dengan sensor photodiode untuk mendeteksi keberadaan kendaraan.
4. Menampilkan kondisi slot parkir berdasarkan hasil pembacaan sensor.
5. Memungkinkan pengguna melakukan reservasi slot parkir secara online.
6. Mengimplementasikan sistem pembayaran transfer manual dengan verifikasi oleh admin.
7. Membangun mekanisme konfirmasi kedatangan berdasarkan deteksi sensor dan akun pengguna.
8. Menyediakan dashboard admin untuk monitoring dan laporan pendapatan.
9. Menyimpan seluruh aktivitas reservasi, pembayaran, dan pembacaan sensor ke dalam database.

## 1.3 Target Pengguna

Sistem memiliki dua jenis pengguna utama:

| Role | Deskripsi |
|---|---|
| Admin | Pengelola seluruh aktivitas sistem Smart Parking. |
| User | Pengguna yang melakukan reservasi dan menggunakan fasilitas parkir. |

---

# 2. PROJECT SCOPE

## 2.1 In Scope

Fitur yang termasuk dalam pengembangan versi pertama:

### Authentication
- Registrasi pengguna.
- Login dan logout.
- Password hashing.
- Role-based access control.
- Proteksi halaman berdasarkan role.
- Manajemen profil pengguna.

### User Dashboard
- Ringkasan kondisi parkir.
- Total slot parkir.
- Jumlah slot kosong.
- Jumlah slot terisi.
- Informasi reservasi aktif.
- Status pembayaran.

### Parking Management
- Empat slot parkir: A01, A02, A03, A04.
- Monitoring kondisi slot melalui sensor.
- Pembaruan status slot pada website.
- Riwayat perubahan kondisi sensor.
- Indikator koneksi ESP32.

### Reservation Management
- Melihat ketersediaan slot.
- Memilih slot parkir.
- Menentukan tanggal dan waktu parkir.
- Menghitung biaya reservasi.
- Membuat kode reservasi.
- Melihat status reservasi.
- Membatalkan reservasi sesuai aturan sistem.
- Mencegah reservasi pada slot dan waktu yang bertabrakan.

### Payment Management
- Menampilkan informasi rekening pembayaran.
- Menampilkan nominal pembayaran.
- Upload bukti transfer.
- Verifikasi pembayaran oleh admin.
- Persetujuan pembayaran.
- Penolakan pembayaran.
- Riwayat pembayaran.

### Arrival Verification
- Mendeteksi kendaraan menggunakan sensor.
- Memeriksa reservasi aktif pada slot terkait.
- Menampilkan pop-up konfirmasi pada akun pengguna.
- Memvalidasi kepemilikan reservasi.
- Menyimpan waktu kedatangan.
- Mengubah status reservasi menjadi aktif setelah konfirmasi berhasil.

### Admin Dashboard
- Ringkasan jumlah pengguna.
- Ringkasan reservasi.
- Monitoring seluruh slot parkir.
- Verifikasi pembayaran.
- Manajemen pengguna.
- Manajemen reservasi.
- Laporan pendapatan harian.
- Laporan pendapatan bulanan.
- Laporan pendapatan tahunan.
- Riwayat aktivitas sistem.

## 2.2 Out of Scope

Fitur berikut tidak termasuk dalam versi pertama:

- Pembayaran otomatis melalui payment gateway.
- Pengenalan plat nomor kendaraan menggunakan AI.
- Pengenalan wajah pengemudi.
- Integrasi RFID.
- QR Code scanner fisik.
- Automatic barrier gate.
- Aplikasi Android dan iOS native.
- Sistem multi-lokasi parkir.
- Integrasi dengan sistem parkir pihak ketiga.

Fitur tersebut dapat dipertimbangkan untuk pengembangan versi berikutnya.

---

# 3. TECHNOLOGY STACK

## 3.1 Hardware

| Komponen | Jumlah | Fungsi |
|---|---:|---|
| ESP32 DevKit V1 | 1 | Mikrokontroler utama |
| Photodiode | 4 | Mendeteksi kendaraan |
| Sumber cahaya | 4 | Memberikan cahaya untuk proses pendeteksian |
| Resistor / signal conditioning | Sesuai rangkaian | Pengondisian sinyal sensor |
| Buzzer | 1 | Indikator suara |
| Power Supply | Sesuai kebutuhan | Sumber daya sistem |

## 3.2 Software

| Teknologi | Fungsi |
|---|---|
| Laravel | Backend dan web application |
| PHP | Bahasa pemrograman backend |
| MySQL | Database |
| HTML | Struktur website |
| CSS | Styling website |
| JavaScript | Interaksi frontend |
| Bootstrap | UI component dan responsive layout |
| Arduino IDE | Pemrograman ESP32 |
| C++ | Firmware ESP32 |
| REST API | Komunikasi ESP32 dan Laravel |
| JSON | Format pertukaran data |
| Git | Version control |

## 3.3 Arsitektur Sistem

Arsitektur sistem menggunakan pendekatan client-server dengan integrasi perangkat IoT.

```text
                  USER / ADMIN
                       |
                       |
                 WEB APPLICATION
                       |
                 LARAVEL BACKEND
                       |
                MYSQL DATABASE
                       |
                REST API SERVER
                       |
                    WI-FI
                       |
                     ESP32
                       |
          +------------+------------+
          |            |            |
       SENSOR A01   SENSOR A02   SENSOR A03
          |
       SENSOR A04
                       |
                    BUZZER
```

ESP32 hanya berkomunikasi dengan Laravel melalui REST API. ESP32 tidak diperbolehkan mengakses database MySQL secara langsung.

---

# 4. USER ROLES & ACCESS CONTROL

## 4.1 Admin

Admin merupakan pengguna yang memiliki hak akses tertinggi dalam aplikasi.

Fitur Admin:

1. Login ke dashboard admin.
2. Melihat statistik keseluruhan parkir.
3. Melihat kondisi empat slot parkir.
4. Melihat daftar pengguna.
5. Mengelola data pengguna.
6. Melihat seluruh transaksi reservasi.
7. Memverifikasi bukti pembayaran.
8. Menyetujui pembayaran.
9. Menolak pembayaran.
10. Melihat laporan pendapatan harian.
11. Melihat laporan pendapatan bulanan.
12. Melihat laporan pendapatan tahunan.
13. Melihat riwayat sensor.
14. Melihat status koneksi ESP32.

## 4.2 User

User merupakan pengguna yang melakukan reservasi tempat parkir.

Fitur User:

1. Registrasi akun.
2. Login dan logout.
3. Mengelola profil.
4. Melihat dashboard pengguna.
5. Melihat denah empat slot parkir.
6. Melihat kondisi slot kosong dan terisi.
7. Memilih slot parkir.
8. Menentukan tanggal dan waktu parkir.
9. Melakukan reservasi.
10. Melihat informasi pembayaran.
11. Mengunggah bukti transfer.
12. Melihat status verifikasi pembayaran.
13. Melihat riwayat reservasi.
14. Menerima pop-up konfirmasi kedatangan.
15. Mengonfirmasi kedatangan kendaraan.

## 4.3 Access Control Matrix

| Fitur | Admin | User |
|---|---|---|
| Login | Yes | Yes |
| Registrasi | No | Yes |
| Dashboard | Yes | Yes |
| Melihat Slot | Yes | Yes |
| Reservasi | No | Yes |
| Upload Pembayaran | No | Yes |
| Verifikasi Pembayaran | Yes | No |
| Monitoring Sensor | Yes | Yes |
| Laporan Pendapatan | Yes | No |
| Manajemen Pengguna | Yes | No |
| Konfirmasi Kedatangan | No | Yes |
| Riwayat Reservasi | Semua | Milik sendiri |

---

# 5. FUNCTIONAL REQUIREMENTS

## 5.1 Authentication Module

### FR-AUTH-001: User Registration
Sistem harus menyediakan halaman registrasi pengguna.

Data registrasi:
- Nama lengkap.
- Email.
- Nomor telepon.
- Password.
- Konfirmasi password.

Validasi:
- Email harus unik.
- Password harus memenuhi kebijakan keamanan.
- Seluruh field wajib harus diisi.
- Password disimpan menggunakan hashing.

### FR-AUTH-002: Login
Sistem menyediakan halaman login dengan email dan password.

Sistem harus:
- Memvalidasi kredensial.
- Mengidentifikasi role pengguna.
- Mengarahkan admin ke dashboard admin.
- Mengarahkan user ke dashboard pengguna.
- Menolak akses apabila kredensial tidak valid.

### FR-AUTH-003: Role Protection
Sistem harus melindungi halaman berdasarkan role.

User tidak dapat mengakses halaman admin melalui URL secara langsung.

Admin dapat mengakses fitur administrasi sesuai hak aksesnya.

---

## 5.2 Parking Management Module

### FR-PARK-001: Parking Slot

Sistem memiliki empat slot parkir:

| Slot ID | Slot Code |
|---|---|
| 1 | A01 |
| 2 | A02 |
| 3 | A03 |
| 4 | A04 |

### FR-PARK-002: Sensor Monitoring

Setiap slot memiliki satu sensor photodiode.

ESP32 bertugas:
- Membaca nilai analog sensor.
- Memproses hasil pembacaan.
- Melakukan filtering.
- Membandingkan nilai sensor dengan threshold.
- Menentukan kondisi fisik slot.
- Mengirim data ke backend.

### FR-PARK-003: Slot Status

Status fisik slot terdiri dari:

| Status | Arti | Warna Website |
|---|---|---|
| Empty | Slot kosong | Merah |
| Occupied | Slot terisi | Hijau |
| Unknown | Sensor tidak tersedia | Abu-abu |

Warna merah dan hijau merupakan indikator kondisi fisik slot, bukan status reservasi.

### FR-PARK-004: Real-Time Monitoring

Website harus memperbarui kondisi slot berdasarkan data terbaru dari ESP32.

Ketentuan awal:
- Polling dashboard setiap 2–3 detik.
- Heartbeat ESP32 setiap 30 detik.
- Status perangkat menjadi offline jika tidak ada heartbeat melewati batas toleransi yang ditentukan.
- Sistem menampilkan waktu pembaruan terakhir.

### FR-PARK-005: Sensor Logging

Sistem menyimpan riwayat perubahan status sensor untuk kebutuhan monitoring dan penelitian.

---

## 5.3 Reservation Module

### FR-RES-001: View Parking Availability

User dapat melihat empat slot parkir beserta:
- Kode slot.
- Kondisi fisik.
- Status reservasi.
- Jadwal ketersediaan.

### FR-RES-002: Create Reservation

User dapat membuat reservasi dengan menentukan:
- Slot parkir.
- Tanggal parkir.
- Jam mulai.
- Jam selesai.
- Nomor polisi kendaraan.

Sistem melakukan validasi:
- Slot harus tersedia pada jadwal tersebut.
- Waktu selesai harus lebih besar daripada waktu mulai.
- Reservasi tidak boleh bertabrakan dengan reservasi lain yang masih berlaku.
- Reservasi harus memenuhi batas minimum dan maksimum waktu pemesanan yang ditetapkan.

### FR-RES-003: Reservation Code

Setiap reservasi memiliki kode unik.

Contoh:

```text
RSV-20261110-0001
```

### FR-RES-004: Reservation Status

Status reservasi:

| Status | Deskripsi |
|---|---|
| pending_payment | Menunggu pembayaran |
| waiting_verification | Menunggu verifikasi admin |
| confirmed | Pembayaran disetujui |
| waiting_arrival | Menunggu kedatangan |
| active | Kendaraan telah dikonfirmasi dan sedang parkir |
| completed | Sesi parkir selesai |
| rejected | Pembayaran ditolak |
| cancelled | Reservasi dibatalkan |
| expired | Reservasi melewati batas waktu |

Status pembayaran disimpan terpisah dari status reservasi.

### FR-RES-005: Double Booking Prevention

Sistem harus mencegah dua pengguna melakukan reservasi pada slot yang sama dalam periode waktu yang bertabrakan.

Pemeriksaan harus dilakukan di backend menggunakan database transaction dan locking yang sesuai.

---

## 5.4 Payment Module

### FR-PAY-001: Payment Information

Sistem menampilkan informasi:
- Nama bank.
- Nomor rekening.
- Nama pemilik rekening.
- Nominal pembayaran.
- Kode reservasi.

Informasi rekening dikelola admin.

### FR-PAY-002: Upload Payment Proof

User dapat mengunggah bukti transfer.

Ketentuan:
- Format JPG, JPEG, PNG.
- Maksimal ukuran file ditentukan dalam konfigurasi aplikasi.
- File disimpan secara aman.
- User hanya dapat melihat bukti pembayaran miliknya sendiri.

### FR-PAY-003: Payment Verification

Admin dapat:
- Melihat bukti pembayaran.
- Melihat nama pengguna.
- Melihat kode reservasi.
- Melihat nominal pembayaran.
- Menyetujui pembayaran.
- Menolak pembayaran dengan alasan.

### FR-PAY-004: Payment Status

Status pembayaran:

| Status | Deskripsi |
|---|---|
| unpaid | Belum membayar |
| pending | Menunggu verifikasi |
| approved | Pembayaran disetujui |
| rejected | Pembayaran ditolak |

### FR-PAY-005: Revenue Calculation

Pendapatan dihitung berdasarkan pembayaran berstatus approved.

Laporan menggunakan waktu verifikasi pembayaran (`verified_at`) sebagai dasar pengelompokan tanggal pendapatan.

Pembayaran yang belum diverifikasi atau ditolak tidak dimasukkan dalam pendapatan.

---

## 5.5 Arrival Authentication Module

### FR-ARR-001: Vehicle Detection

ESP32 membaca sensor photodiode untuk mengetahui kendaraan yang memasuki slot.

### FR-ARR-002: Reservation Matching

Ketika sensor mendeteksi kendaraan, backend memeriksa:
- Kode slot.
- Reservasi yang masih berlaku.
- Status pembayaran.
- Jadwal reservasi.
- Kepemilikan reservasi.

### FR-ARR-003: Confirmation Popup

Jika ditemukan reservasi yang sesuai, website menampilkan pop-up kepada pemilik reservasi.

Contoh:

```text
================================
       KONFIRMASI KEDATANGAN
================================

Kendaraan terdeteksi pada slot A01.

Kode Reservasi:
RSV-20261110-0001

Apakah Anda merupakan pengguna
yang telah melakukan reservasi?

[ YA, KONFIRMASI ] [ BUKAN SAYA ]

================================
```

### FR-ARR-004: Confirmation Validation

Ketika user memilih konfirmasi, backend harus memeriksa:
- User sudah login.
- User merupakan pemilik reservasi.
- Reservasi telah dikonfirmasi pembayarannya.
- Slot sesuai dengan reservasi.
- Waktu reservasi masih berlaku.
- Peristiwa sensor masih relevan dan belum kedaluwarsa.

### FR-ARR-005: Arrival Session

Jika valid:
- Sistem menyimpan waktu kedatangan.
- Sistem membuat parking session.
- Status reservasi menjadi active.
- Sistem mencatat hasil verifikasi.
- Buzzer mengikuti aturan indikator yang telah ditentukan.

Jika tidak valid, sistem menolak konfirmasi dan mencatat kejadian tersebut.

**Batasan:** sensor photodiode hanya mendeteksi perubahan intensitas cahaya atau keberadaan objek. Sensor tidak dapat mengidentifikasi nomor polisi, jenis kendaraan, atau identitas pengemudi.

---

## 5.6 Buzzer Module

Buzzer berfungsi sebagai indikator suara sistem.

Aturan awal:
- Kendaraan terdeteksi pada slot yang sesuai dengan reservasi: indikator suara pendek atau sesuai konfigurasi.
- Kendaraan terdeteksi tanpa reservasi yang valid: indikator peringatan.
- Konfirmasi kedatangan berhasil: indikator konfirmasi.
- Kondisi normal: buzzer tidak aktif.

Durasi dan pola bunyi harus dapat disesuaikan melalui firmware.

---

## 5.7 Admin Reporting Module

### FR-REP-001: Daily Revenue

Admin dapat melihat:
- Total pendapatan hari ini.
- Jumlah pembayaran berhasil.
- Jumlah reservasi hari ini.
- Daftar transaksi.

### FR-REP-002: Monthly Revenue

Admin dapat melihat pendapatan berdasarkan bulan.

### FR-REP-003: Annual Revenue

Admin dapat melihat ringkasan pendapatan tahunan.

### FR-REP-004: Revenue Filter

Laporan dapat difilter berdasarkan rentang tanggal.

### FR-REP-005: Transaction History

Sistem menyimpan seluruh histori pembayaran dan tindakan verifikasi admin.

---

# 6. USER INTERFACE & UX REQUIREMENTS

## 6.1 Design Direction

Website menggunakan desain modern, minimalis, profesional, dan responsive.

Karakteristik desain:
- Clean dashboard.
- Layout terstruktur.
- Sidebar navigation.
- Card-based statistics.
- Tabel data yang mudah dibaca.
- Status badge.
- Modal konfirmasi.
- Responsive untuk desktop, tablet, dan mobile.

## 6.2 User Dashboard

Halaman utama pengguna menampilkan:

1. Navbar.
2. Sidebar atau navigasi utama.
3. Welcome section.
4. Ringkasan slot parkir.
5. Denah empat slot parkir.
6. Informasi reservasi aktif.
7. Status pembayaran.
8. Notifikasi kedatangan.

### Parking Slot Visualization

Contoh visual:

| A01 | A02 |
|---|---|
| Hijau – Terisi | Merah – Kosong |
| A03 | A04 |
| Merah – Kosong | Hijau – Terisi |

Legenda:
- Merah: slot kosong secara fisik.
- Hijau: slot terisi secara fisik.
- Abu-abu: sensor offline atau status tidak diketahui.

Ketersediaan untuk reservasi tetap diperiksa berdasarkan jadwal dan status reservasi.

## 6.3 Admin Dashboard

Halaman admin menampilkan:

1. Total pengguna.
2. Total reservasi.
3. Total pendapatan.
4. Pembayaran menunggu verifikasi.
5. Monitoring empat slot.
6. Grafik pendapatan.
7. Tabel reservasi terbaru.
8. Tabel pembayaran terbaru.
9. Status koneksi ESP32.

## 6.4 Required Pages

### Public Pages
- Landing Page.
- Login.
- Register.

### User Pages
- Dashboard.
- Parking Availability.
- Reservation.
- Payment.
- Reservation History.
- Profile.

### Admin Pages
- Dashboard.
- User Management.
- Parking Management.
- Reservation Management.
- Payment Verification.
- Sensor Monitoring.
- Revenue Reports.
- Transaction History.
- System Settings.

---

# 7. DATABASE DESIGN

Database menggunakan MySQL dengan tujuh tabel inti.

## 7.1 Table: users

| Column | Type | Description |
|---|---|---|
| id | BIGINT | Primary key |
| name | VARCHAR(100) | Nama |
| email | VARCHAR(100) | Email unik |
| password | VARCHAR(255) | Password hash |
| phone | VARCHAR(20) | Nomor telepon |
| role | VARCHAR(20) | admin / user |
| created_at | TIMESTAMP | Waktu dibuat |
| updated_at | TIMESTAMP | Waktu diperbarui |

## 7.2 Table: parking_slots

| Column | Type | Description |
|---|---|---|
| id | BIGINT | Primary key |
| slot_code | VARCHAR(10) | A01–A04 |
| sensor_value | INT | Nilai ADC terakhir |
| is_occupied | BOOLEAN | Kondisi fisik |
| sensor_status | VARCHAR(20) | occupied / empty / unknown |
| last_detected_at | TIMESTAMP | Waktu pembacaan |
| created_at | TIMESTAMP | Waktu dibuat |
| updated_at | TIMESTAMP | Waktu diperbarui |

## 7.3 Table: reservations

| Column | Type | Description |
|---|---|---|
| id | BIGINT | Primary key |
| reservation_code | VARCHAR(30) | Kode reservasi |
| user_id | BIGINT | FK users |
| parking_slot_id | BIGINT | FK parking_slots |
| vehicle_plate | VARCHAR(15) | Nomor polisi |
| start_time | DATETIME | Waktu mulai |
| end_time | DATETIME | Waktu selesai |
| total_price | DECIMAL(12,2) | Biaya |
| status | VARCHAR(30) | Status reservasi |
| arrival_confirmed_at | DATETIME | Waktu kedatangan |
| created_at | TIMESTAMP | Waktu dibuat |
| updated_at | TIMESTAMP | Waktu diperbarui |

## 7.4 Table: payments

| Column | Type | Description |
|---|---|---|
| id | BIGINT | Primary key |
| reservation_id | BIGINT | FK reservations |
| amount | DECIMAL(12,2) | Nominal |
| payment_method | VARCHAR(30) | Transfer manual |
| proof_image | VARCHAR(255) | File bukti |
| status | VARCHAR(20) | unpaid / pending / approved / rejected |
| verified_by | BIGINT | FK users |
| rejection_reason | TEXT | Alasan penolakan |
| verified_at | DATETIME | Waktu verifikasi |
| created_at | TIMESTAMP | Waktu dibuat |
| updated_at | TIMESTAMP | Waktu diperbarui |

## 7.5 Table: sensor_logs

| Column | Type | Description |
|---|---|---|
| id | BIGINT | Primary key |
| parking_slot_id | BIGINT | FK parking_slots |
| sensor_value | INT | Nilai ADC |
| detected_status | VARCHAR(20) | Status deteksi |
| recorded_at | DATETIME | Waktu pencatatan |

## 7.6 Table: parking_sessions

| Column | Type | Description |
|---|---|---|
| id | BIGINT | Primary key |
| reservation_id | BIGINT | FK reservations |
| check_in | DATETIME | Waktu masuk |
| check_out | DATETIME | Waktu keluar |
| status | VARCHAR(20) | active / completed |
| created_at | TIMESTAMP | Waktu dibuat |
| updated_at | TIMESTAMP | Waktu diperbarui |

## 7.7 Table: arrival_verifications

| Column | Type | Description |
|---|---|---|
| id | BIGINT | Primary key |
| reservation_id | BIGINT | FK reservations |
| parking_slot_id | BIGINT | FK parking_slots |
| detected_at | DATETIME | Waktu deteksi |
| confirmed_by | BIGINT | FK users |
| confirmed_at | DATETIME | Waktu konfirmasi |
| status | VARCHAR(20) | pending / confirmed / rejected |
| created_at | TIMESTAMP | Waktu dibuat |
| updated_at | TIMESTAMP | Waktu diperbarui |

## 7.8 Database Relationship

Relasi utama:

- Users memiliki banyak Reservations.
- Parking Slots memiliki banyak Reservations.
- Reservations memiliki Payment.
- Parking Slots memiliki banyak Sensor Logs.
- Reservations memiliki Parking Session.
- Reservations memiliki Arrival Verifications.
- Users dapat melakukan Arrival Verification.
- Admin memverifikasi Payment.

Gunakan foreign key, index, unique constraints, dan migration Laravel.

Catatan desain: tabel `parking_sessions` harus memiliki aturan agar satu reservasi tidak menghasilkan lebih dari satu sesi aktif. Tabel `arrival_verifications` perlu mendukung pencatatan beberapa kejadian sensor untuk satu reservasi.

---

# 8. IOT COMMUNICATION & API SPECIFICATION

## 8.1 Communication Flow

1. ESP32 membaca empat sensor photodiode.
2. ESP32 memproses hasil pembacaan.
3. ESP32 mengirim data melalui Wi-Fi.
4. Laravel menerima data melalui REST API.
5. Laravel memvalidasi perangkat.
6. Laravel memperbarui status slot.
7. Laravel menyimpan riwayat perubahan sensor.
8. Website memperbarui informasi slot.

## 8.2 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/iot/sensor-update | Mengirim data sensor |
| GET | /api/iot/slots | Membaca data slot |
| POST | /api/iot/device-heartbeat | Status koneksi ESP32 |
| GET | /api/parking-slots | Data seluruh slot |
| POST | /api/reservations | Membuat reservasi |
| GET | /api/reservations | Riwayat reservasi |
| POST | /api/payments | Upload bukti pembayaran |
| POST | /api/admin/payments/{id}/approve | Menyetujui pembayaran |
| POST | /api/admin/payments/{id}/reject | Menolak pembayaran |
| POST | /api/arrival/{id}/confirm | Konfirmasi kedatangan |

## 8.3 Sensor Update JSON

Contoh payload:

```json
{
  "device_id": "ESP32_PARKING_01",
  "slots": [
    {
      "slot_code": "A01",
      "sensor_value": 1200,
      "status": "occupied"
    },
    {
      "slot_code": "A02",
      "sensor_value": 3100,
      "status": "empty"
    },
    {
      "slot_code": "A03",
      "sensor_value": 2900,
      "status": "empty"
    },
    {
      "slot_code": "A04",
      "sensor_value": 1100,
      "status": "occupied"
    }
  ]
}
```

Nilai sensor merupakan contoh dan harus dikalibrasi berdasarkan rangkaian sebenarnya.

## 8.4 API Security

- ESP32 harus memiliki API key khusus.
- API key divalidasi di backend.
- API key tidak boleh dikirimkan melalui frontend.
- Gunakan HTTPS pada deployment online.
- Validasi seluruh payload JSON.
- Terapkan rate limiting.
- Catat aktivitas komunikasi perangkat.
- Tolak permintaan dari perangkat yang tidak terdaftar.

---

# 9. BUSINESS LOGIC & SYSTEM RULES

## 9.1 Slot Availability

Sistem membedakan dua kondisi:

**Physical Status**
- Empty.
- Occupied.
- Unknown.

**Reservation Status**
- Available.
- Pending Payment.
- Confirmed.
- Active.
- Reserved.

Slot yang kosong secara fisik belum tentu tersedia untuk reservasi.

## 9.2 Reservation Rules

- Satu slot tidak boleh memiliki dua reservasi aktif pada periode yang bertabrakan.
- Reservasi harus memiliki jadwal yang valid.
- Reservasi yang belum dibayar mempunyai batas waktu.
- Reservasi yang telah disetujui pembayaran akan ditahan sesuai periode reservasi.
- Pengguna hanya dapat melihat dan mengelola reservasi miliknya sendiri.

## 9.3 Payment Rules

- Pembayaran dilakukan melalui transfer manual.
- Bukti pembayaran wajib diunggah.
- Admin melakukan verifikasi.
- Pembayaran hanya dapat disetujui atau ditolak sesuai statusnya.
- Tindakan verifikasi harus dicatat.
- Pembayaran approved tidak dapat disetujui ulang.

## 9.4 Arrival Rules

- Sensor mendeteksi kendaraan.
- Backend mencari reservasi valid untuk slot tersebut.
- Sistem membuat kejadian deteksi.
- Pengguna pemilik reservasi menerima konfirmasi melalui dashboard.
- Pengguna harus login untuk melakukan konfirmasi.
- Backend memvalidasi identitas akun, slot, jadwal, dan reservasi.
- Sistem menyimpan waktu kedatangan apabila valid.

## 9.5 Revenue Rules

Pendapatan dihitung berdasarkan total pembayaran approved.

Contoh:

```text
Tanggal: 10 November 2026

Reservasi berhasil: 10
Pembayaran disetujui: 8
Pembayaran ditolak: 1
Menunggu verifikasi: 1

Total pendapatan:
8 x Rp50.000 = Rp400.000
```

Nominal tersebut merupakan ilustrasi, bukan tarif final sistem.

---

# 10. NON-FUNCTIONAL REQUIREMENTS

## 10.1 Performance

- Dashboard harus dapat dimuat secara efisien.
- Polling monitoring awal menggunakan interval 2–3 detik.
- API harus memproses data sensor secara konsisten.
- Database harus menggunakan index untuk pencarian yang sering dilakukan.
- Query laporan harus dioptimalkan.

## 10.2 Security

- Password menggunakan hashing.
- Implementasi CSRF protection.
- Validasi dan sanitasi input.
- Role-based authorization.
- Validasi kepemilikan data.
- Proteksi upload file.
- Pembatasan akses endpoint IoT.
- Proteksi terhadap SQL Injection dan XSS.
- Penggunaan database transaction untuk pembayaran dan reservasi.

## 10.3 Reliability

- Sistem harus dapat mendeteksi ESP32 offline.
- Data sensor tidak boleh dianggap valid apabila sudah kedaluwarsa.
- Sistem harus menangani kegagalan koneksi.
- ESP32 harus dapat mengirim ulang data ketika koneksi kembali tersedia.
- Perubahan status harus dicatat secara konsisten.

## 10.4 Responsive Design

Website harus dapat digunakan pada:
- Desktop.
- Laptop.
- Tablet.
- Smartphone.

## 10.5 Maintainability

- Kode menggunakan struktur MVC.
- Pemisahan controller, model, service, dan view.
- Menggunakan migration.
- Menggunakan konfigurasi environment.
- Menggunakan version control Git.
- Dokumentasi API dan instalasi harus tersedia.

---

# 11. SYSTEM STATES & ERROR HANDLING

Sistem harus menangani beberapa kondisi kegagalan:

| Kondisi | System Response |
|---|---|
| ESP32 offline | Tampilkan status perangkat offline |
| Sensor tidak terbaca | Status slot menjadi unknown |
| API gagal | ESP32 mencoba mengirim ulang |
| Upload bukti gagal | Tampilkan pesan error |
| Pembayaran ditolak | User dapat mengunggah ulang |
| Reservasi bentrok | Tolak reservasi dan tampilkan alasan |
| Session kedatangan kedaluwarsa | Minta proses deteksi ulang |
| Pengguna tidak berhak | Tolak akses |
| Database gagal | Catat error dan tampilkan pesan aman |

---

# 12. ACCEPTANCE CRITERIA

Produk dinyatakan memenuhi kebutuhan versi pertama apabila:

### Authentication
- User berhasil melakukan registrasi.
- Admin dan user dapat login.
- Sistem mengarahkan pengguna sesuai role.
- User tidak dapat membuka dashboard admin.

### Parking Monitoring
- Empat sensor dapat dibaca ESP32.
- Website dapat menampilkan empat slot.
- Slot kosong berwarna merah.
- Slot terisi berwarna hijau.
- Status unknown ditampilkan berbeda.
- Status berubah berdasarkan data sensor.

### Reservation
- User dapat melakukan reservasi.
- User dapat memilih jadwal.
- Sistem mencegah double booking.
- Kode reservasi berhasil dibuat.
- Status reservasi dapat dipantau.

### Payment
- User dapat mengunggah bukti pembayaran.
- Admin dapat memeriksa pembayaran.
- Admin dapat menyetujui pembayaran.
- Admin dapat menolak pembayaran.
- Status pembayaran tersimpan.

### Arrival Authentication
- Sistem mendeteksi kendaraan.
- Backend mencocokkan slot dengan reservasi.
- Pop-up muncul pada akun pemilik reservasi.
- Pengguna lain tidak dapat mengonfirmasi reservasi tersebut.
- Waktu kedatangan tersimpan.

### Admin Reporting
- Admin dapat melihat pendapatan harian.
- Admin dapat melihat pendapatan bulanan.
- Admin dapat melihat pendapatan tahunan.
- Nilai pendapatan sesuai dengan pembayaran approved.

### IoT
- ESP32 dapat terhubung ke server.
- Data sensor dapat diterima Laravel.
- Buzzer bekerja sesuai aturan.
- Status perangkat dapat dipantau.

---

# 13. DEVELOPMENT ROADMAP

Pengembangan dilakukan secara bertahap.

## Phase 1: Project Initialization
- Menyiapkan lingkungan development.
- Instalasi PHP.
- Instalasi Composer.
- Instalasi Laravel.
- Instalasi MySQL.
- Membuat project Smart Parking.

## Phase 2: Database Development
- Membuat database.
- Membuat migration.
- Membuat model.
- Membuat relasi.
- Membuat seeder.
- Menguji struktur database.

## Phase 3: Authentication Development
- Registrasi.
- Login.
- Logout.
- Role management.
- Middleware.
- Authorization.

## Phase 4: IoT Hardware Development
- Merakit ESP32.
- Menghubungkan empat photodiode.
- Menghubungkan buzzer.
- Membuat firmware.
- Kalibrasi sensor.
- Pengujian hardware.

## Phase 5: IoT API Integration
- Membuat REST API.
- Membuat validasi API key.
- Integrasi ESP32 dan Laravel.
- Penyimpanan sensor logs.
- Heartbeat perangkat.

## Phase 6: User Interface Development
- Landing page.
- User dashboard.
- Admin dashboard.
- Parking visualization.
- Responsive layout.

## Phase 7: Reservation Development
- Slot availability.
- Reservation form.
- Reservation validation.
- Double booking prevention.
- Reservation history.

## Phase 8: Payment Development
- Informasi rekening.
- Upload bukti pembayaran.
- Admin verification.
- Payment history.
- Revenue calculation.

## Phase 9: Arrival Authentication
- Vehicle detection.
- Reservation matching.
- Confirmation popup.
- Arrival validation.
- Parking session.

## Phase 10: Final Integration & Testing
- Hardware testing.
- API testing.
- Functional testing.
- Security testing.
- Performance testing.
- Documentation.
- Deployment.

---

# 14. TESTING PLAN

Pengujian harus dilakukan untuk mengetahui apakah sistem sesuai dengan kebutuhan.

| No. | Pengujian | Metode |
|---|---|---|
| 1 | Sensor photodiode | Pengujian kendaraan pada slot |
| 2 | Akurasi sensor | Pengujian berulang dengan kondisi pencahayaan berbeda |
| 3 | ESP32 | Pengujian pembacaan empat sensor |
| 4 | REST API | Pengiriman dan penerimaan JSON |
| 5 | Login | Black-box testing |
| 6 | Registrasi | Black-box testing |
| 7 | Reservasi | Pengujian berbagai jadwal |
| 8 | Double booking | Pengujian dua pengguna secara bersamaan |
| 9 | Pembayaran | Pengujian upload dan verifikasi |
| 10 | Arrival authentication | Pengujian kepemilikan reservasi |
| 11 | Buzzer | Pengujian setiap skenario |
| 12 | Revenue report | Membandingkan laporan dengan transaksi |
| 13 | Device offline | Memutus koneksi ESP32 |
| 14 | Security | Pengujian hak akses dan validasi |

Parameter penelitian yang perlu diukur:
- Akurasi pendeteksian kendaraan.
- Waktu respons sensor.
- Waktu pengiriman data ESP32.
- Waktu pembaruan website.
- Keberhasilan autentikasi kedatangan.
- Keberhasilan reservasi.
- Keberhasilan komunikasi IoT.

---

# 15. DEVELOPMENT PRIORITIES

Prioritas pengembangan ditentukan sebagai berikut:

| Priority | Modul | Keterangan |
|---|---|---|
| P0 | Authentication | Wajib |
| P0 | Database | Wajib |
| P0 | Parking Monitoring | Wajib |
| P0 | IoT Integration | Wajib |
| P0 | Reservation | Wajib |
| P0 | Payment Verification | Wajib |
| P0 | Arrival Authentication | Wajib |
| P0 | Admin Dashboard | Wajib |
| P1 | Revenue Reports | Wajib untuk ruang lingkup tugas akhir |
| P1 | Sensor History | Penting untuk evaluasi |
| P2 | Export PDF | Pengembangan tambahan |
| P2 | Export Excel | Pengembangan tambahan |
| P2 | Email Notifications | Pengembangan tambahan |

---

# 16. PROJECT CONSTRAINTS & ASSUMPTIONS

1. Sistem menggunakan satu ESP32 untuk empat slot parkir.
2. Setiap slot menggunakan satu photodiode.
3. Sumber cahaya menggunakan cahaya biasa.
4. Nilai threshold sensor ditentukan melalui kalibrasi.
5. Sistem menggunakan koneksi Wi-Fi.
6. Server development dijalankan secara lokal.
7. ESP32 dan server harus berada pada jaringan yang dapat saling dijangkau.
8. Pembayaran menggunakan transfer manual.
9. Admin melakukan verifikasi pembayaran secara manual.
10. Autentikasi kedatangan menggunakan akun pengguna dan deteksi sensor.
11. Sensor tidak dapat mengidentifikasi kendaraan secara langsung.
12. Website menggunakan bahasa Indonesia.
13. Tarif parkir ditentukan melalui konfigurasi sistem.
14. Zona waktu menggunakan Asia/Jakarta.
15. Sistem versi pertama hanya menangani empat slot parkir.

---

# 17. FUTURE DEVELOPMENT

Pengembangan lanjutan yang dapat dipertimbangkan:

- Integrasi QR Code untuk autentikasi kendaraan.
- RFID untuk identifikasi pengguna.
- Automatic parking gate.
- Payment gateway.
- Notifikasi WhatsApp atau Telegram.
- Pengenalan plat nomor menggunakan computer vision.
- Aplikasi mobile.
- Multi-location parking management.
- Prediksi ketersediaan slot parkir.

Fitur tambahan tidak boleh mengganggu fungsi utama sistem versi pertama.

---

# 18. FINAL PRODUCT DEFINITION

Smart Parking System merupakan aplikasi reservasi parkir mobil berbasis website yang terintegrasi dengan Internet of Things menggunakan ESP32 dan empat sensor photodiode.

Sistem memiliki dua role utama, yaitu Admin dan User.

User dapat melakukan registrasi, login, melihat kondisi slot parkir, melakukan reservasi, mengunggah bukti pembayaran, dan mengonfirmasi kedatangan kendaraan.

Admin dapat mengelola pengguna, memverifikasi pembayaran, memonitor kondisi parkir, serta melihat laporan pendapatan.

ESP32 bertugas membaca kondisi empat sensor photodiode, mengirimkan data ke server Laravel melalui REST API, dan mengendalikan buzzer berdasarkan aturan sistem.

Laravel bertindak sebagai backend utama yang mengelola autentikasi, reservasi, pembayaran, proses kedatangan, serta komunikasi perangkat IoT. MySQL digunakan untuk menyimpan seluruh data sistem.

**Target akhir proyek adalah menghasilkan sistem Smart Parking yang berfungsi secara terintegrasi, memiliki pencatatan data yang konsisten, dapat diuji secara empiris, dan dapat dikembangkan lebih lanjut.**

---

# END OF PRODUCT REQUIREMENTS DOCUMENT

**Document:** PRD.md  
**Project:** Smart Parking System  
**Version:** 1.0.0  
**Status:** Ready for Development Planning