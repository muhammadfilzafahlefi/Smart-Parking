# DEVELOPMENT CHECKLIST
# SMART PARKING SYSTEM

**Versi:** 1.0.0  
**Teknologi:** Laravel, MySQL, HTML, CSS, JavaScript, ESP32  
**Jumlah Slot:** 4 (A01, A02, A03, A04)

---

## 1. Persiapan Lingkungan Pengembangan

### 1.1 Instalasi dan Konfigurasi Tools
- [ ] Install PHP sesuai persyaratan versi Laravel yang digunakan.
- [ ] Install Composer.
- [ ] Install Laravel.
- [ ] Install MySQL.
- [ ] Install Visual Studio Code.
- [ ] Install Git.
- [ ] Install Arduino IDE.
- [ ] Install driver USB-to-Serial ESP32 jika diperlukan.
- [ ] Pastikan PHP, Composer, MySQL, dan Arduino IDE berjalan dengan baik.

### 1.2 Pembuatan Proyek
- [ ] Buat folder proyek `smart-parking`.
- [ ] Buat proyek Laravel.
- [ ] Konfigurasi file `.env`.
- [ ] Buat database MySQL `smart_parking`.
- [ ] Hubungkan Laravel dengan database.
- [ ] Jalankan Laravel development server.
- [ ] Pastikan halaman Laravel dapat diakses melalui localhost.
- [ ] Inisialisasi Git repository.
- [ ] Buat file `README.md`.
- [ ] Simpan dokumen `PRD.md`, `DEVELOPMENT_CHECKLIST.md`, dan `DATABASE_SCHEMA.md` pada direktori utama proyek.

---

## 2. Perancangan dan Implementasi Database

### 2.1 Pembuatan Struktur Database
- [ ] Buat migration tabel `users`.
- [ ] Buat migration tabel `iot_devices`.
- [ ] Buat migration tabel `parking_slots`.
- [ ] Buat migration tabel `reservations`.
- [ ] Buat migration tabel `payments`.
- [ ] Buat migration tabel `sensor_logs`.
- [ ] Buat migration tabel `parking_sessions`.
- [ ] Buat migration tabel `arrival_verifications`.
- [ ] Tambahkan foreign key pada setiap relasi.
- [ ] Tambahkan unique constraint pada kolom yang membutuhkan nilai unik.
- [ ] Tambahkan index untuk kolom pencarian dan relasi.
- [ ] Tambahkan aturan integritas data.
- [ ] Jalankan seluruh migration.
- [ ] Periksa struktur tabel melalui MySQL.

### 2.2 Data Awal
- [ ] Buat seeder akun admin.
- [ ] Buat seeder empat slot parkir A01–A04.
- [ ] Buat seeder perangkat ESP32.
- [ ] Pastikan seluruh slot memiliki status awal `unknown` sampai sensor memberikan data valid.
- [ ] Uji relasi antar tabel.

---

## 3. Backend Laravel

### 3.1 Autentikasi dan Hak Akses
- [ ] Implementasikan registrasi pengguna.
- [ ] Implementasikan login.
- [ ] Implementasikan logout.
- [ ] Implementasikan password hashing.
- [ ] Implementasikan middleware autentikasi.
- [ ] Implementasikan middleware role admin.
- [ ] Implementasikan middleware role user.
- [ ] Batasi halaman admin hanya untuk admin.
- [ ] Batasi halaman pengguna hanya untuk pengguna yang login.
- [ ] Implementasikan validasi input.
- [ ] Implementasikan pengelolaan profil pengguna.

### 3.2 Manajemen Pengguna
- [ ] Tampilkan daftar pengguna.
- [ ] Tampilkan detail pengguna.
- [ ] Implementasikan pencarian pengguna.
- [ ] Implementasikan perubahan data pengguna.
- [ ] Implementasikan penonaktifan akun jika diperlukan.
- [ ] Pastikan admin tidak dapat menghapus data yang masih memiliki transaksi tanpa aturan yang jelas.

### 3.3 Manajemen Slot Parkir
- [ ] Tampilkan slot A01.
- [ ] Tampilkan slot A02.
- [ ] Tampilkan slot A03.
- [ ] Tampilkan slot A04.
- [ ] Tampilkan status fisik setiap slot.
- [ ] Implementasikan status `empty`, `occupied`, dan `unknown`.
- [ ] Implementasikan status perangkat `online` dan `offline`.
- [ ] Tampilkan waktu terakhir pembaruan sensor.
- [ ] Pisahkan status fisik slot dari ketersediaan reservasi.
- [ ] Implementasikan validasi ketersediaan slot berdasarkan rentang waktu reservasi.

