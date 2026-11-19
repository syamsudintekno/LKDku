# design.md — Desain UI/UX & Format Laporan (LKB-App)

Dokumen ini mendefinisikan tampilan aplikasi web dan **tata letak PDF LKB**. Perilaku dan aturan data ada di `prd.md`.

## 1. Prinsip desain

1. **SKP dulu.** Jalur utama selalu "dari SKP"; kegiatan insidental adalah jalur kedua yang sengaja dibuat sedikit lebih jauh dan diberi penanda.
2. **Catat dalam dua ketukan.** Menandai kegiatan selesai harus secepat mencentang daftar tugas, terutama di ponsel.
3. **Tenang dan padat.** Satu pengguna, banyak data tabel: tampilan bersih, informatif, tanpa dekorasi.
4. **Laporan adalah sumber kebenaran visual.** Pratinjau di layar identik dengan PDF.
5. **Kesalahan dicegah, bukan dimarahi.** Validasi tampil di tempat, dengan cara memperbaikinya.

## 2. Arsitektur informasi

```
Masuk
└─ Aplikasi (navigasi: sidebar di desktop, tab bawah di ponsel)
   ├─ Beranda        — ringkasan bulan berjalan + capaian SKP
   ├─ Harian         — catat & tandai kegiatan (kalender + daftar hari)
   ├─ Laporan        — daftar bulan → pratinjau → validasi → final → PDF
   ├─ SKP            — tahun → butir → template kegiatan
   └─ Pengaturan     — profil & kop, hari libur, unsur/satuan, password, cadangan
```

Tombol aksi cepat (FAB di ponsel): **+ Kegiatan**.

## 3. Token visual

Warna meniru nuansa LKB contoh (hijau-teal institusi, abu-abu untuk libur). Nilai heksa adalah perkiraan; sesuaikan setelah membandingkan dengan PDF.

```css
:root {
  /* brand */
  --brand-700: #1f5f5b;   /* header tabel PDF, tombol utama */
  --brand-600: #277a74;
  --brand-100: #e3f1ef;
  /* netral */
  --ink-900: #1b1f23;  --ink-600: #4b5563;  --ink-400: #9aa3ad;
  --line: #d9dee3;     --surface: #ffffff;  --bg: #f5f7f8;
  --holiday: #e6e8ea;  /* baris Libur Umum */
  /* unsur */
  --u-pendidikan: #2563eb;  --u-penelitian: #7c3aed;
  --u-pengabdian: #d97706;  --u-penunjang:  #4b5563;
  /* status */
  --ok: #15803d; --warn: #b45309; --err: #b91c1c; --info: #1d4ed8;
  /* bentuk */
  --radius: 10px; --radius-sm: 6px;
  --space: 4px;  /* skala 4/8/12/16/24/32 */
  --shadow: 0 1px 2px rgb(0 0 0 / .06), 0 4px 12px rgb(0 0 0 / .05);
}
@media (prefers-color-scheme: dark) { /* definisikan ulang --bg, --surface, --ink-*, --line */ }
```

**Tipografi UI:** `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`; dasar 16 px, tabel 14 px, judul halaman 22/28. Angka tabel memakai `font-variant-numeric: tabular-nums`.

**Tipografi PDF:** isi tabel serif (`Cambria, "Noto Serif", Georgia, serif`) 9–9.5 pt; judul dan header kolom sans-serif tebal (`Arial, Helvetica, sans-serif`). Pastikan font tersedia di mesin PDF Apps Script; bila tidak, gunakan fallback dan uji.

### Chip & badge

| Elemen | Gaya |
|---|---|
| Unsur | Chip kecil berwarna sesuai `--u-*` (teks gelap di atas latar 12% warna yang sama) |
| Status `rencana` | Garis putus-putus, ikon jam |
| Status `terealisasi` | Solid, ikon centang `--ok` |
| Status `dibatalkan` | Teks dicoret, `--ink-400` |
| **Insidental** | Badge oranye "Insidental" + ikon petir; selalu terlihat di daftar, tabel, dan pratinjau layar (tidak di PDF) |
| Dari SKP | Kode butir (mis. `P-02`) sebagai tautan kecil |

## 4. Layar

Wireframe bersifat indikatif.

### 4.1 Masuk

