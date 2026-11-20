# CHANGELOG — LKB-App

Semua perubahan penting pada struktur database, arsitektur, dan fitur aplikasi dicatat di dokumen ini.

---

## [Unreleased] - 2026-11-20 — Implementasi M1

### Ditambahkan

- Profil dan kop laporan dengan pratinjau teks, validasi NIP, serta kontrol versi untuk mencegah penimpaan perubahan dari tab lain.
- SKP tahunan berstatus draft/aktif/arsip; butir dengan kode unik, unsur, indikator, target dan satuan; serta template dengan rentang, frekuensi, jam, jumlah, urutan, dan tanggal pengecualian.
- Pratinjau tanggal dari server sebelum menyimpan. Domain frontend dan port Apps Script diuji dengan fixture yang sama; port dihasilkan lewat `scripts/sync-domain.mjs`.
- Pengelolaan libur nasional/cuti bersama/kampus dan impor JSON per tahun yang memvalidasi seluruh isian sebelum menulis serta melewati tanggal duplikat.
- Optimistic update, rollback, toast galat, soft delete, Urungkan lima detik, penulisan batch dengan LockService, serta audit perubahan. Hapus/pulihkan butir menjaga activity lama dan status template yang sebelumnya dihapus.
- Tabel desktop dan kartu mobile, modal yang dapat digulir, tab pengaturan dengan navigasi keyboard, serta kontras tombol sekunder pada tema gelap.

### Verifikasi dan batas

- `npm run lint`, 57 tes pada 10 berkas, dan `npm run build` lulus. Tes mencakup rollback, draft SKP kedua pada tahun yang sama, dan pergantian tahun Asia/Jakarta. Uji browser lokal mencakup simpan profil palsu, impor libur, buat SKP/butir/template, pratinjau dengan libur dan pengecualian, hapus/urungkan lalu reload, aktivasi dan arsip, serta tampilan 360 px dan 1280 px.
- Pemisahan polyfill mempertahankan kompatibilitas dan menghilangkan peringatan ukuran chunk. Bundel utama sekitar 427 KB dan polyfill 256 KB minifikasi; perubahan ini tidak dinyatakan mengurangi keseluruhan unduhan atau mempercepat pemuatan tanpa pengukuran.
- Header sheet tidak berubah. Uji live M0/M1 masih terbuka; pengembangan M1 dilanjutkan atas arahan pemilik tanpa menyatakan uji live lulus. Deploy, merge, serta perubahan data Google nyata belum dijalankan. Rincian aturan dan checklist ada di `docs/m1-acceptance.md`.

## [Unreleased] - 2026-11-20 — Perbaikan fondasi M0

### Diubah

- Login memerlukan API terkonfigurasi; fallback akun demo dan profil pribadi di frontend dihapus. Beranda menampilkan profil dari server serta keadaan kosong, tanpa angka kegiatan/status koneksi rekaan.
- Halaman kerja memerlukan verifikasi sesi; token tidak valid mengalihkan ke login. Logout membersihkan token dan cache privat meskipun jaringan gagal. Query sesi dapat dibatalkan saat logout.
- ID spreadsheet hanya dibaca dari Script Properties. Setup membuat profil kosong dan tidak lagi menghapus Sheet1. `setupUser()` mewajibkan kredensial eksplisit, mendukung properti sementara dari editor, serta mencabut sesi lama saat akun diatur ulang. Tidak ada perubahan header sheet.
- Kegagalan login kelima mengembalikan `LOCKED`; durasi penguncian 15 menit. Validasi bentuk permintaan dan token diperketat, perbandingan hash token memakai constant-time, dan login/logout dicatat tanpa kredensial.
- FunButton memiliki status loading/sukses, pembatalan timer, serta tekan-tahan satu detik lewat pointer dan keyboard. Mode Ceria/Tenang/Mati disimpan lokal; reduced-motion memaksa Mati.
- Halaman demo dan komponen dokumentasi template dibersihkan; layout, navigasi, tema, dan LICENSE CoreUI tetap dipertahankan. Breadcrumb memakai router hash dan label Indonesia.
- Build produksi menyertakan CSP; favicon menggunakan base GitHub Pages. Workflow CI memeriksa lint/tes/build, dan build Pages membaca repository variable publik `VITE_API_URL`.
- `.clasp.json` dikecualikan dari Git sambil mempertahankan file lokal. Petunjuk setup dan batas pengujian dijelaskan di `docs/m0-setup.md`.