### 3.4 Sistem Reservasi
- [ ] Buat halaman formulir reservasi.
- [ ] Implementasikan pemilihan slot.
- [ ] Implementasikan input nomor polisi kendaraan.
- [ ] Implementasikan input waktu mulai parkir.
- [ ] Implementasikan input waktu selesai parkir.
- [ ] Implementasikan perhitungan biaya.
- [ ] Implementasikan kode reservasi unik.
- [ ] Implementasikan pemeriksaan konflik waktu.
- [ ] Implementasikan transaksi database untuk mencegah double booking.
- [ ] Implementasikan pembatalan reservasi sesuai aturan.
- [ ] Implementasikan riwayat reservasi pengguna.
- [ ] Implementasikan detail reservasi.
- [ ] Implementasikan kedaluwarsa reservasi yang belum dibayar sesuai kebijakan.

### 3.5 Sistem Pembayaran
- [ ] Buat halaman instruksi transfer bank.
- [ ] Tampilkan nominal pembayaran.
- [ ] Tampilkan informasi rekening tujuan.
- [ ] Buat formulir upload bukti pembayaran.
- [ ] Validasi format file.
- [ ] Validasi ukuran file.
- [ ] Simpan bukti pembayaran pada storage privat.
- [ ] Implementasikan status pembayaran `unpaid`, `pending`, `approved`, dan `rejected`.
- [ ] Buat halaman verifikasi pembayaran admin.
- [ ] Implementasikan persetujuan pembayaran.
- [ ] Implementasikan penolakan pembayaran.
- [ ] Simpan identitas admin yang melakukan verifikasi.
- [ ] Simpan waktu verifikasi.
- [ ] Simpan alasan penolakan jika pembayaran ditolak.
- [ ] Pastikan pembayaran yang disetujui tidak dapat disetujui dua kali.
- [ ] Pastikan pendapatan hanya dihitung dari pembayaran yang disetujui.

### 3.6 Konfirmasi Kedatangan
- [ ] Buat halaman konfirmasi kedatangan.
- [ ] Validasi pengguna pemilik reservasi.
- [ ] Validasi status pembayaran.
- [ ] Validasi waktu kedatangan.
- [ ] Periksa status sensor slot.
- [ ] Catat hasil verifikasi kedatangan.
- [ ] Implementasikan pembentukan sesi parkir.
- [ ] Cegah satu reservasi membuat lebih dari satu sesi aktif.
- [ ] Implementasikan proses check-out.
- [ ] Implementasikan penyelesaian reservasi.

### 3.7 Dashboard dan Laporan Admin
- [ ] Buat dashboard admin.
- [ ] Tampilkan jumlah pengguna.
- [ ] Tampilkan jumlah reservasi.
- [ ] Tampilkan jumlah slot kosong.
- [ ] Tampilkan jumlah slot terisi.
- [ ] Tampilkan jumlah perangkat online dan offline.
- [ ] Tampilkan pembayaran menunggu verifikasi.
- [ ] Tampilkan pendapatan harian.
- [ ] Tampilkan riwayat transaksi.
- [ ] Buat filter laporan berdasarkan tanggal.
- [ ] Buat laporan berdasarkan status pembayaran.
- [ ] Buat laporan berdasarkan slot.
- [ ] Implementasikan export laporan jika diperlukan.

---

## 4. Frontend Website

### 4.1 Desain dan Komponen
- [ ] Tentukan warna dan identitas visual website.
- [ ] Buat layout responsif.
- [ ] Buat navbar.
- [ ] Buat sidebar admin.
- [ ] Buat footer.
- [ ] Buat komponen notifikasi.
- [ ] Buat komponen tabel.
- [ ] Buat komponen kartu status slot.

### 4.2 Halaman Pengguna
- [ ] Buat halaman landing page.
- [ ] Buat halaman registrasi.
- [ ] Buat halaman login.
- [ ] Buat halaman dashboard pengguna.
- [ ] Buat halaman ketersediaan parkir.
- [ ] Buat halaman reservasi.
- [ ] Buat halaman pembayaran.
- [ ] Buat halaman riwayat reservasi.
- [ ] Buat halaman detail reservasi.
- [ ] Buat halaman konfirmasi kedatangan.
- [ ] Buat halaman profil.

