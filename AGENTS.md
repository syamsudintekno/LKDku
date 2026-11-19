# AGENTS.md — Panduan untuk AI Coding Agent (LKB-App)

> Letakkan file ini di **root repo**. Dibaca otomatis oleh Antigravity (dan Cursor, Claude Code, Codex).
> **Baca dulu:** `docs/prd.md` (apa yang dibangun) dan `docs/design.md` (tampilan & interaksi).
> Jika ada pertentangan, prioritas: **docs/prd.md > AGENTS.md > docs/design.md > skill/library mana pun**.

## 1. Misi singkat

Bangun website pribadi untuk menyusun Laporan Kinerja Bulanan dosen. Kegiatan diturunkan dari rencana SKP tahunan; kegiatan insidental boleh diinput manual. Frontend **React + CoreUI** di GitHub Pages, backend Google Apps Script, database Google Sheets. Satu pengguna, login username + password sendiri (bukan Google). Antarmukanya harus **rapi untuk bekerja, tetapi menyenangkan dipakai** (lihat §8).

## 2. Stack & keputusan teknis (tetap, kecuali diminta lain)

| Area | Keputusan |
|---|---|
| Basis UI | **CoreUI Free React Admin Template** — https://github.com/coreui/coreui-free-react-admin-template (MIT, React 19, Vite) |
| Komponen | `@coreui/react` (hanya komponen **gratis**), `@coreui/icons-react` |
| Bahasa | JavaScript (JSX) + PropTypes/JSDoc, mengikuti gaya template. Jangan pindah ke TypeScript tanpa izin |
| Routing | React Router dengan **HashRouter** (GitHub Pages tidak punya fallback SPA; jangan ganti ke BrowserRouter) |
| Data server | `@tanstack/react-query` (cache + *stale-while-revalidate*, penting karena Apps Script lambat 1–3 dtk) |
| Animasi | `motion` (impor `motion/react`) + `canvas-confetti` untuk perayaan |
| Gaya | SCSS template CoreUI; kustomisasi lewat override variabel di `src/scss/` |
| Tes | Vitest + Testing Library |
| Backend | Apps Script (V8), satu Web App, dikelola dengan **clasp** |
| DB | Satu Spreadsheet, sheet sesuai `docs/prd.md` §9 |
| PDF | Server-side: `HtmlService` template → `getAs('application/pdf')` → simpan ke Drive |
| Hosting | GitHub Pages lewat **GitHub Actions** (butuh build; bukan "push langsung") |
| Bahasa UI | Indonesia. Nama variabel/fungsi/komit: Inggris |

**Dependensi lain di luar tabel ini (mis. Redux Toolkit tambahan, Tailwind, MUI, Lottie, library ikon lain) wajib ditanyakan dulu.** Tailwind dan framework UI lain tidak boleh dicampur dengan CoreUI.

### Batasan CoreUI Free (penting)

Template gratis **tidak** memuat komponen PRO. Jangan impor atau meniru API `@coreui/*-pro` (berlisensi berbayar). Komponen yang **tidak tersedia** dan harus dibuat dengan kontrol gratis/native:

Date Picker, Date Range Picker, Time Picker, Smart Table, Smart Pagination, Loading Button, Password Input, Stepper, Multi Select, Autocomplete, Range Slider, OTP Input. Begitu pula add-on berbayar **Data Grid** dan **Scheduler**.

Solusi bawaan: `<input type="date|time">` dalam `CFormInput`; tombol *loading* = `CButton` + `CSpinner`; tampilan password = `CInputGroup` + tombol mata; tabel = `CTable`.

## 3. Memulai dari template (tugas M0)

