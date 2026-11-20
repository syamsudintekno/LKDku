# LKDku — Laporan Kinerja Bulanan Dosen

Aplikasi pribadi berbasis React + CoreUI Free, Google Apps Script, dan Google Sheets. Frontend menggunakan HashRouter dan dibangun ke `build/` untuk GitHub Pages.

Fondasi M0 telah diperbaiki dan diuji dengan layanan Google simulasi. Uji penerimaan pada Web App dan spreadsheet uji milik pemilik masih diperlukan sebelum M0 dinyatakan selesai dan pekerjaan M1 dimulai.

## Menjalankan frontend

Gunakan Node.js 22 dengan npm. Dependensi sudah dikunci di `package-lock.json`.

```sh
npm ci
npm start
npm run lint
npm test
npm run build
```

Salin `.env.example` ke `.env.local`, kemudian isi `VITE_API_URL` dengan URL Web App pengujian. URL ini bersifat publik. Jangan menaruh password, token, pepper, ID spreadsheet, atau data pribadi dalam variabel `VITE_*`.

Tanpa URL API, aplikasi menampilkan pesan konfigurasi dan tombol Masuk tidak aktif. Tidak ada akun demo atau login offline dalam aplikasi.

## Menyiapkan backend

Ikuti [panduan setup dan penerimaan M0](docs/m0-setup.md). Jangan memakai spreadsheet produksi untuk pengembangan. File `.clasp.json` adalah konfigurasi lokal; ikatan proyek milik pengguna tidak dikirim ke GitHub.

## GitHub

Workflow CI memeriksa lint, tes, dan build pada pull request serta branch `codex/**`. Workflow Pages pada `main` memeriksa hal yang sama sebelum deploy. Isi repository variable `VITE_API_URL` dengan URL Web App yang ingin digunakan pada build Pages. Perubahan variabel memerlukan build ulang.

Deploy Apps Script dijalankan pemilik. Penggabungan ke `main` memicu deploy Pages, sehingga perubahan disiapkan pada branch terpisah untuk ditinjau terlebih dahulu.

## Pengujian browser dengan data palsu

API pengujian lokal menjalankan kode `.gs` melalui `node:vm` dengan Spreadsheet, Properties, Lock, dan Utilities simulasi. API ini hanya mendengarkan `127.0.0.1:3001`, tidak membuka file Google atau menulis data nyata, dan tidak diimpor frontend.

Terminal pertama:

```sh
node tests/fixtures/serveApi.mjs
```

Terminal PowerShell kedua:

```powershell
$env:VITE_API_URL = 'http://127.0.0.1:3001'
npm start -- --host 127.0.0.1 --port 3002 --strictPort
```

Buka `http://127.0.0.1:3002/LKDku/`. Akun palsu khusus pengujian: username `test-user`, password `test-only-password`. Seluruh data hilang saat server API dihentikan. Kredensial ini hanya ada di fixture pengujian, bukan login aplikasi produksi.

## Dokumen proyek dan lisensi

- [PRD](docs/prd.md), [desain](docs/design.md), [changelog](docs/CHANGELOG.md).
- Basis aplikasi: CoreUI Free React Admin Template. Pemberitahuan hak cipta dan lisensi MIT tetap tersedia di [LICENSE](LICENSE).
