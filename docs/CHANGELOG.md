# CHANGELOG — LKB-App

Semua perubahan penting pada struktur database, arsitektur, dan fitur aplikasi dicatat di dokumen ini.

---

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
- Uji Web App dan spreadsheet uji nyata belum dilakukan; M0 belum dinyatakan selesai. M1 menunggu penerimaan M0. Riwayat Git tidak ditulis ulang dan data pada Google Sheets/Drive tidak diubah.

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
