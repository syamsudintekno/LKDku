# Audit UI manual M4

Skill impeccable/motion-framer tidak tersedia di checkout dan tidak dipasang. Audit dan polish dilakukan manual sesuai persetujuan cakupan, dengan `docs/design.md` sebagai rujukan.

| Area          | Pemeriksaan dan perbaikan lokal                                                                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Responsif     | Dashboard 360/1280 px; Harian dan Pengaturan 360/800 px. Navigasi bawah/ikon tidak menutup isi; halaman tidak melebar horizontal. Kalender penuh tetap tersedia.                                  |
| Hierarki      | Angka ringkasan mendahului pekerjaan hari ini, peringatan, dan rincian target. Satuan yang tidak cocok diberi keterangan terpisah.                                                                |
| Kontras       | Tema terang dan gelap diperiksa secara visual. Bar memakai warna tautan tema agar terlihat pada tema gelap. Pemeriksaan ini bukan sertifikasi kontras menyeluruh.                                 |
| Sentuh/fokus  | Input dan tombol utama minimal 44 px, tanggal strip 48 px; fokus tautan/tombol/form diperjelas. Tab pengaturan memakai navigasi panah/Home/End.                                                   |
| Umpan balik   | Spinner, sukses, galat dan keadaan kosong tersedia. Toast sukses memakai status/polite; galat memakai alert/assertive tanpa pengumuman ganda. Status tombol satuan direset setelah isian berubah. |
| Gerak         | Bar memakai transform; daftar/count memakai token. Mati/reduced-motion diuji otomatis; konfeti bergantung data tersimpan dan ambang terverifikasi. Tidak ada animasi baru tak terbatas.           |
| Keamanan alur | Pemulihan membutuhkan pemeriksaan server dan tekan-tahan; bulan final read-only. Daftar sesi tidak menampilkan rahasia.                                                                           |

Pengukuran kinerja perangkat nyata, pembaca layar, unduhan file fisik, dan penerimaan backend Google tetap mengikuti checklist M4. Audit tidak menggantikan pengujian tersebut.