```
┌──────────────────────────────┐
│        LKB-App               │
│  Laporan Kinerja Bulanan     │
│  [ Username              ]   │
│  [ Password           👁 ]   │
│  [x] Ingat saya 14 hari      │
│  [        Masuk         ]    │
│  (pesan error / sisa percobaan) │
└──────────────────────────────┘
```
Keadaan: *loading* (tombol nonaktif + spinner), salah kredensial ("Username atau password salah"), terkunci ("Terlalu banyak percobaan. Coba lagi dalam 12 menit"), galat jaringan. Server dingin bisa lambat; tampilkan "Menghubungi server…" setelah 2 detik.

### 4.2 Beranda

```
Kamis, 19 November 2026                         [ + Kegiatan ]
┌ Bulan ini: November 2026 ───────────────────────────────────┐
│ Terealisasi 28  ·  Rencana 14  ·  Insidental 2    [Buat draft] │
│ ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░ 67% hari kerja terisi                     │
└──────────────────────────────────────────────────────────────┘
┌ Hari ini ───────────────────┐ ┌ Perlu perhatian ─────────────┐
│ ☐ Mengajar Apkom Kelas A    │ │ ⚠ Pengabdian: 0 bulan ini     │
│ ☐ Mengajar Apkom Kelas B    │ │ ⚠ 2 insidental belum dipetakan│
│ [Tandai semua selesai]      │ │ ⚠ 1 hari kerja kosong (12/11) │
└─────────────────────────────┘ └──────────────────────────────┘
┌ Capaian SKP 2026 ───────────────────────────────────────────┐
│ P-01 Pengajaran      ▓▓▓▓▓▓▓▓▓░░  86/100 Kelas               │
│ R-02 Publikasi       ▓▓▓▓░░░░░░░  2/5 Draft                  │
└──────────────────────────────────────────────────────────────┘
```
Angka di atas hanyalah contoh tampilan.

### 4.3 Harian

- **Desktop:** kiri kalender bulan (titik penanda per hari: hijau = semua terealisasi, abu putus = ada rencana, oranye = ada insidental, merah = hari kerja kosong); kanan daftar kegiatan hari terpilih.
- **Ponsel:** strip pekan di atas (geser), daftar hari di bawah.
- Setiap baris kegiatan: kotak centang (tandai terealisasi), jam, deskripsi, chip unsur, kode SKP/badge insidental, menu `⋯` (ubah, pindah tanggal, batalkan, hapus).
- Aksi massal per hari: "Tandai semua selesai". Per pekan: "Tandai pekan ini".

**Sheet "Tambah kegiatan"** (modal di desktop, *bottom sheet* di ponsel):

```
Tanggal [19/11/2026]    Jam [07.00]–[09.30] (opsional)
Sumber  (•) Dari SKP   ( ) Insidental
Butir SKP   [ P-01 · Pengajaran            ▾ ]   ← bila Dari SKP
Template    [ Aplikasi Komputer Kelas A    ▾ ]   (opsional, mengisi deskripsi)
Deskripsi   [ ................................ ]
Unsur [Pendidikan ▾]  Jumlah [1]  Satuan [Kelas ▾]   ← terisi otomatis, dapat diubah
Alasan insidental [ ............ ]                ← hanya jika Insidental (wajib)
Status ( ) Rencana  (•) Terealisasi
[Batal]                         [Simpan]  [Simpan & tambah lagi]
```
Memilih Insidental menyembunyikan kolom SKP, menampilkan alasan, dan menampilkan saran "Mirip butir SKP: R-02 — petakan?" bila deskripsi mirip.

### 4.4 Laporan

Daftar 12 bulan dengan status: `Kosong`, `Draft`, `Siap difinalisasi`, `Final` (+ ikon PDF).

**Detail bulan** — tiga tab:
1. **Pratinjau** — render tabel LKB persis format PDF; baris `rencana` diberi latar kuning muda dan label "Belum terealisasi" (tidak ikut PDF final).
2. **Pemeriksaan** — daftar Error (merah, menghalangi), Peringatan (kuning), tiap item dengan tautan "Perbaiki" yang melompat ke tanggal terkait.
3. **Ekspor** — tanggal tanda tangan, tombol *Finalisasi & buat PDF*, tautan PDF di Drive, tombol *Buka kembali* (dengan konfirmasi dan alasan).

