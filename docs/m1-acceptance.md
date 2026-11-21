# Implementasi dan penerimaan M1

M1 mencakup FR-02, FR-03, dan FR-09: profil/kop, SKP tahunan beserta butir dan template, serta daftar hari libur. Seluruh pengembangan dan uji browser memakai layanan Google simulasi serta data palsu. Uji penerimaan pada Web App/spreadsheet uji nyata belum dilakukan. M0 live tetap terbuka; pemilik meminta pengembangan dilanjutkan tanpa menunggu URL lingkungan uji pada 20 November 2026.

## Perilaku

- Profil dapat dilengkapi bertahap. NIP disimpan sebagai teks dan, bila diisi, wajib terdiri dari 18 angka. Pratinjau kop menampilkan teks yang sedang disunting. Folder PDF hanya disimpan sebagai referensi; tidak ada file Drive yang dibuat pada M1.
- SKP baru berstatus draft; perubahan status mengikuti draft → aktif → arsip. Hanya satu SKP aktif pada tahun yang sama. Arsip bersifat read-only di server. Tahun dan relasi parent butir/template tidak dipindahkan setelah dibuat.
- Butir memiliki kode unik di dalam SKP, unsur/satuan dari konfigurasi, indikator, serta target positif. Template wajib memiliki butir, rentang tanggal pada tahun SKP, jumlah positif, satuan yang tersedia, dan pasangan jam valid bila jam diisi.
- Pratinjau tidak membuat activity. Jadwal mingguan mengikuti hari pilihan. Dua mingguan berpatokan pada pekan Senin–Minggu yang memuat tanggal mulai. Bulanan mengikuti nomor tanggal mulai, bukan ordinal hari pekan; bulan tanpa tanggal tersebut dilewati. Sekali hanya memakai tanggal mulai.
- Minggu, hari libur, dan tanggal pengecualian dilewati. Sabtu hanya disertakan jika hari template dipilih Sabtu. Pola disertasi yang bergeser setelah Oktober dapat dibuat sebagai template terpisah dengan tanggal mulai baru atau template sekali untuk tanggal tetap; tidak diasumsikan sebagai interval dua minggu tanpa pengecualian.
- Impor libur berupa array JSON berisi tanggal ISO, keterangan, dan jenis `nasional`, `cuti_bersama`, atau `kampus`. Maksimal 400 baris, seluruh tanggal harus berada pada tahun pilihan. Semua baris divalidasi sebelum penulisan. Tanggal yang sudah ada dilewati dan tidak menimpa catatan lama.
- Penghapusan butir menonaktifkan template di bawahnya. Urungkan memulihkan hanya template yang ikut dihapus bersama butir tersebut; template yang lebih dulu dihapus tetap terhapus. Activity tidak diubah. Pemulihan ditolak jika parent sudah arsip atau tanggal libur sudah ditempati catatan baru.
- Perubahan memakai optimistic update dengan rollback dan toast galat. Update/hapus/pulihkan memerlukan versi record `updated_at`; profil memakai fingerprint seluruh record profil. Bentrok versi menghasilkan `CONFLICT` dan meminta pemuatan ulang. Semua perubahan server memakai LockService, penulisan batch, dan audit log.

Tidak ada perubahan header atau penambahan kolom sheet. Script Properties menambah penanda waktu internal `LAST_REFERENCE_STAMP` untuk versi yang berbeda pada operasi berurutan. Rahasia dan data nyata tidak ditambahkan ke repo. Impor libur tidak mengambil data dari sumber daring.

## Pemeriksaan pada lingkungan uji pemilik

- [ ] Selesaikan setup dan uji live di `m0-setup.md` pada proyek/spreadsheet uji terpisah.
- [ ] Simpan profil/kop dan periksa nilainya setelah reload, termasuk NIP dengan nol di depan. Nilai teks yang diawali `=` ditolak agar tidak dieksekusi sebagai formula Sheet.
- [ ] Buat draft SKP, beberapa butir dan template; uji penolakan kode duplikat, target nol, satuan tak dikenal, serta template tanpa butir.
- [ ] Bandingkan pratinjau mingguan/dua mingguan/bulanan/sekali dengan tanggal yang dimasukkan pemilik; uji jam tidak lengkap dan pengecualian di luar rentang.
- [ ] Input atau impor libur, ulangi impor dan pastikan tidak ada duplikasi. Impor dengan satu tanggal salah harus ditolak seluruhnya.
- [ ] Aktifkan SKP; SKP kedua pada tahun yang sama tidak dapat diaktifkan. Arsipkan dengan tekan-tahan satu detik, lalu pastikan perubahan ditolak server.
- [ ] Hapus dan urungkan butir/template/libur dalam lima detik; periksa activity lama tetap utuh.
- [ ] Buka dua tab, simpan perubahan dari tab pertama, lalu coba simpan versi lama dari tab kedua. Pastikan mendapat CONFLICT dan tidak menimpa perubahan pertama.
- [ ] Periksa formulir, kartu mobile/tabel desktop, modal bergulir, fokus keyboard, toast, serta mode animasi pada 360 px dan desktop.

Pembangkitan draft activity dan pencatatan harian masuk M2; finalisasi/PDF masuk M3. Kemampuan tersebut tidak dinyatakan selesai oleh implementasi M1.
