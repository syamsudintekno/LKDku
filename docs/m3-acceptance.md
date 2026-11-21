# Implementasi dan penerimaan M3

M3 mengimplementasikan FR-07/FR-08: pemeriksaan, pratinjau, finalisasi, PDF, dan buka kembali laporan. Domain dan tes dibuat sebelum server/UI; animasi ditambahkan setelah alur dasar berhasil di browser. Semua pengujian yang menulis memakai fixture dan layanan Google simulasi. Belum ada deploy, merge, penulisan spreadsheet nyata, atau pembuatan PDF di Drive pengguna.

## Keputusan format yang disetujui

- Hari kerja kosong diperingatkan tanpa baris PDF, mengikuti BR-04. Ini menyelesaikan pertentangan dengan kalimat BR-01 bahwa setiap tanggal tampil. Tanggal libur kosong tetap memiliki baris Libur Umum.
- Pemilik mengonfirmasi A4 sesuai design.md pada 20 November 2026. PDF Oktober referensi memakai Legal (612 × 1008 pt), sehingga jumlah/pemisahan halaman tidak ditargetkan identik dengan contoh Legal. Margin A4 tetap 15 mm atas/bawah dan 18 mm kiri/kanan.
- Referensi Drive hanya dibaca untuk pembandingan visual. Data pribadi, kegiatan nyata, tanda tangan dan stempel tidak disalin ke fixture atau repo. Logo dapat diunggah sendiri sebagai PNG/JPEG kecil melalui Profil; v1 tetap tanpa gambar tanda tangan/stempel.

## Perilaku dan kontrak

- `report.list` memberi 12 bulan berstatus Kosong/Draft/Siap difinalisasi/Final. Siap berarti tidak ada Error; peringatan tetap memerlukan persetujuan.
- `report.preview` dan `report.validate` mengembalikan dokumen, record laporan, Error/Peringatan, jumlah rencana/terealisasi, tanggal tanda tangan, dan fingerprint versi input. Pratinjau draft menandai rencana dan insidental. PDF final serta pratinjau final hanya memuat kegiatan terealisasi dan baris libur kosong.
- Hari kerja yang hanya berisi rencana tetap diperingatkan kosong untuk laporan final. Rencana, bentrok jam, Pengabdian kosong, dan logo belum diunggah menjadi peringatan. Profil wajib belum lengkap, NIP/folder tak valid, kegiatan tak valid, dan tidak adanya kegiatan terealisasi menjadi Error.
- Finalisasi memeriksa ulang versi dan validasi di dalam LockService. Persetujuan UI terikat versi yang dilihat; pergantian versi membatalkan persetujuan lama. Tombol memerlukan tekan-tahan satu detik. Tidak ada status final optimistis sebelum server berhasil.
- Snapshot berisi profil/kop/logo, tanggal tanda tangan, baris final, hasil pemeriksaan dan versi sumber. Hanya field baris laporan disimpan, tanpa catatan/metadata kegiatan yang tidak dicetak, agar bulan biasa tetap muat. Ekspor ulang tidak membaca profil/kegiatan terbaru. Snapshot lebih dari 45.000 karakter menjadi Error sebelum finalisasi dan diperiksa kembali sebelum pembuatan file, menjaga batas sel Sheets tanpa menambah kolom.
- `report.finalize` membuat PDF terlebih dahulu, lalu menyimpan snapshot dan status final. Bila konversi gagal, bulan tetap dapat disunting. Bila file berhasil dibuat tetapi penyimpanan record gagal, file baru dipindah ke Trash (bukan dihapus permanen). Pengulangan finalisasi dari versi sumber yang sama mengembalikan hasil tersimpan tanpa membuat PDF kedua.
- PDF memakai `HtmlService` dan `getAs('application/pdf')`, disimpan di folder yang dipilih pengguna → `LKB/{tahun}/LKB_{Nama}_{tahun}_{bln}.pdf`. Tidak ada perubahan sharing atau akses publik file. Tanggal tanda tangan awal adalah akhir bulan.
- `report.exportPdf` memakai file yang masih tersedia atau membuat ulang dari snapshot bila file hilang/di-Trash. Pengulangan setelah respons terputus dapat memerlukan muat ulang versi record; tidak ada penimpaan file lama.
- `report.reopen` memerlukan alasan dan versi record, dicatat di audit, lalu membuka bulan untuk penyuntingan. PDF lama tetap menjadi arsip di Drive; finalisasi berikutnya membuat file dan snapshot baru. Mutasi kegiatan tetap memeriksa bulan asal/tujuan di server.
- Header sheet tidak berubah. Profil menambah key opsional `logo_kop` pada struktur key/value yang sudah ada, maksimal 20.000 karakter data URL PNG/JPEG (unggah UI maksimal 14 KB). Tidak ada logo, ID folder atau data pribadi pengguna yang ditanam di frontend.

