# Setup dan penerimaan M0

## Status

Implementasi diuji dengan fixture palsu dan layanan Google simulasi. Uji login/logout terhadap Web App dan spreadsheet uji nyata belum dilakukan. Jangan menandai M0 selesai berdasarkan tes simulasi saja.

## Konfigurasi lokal dan backend

1. Buat spreadsheet **uji** kosong dan proyek Apps Script pengujian milik sendiri. Jangan menyalin kegiatan nyata ke lingkungan pengembangan.
2. Hubungkan `clasp` ke proyek tersebut secara lokal dengan `rootDir` menunjuk `apps-script`. Jangan commit `.clasp.json` atau `.clasprc.json`. Unggah kode hanya setelah pemilik menyetujui proyek tujuan.
3. Di Project Settings → Script Properties, isi `SPREADSHEET_ID` dengan ID spreadsheet uji. Jangan menuliskannya ke source. Bila `PEPPER` belum ada, `initSheets()` membuatnya. Pertahankan pepper yang sudah digunakan karena perubahan pepper membuat hash password lama tidak cocok.
4. Jalankan `initSheets()` dari editor Apps Script. Fungsi membuat 11 sheet yang belum ada, profil kosong, dan daftar unsur/satuan. Fungsi tidak menghapus tab yang sudah ada atau mengganti header sheet. Pemanggilan ulang tidak menggandakan profil.
5. Untuk membuat akun lewat editor tanpa menaruh password dalam kode, isi Script Properties sementara `INITIAL_USERNAME` dan `INITIAL_PASSWORD`. Gunakan password pilihan pemilik minimal 12 karakter, lalu jalankan `setupUser()` tanpa argumen. Setelah berhasil, kedua properti sementara dihapus; Sheet hanya berisi hash, salt, dan jumlah iterasi. Menjalankan setup untuk username yang sudah ada mengganti hash dan mengakhiri seluruh sesi lamanya.
6. Pemilik melakukan deploy Web App: **Execute as me**, akses **Anyone**. Deploy tidak dijalankan agen. Gunakan URL `/exec` Web App tersebut sebagai `VITE_API_URL` di `.env.local` untuk frontend lokal atau repository variable untuk Pages.
7. Pastikan zona waktu proyek `Asia/Jakarta`. Login memakai token aplikasi, bukan `Session.getActiveUser()` atau login Google.

## Uji penerimaan pada lingkungan uji pemilik

- [ ] Username/password salah ditolak. Kegagalan kelima mengunci akun 15 menit, termasuk bila password berikutnya benar.
- [ ] Login benar membuka Beranda tanpa data kegiatan rekaan atau profil pribadi bawaan.
- [ ] Reload halaman memverifikasi sesi kembali lewat server.
- [ ] Tanpa “ingat saya”, token tersimpan hanya di `sessionStorage`; dengan persetujuan, token tersimpan di `localStorage` dan sesi server berumur 14 hari. Sesi biasa 12 jam.
- [ ] Token kosong, salah, kedaluwarsa, dan sesi yang telah logout ditolak semua action privat. Uji dengan token milik akun uji saja; jangan mencatatnya di repositori, tangkapan layar, atau log.
- [ ] Logout kembali ke login dan membersihkan cache data privat. Bila jaringan gagal, sesi lokal tetap dibersihkan; sesi server yang gagal dicabut masih berlaku sampai kedaluwarsa.
- [ ] Login/logout membuat audit log tanpa password atau token. Setup ulang akun mengakhiri sesi lama.
- [ ] Form dan navigasi terbaca pada 360 px dan desktop; fokus keyboard terlihat. Mode Ceria/Tenang/Mati tersimpan di perangkat; reduced-motion selalu memaksa Mati.
- [ ] Tombol tekan-tahan membatalkan aksi bila dilepas sebelum satu detik, dan berfungsi dengan pointer maupun Space/Enter.

Setelah daftar ini lulus, catat hasil pada changelog sebelum memulai M1: profil, SKP/template, serta hari libur.

## Catatan migrasi dari fondasi awal

Header sheet tidak berubah dan tidak ada migrasi data otomatis. `initSheets()` tidak menghapus profil atau akun lama yang sudah ada. Nilai profil dan ID tujuan yang sebelumnya tertanam di source telah dihilangkan dari kode aplikasi, tetapi tetap dapat berada pada histori Git. Bila password bawaan lama pernah dipakai, pemilik perlu menggantinya melalui setup akun dan memeriksa akses spreadsheet/Drive. Penghapusan histori Git tidak dilakukan sebagai bagian perubahan ini.