Dialog finalisasi: "Setelah final, kegiatan bulan ini terkunci. X kegiatan berstatus rencana tidak akan dimasukkan." Tombol utama baru aktif jika tidak ada Error.

### 4.5 SKP

- **Daftar tahun** (kartu): tahun, status, jumlah butir, capaian keseluruhan.
- **Detail SKP:** tabel butir (kode, unsur, rencana hasil kerja, target, satuan, realisasi). Klik baris → panel samping.
- **Panel butir:** form butir + daftar template (kartu kecil: "Kamis · 07.00–09.30 · tiap pekan · Kelas").
- **Editor template:** hari, frekuensi, rentang tanggal, jam, jumlah, satuan, pengecualian (pilih tanggal di kalender mini) + **pratinjau tanggal** yang dihasilkan untuk bulan terpilih.
- Tombol "Salin dari tahun lalu" (v1.1) dan "Arsipkan".

### 4.6 Pengaturan

Tab: **Profil & kop** (dengan pratinjau kop), **Hari libur** (tabel + impor), **Unsur & satuan**, **Keamanan** (ganti password, sesi aktif, keluar semua), **Cadangan** (ekspor/impor).

## 5. Pola interaksi & umpan balik

- Simpan memakai *optimistic UI*; bila gagal tampil toast merah dengan tombol "Coba lagi" dan perubahan dikembalikan.
- Toast: pojok bawah, otomatis hilang 4 detik; error tetap sampai ditutup.
- Konfirmasi hanya untuk tindakan merusak/menguncikan (hapus, finalisasi, buka kembali).
- Skeleton saat memuat; keadaan kosong punya ajakan jelas ("Belum ada SKP 2026 — Buat SKP").
- Bentrok versi (`CONFLICT`): dialog "Data diubah di tempat lain. Muat ulang?".
- Tanggal dan jam: pemilih native; tampilkan format Indonesia.

## 6. Responsif & aksesibilitas

- Titik henti: ≤ 600 px (ponsel, tab bawah), 601–1024 (sidebar ikon), > 1024 (sidebar penuh).
- Target sentuh ≥ 44 px. Aksi utama di zona jempol (FAB, bottom sheet).
- Kontras AA; status tidak hanya dengan warna (selalu ada ikon/teks).
- Fokus terlihat jelas; semua dialog menjebak fokus dan dapat ditutup dengan `Esc`.
- Tabel lebar di ponsel berubah menjadi kartu bertumpuk.
- `prefers-reduced-motion` dihormati.

## 7. Spesifikasi PDF LKB

Mengikuti LKB contoh Sep–Nov 2026.

### 7.1 Halaman
A4 potret; margin atas 15 mm, kiri/kanan 18 mm, bawah 15 mm. Pemisah halaman otomatis; satu baris tidak boleh terpotong. Sebaiknya baris tanggal yang sama tidak terpisah halaman bila memungkinkan, dan header tabel **diulang** di tiap halaman (peningkatan atas contoh, yang tidak mengulang header).

### 7.2 Kop (tengah, tebal, serif)
```
[logo]  KEMENTERIAN AGAMA REPUBLIK INDONESIA
        UNIVERSITAS ISLAM NEGERI SYEKH WASIL KEDIRI
        Jalan Sunan Ampel Nomor 07 Ngronggo Kota Kediri Kode Pos 64127
        Telepon (0354) 689282  Faksimile (0354) 686564  Website: www.uinkediri.ac.id
```
Logo di kiri (±18 mm), diunggah di pengaturan. Garis pemisah tipis di bawah kop.

### 7.3 Judul & identitas
- Judul tengah, sans-serif tebal 12 pt: `LAPORAN KINERJA BULANAN`; baris bawah 9.5 pt tebal: `Periode: Bulan Oktober Tahun 2026`.
- Blok identitas (label tebal, titik dua sejajar): Nama, NIP, Jabatan, Unit Kerja, Satuan Kerja — dari profil.

### 7.3 Tabel

| Kolom | Lebar | Rata | Catatan |
|---|---|---|---|
| Hari / Tanggal | 17% | kiri | tampil sekali per tanggal (baris pertama) |
| No. | 5% | tengah | mulai 1 per tanggal |
| Deskripsi Laporan Kinerja | 46% | kiri | boleh membungkus baris |
| Unsur Tridharma | 12% | tengah | |
| Jumlah | 8% | tengah | |
| Satuan | 12% | tengah | |