1. Salin template ke repo ini (tanpa riwayat git-nya): `git clone --depth 1 <url template> tmp && rsync -a --exclude .git tmp/ . && rm -rf tmp`. **Pertahankan `LICENSE` CoreUI** (MIT mewajibkan pemberitahuan hak cipta tetap ada) dan tambahkan lisensi proyek ini terpisah bila perlu.
2. Baca `ARCHITECTURE.md`, `DEVELOPMENT.md`, dan `.cursorrules` bawaan template. Itu konvensi level template; AGENTS.md ini menang bila bertentangan untuk hal khusus proyek.
3. `npm install`, jalankan `npm start` (port 3000) untuk memastikan template jalan.
4. **Bersihkan halaman demo** (dashboard demo, widgets, charts, theme, buttons showcase, pages demo) tetapi pertahankan layout: sidebar, header, footer, mode terang/gelap, `_nav.jsx`, `routes.js`.
5. Atur `vite.config.mjs`: `base: '/<nama-repo>/'` (atau `'/'` bila memakai domain khusus); keluaran build tetap `build/`.
6. Tambahkan workflow `.github/workflows/pages.yml`: checkout → setup-node (LTS) → `npm ci` → `npm run build` → `actions/upload-pages-artifact` (path `build`) → `actions/deploy-pages`. Izin minimal: `pages: write`, `id-token: write`, `contents: read`.
7. Buat `config.js`/env hanya untuk `VITE_API_URL` (URL Web App; publik). **Variabel `VITE_*` tertanam di bundel klien — jangan pernah menaruh rahasia di sana.**

## 4. Struktur repo

```
/
├─ AGENTS.md
├─ docs/ (prd.md, design.md, CHANGELOG.md)
├─ .agents/skills/              # skill (lihat §9)
├─ .github/workflows/pages.yml
├─ public/ (favicon, logo-kop.png)
├─ src/
│  ├─ App.jsx  index.jsx  routes.js  _nav.jsx
│  ├─ scss/ (style.scss, _variables.scss ← override token, _fun.scss ← animasi CSS)
│  ├─ api/            # client.js (satu-satunya tempat fetch), hooks react-query
│  ├─ domain/         # logika murni: tanggal ID, generator jadwal, libur, validasi, penomoran
│  ├─ motion/         # tokens.js, variants.js, confetti.js, useMotionPref.js
│  ├─ components/
│  │  ├─ ui/          # pembungkus CoreUI: FunButton, DoneCheck, EmptyState, ProgressRing, UnsurChip, IconBadge
│  │  └─ (header, sidebar, footer bawaan template)
│  ├─ layouts/
│  └─ views/ (login, beranda, harian, laporan, skp, pengaturan)
├─ apps-script/ (appsscript.json, Code.gs, auth.gs, data.gs, skp.gs, plan.gs, activity.gs, report.gs, holiday.gs, backup.gs, util.gs, setup.gs, report.html)
└─ tests/ (fixtures/, *.test.js)
```

Logika murni di `src/domain/` **tanpa** React/DOM/Sheet agar mudah diuji. Port `.gs`-nya diuji dengan fixture yang sama (boleh memuat file `.gs` lewat `node:vm`).

## 5. Perintah

```bash
npm install
npm start                 # dev server, http://localhost:3000
npm run build             # keluaran ke build/
npm run lint              # ESLint (konfigurasi template)
npx vitest run            # tes

# Apps Script
npm i -g @google/clasp && clasp login
clasp push                # unggah apps-script/
clasp deploy -d "vX.Y.Z"  # Web App baru (pemilik yang menjalankan, bukan agen)
```

Sebelum menyatakan selesai: `npm run lint`, `npx vitest run`, `npm run build`, lalu buka aplikasi dan coba alur yang diubah.

## 6. Aturan keamanan (wajib)

1. **Jangan commit:** ID spreadsheet, pepper, password, token, NIP asli, data kegiatan nyata. Repo publik. Fixture memakai data palsu.
2. ID spreadsheet dan pepper hanya di `PropertiesService.getScriptProperties()`.
3. Password: **hash + salt + pepper** (SHA-256 iteratif, `Utilities.computeDigest`), perbandingan *constant-time*. Jangan menyebutnya "enkripsi"; jangan membuat skema yang bisa didekripsi.
4. Semua action selain `auth.login` memvalidasi token di server (hash tersimpan, cek kedaluwarsa).
5. **Dilarang `dangerouslySetInnerHTML`** dan `innerHTML` dengan data dinamis. Biarkan JSX meng-escape.
6. Token sesi di `sessionStorage` (atau `localStorage` hanya bila "ingat saya"). Jangan log token/password.
7. Web App *Execute as me / Anyone*; jangan mengandalkan `Session.getActiveUser()`.
8. Validasi bisnis **di server**; validasi klien hanya kenyamanan.
9. Dependensi baru: periksa pemeliharaan dan lisensi, kunci versi di `package-lock.json`, hindari paket yang baru dirilis dalam ~14 hari terakhir. Jangan jalankan skrip `postinstall` pihak ketiga yang tidak dikenal.

## 7. Konvensi kode

