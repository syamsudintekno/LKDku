# PRD — Aplikasi Laporan Kinerja Bulanan Dosen (LKB-App)

Versi 1.0 · 19 November 2026 · Pemilik produk & satu-satunya pengguna: Ahmad Syamsudin, M.Kom.

---

## 1. Ringkasan

LKB-App adalah website pribadi untuk menyusun **Laporan Kinerja Bulanan (LKB)** dosen UIN Syekh Wasil Kediri. Prinsip utamanya: **kegiatan harian diturunkan dari rencana SKP tahunan**, bukan diketik ulang setiap bulan. Kegiatan insidental yang belum tercakup di SKP tetap bisa diinput manual dan ditandai sebagai "insidental".

Keluaran akhirnya adalah PDF LKB dengan format yang sama seperti contoh (Sep, Okt, Nov 2026): kop kementerian, identitas pegawai, tabel kegiatan per hari, baris "Libur Umum", dan blok tanda tangan.

| Komponen | Pilihan |
|---|---|
| Frontend | React 19 + Vite (basis CoreUI Free React Admin Template), di-build dan dipublikasikan ke GitHub Pages (`*.github.io`) |
| Backend / API | Google Apps Script Web App (di Google Drive) |
| Database | Google Spreadsheet (1 file, banyak sheet) |
| Autentikasi | Username + password (hash di Sheet), token sesi buatan sendiri; **tanpa Google login** |
| PDF | Dibuat di Apps Script dari template HTML, disimpan ke folder Drive |

## 2. Latar belakang & masalah

Dari tiga LKB yang ada (Sep–Nov 2026) terlihat pola kerja yang sangat berulang: jadwal mengajar mingguan, bimbingan proposal tiap Selasa, evaluasi dan rencana tiap Jumat, bimbingan disertasi hari Sabtu, serta satu hari fleksibel (Rabu) untuk penelitian atau penulisan buku. Masalah saat ini:

1. Menyusun LKB bulanan berarti mengetik ulang kegiatan yang hampir sama.
2. Tidak ada keterkaitan eksplisit antara kegiatan harian dan rencana SKP, sehingga capaian terhadap target SKP sulit dilihat.
3. Hari libur, urutan tanggal, dan penomoran dibuat manual dan rawan salah.
4. Kegiatan insidental (mis. revisi paper, laporan DIPA) tercampur tanpa penanda.

## 3. Tujuan, non-tujuan, metrik

**Tujuan**
- G1. Input SKP tahunan sekali, lalu LKB bulanan terbentuk otomatis sebagai draft.
- G2. Setiap kegiatan terhubung ke butir SKP, atau ditandai insidental secara sadar.
- G3. PDF LKB identik formatnya dengan contoh, siap ditandatangani.
- G4. Melihat capaian terhadap target SKP kapan saja.

**Non-tujuan (v1)**
- Multi-user, peran, atau persetujuan berjenjang oleh atasan di dalam aplikasi.
- Integrasi langsung dengan e-Kinerja BKN / SISTER / BKD.
- Tanda tangan elektronik tersertifikasi.
- Login Google / OAuth.

**Metrik sukses**
- Menyusun LKB satu bulan ≤ 15 menit (target saat ini: dikerjakan manual per bulan).
- ≥ 90% baris LKB berasal dari template SKP (bukan input manual).
- 0 pelanggaran aturan format (tanggal urut, libur, satuan) pada PDF final.

## 4. Pengguna

Satu pengguna (dosen). Perangkat utama: laptop untuk penyusunan SKP dan laporan; **ponsel untuk mencatat cepat** saat kegiatan selesai. Bahasa antarmuka: Indonesia.

## 5. Konsep domain

| Istilah | Arti dalam aplikasi |
|---|---|
| **SKP** | Rencana Sasaran Kinerja Pegawai untuk satu tahun (`skp_year`). |
| **Butir SKP** | Satu rencana hasil kerja beserta indikator, target tahunan, dan satuan (`skp_item`). |
| **Template kegiatan** | Pola kegiatan berulang di bawah butir SKP, mis. "Mengajar Aplikasi Komputer Kelas A, Kamis 07.00–09.30" (`skp_template`). |
| **Kegiatan** | Satu baris pada LKB: tanggal, deskripsi, unsur, jumlah, satuan (`activity`). |
| **Unsur** | Pendidikan · Penelitian · Pengabdian · Penunjang. |
| **Status kegiatan** | `rencana` → `terealisasi` (atau `dibatalkan`). |
| **Insidental** | Kegiatan tanpa butir SKP; wajib diberi alasan singkat. |
| **LKB** | Laporan bulanan, status `draft` atau `final` (terkunci). |