### Verifikasi dan batas

- `npm run lint`, 30 tes pada 7 berkas, dan `npm run build` lulus. Build masih memberi peringatan ukuran chunk JavaScript utama (sekitar 718 KB minifikasi, 236 KB gzip).
- Uji browser lokal pada 360 px dan 1280 px: login salah/benar, navigasi Beranda/Pengaturan, Mode Mati bertahan setelah reload, tema terang/gelap, serta logout dan penolakan akses ulang.
- Tes mencakup router/token, penyimpanan sesi, logout jaringan gagal, tombol/animasi, dan siklus autentikasi kode Apps Script dengan layanan Google simulasi.
- API lokal khusus fixture memungkinkan uji browser tanpa menghubungi Google Sheets.
- Uji Web App dan spreadsheet uji nyata belum dilakukan; M0 belum dinyatakan selesai. Status uji live M0 tetap terbuka; lihat catatan implementasi M1 di atas. Riwayat Git tidak ditulis ulang dan data pada Google Sheets/Drive tidak diubah.

## [0.1.0] - 2026-11-19 — Milestone M0: Kerangka Dasar & Autentikasi

### Ditambahkan

- **Frontend CoreUI Free React Admin:**
  - Setup React 19 + Vite dengan `base: '/LKDku/'` dan keluaran build ke `build/`.
  - Routing `HashRouter` untuk kompatibilitas penuh dengan GitHub Pages.
  - Setup token visual di `src/scss/_variables.scss` dan animasi CSS di `src/scss/_fun.scss` (warna brand `#1f5f5b`, status, chip unsur).
  - Integrasi `@tanstack/react-query`, `motion/react`, dan `canvas-confetti`.
  - Komponen dasar `FunButton` dengan dukungan micro-interaction dan varian `danger-hold` 1 detik.
  - Halaman `Login` dengan toggle lihat kata sandi, opsi "Ingat saya 14 hari", dan efek guncangan saat salah input.
  - Halaman `Beranda` dengan banner sambutan dosen, status arsitektur, dan ringkasan bulan berjalan.
- **Backend Google Apps Script (`apps-script/`):**
  - Konfigurasi `appsscript.json` (V8, zona waktu `Asia/Jakarta`).
  - `Code.gs`: Penanganan `doPost` untuk format JSON `text/plain` tanpa preflight CORS, router action, dan pembatasan token sesi.
  - `auth.gs`: Hashing password SHA-256 iteratif + salt acak + pepper di `ScriptProperties`, batas 5 kali salah kunci 15 menit, dan token sesi 256-bit.
  - `data.gs`: Operasi Google Sheets terisolasi dengan `LockService` dan pembacaan/penulisan batch.
  - `setup.gs`: Fungsi `initSheets()` untuk inisialisasi 11 tab sheet (`users`, `sessions`, `profile`, `skp_year`, `skp_item`, `skp_template`, `activity`, `holiday`, `report_month`, `audit_log`, `config`) serta pembuatan akun awal via `setupUser()`.
  - `util.gs`: Perbandingan constant-time, generator token, dan formatter JSON `{ok: true, data}`.
- **Domain Murni & Pengujian (`tests/`):**
  - `src/domain/dateId.js`: Pemformatan tanggal resmi Indonesia (`Kamis, 01/10/2026`, `Kediri, 31 Oktober 2026`, `07.00–09.30`).
  - `src/domain/crypto.js`: Algoritma constant-time string comparison.
  - 9 unit tests lulus via Vitest (auth storage, format tanggal Indonesia, constant-time compare).
- **CI/CD:**
  - Workflow `.github/workflows/pages.yml` untuk build dan deploy otomatis ke GitHub Pages saat push ke branch `main`.
