# Implementasi dan penerimaan M2

M2 mencakup FR-04, FR-05, serta logika BR-02 sampai BR-11: generator draft dan pencatatan harian. Domain dan tes dibuat terlebih dahulu, dilanjutkan port server dan UI. Animasi ditambahkan setelah alur dasar berjalan. Pengujian memakai data palsu dan layanan Google simulasi; uji Web App/spreadsheet uji nyata masih terbuka, termasuk penerimaan M0/M1.

## Perilaku

- Generator mengambil template dari SKP aktif pada tahun bulan pilihan, dengan butir aktif. Jadwal memakai aturan libur dan pengecualian M1. Hasil selalu `rencana`; tidak ada kegiatan yang ditandai terealisasi otomatis.
- Periksa draft tidak menulis kegiatan. Simpan memeriksa ulang jadwal di dalam LockService dan menolak pratinjau yang berubah dengan `CONFLICT`. Permintaan ulang setelah seluruh kandidat sudah tersimpan menghasilkan nol kegiatan baru.
- `generated_key = template_id|yyyy-MM-dd|urutan` disimpan sekali. Kunci lama tetap diperhitungkan meskipun kegiatan disunting, dipindahkan, dibatalkan, atau dihapus sementara. Generator tidak menimpa kegiatan lama. Tautan SKP/template hasil generator tidak dapat diganti.
- Harian memuat kalender bulanan, daftar tanggal terpilih, jumlah terealisasi/rencana/insidental, status libur dan hari kerja kosong. Sabtu dengan kegiatan aktif tampil sebagai hari berkegiatan. Kegiatan dibatalkan tetap terlihat dengan penanda, tetapi tidak dihitung sebagai kegiatan aktif.
- Centang tunggal dan aksi massal memerlukan tindakan pengguna. Aksi pekan memakai Senin–Minggu dan hanya kegiatan rencana tersimpan dalam bulan yang sedang ditampilkan, sehingga tidak mengubah bulan tetangga secara tersembunyi.
- Jalur Dari SKP mengisi unsur/satuan dari butir dan dapat mengisi deskripsi/jam/jumlah dari template. Jalur Insidental mewajibkan alasan, tanpa tautan SKP/template. Status awal input manual juga `rencana`.
- Jam harus berpasangan, dengan waktu selesai setelah mulai. Bentrok pada tanggal sama menjadi peringatan, bukan larangan simpan. Batas yang bersentuhan, misalnya 07.00–09.30 dan 09.30–12.00, tidak bentrok. Kegiatan tanpa jam, dibatalkan, atau dihapus tidak ikut pemeriksaan bentrok. Form perpindahan lintas bulan memuat jadwal tujuan; server tetap memeriksa ulang saat simpan.
- Nomor dimulai dari satu per tanggal, diurutkan menurut jam lalu waktu/urutan input. Kegiatan tanpa jam berada di belakang. Deskripsi menampilkan jam dalam format Indonesia. Selector `realizedActivities` menyiapkan BR-10; pratinjau/finalisasi/PDF tetap cakupan M3.
- Update, pindah, hapus, pulihkan, dan mutasi massal memeriksa versi. Mutasi massal memvalidasi seluruh record sebelum menulis. Bulan final ditolak server, termasuk bulan asal dan tujuan perpindahan. Penulisan batch dilindungi LockService dan dicatat di audit log.
- ID stabil pada tambah manual memungkinkan permintaan ulang setelah respons jaringan hilang tanpa menduplikasi kegiatan. Isi berbeda dengan ID sama ditolak. Optimistic update diputar balik ketika gagal; toast menyediakan coba lagi atau muat ulang pada bentrok versi. Soft delete menyediakan Urungkan lima detik.
- Centang terkonfirmasi menggambar garis dan memantul pada Mode Ceria; daftar muncul berurutan dan badge insidental berayun sekali. Mode Tenang hanya memakai transisi dasar; Mati dan reduced-motion meniadakan gerak. Umpan balik menunggu server tidak dianggap sebagai capaian terkonfirmasi. Tidak ada konfeti M2.

Header sheet tidak berubah. Tidak ada dependensi atau skill baru, deploy, merge, maupun perubahan data Google nyata.

## Verifikasi lokal

- Lint, 89 tes pada 15 berkas, dan build produksi lulus. Tes meliputi domain, kesamaan port `.gs`, autentikasi/validasi server, idempotensi dan permintaan ulang, versi/final state, rollback UI, alasan insidental, jadwal tujuan, Mode Mati, serta reduced-motion dengan 40 baris.
- Browser dengan API fixture: preview delapan kegiatan, simpan dan ulang generator, centang tunggal/harian/pekan, tambah insidental, bentrok dua kegiatan, pindah lintas bulan, tambah dari SKP pada Sabtu, hapus/Urungkan, serta pergantian mode animasi. Sesudah pindah dan pulih, generator tetap menghasilkan nol kegiatan baru dan delapan kunci sudah ada.
- Tampilan diperiksa pada 1280 px dan 360 px, tema terang/gelap, modal bergulir, dan keterbacaan status. Kalender mobile memiliki target tanggal minimal 44 px tanpa gulir horizontal. Ini bukan pengukuran 60 fps pada ponsel fisik.

## Checklist lingkungan uji pemilik

- [ ] Selesaikan penerimaan live M0/M1 pada spreadsheet uji terpisah. Pemilik menjalankan upload/deploy Apps Script sesuai panduan M0.
- [ ] Periksa dry run, simpan delapan kegiatan fixture, dan ulangi tanpa duplikasi di Sheet.
- [ ] Sunting/pindahkan/batalkan/hapus hasil generator, ulangi generator, lalu pastikan tidak dibuat ulang dan tautan tetap utuh.
- [ ] Uji input SKP/insidental, alasan kosong, jumlah nol, jam tidak lengkap, serta bentrok lintas bulan.
- [ ] Centang tunggal/harian/pekan dan periksa status setelah reload. Periksa batas pekan yang melintasi bulan.
- [ ] Uji versi basi dari dua tab, token salah/kedaluwarsa, gagal jaringan, dan bulan final pada asal maupun tujuan perpindahan.
- [ ] Hapus/Urungkan, periksa audit dan hasil pada Sheet; uji pengiriman ulang setelah respons terputus.
- [ ] Periksa keyboard, kontras, ketiga mode animasi dan reduced-motion pada ponsel nyata, termasuk daftar 40+ kegiatan.

Uji lokal tidak menggantikan penerimaan live. M2 belum dinyatakan diterima pada layanan Google nyata.