- Komponen fungsional + hooks; satu komponen satu tanggung jawab; PropTypes pada setiap komponen publik.
- Akses data hanya lewat `src/api/` (hook react-query); komponen tidak memanggil `fetch` langsung.
- Mutasi memakai *optimistic update* dengan rollback + toast galat (`CToast`).
- Apps Script: satu action = satu fungsi `handle_<ns>_<nama>(payload, ctx)`; baca/tulis Sheet **batch**; tulis dibungkus `LockService`.
- Tanggal disimpan sebagai string ISO `yyyy-MM-dd`; zona waktu `Asia/Jakarta`. Format Indonesia dipusatkan di `src/domain/dateId.js`: `Kamis, 01/10/2026`, `Kediri, 31 Oktober 2026`, `07.00–09.30`.
- Respons API: `{ok, data}` atau `{ok:false, error:{code,message}}` (`docs/prd.md` §10).
- Jangan ubah header kolom Sheet tanpa skrip migrasi + catatan di `docs/CHANGELOG.md`.
- Komit kecil, Conventional Commits.

## 8. UI yang menyenangkan (animasi, tombol, ikon)

Tujuan: aplikasi terasa hidup dan memberi hadiah kecil saat pekerjaan selesai, **tanpa mengganggu kecepatan dan keterbacaan data**. Detail visual ada di `docs/design.md` §10; ringkasan aturan untuk agen:

**Prinsip**
1. Gerak harus *bermakna*: memberi umpan balik, menunjukkan hubungan, atau merayakan pencapaian. Jangan menganimasikan semuanya.
2. Satu momen "wow" per layar, sisanya halus. Hindari kelelahan animasi.
3. Respons input < 100 ms. Animasi tidak pernah memblokir klik atau ketikan.
4. Hormati `prefers-reduced-motion` **tanpa pengecualian**; sediakan pengaturan "Mode animasi": Ceria (default) / Tenang / Mati.
5. Hanya animasikan `transform` dan `opacity`; jangan `width/height/top/left` (kecuali lewat `layout` milik `motion`).
6. Jangan ada kedipan, getaran berulang, atau suara.

**Token gerak** (`src/motion/tokens.js`) — wajib dipakai, tanpa angka ajaib:

```js
export const DUR = { instant: 0.1, fast: 0.18, base: 0.28, slow: 0.45 }; // detik
export const SPRING = {
  snappy: { type: 'spring', stiffness: 520, damping: 32 },
  bouncy: { type: 'spring', stiffness: 380, damping: 18 },
};
export const EASE = [0.22, 1, 0.36, 1];
export const PRESS = { scale: 0.96 };
export const HOVER_LIFT = { y: -2, scale: 1.02 };
```

**Katalog interaksi minimum**

| Momen | Efek |
|---|---|
| Tombol (semua) | hover: naik 2 px + bayangan; tekan: skala 0.96; fokus: cincin jelas |
| Tombol simpan | status `idle → loading (spinner) → sukses (ikon centang menggambar sendiri) → idle` |
| Centang "terealisasi" | lingkaran terisi + garis centang digambar (≈ 250 ms) + pantulan kecil; baris menjadi hijau lembut |
| Daftar/kartu muncul | masuk berurutan (*stagger* 40 ms, geser 8 px + fade) |
| Pindah halaman | fade + geser tipis 12 px (≤ 250 ms) |
| Progres SKP | bar/cincin terisi dengan *spring*; angka menghitung naik |
| Kegiatan insidental | badge oranye berayun sekali saat muncul |
| Salah login / validasi gagal | guncangan horizontal singkat sekali + pesan jelas |
| Modal / bottom sheet | skala 0.96→1 + fade (desktop), geser naik (ponsel) |
| Hapus / batalkan | item mengecil dan menghilang, dengan opsi "Urungkan" 5 detik |
| Hari terakhir bulan terisi, target SKP 100%, finalisasi LKB | **konfeti** (`canvas-confetti`, ≤ 1.5 dtk, sekali) + pesan ceria |
| Keadaan kosong | ilustrasi ikon besar yang bergoyang halus + ajakan tindakan |
| Aksi destruktif/kunci (finalisasi, buka kembali) | tombol **tekan-tahan 1 detik** dengan cincin progres |