### Alur utama

```
Awal tahun: input SKP (butir + template)
        │
Awal bulan: "Buat draft bulan ini"  → kegiatan status = rencana (dari template, melewati hari libur)
        │
Harian/mingguan: tandai terealisasi, ubah deskripsi bila perlu, tambah kegiatan insidental
        │
Akhir bulan: periksa validasi → pratinjau → finalisasi → ekspor PDF → cetak & tanda tangan
```

## 6. Ruang lingkup

**MVP (v1.0):** login, profil pegawai, SKP tahunan + template, generator draft bulanan, pencatatan harian, kegiatan insidental, hari libur, pratinjau & PDF, finalisasi/penguncian, dashboard capaian dasar.

**v1.1:** duplikasi SKP dari tahun lalu, impor/ekspor CSV, pemetaan insidental ke SKP, unggah tanda tangan & stempel (opsional), pengingat penutupan bulan.

**Nanti:** Excel export, lampiran bukti per kegiatan, rekap triwulan/tahunan, PWA offline.

## 7. Kebutuhan fungsional

### FR-01 Autentikasi
- Form login username + password. Tidak ada registrasi publik.
- Akun dibuat lewat fungsi `setupUser()` yang dijalankan manual di editor Apps Script (password tidak pernah tersimpan polos).
- Sesi berbasis token acak, kedaluwarsa 12 jam (opsi "ingat saya" 14 hari). Logout menghapus token di server.
- Setelah 5 kali gagal berturut-turut, akun terkunci 15 menit.
- Ganti password dari menu Pengaturan.

**Kriteria penerimaan:** semua endpoint selain `auth.login` menolak permintaan tanpa token valid dengan kode `UNAUTHENTICATED`.

### FR-02 Profil & pengaturan laporan
Menyimpan: nama + gelar, NIP, jabatan/pangkat, unit kerja, satuan kerja, teks kop (3 baris + alamat/telepon), kota penandatanganan, nama/NIP/jabatan pejabat yang mengetahui (Dekan), dan folder Drive untuk PDF. Semua nilai ini muncul otomatis di PDF.

### FR-03 Manajemen SKP tahunan
- Buat SKP per tahun (`draft` → `aktif` → `arsip`); hanya satu SKP aktif per tahun.
- Butir SKP: kode, unsur, rencana hasil kerja, indikator, target tahunan, satuan, catatan.
- Template kegiatan di bawah butir: deskripsi baku, hari dalam pekan, frekuensi (`mingguan`, `2-mingguan`, `bulanan`, `sekali`), tanggal mulai/akhir, jam mulai–selesai (opsional), jumlah, satuan, daftar pengecualian tanggal.
- Satu butir boleh punya banyak template (mis. Kelas A dan Kelas B).
- Butir/template dihapus secara *soft delete*; kegiatan lama tetap utuh.
- Perubahan SKP di tengah tahun dicatat di audit log (SKP perubahan sering terjadi).

**Kriteria penerimaan:** menyimpan template tanpa butir SKP ditolak; dapat melihat pratinjau tanggal yang dihasilkan template untuk bulan terpilih sebelum disimpan.

### FR-04 Generator draft bulanan
- Tombol "Buat draft bulan ini" membuat kegiatan berstatus `rencana` dari semua template aktif.
- Melewati Sabtu/Minggu (kecuali template berhari Sabtu), hari libur, dan tanggal pengecualian.
- **Idempoten:** dijalankan dua kali tidak menggandakan kegiatan (kunci unik `template_id + tanggal + urutan`).
- Ada mode *dry run* yang menampilkan hasil sebelum disimpan.
- Kegiatan hasil generator bisa diedit tanpa memutus tautan ke butir SKP.

### FR-05 Pencatatan harian
- Tampilan harian dan kalender bulanan; ringkasan jumlah kegiatan per hari.
- Aksi cepat: **Tandai terealisasi** (satuan dan massal per hari/pekan), **Batalkan**, **Ubah**, **Pindah tanggal**.
- Tambah kegiatan manual dengan dua jalur yang dipilih eksplisit:
  1. **Dari SKP** — pilih butir SKP (dan opsional template); unsur dan satuan terisi otomatis.
  2. **Insidental** — unsur dipilih manual, isi alasan singkat; ditandai badge "Insidental".
