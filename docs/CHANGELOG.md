# CHANGELOG — LKB-App

Semua perubahan penting pada struktur database, arsitektur, dan fitur aplikasi dicatat di dokumen ini.

---

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