**Tombol & ikon**
- Gunakan `CButton` CoreUI dibungkus `FunButton` (varian: `primary`, `success`, `ghost`, `danger-hold`). Semua tombol utama punya ikon di kiri.
- Ikon utama: `@coreui/icons-react` (set gratis, `cil*`). Jangan campur set ikon lain tanpa izin. Pasangan ikon ↔ aksi dibakukan di `components/ui/icons.js` (mis. selesai = `cilCheckCircle`, insidental = `cilBolt`, SKP = `cilTask`, laporan = `cilDescription`, libur = `cilSun`).
- Ikon bergerak dibuat dengan `motion` (SVG path) atau CSS, bukan GIF/video. Ikon dekoratif `aria-hidden`; ikon yang membawa makna diberi `aria-label`.
- Teks ceria (microcopy) boleh: "Mantap, 4 kegiatan hari ini beres!" Nada hangat, singkat, tidak kekanak-kanakan, tidak menyalahkan.

**Anggaran kinerja:** animasi tetap 60 fps di ponsel menengah; bundel animasi tambahan ≤ ~60 KB gzip (impor `motion` secara spesifik, *lazy-load* konfeti); tidak ada animasi yang berjalan tak terbatas di luar ikon keadaan kosong.

**Aksesibilitas:** kontras AA; status tidak hanya dengan warna; fokus terlihat; konfeti tidak mengambil fokus dan diumumkan lewat `aria-live` secara teks.

## 9. Skill yang digunakan

Antigravity membaca skill dari `.agents/skills/` (folder `.agent/skills/` versi lama masih bekerja). Skill adalah **instruksi yang akan diikuti agen**, jadi pemilik wajib membaca `SKILL.md`-nya sebelum memasangnya, dan agen **tidak boleh memasang skill atau menjalankan perintah instalasi sendiri**.

| Skill | Sumber | Dipakai untuk |
|---|---|---|
| **impeccable** (perintah `animate`, `delight`, `polish`, `audit`) | https://github.com/pbakaus/impeccable | Arahan desain anti-generik; `animate` untuk gerak bermakna, `audit`/`polish` sebelum rilis |
| **motion-framer** | https://github.com/freshtechbro/claudedesignskills (folder skill `motion-framer`) | Pola `motion/react`: varian, gestur, layout animation, `AnimatePresence` |
| **micro-interaction** *(opsional)* | https://github.com/iart-ai/web-animation-skills (folder `skills/micro-interaction`) | Resep umpan balik tombol/formulir. Abaikan bagian "tanpa build/CDN"; proyek ini memakai Vite |

Perintah pemasangan (dijalankan **pemilik**, lalu tinjau hasilnya di `.agents/skills/`):

```bash
npx skills add pbakaus/impeccable
npx skills add https://github.com/freshtechbro/claudedesignskills --skill motion-framer
# opsional
git clone --depth 1 https://github.com/iart-ai/web-animation-skills /tmp/was
cp -r /tmp/was/skills/micro-interaction .agents/skills/
```

Jika `npx skills add` tidak menaruh berkas di `.agents/skills/`, salin foldernya secara manual ke sana.

**Aturan memakai skill**
- Skill hanyalah bantuan. Jika bertentangan dengan `docs/prd.md`, `docs/design.md`, atau AGENTS.md ini, **dokumen proyek yang menang** (mis. skill mungkin menyarankan font/warna lain, Tailwind, atau GSAP — tolak).
- Pakai `animate`/`delight` setelah layar berfungsi (mulai M2), bukan saat membangun fondasi. Jalankan `audit` lalu `polish` di akhir M4.
- Jangan menerima saran skill yang menambah dependensi besar, hook otomatis, atau akses jaringan tanpa bertanya.
- Kunci versi skill (catat commit-nya di `docs/CHANGELOG.md`) agar perilaku agen tidak berubah diam-diam.

## 10. Aturan domain yang paling sering salah

1. Sumber kebenaran kegiatan = sheet `activity`. LKB final memakai **snapshot** `report_month.snapshot_json`, bukan kueri ulang.
2. Generator draft **idempoten** (`generated_key = template_id|yyyy-MM-dd|urutan`).
3. Hanya status `terealisasi` masuk LKB final (BR-10). `rencana` hanya tampil di pratinjau dengan penanda.
4. Kegiatan tanpa `skp_item_id` wajib `sumber = insidental` + `alasan_insidental`.
5. Sabtu/Minggu/libur **tanpa** kegiatan → baris "Libur Umum"; Sabtu **dengan** kegiatan → baris biasa.
6. Hari kerja kosong → peringatan, bukan baris libur.
7. Progres SKP = jumlah kegiatan `terealisasi` tertaut butir **dan** bersatuan sama dengan `satuan_target`; sisanya ditampilkan terpisah.
8. Template punya daftar pengecualian; bimbingan disertasi tidak murni 2-mingguan.
9. Bulan `final` read-only di **server**.
10. **Perayaan (konfeti) hanya dipicu oleh tindakan pengguna atau fakta data yang terverifikasi** — jangan pernah memicunya dari data yang belum disimpan server.