- Deteksi bentrok jam pada tanggal yang sama (peringatan, bukan blokir).

### FR-06 Capaian & dashboard
- Per butir SKP: realisasi vs target tahunan (dalam satuan target), progres bulanan.
- Ringkasan per unsur per bulan, termasuk **rasio kegiatan insidental**.
- Peringatan jika suatu unsur bernilai 0 pada bulan berjalan (lihat catatan Pengabdian di §14).
- Daftar insidental yang belum dipetakan, dengan aksi "Petakan ke butir SKP" atau "Usulkan masuk SKP perubahan".

### FR-07 Pemeriksaan sebelum finalisasi
Validasi otomatis (lihat BR-xx). Hasil dibagi: **Error** (menghalangi finalisasi) dan **Peringatan** (boleh lanjut dengan konfirmasi).

### FR-08 Pratinjau, finalisasi, PDF
- Pratinjau HTML identik dengan PDF.
- Finalisasi mengunci semua kegiatan bulan tersebut dan menyimpan *snapshot* baris laporan. Pembukaan kembali (`reopen`) dicatat di audit log.
- PDF dibuat di Apps Script, disimpan di folder Drive (`LKB/{tahun}/LKB_{Nama}_{tahun}_{bln}.pdf`), dan tautannya dikembalikan ke aplikasi. Nama file mengikuti pola contoh: `LKB_Ahmad_Syamsudin_2026_okt.pdf`.
- Tanggal tanda tangan default = hari terakhir bulan (sesuai contoh: 30 Sep, 31 Okt, 30 Nov), dapat diubah.

### FR-09 Hari libur
Daftar libur nasional, cuti bersama, dan libur kampus yang dapat diedit; ada impor sekali jalan per tahun. Sabtu dan Minggu dianggap libur otomatis.

### FR-10 Cadangan data
Ekspor seluruh data ke JSON dan per sheet ke CSV; impor JSON untuk pemulihan.

## 8. Aturan bisnis (diturunkan dari contoh LKB)

| ID | Aturan |
|---|---|
| BR-01 | Tabel memuat **setiap tanggal** dalam bulan, urut naik. |
| BR-02 | Tanggal dengan kegiatan → baris kegiatan, penomoran `No.` mulai dari 1 per tanggal. |
| BR-03 | Sabtu, Minggu, atau hari libur **tanpa kegiatan** → satu baris abu-abu: `Hari, dd/MM/yyyy — Libur Umum`. Sabtu **dengan** kegiatan (mis. bimbingan disertasi) tampil sebagai baris biasa. |
| BR-04 | Hari kerja tanpa kegiatan → **Peringatan** "hari kerja kosong" dan baris tidak ditampilkan (bukan Libur). |
| BR-05 | Format tanggal tabel: `Kamis, 01/10/2026`; tanggal tanda tangan: `Kediri, 31 Oktober 2026`; nama hari dan bulan berbahasa Indonesia. |
| BR-06 | Jam ditulis `07.00–09.30` (titik, en dash) dan menempel pada deskripsi: `... Kelas A pukul 07.00–09.30`. |
| BR-07 | Kolom Unsur ∈ {Pendidikan, Penelitian, Pengabdian, Penunjang}. Satuan ∈ {Kelas, Kegiatan, Draft, Modul, Laporan} (daftar dapat ditambah di pengaturan). |
| BR-08 | Jumlah berupa angka > 0; pada contoh semua bernilai 1. |
| BR-09 | Urutan dalam satu tanggal: jam mulai, lalu urutan input. |
| BR-10 | **Hanya kegiatan berstatus `terealisasi` yang masuk LKB final.** Draft/pratinjau boleh menampilkan `rencana` dengan penanda khusus. |
| BR-11 | Kegiatan tanpa butir SKP wajib bertanda insidental dan beralasan. |
| BR-12 | Setelah final, kegiatan bulan itu read-only sampai `reopen`. |
| BR-13 | Pernyataan penutup tetap: "Demikian laporan kinerja bulanan ini dibuat berdasarkan yang sebenarnya." |

## 9. Model data (Google Sheets)

Semua sheet punya `id` (UUID), `created_at`, `updated_at`, `deleted` (0/1). Baris pertama = header. Header tidak boleh diubah manual; akses lewat Apps Script.