## Tampilan, gerak, dan keamanan

Pratinjau React dan template Apps Script memakai CSS dokumen yang sama, diperiksa oleh tes. Struktur kop, identitas, enam kolom, baris libur, kalimat penutup, dan tanda tangan mengikuti design.md §7. Header tabel diulang dan baris/penutup diberi aturan hindari pemisahan halaman. Font fallback tetap perlu diperiksa pada mesin konversi Google.

Data React di-escape oleh JSX; template memakai scriptlet printing yang di-escape. Tidak ada innerHTML dinamis. Tautan Perbaiki menuju tanggal Harian atau Profil sesuai masalahnya. Dokumen A4 dapat digulir secara horizontal di dalam panel pada ponsel; halaman luar tidak ikut melebar.

Transisi tab hanya memakai transform/opacity dan token. Konfeti di-lazy-load setelah respons finalisasi pertama yang berhasil, maksimal 1,4 detik; pengulangan hasil tersimpan tidak memicunya. Tenang/Mati dan reduced-motion menonaktifkan konfeti. Perubahan mode/reduced-motion atau meninggalkan layar membatalkan perayaan. Status sukses tetap diumumkan sebagai teks.

## Verifikasi lokal dan batas

- Lint, 111 tes pada 21 berkas, dan build lulus, termasuk tes M0–M2. Tes mencakup fingerprint basi, persetujuan versi, Error penghalang, snapshot terlepas, rencana terfilter, autentikasi, ulang finalisasi, kegagalan PDF, kompensasi Trash, batas snapshot, ekspor ulang setelah profil berubah, escaping template dan kesamaan CSS.
- Layanan Google simulasi menjalankan kode `.gs` dan template HTML yang sebenarnya. Konversi PDF serta Drive tetap test double; keberhasilan tes ini bukan bukti konversi PDF atau izin Drive Google nyata.
- Browser fixture memeriksa finalisasi dengan tekan-tahan, rencana tidak muncul pada final, buka kembali beralasan, tautan Perbaiki, navigasi tab, serta tampilan 360/1280 px. Pengujian animasi dan aksesibilitas dilengkapi tes otomatis, bukan pengukuran fps ponsel fisik.
- Uji resize menemukan umpan balik pengukuran viewport sidebar ke state kendali yang dapat menyebabkan loop render. Sidebar kini hanya menyinkronkan penutupan mobile; observasi viewport tidak memerintahkan buka. Dua tes regresi dan uji ulang navigasi mobile/desktop mencakup perbaikan ini.

## Checklist live pemilik

- [ ] Selesaikan setup/penerimaan live M0–M2 pada spreadsheet uji terpisah. Pemilik melakukan upload/deploy Apps Script, termasuk otorisasi layanan Drive saat dibutuhkan.
- [ ] Isi profil palsu, folder Drive uji milik sendiri, dan logo institusi yang diizinkan; jangan memakai data produksi dalam pengembangan.
- [ ] Periksa Error/Peringatan, default tanggal akhir bulan, pengubahan tanggal tanda tangan dan penolakan versi basi.
- [ ] Finalisasi data uji, verifikasi file di folder tahun, status final, snapshot dan audit; pastikan seluruh mutasi kegiatan ditolak saat final.
- [ ] Buka PDF aktual. Bandingkan kop/logo, kolom, font, jam, penomoran, warna, libur, penutup, dan tanda tangan dengan referensi. A4 adalah keputusan yang disetujui; pagination dapat berbeda dari contoh Legal.
- [ ] Uji laporan panjang lintas halaman: header berulang, baris tidak terpotong, blok penutup/tanda tangan utuh, dan tidak ada teks bertumpuk.
- [ ] Ubah profil/libur/SKP setelah final; pastikan pratinjau dan ekspor ulang tetap memakai snapshot. Uji file PDF di-Trash lalu buat ulang.
- [ ] Uji gagal konversi/izin folder dan respons jaringan terputus; pastikan tidak ada finalisasi palsu atau duplikasi pada pengiriman ulang.
- [ ] Buka kembali dengan alasan, koreksi kegiatan dan finalisasi ulang; pastikan PDF lama tetap tersimpan dan audit lengkap.
- [ ] Periksa keyboard, mode gerak, reduced-motion, dan tampilan pada ponsel nyata.

Penerimaan live serta fidelitas hasil konversi Google belum dinyatakan lulus. Dashboard/cadangan dan penyempurnaan mobile menyeluruh tetap M4.
