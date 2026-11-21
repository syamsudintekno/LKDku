# M4 — Dashboard, cadangan, dan mobile

Implementasi lokal M4 mengikuti rencana yang disetujui. Penerimaan live M0–M4 tetap terbuka; layanan Google pada tes memakai simulasi dan data palsu. Tidak ada deploy, merge, pemasangan skill, dependensi baru, atau perubahan header sheet.

## Perilaku

- Dashboard menghitung kegiatan terealisasi per bulan, rasio insidental berdasarkan jumlah kegiatan, hari kerja, peringatan unsur kosong, dan kegiatan hari ini. Peringatan hari kerja kosong hanya sampai tanggal hari ini di Asia/Jakarta.
- Capaian tahunan menjumlahkan `jumlah` kegiatan terealisasi tertaut dengan satuan yang sama dengan target. Satuan berbeda ditampilkan terpisah; persentase angka dapat melampaui 100%, sedangkan bar dibatasi 100%. Riwayat bulanan tersedia per butir.
- Perayaan hanya setelah mutasi pengguna tersimpan dan ringkasan server melewati ambang target/hari kerja lengkap. Memuat halaman atau mengubah target tidak memicu konfeti. Token gerak, Tenang/Mati, dan reduced-motion tetap berlaku.
- Cadangan JSON versi 1 memuat delapan tabel bisnis beserta header. CSV tersedia per tabel dan audit. Pengguna, hash password, pepper, dan sesi tidak diekspor. Audit hanya diekspor sebagai metadata ringkas dan tidak diimpor. CSV melindungi awalan formula spreadsheet.
- Pemulihan JSON bersifat menambahkan: baris identik dilewati, perbedaan dengan record yang sudah ada ditolak. Profil kosong dan satuan bawaan pada target baru dapat diisi. Validasi relasi, snapshot final, konfigurasi, dan bulan terkunci dilakukan sebelum tulis; pratinjau terikat versi diperlukan sebelum tekan-tahan pemulihan.
- Impor maksimal 2 MB dan 10.000 baris per tabel. Ekspor besar tetap dapat dihasilkan tetapi mungkin melampaui batas impor; jangan menganggap setiap ukuran ekspor dapat langsung dipulihkan.
- Pemulihan memakai lock dan kompensasi jika tulis gagal; Google Sheets tidak menyediakan transaksi lintas sheet. Jika kompensasi juga gagal, properti internal `BACKUP_RECOVERY_REQUIRED=1` memblokir penulisan bisnis. Pemilik harus memeriksa dan memperbaiki spreadsheet terhadap cadangan sebelum menghapus flag di Script Properties. Pembacaan, ekspor, dan autentikasi tetap tersedia.
- Pengaturan satuan menolak penghapusan satuan yang masih dirujuk. Empat unsur tetap. Ubah password memerlukan password saat ini, membatasi kegagalan, menggunakan hash/salt/pepper yang sama, dan mencabut semua sesi. Daftar sesi tidak menampilkan token/hash; sesi lain dapat dicabut.
- Navigasi bawah tersedia sampai 600 px, navigasi ikon pada 601–1024 px. Harian ponsel memakai strip tanggal horizontal dan kalender bulanan yang dapat dibuka. Pemetaan insidental khusus tetap v1.1 sesuai keputusan cakupan; dashboard mengarah ke penyuntingan Harian.

## Bukti lokal

Lint, 134 tes dalam 27 berkas, dan build lulus. Tes mencakup port domain identik, capaian beda satuan, pemulihan idempoten/konflik/versi, relasi dan snapshot palsu, rollback dan blok pemulihan gagal, password/sesi, UI galat, serta reduced-motion. Tes unduhan memeriksa Blob, nama file, tautan, dan pelepasan URL.

Browser fixture mencakup capaian 3/4 → 4/4 setelah centang tersimpan, satuan Draft terpisah, ekspor yang disiapkan UI, impor satu libur palsu melalui pratinjau dan tekan-tahan, tambah satuan dan penolakan penghapusan satuan terpakai. Tampilan 360/800/1280 px, tema terang/gelap, strip tanggal dan navigasi diperiksa tanpa gulir horizontal halaman. File impor browser disiapkan terpisah; ini bukan verifikasi ulang file hasil unduhan. Tidak ada error JavaScript pada pemeriksaan akhir.

## Penerimaan pemilik pada lingkungan uji terpisah

- [ ] Selesaikan checklist live M0–M3, termasuk konversi Google PDF A4 dan fidelitas terhadap contoh.
- [ ] Cocokkan ringkasan dashboard dengan Sheet untuk beberapa bulan, satuan berbeda, arsip, insidental, dan bulan final.
- [ ] Unduh JSON/CSV, pastikan file benar-benar tersimpan dan dapat dibaca. Pulihkan JSON hasil unduhan pada spreadsheet uji baru; ulangi untuk memastikan tidak duplikat.
- [ ] Periksa batas ukuran, kuota Apps Script, izin Drive, dan kegagalan jaringan; simpan cadangan sebelum pemulihan.
- [ ] Pemilik menguji perubahan password serta pencabutan sesi di dua browser.
- [ ] Uji keyboard, pembaca layar, reduced-motion dan tiga mode gerak pada perangkat nyata; ukur respons input dan kelancaran animasi pada ponsel menengah. Pemeriksaan lokal tidak mengklaim hasil pengukuran 60 fps atau latensi Google.

Lihat juga [audit UI manual](m4-ui-audit.md). MVP belum dinyatakan lulus penerimaan live.