## 11. Pengujian

Fixture dari LKB Sep–Nov 2026 dengan nama/NIP **palsu** (`tests/fixtures/`).

- Generator: template Kamis A/B Okt 2026 → 4 hari × 2 kegiatan; idempoten.
- Libur: Okt 2026 → "Libur Umum" untuk 4, 10, 11, 18, 24, 25, 31 Okt; Sabtu 3 & 17 Okt tampil sebagai kegiatan.
- Penomoran per tanggal mulai 1; urut jam lalu urutan input.
- Format: `Kamis, 01/10/2026`; `31 Oktober 2026`.
- Validasi: tanpa SKP & tanpa alasan → error; bentrok jam → peringatan; bulan final → `FORBIDDEN_STATE`.
- Auth: token salah/kedaluwarsa → `UNAUTHENTICATED`; 5 gagal → `LOCKED`.
- UI (Testing Library): `FunButton` menampilkan status loading→sukses; centang terealisasi memanggil mutasi dan memutar balik bila gagal; mode "Mati" menonaktifkan animasi.
- **Uji fidelitas PDF (manual):** bandingkan dengan `LKB_..._okt.pdf` (kop, kolom, warna header, baris libur, tanda tangan, pemisah halaman).

## 12. Definition of Done

- [ ] Sesuai FR/BR yang dirujuk di `docs/prd.md`.
- [ ] Validasi server + pesan error Indonesia yang jelas.
- [ ] Tes relevan lulus; `npm run lint` dan `npm run build` bersih.
- [ ] Tidak ada rahasia/data pribadi di diff; tidak ada komponen CoreUI PRO.
- [ ] Sesuai `docs/design.md` di 360 px dan desktop; keadaan *loading/kosong/error* ada.
- [ ] Animasi memakai token gerak, menghormati reduced-motion dan "Mode animasi".
- [ ] `docs/CHANGELOG.md` diperbarui bila skema/perilaku/skill berubah.

## 13. Urutan kerja

Ikuti M0 → M4 (`docs/prd.md` §13), satu milestone sampai tuntas dan teruji. Mulai dengan **mode Planning**: buat rencana implementasi dan tunggu persetujuan pemilik sebelum menulis kode.

- **M0:** template + pembersihan demo + Pages workflow + `initSheets()` + `setupUser()` + login + token + `FunButton` dasar.
- **M1:** profil, SKP + template, hari libur.
- **M2:** generator draft, pencatatan harian, insidental, centang animasi.
- **M3:** validasi, pratinjau, PDF, finalisasi (tekan-tahan + konfeti).
- **M4:** dashboard capaian (progres animasi), cadangan, mobile, `audit` + `polish`.

## 14. Kapan harus bertanya ke pemilik

- Mengubah struktur butir SKP atau kolom `skp_item`.
- Mengubah format PDF (kolom, teks baku, penomoran).
- Menambah dependensi di luar §2, mengganti library UI/ikon, atau mengubah mekanisme login.
- Menyimpan data di luar Google Sheets/Drive; menghapus data permanen (default: *soft delete*).
- Memasang skill, hook, atau menjalankan deploy.
- Aturan yang tampak bertentangan dengan contoh LKB.

Hal kecil dan reversibel: ambil keputusan terbaik dan catat sebagai asumsi di deskripsi komit/PR.

## 15. Yang tidak boleh dilakukan

- Menandai kegiatan `terealisasi` otomatis tanpa tindakan pengguna.
- Mengarang isi kegiatan, angka, atau tanggal.
- Menyentuh data nyata saat pengembangan (pakai spreadsheet uji terpisah).
- Menambahkan telemetri/analitik pihak ketiga, atau memuat skrip dari CDN tak dipatok versinya.
- Memakai komponen/paket CoreUI PRO, `eval`, `new Function`, atau `dangerouslySetInnerHTML`.
- Menjadikan animasi sebagai alasan memperlambat alur pencatatan harian.