### 4.3 Halaman Admin
- [ ] Buat dashboard admin.
- [ ] Buat halaman manajemen pengguna.
- [ ] Buat halaman monitoring parkir.
- [ ] Buat halaman manajemen reservasi.
- [ ] Buat halaman verifikasi pembayaran.
- [ ] Buat halaman monitoring perangkat IoT.
- [ ] Buat halaman laporan pendapatan.
- [ ] Buat halaman riwayat transaksi.
- [ ] Buat halaman pengaturan sistem.

### 4.4 Status Visual Slot
- [ ] Gunakan warna merah untuk slot kosong.
- [ ] Gunakan warna hijau untuk slot terisi.
- [ ] Gunakan warna abu-abu untuk status sensor tidak diketahui atau perangkat offline.
- [ ] Tampilkan label status selain warna.
- [ ] Tampilkan status reservasi secara terpisah.
- [ ] Pastikan tampilan dapat dibaca pada perangkat mobile.

---

## 5. Pengembangan Perangkat IoT ESP32

### 5.1 Persiapan Hardware
- [ ] Siapkan ESP32.
- [ ] Siapkan empat sensor fotodioda.
- [ ] Siapkan sumber cahaya untuk setiap sensor.
- [ ] Siapkan buzzer.
- [ ] Siapkan komponen pendukung sensor sesuai rangkaian.
- [ ] Siapkan catu daya.
- [ ] Periksa tegangan dan polaritas rangkaian.
- [ ] Buat diagram rangkaian.
- [ ] Tentukan pin input sensor dan pin buzzer.

### 5.2 Pemrograman ESP32
- [ ] Konfigurasi koneksi Wi-Fi.
- [ ] Implementasikan pembacaan sensor A01.
- [ ] Implementasikan pembacaan sensor A02.
- [ ] Implementasikan pembacaan sensor A03.
- [ ] Implementasikan pembacaan sensor A04.
- [ ] Tentukan nilai ambang sensor berdasarkan kalibrasi.
- [ ] Implementasikan deteksi perubahan status sensor.
- [ ] Implementasikan mekanisme filter pembacaan sensor.
- [ ] Implementasikan pengendalian buzzer.
- [ ] Implementasikan koneksi HTTP/HTTPS.
- [ ] Implementasikan pengiriman data JSON.
- [ ] Implementasikan pengiriman heartbeat perangkat.
- [ ] Implementasikan penanganan koneksi Wi-Fi terputus.
- [ ] Implementasikan pengiriman ulang data jika diperlukan.
- [ ] Simpan API key secara aman.

### 5.3 Kalibrasi Sensor
- [ ] Uji sensor tanpa kendaraan.
- [ ] Uji sensor dengan kendaraan.
- [ ] Uji pada kondisi pencahayaan gelap.
- [ ] Uji pada kondisi pencahayaan normal.
- [ ] Uji pada kondisi pencahayaan terang.
- [ ] Uji beberapa posisi pemasangan.
- [ ] Uji kemungkinan gangguan cahaya lingkungan.
- [ ] Tentukan nilai ambang akhir.
- [ ] Dokumentasikan hasil pengujian.

---

## 6. Integrasi ESP32 dengan Laravel

- [ ] Buat endpoint API pembaruan sensor.
- [ ] Buat endpoint API heartbeat.
- [ ] Implementasikan autentikasi API key.
- [ ] Validasi identitas perangkat.
- [ ] Validasi kode slot.
- [ ] Validasi format data JSON.
- [ ] Simpan pembacaan sensor ke tabel parking_slots.
- [ ] Simpan histori pembacaan pada sensor_logs.
- [ ] Implementasikan pembaruan status fisik slot.
- [ ] Implementasikan deteksi perangkat offline berdasarkan heartbeat.
- [ ] Uji pengiriman data dari ESP32 ke Laravel.
- [ ] Uji respons API ketika data tidak valid.
- [ ] Uji respons API ketika perangkat tidak terhubung.
- [ ] Uji komunikasi untuk empat slot sekaligus.

**Catatan:** ESP32 mengirim data melalui REST API. ESP32 tidak boleh terhubung langsung ke database MySQL.

---

## 7. Pengujian Sistem

### 7.1 Pengujian Fungsional
- [ ] Uji registrasi pengguna.
- [ ] Uji login pengguna.
- [ ] Uji login admin.
- [ ] Uji pembatasan hak akses.
- [ ] Uji pemilihan slot.
- [ ] Uji pembuatan reservasi.
- [ ] Uji pencegahan double booking.
- [ ] Uji upload bukti pembayaran.
- [ ] Uji verifikasi pembayaran.
- [ ] Uji penolakan pembayaran.
- [ ] Uji konfirmasi kedatangan.
- [ ] Uji check-in.
- [ ] Uji check-out.
- [ ] Uji perhitungan pendapatan.