- **Header:** latar `--brand-700`, teks putih, sans-serif tebal 9 pt, tinggi ±9 mm, tengah vertikal.
- **Baris kegiatan:** garis tipis horizontal `--line`, padding vertikal 1.5–2 mm.
- **Baris Libur Umum:** satu sel melebar seluruh kolom, latar `--holiday`, teks tengah, *italic*, format `Minggu, 04/10/2026 — Libur Umum`.
- Border luar tipis abu-abu; tanpa garis vertikal antarkolom di body.

### 7.4 Penutup
- Kalimat: "Demikian laporan kinerja bulanan ini dibuat berdasarkan yang sebenarnya." (sans-serif 9 pt), jarak ±8 mm di bawah tabel.
- Dua kolom tanda tangan, tidak boleh terpisah dari kalimat penutup:

| Kiri | Kanan |
|---|---|
| Mengetahui, | `Kediri, 31 Oktober 2026` |
| Dekan Fakultas Tarbiyah dan Ilmu Keguruan, | Yang membuat laporan, |
| *(ruang ±25 mm untuk tanda tangan & stempel)* | *(ruang ±25 mm)* |
| Prof. Dr. Dra. Hj. Munifah, M.Pd. | Ahmad Syamsudin, M.Kom. |
| NIP. 197004121994032006 | NIP. 198809022015031004 |

Nama pejabat dan NIP berasal dari profil, bukan teks tetap. Opsi v1.1: gambar tanda tangan/stempel diletakkan di ruang kosong.

### 7.5 Aturan isi (ringkas)
Semua tanggal bulan hadir berurutan; Sabtu/Minggu/libur tanpa kegiatan jadi baris libur; hanya kegiatan `terealisasi`; format jam `07.00–09.30`; tanpa badge insidental atau penanda status. Nama file: `LKB_Ahmad_Syamsudin_2026_okt.pdf`.

## 8. Salinan teks (microcopy)

- Tombol: **Masuk**, **Simpan**, **Tandai selesai**, **Buat draft bulan ini**, **Finalisasi & buat PDF**, **Buka kembali**.
- Kosong: "Belum ada kegiatan pada tanggal ini."
- Insidental: "Kegiatan ini belum ada di SKP. Tulis alasan singkat agar mudah ditelusuri nanti."
- Peringatan Pengabdian: "Belum ada kegiatan Pengabdian pada bulan ini."
- Error server: "Tidak bisa menghubungi server. Data Anda belum tersimpan. Coba lagi."
- Nada: ringkas, sopan, tidak menyalahkan, tanpa istilah teknis.

## 9. Kriteria penerimaan visual

- [ ] PDF Okt 2026 hasil aplikasi berdampingan dengan contoh: kop, kolom, warna, baris libur, tanda tangan sama.
- [ ] Mencatat satu kegiatan terjadwal sebagai selesai ≤ 2 ketukan di ponsel.
- [ ] Insidental selalu terbedakan di layar, tidak muncul di PDF.
- [ ] Semua layar nyaman di 360 px dan 1280 px; lulus pemeriksaan kontras AA.
- [ ] Setiap layar punya keadaan loading, kosong, dan error.

## 10. Animasi & interaksi menyenangkan

Lapisan ini menambah rasa "hidup" pada aplikasi tanpa mengurangi keterbacaan data. Implementasi teknis dan token gerak ada di `AGENTS.md` §8; dasar UI memakai **CoreUI Free React** (komponen gratis saja).

### 10.1 Prinsip tambahan
6. **Menyenangkan tapi berguna.** Setiap animasi harus memberi umpan balik, menunjukkan hubungan, atau merayakan pencapaian nyata. Hadiah hanya untuk hal yang benar-benar terjadi (data tersimpan di server).

### 10.2 Pemetaan token ke CoreUI
Token di §3 dipetakan ke variabel SCSS CoreUI di `src/scss/_variables.scss` (bukan CSS liar di komponen):