| Sheet | Kolom utama |
|---|---|
| `users` | username, password_hash, salt, iterations, failed_count, locked_until, last_login |
| `sessions` | token_hash, user_id, expires_at, remember |
| `profile` | key, value (nama, nip, jabatan, unit_kerja, satuan_kerja, kop_1..3, alamat_kop, kota_ttd, atasan_nama, atasan_nip, atasan_jabatan, folder_pdf_id) |
| `skp_year` | tahun, status, catatan |
| `skp_item` | skp_year_id, kode, unsur, rencana_hasil_kerja, indikator, target_tahunan, satuan_target, catatan, aktif |
| `skp_template` | skp_item_id, deskripsi, hari (1–7), frekuensi, tgl_mulai, tgl_akhir, jam_mulai, jam_selesai, jumlah, satuan, pengecualian (JSON), urutan |
| `activity` | tanggal, deskripsi, unsur, jumlah, satuan, jam_mulai, jam_selesai, skp_item_id, template_id, generated_key, sumber (`skp`/`insidental`), alasan_insidental, status, bukti_url, catatan |
| `holiday` | tanggal, keterangan, jenis |
| `report_month` | tahun, bulan, status, tanggal_ttd, pdf_file_id, pdf_url, snapshot_json, finalized_at |
| `audit_log` | waktu, aksi, entitas, entitas_id, ringkasan |
| `config` | key, value (daftar unsur, satuan, label libur) |

## 10. Arsitektur & kontrak API

```
Browser (github.io) ──HTTPS POST (text/plain, JSON)──▶ Apps Script Web App ──▶ Spreadsheet + Drive
```

- Deploy Web App sebagai *Execute as: Me*, *Access: Anyone* (perlu karena tidak memakai login Google). Karena itu **semua** perlindungan ada di lapisan token aplikasi.
- Permintaan memakai `Content-Type: text/plain;charset=utf-8` berisi JSON agar tidak memicu preflight CORS.
- Format: `{ "action": "activity.upsert", "token": "...", "payload": {...}, "requestId": "uuid" }` → `{ "ok": true, "data": {...} }` atau `{ "ok": false, "error": { "code": "...", "message": "..." } }`.
- Kode error baku: `UNAUTHENTICATED`, `LOCKED`, `VALIDATION`, `CONFLICT` (versi `updated_at` berbeda), `FORBIDDEN_STATE` (mis. bulan final), `NOT_FOUND`, `INTERNAL`.
- Penulisan memakai `LockService` agar aman dari tulis ganda; `requestId` menjaga idempotensi.

**Aksi:** `auth.login/logout/me/changePassword` · `bootstrap` · `profile.get/update` · `skp.year.*` · `skp.item.*` · `skp.template.*` · `plan.generate` · `activity.list/upsert/bulkStatus/delete` · `holiday.*` · `report.preview/validate/finalize/reopen/exportPdf` · `dashboard.summary` · `backup.export/import`.

`bootstrap` mengembalikan profil, SKP aktif, hari libur tahun berjalan, dan konfigurasi dalam **satu panggilan** karena latensi Apps Script 1–3 detik per request.

## 11. Keamanan

1. **Password di-hash, bukan dienkripsi.** Enkripsi dua arah berarti password bisa dipulihkan; untuk login yang benar adalah hash + salt. Implementasi: SHA-256 iteratif dengan salt acak per pengguna dan *pepper* di `PropertiesService` (bukan di Sheet). Apps Script tidak punya bcrypt/argon2; jumlah iterasi disetel agar login ≤ 2 detik.
2. Token sesi acak 256-bit; hanya hash-nya disimpan. Token di `sessionStorage` (atau `localStorage` bila "ingat saya").
3. Pembatasan percobaan login dan penguncian akun (FR-01).
4. Repo GitHub Pages **publik**: jangan commit ID spreadsheet, pepper, atau data pribadi. URL Web App boleh ada di `config.js` karena memang publik.
5. Semua keluaran ke DOM memakai `textContent` / escaping; tidak ada `innerHTML` dengan data pengguna. CSP via `<meta>`.
6. Data pribadi (NIP, jabatan) hanya hidup di Sheet dan PDF di Drive pribadi.
7. Audit log untuk login, finalisasi, reopen, dan perubahan SKP.

## 12. Kebutuhan non-fungsional