### 7.2 Pengujian IoT
- [ ] Uji sensor A01.
- [ ] Uji sensor A02.
- [ ] Uji sensor A03.
- [ ] Uji sensor A04.
- [ ] Uji buzzer.
- [ ] Uji komunikasi ESP32 dengan API.
- [ ] Uji kondisi Wi-Fi terputus.
- [ ] Uji perangkat offline.
- [ ] Uji pemulihan koneksi.
- [ ] Uji ketepatan deteksi kendaraan.

### 7.3 Pengujian Integrasi
- [ ] Uji perubahan status sensor pada website.
- [ ] Uji sinkronisasi data sensor.
- [ ] Uji reservasi ketika slot sedang terisi.
- [ ] Uji reservasi ketika slot telah dipesan pada waktu yang sama.
- [ ] Uji konfirmasi kedatangan dengan akun yang benar.
- [ ] Uji konfirmasi kedatangan dengan akun yang salah.
- [ ] Uji dashboard admin.
- [ ] Uji laporan pendapatan.

### 7.4 Pengujian Keamanan
- [ ] Uji proteksi halaman tanpa login.
- [ ] Uji pembatasan akses berdasarkan role.
- [ ] Uji validasi file upload.
- [ ] Uji proteksi CSRF.
- [ ] Uji validasi input.
- [ ] Uji keamanan API key.
- [ ] Uji pembatasan request API.
- [ ] Uji proteksi akses bukti pembayaran.
- [ ] Uji konfigurasi HTTPS pada server online.

---

## 8. Deployment dan Implementasi

### 8.1 Persiapan Server
- [ ] Tentukan hosting atau VPS.
- [ ] Siapkan domain.
- [ ] Siapkan database MySQL online.
- [ ] Konfigurasi PHP dan Composer pada server.
- [ ] Konfigurasi web server.
- [ ] Konfigurasi environment production.
- [ ] Konfigurasi HTTPS.
- [ ] Konfigurasi penyimpanan file privat.
- [ ] Konfigurasi backup database.

### 8.2 Deployment
- [ ] Upload kode Laravel ke server.
- [ ] Konfigurasi `.env` production.
- [ ] Jalankan migration production.
- [ ] Jalankan seeder yang diperlukan.
- [ ] Konfigurasi permission folder storage dan cache.
- [ ] Konfigurasi scheduler jika digunakan.
- [ ] Uji website melalui domain.
- [ ] Uji API ESP32 melalui internet.
- [ ] Uji koneksi ESP32 ke server online.
- [ ] Uji seluruh fitur setelah deployment.

### 8.3 Dokumentasi
- [ ] Buat dokumentasi instalasi.
- [ ] Buat dokumentasi konfigurasi database.
- [ ] Buat dokumentasi endpoint API.
- [ ] Buat dokumentasi rangkaian ESP32.
- [ ] Buat dokumentasi penggunaan admin.
- [ ] Buat dokumentasi penggunaan pengguna.
- [ ] Dokumentasikan hasil pengujian.
- [ ] Buat dokumentasi batasan sistem.

---

## 9. Kriteria Penyelesaian Proyek

Proyek dinyatakan selesai apabila:

- [ ] Pengguna dapat melakukan registrasi dan login.
- [ ] Admin dapat mengelola pengguna.
- [ ] Website menampilkan empat slot parkir.
- [ ] Sensor dapat mendeteksi perubahan kondisi setiap slot.
- [ ] ESP32 dapat mengirim data ke Laravel.
- [ ] Website menampilkan status sensor secara aktual.
- [ ] Pengguna dapat melakukan reservasi.
- [ ] Sistem mencegah double booking.
- [ ] Pengguna dapat mengunggah bukti pembayaran.
- [ ] Admin dapat memverifikasi pembayaran.
- [ ] Pengguna dapat melakukan konfirmasi kedatangan.
- [ ] Sistem dapat mencatat sesi parkir.
- [ ] Buzzer bekerja sesuai aturan sistem.
- [ ] Admin dapat melihat laporan pendapatan.
- [ ] Sistem telah melalui pengujian fungsional dan integrasi.
- [ ] Sistem dapat diakses melalui server online.
- [ ] Dokumentasi teknis telah tersedia.

---

**Catatan Pengembangan:** Kerjakan checklist secara berurutan. Jangan menandai fitur selesai hanya karena tampilan halaman sudah dibuat. Fitur harus memiliki proses backend, validasi, penyimpanan data, dan hasil pengujian yang sesuai.