| Token | Variabel CoreUI (override) |
|---|---|
| `--brand-700` | `$primary` |
| `--ok` / `--warn` / `--err` / `--info` | `$success` / `$warning` / `$danger` / `$info` |
| `--u-pendidikan` dst. | variabel khusus `$unsur-*` → kelas `.chip-unsur-*` |
| `--radius` | `$border-radius`, `$border-radius-lg` (sedikit lebih bulat: 10–12 px) |

Mode terang/gelap memakai mekanisme tema bawaan CoreUI.

### 10.3 Tombol

| Varian | Dipakai untuk | Perilaku khas |
|---|---|---|
| `primary` | Simpan, Buat draft | naik 2 px saat hover, mengecil 0.96 saat ditekan; state loading → centang menggambar sendiri |
| `success` | Tandai selesai | lingkaran terisi + pantulan kecil |
| `ghost` | Batal, aksi sekunder | latar lembut saat hover |
| `danger-hold` | Finalisasi, Buka kembali, Hapus permanen | **tekan-tahan 1 detik**, cincin progres mengelilingi tombol; dilepas sebelum penuh = batal |

Semua tombol utama memiliki ikon di kiri; ukuran sentuh ≥ 44 px; fokus terlihat jelas.

### 10.4 Ikon
Set tunggal: CoreUI Icons (`cil*`). Pasangan baku: selesai `cilCheckCircle` · insidental `cilBolt` · SKP `cilTask` · laporan `cilDescription` · libur `cilSun` · peringatan `cilWarning` · PDF `cilCloudDownload`. Ikon gerak (centang, petir, matahari berputar pelan di keadaan libur) dibuat dari SVG yang dianimasikan. Ukuran 16/20/24 px; ikon bermakna diberi `aria-label`.

### 10.5 Momen animasi per layar

| Layar | Momen |
|---|---|
| Masuk | kartu login masuk dengan fade + naik; salah password → guncang sekali; sukses → transisi ke Beranda |
| Beranda | kartu muncul berurutan; angka dan bar capaian menghitung naik; "Hari ini" menandai centang dengan pantulan |
| Harian | centang menggambar sendiri, baris berubah hijau lembut; kegiatan baru "muncul" dengan geser + fade; hapus → mengecil + "Urungkan" |
| SKP | pratinjau tanggal template muncul berurutan; kartu butir terangkat saat hover |
| Laporan | pindah tab dengan geser halus; item pemeriksaan hilang dengan lembut saat diperbaiki; finalisasi → konfeti + pesan |
| Pengaturan | saklar bergeser dengan *spring*; "Mode animasi" langsung terlihat efeknya |

### 10.6 Momen perayaan (konfeti ≤ 1.5 dtk, sekali per kejadian)
1. LKB bulan itu berhasil difinalisasi dan PDF dibuat.
2. Target tahunan sebuah butir SKP mencapai 100%.
3. Seluruh hari kerja dalam bulan telah terisi dan terealisasi.

Pesan contoh: "LKB Oktober beres! PDF sudah tersimpan di Drive." Nada hangat dan singkat, tanpa berlebihan.

### 10.7 Keadaan kosong & pesan
Ikon besar bergoyang halus + ajakan jelas, mis. "Belum ada kegiatan hari ini — mulai dari SKP?". Microcopy boleh ceria, tidak kekanak-kanakan, tidak menyalahkan.

### 10.8 Mode animasi & aksesibilitas
- Pengaturan "Mode animasi": **Ceria** (default), **Tenang** (hanya transisi dasar, tanpa konfeti/pantulan), **Mati** (tanpa gerak).
- `prefers-reduced-motion: reduce` otomatis memaksa **Mati**.
- Durasi: instan 100 ms, cepat 180 ms, dasar 280 ms, lambat 450 ms. Hanya `transform` dan `opacity` yang dianimasikan.
- Tidak ada kedipan, animasi berulang tak berujung (selain ikon keadaan kosong), atau suara.

### 10.9 Kriteria penerimaan tambahan
- [ ] Setiap aksi utama memberi umpan balik visual < 100 ms.
- [ ] Mode "Mati" dan reduced-motion menghilangkan semua gerak tanpa merusak fungsi.
- [ ] Konfeti hanya muncul setelah server mengonfirmasi data tersimpan.
- [ ] Animasi tetap mulus di ponsel menengah; halaman Harian tetap cepat dengan 40+ baris.