- Kuota Apps Script: cukup untuk satu pengguna; tetap gunakan pembacaan/penulisan batch (`getValues`/`setValues`).
- Pembacaan awal ≤ 3 detik; aksi simpan terasa instan lewat *optimistic UI* dengan rollback bila gagal.
- Responsif dari 360 px; dapat dipakai satu tangan di ponsel.
- Aksesibilitas: kontras WCAG AA, navigasi keyboard, label form.
- Cache data referensi (SKP, libur) di `localStorage` dengan penanda versi; data kegiatan selalu dari server.
- Build dengan Vite; deploy otomatis lewat GitHub Actions ke GitHub Pages setiap push ke `main`. Hanya komponen CoreUI gratis yang dipakai.

## 13. Milestone

| M | Isi | Selesai bila |
|---|---|---|
| M0 | Kerangka repo, Apps Script, `setupUser`, login, token | Login/logout berfungsi end-to-end |
| M1 | Profil, SKP + template, hari libur | Bisa menyusun SKP 2026 lengkap |
| M2 | Generator draft, pencatatan harian, insidental | Draft Nov 2026 dihasilkan dari template |
| M3 | Validasi, pratinjau, PDF, finalisasi | PDF Okt 2026 identik dengan contoh |
| M4 | Dashboard capaian, cadangan, penyempurnaan mobile | Semua FR MVP lulus uji penerimaan |

## 14. Asumsi & pertanyaan terbuka

Asumsi berikut dipakai sampai dikonfirmasi; semuanya mudah diubah.

1. **Struktur SKP.** Diasumsikan: butir = rencana hasil kerja + indikator + target tahunan + satuan. Jika SKP Anda memakai format lain (mis. kolom perspektif, atau butir yang ditautkan ke SKP atasan), `skp_item` perlu disesuaikan.
2. **Pengabdian kepada Masyarakat.** Ketiga LKB contoh tidak memuat satu pun kegiatan Pengabdian (hanya Pendidikan, Penelitian, Penunjang). Aplikasi menyediakan unsur ini dan menampilkan peringatan bila kosong; mohon pastikan apakah SKP Anda memang tidak menargetkannya.
3. **LKB November.** File contoh November sudah memuat kegiatan bertanggal 20–30 Nov, padahal belum berlalu. Aplikasi menanganinya lewat BR-10: yang belum terjadi berstatus `rencana` dan hanya masuk laporan final setelah ditandai `terealisasi`.
4. **Bimbingan disertasi hari Sabtu.** Polanya "dua mingguan dengan pengecualian" (5 & 19 Sep, 3 & 17 Okt, 7 & 21 Nov; 31 Okt dilewati). Karena itu template butuh daftar pengecualian dan tanggal tetap, bukan hanya interval.
5. **Hari libur nasional** diinput/diimpor manual karena tidak ada sumber resmi yang stabil untuk dipanggil dari Apps Script.
6. **Tanda tangan & stempel.** v1 menghasilkan PDF tanpa gambar tanda tangan (dicetak lalu ditandatangani basah). Unggah gambar tanda tangan menjadi opsi v1.1.
7. **Teks "Libur Umum"** dipakai untuk Sabtu/Minggu dan libur nasional, mengikuti contoh.

## Lampiran A — Pola kegiatan dari LKB Sep–Nov 2026

| Hari | Kegiatan | Unsur | Satuan |
|---|---|---|---|
| Senin | Mengajar Algoritma dan Pemrograman Kelas A pukul 07.00–09.30; Kelas B pukul 09.30–12.00 | Pendidikan | Kelas |
| Selasa | Melaksanakan bimbingan proposal mahasiswa pukul 09.00–12.00; Menelaah dan memberi umpan balik draft proposal mahasiswa | Pendidikan | Kegiatan |
| Rabu | Slot fleksibel: penulisan/analisis penelitian, buku praktikum, laporan | Penelitian / Pendidikan | Draft, Kegiatan, Modul, Laporan |
| Kamis | Mengajar Aplikasi Komputer Kelas A pukul 07.00–09.30; Kelas B pukul 09.30–12.00 | Pendidikan | Kelas |
| Jumat | Mengevaluasi pembelajaran dan memeriksa tugas mahasiswa (Pendidikan); Menyusun rencana kegiatan akademik minggu berikutnya (Penunjang) | Pendidikan, Penunjang | Kegiatan |
| Sabtu (berkala) | Melaksanakan bimbingan disertasi S3 dengan promotor (kegiatan sehari penuh) | Pendidikan | Kegiatan |

Rabu adalah satu-satunya hari yang isinya berubah tiap pekan, jadi paling cocok untuk input manual atau template "fleksibel" yang deskripsinya diisi saat realisasi.
