# Acceptance criteria (bisa dicek tanpa membaca kode)

Uji di Chrome desktop + 1 HP Android/iPhone.

## T0.1
- [ ] Alamat localhost dari AI terbuka di browser tanpa layar error.
- [ ] Folder sesuai architecture.md ada.

## T0.2
- [ ] Silinder merah tampil di latar studio gelap.
- [ ] Bisa diputar & zoom, tidak bisa masuk ke bawah lantai.
- [ ] Diam 5 dtk → berputar pelan sendiri.

## T0.3
- [ ] Splash dengan % muncul, lalu APAR tampil.
- [ ] File apar.glb < 2 MB (lihat laporan AI).
- [ ] Matikan internet saat load → muncul pesan error + Retry.

## T0.4
- [ ] https://trainer.barkahmauludi.com terbuka dengan HTTPS (gembok).
- [ ] Di Vercel, domain berstatus Valid Configuration di project apar-3d-trainer.
- [ ] barkahmauludi.com (situs utama) tetap normal.
- [ ] Push ke GitHub → situs ter-update otomatis.

## T1.1
- [ ] Klik EN/ID → semua teks berganti tanpa reload.
- [ ] Refresh → bahasa tetap.

## T1.2
- [ ] Tab berpindah & URL berubah (#train dst).
- [ ] Di HP: panel jadi bottom sheet yang bisa ditarik.

## T1.3
- [ ] Buka URL dengan ?debug, klik model → koordinat muncul.
- [ ] Klik dekat pin/tuas/nozzle/gauge/label/tabung → ring kuning berdenyut tepat di bagian itu (bukan meleset).

## T1.4
- [x] 6 pin hotspot terlihat di tempat yang benar; klik → kamera mendekat + kartu info dalam bahasa aktif, teks sama dengan content-and-assets.md.
- [x] Pin di sisi belakang tersembunyi; pin tidak 'melayang' saat diputar.

Dikonfirmasi lolos oleh Barkah pada 27 Okt 2026.

## T1.5
- [x] Ganti warna → body berubah instan, detail tekstur tetap.
- [x] Toggle bracket muncul/hilang.

Revisi UX HP (rencana dan acceptance disetujui Barkah, 27 Okt 2026):
- [x] Dari panel ringkas, tap keenam hotspot langsung memperlihatkan judul, tombol Tutup, dan awal deskripsi.
- [x] Deskripsi panjang dapat di-scroll tanpa menyembunyikan tombol Tutup.
- [x] Menutup kartu mengembalikan pengaturan dan pilihan sebelumnya.
- [x] Drag/tap handle, pergantian hotspot, EN/ID, About/Escape, dan perpindahan tab tetap bekerja.
- [x] Ukuran 360×800, 390×844, 768×1024, dan 844×390 tidak memotong header atau menimbulkan overflow horizontal.
- [x] Teks 200%, keyboard, reduced motion, dan perubahan breakpoint saat kartu terbuka tetap dapat digunakan.
- [x] Desktop, tiga warna, bracket, picking, dan oklusi hotspot tetap lolos.

Dikonfirmasi lolos oleh Barkah pada 27 Okt 2026. Rincian perangkat pemeriksaan Barkah tidak dicatat; matriks ukuran layar di atas diuji AI melalui emulasi Chrome.

## T1.6
- [x] Ganti kapasitas → ukuran & harga berubah.
- [x] Ganti bahasa → mata uang berganti IDR/USD.
- [x] Ada label 'Harga ilustrasi'.

Dikonfirmasi lolos oleh Barkah pada 27 Okt 2026. Rincian perangkat pemeriksaan Barkah tidak dicatat; QA AI menggunakan Chrome desktop dan HP emulasi.

## T1.7
- [x] Save → muncul di daftar; refresh → masih ada; load → kembali ke konfigurasi itu; delete → hilang.
- [x] Kosong → teks empty state.

Dikonfirmasi lolos oleh Barkah pada 28 Okt 2026. Rincian perangkat pemeriksaan Barkah tidak dicatat. AI menjalankan Chrome desktop + HP emulasi, termasuk EN/ID, batas 10/batal, kegagalan storage, keyboard, teks 200%, dan viewport pendek untuk simulasi ruang keyboard. AI belum menguji HP fisik/keyboard sistem. Bukti `.cursor/t1.7-qa.json` dan `.cursor/t1.7-*.png`.

## T2.1
- [x] Bisa menyelesaikan 4 langkah PASS dengan klik/tahan/geser; instruksi sama dengan content-and-assets.md.
- [x] Skip interaction berfungsi.
- [x] Disclaimer terlihat.
- [x] Kartu akhir Train menampilkan 113 & 112 + sumber; di HP `tel:` link bisa diketuk; teks ikut toggle bahasa.

28 Okt 2026: implementasi dan QA AI dev/build produksi lokal lolos. AI menguji Chrome desktop/HP emulasi, empat langkah/Skip/Back/Ulangi, hold mouse/keyboard/sentuhan, enam lintasan Sweep, interupsi About/blur/mode, pemulihan konfigurasi, gagal model/Retry dan storage, EN/ID/teks latihan 200%/dua snap pada lima viewport. Bukti `.cursor/t2.1-qa.json`, `.cursor/t2.1-production-qa.json`, `.cursor/t2.1-final-qa.json` dan screenshot `.cursor/t2.1-*.png`. HP fisik dan pengukuran performa perangkat belum diuji oleh AI. Api/garis bidik/semprotan tetap T2.2; kuis T2.3.

Revisi Sweep disetujui setelah feedback Barkah: validasi ulang slider mulai kiri/tujuan kanan, kanan→kiri tiga siklus sampai 3/3, drag/klik/tap rel/keyboard, posisi/progres bertahan saat terputus, Skip tidak memalsukan 3/3, dan Next tetap manual. Bukti revisi `.cursor/t2.1-slider-qa.json`, `.cursor/t2.1-slider-check.cjs`, `.cursor/t2.1-slider-*.png`; regresi `.cursor/t2.1-check.cjs` diperbarui untuk slider.

Dikonfirmasi lolos oleh Barkah pada 28 Okt 2026: revisi slider Sweep dinyatakan lebih jelas dan lolos, T2.1 diminta ditandai selesai serta commit/push ke develop. Seluruh checklist ditutup; rincian perangkat pemeriksaan Barkah tidak dicatat. T2.2 belum dimulai sesuai instruksi Barkah.

## T2.2
- [x] Api tampil, semprotan keluar dari arah nozzle, api padam di akhir Sweep.
- [x] Di HP tetap halus.

28 Okt 2026: validasi Q1–Q5 serta planning disetujui sebelum implementasi. QA AI memeriksa api setelah Aim, hold/lepas/sukses 1 detik, semprotan mengikuti slider dan berhenti setelah diam 180ms, enam lintasan/padam 250ms, Skip dengan hitungan sebenarnya, Back/Ulangi/mode, interupsi About/blur/visibility, reduced motion, sumber nozzle, batas partikel dan resource GPU stabil. QA Chrome dev/produksi lokal mencakup viewport HP portrait/landscape, EN/ID, teks latihan 100/200%, kedua snap dan model gagal/Retry; bukti `.cursor/t2.2-*-qa.json`, `.cursor/t2.2-qa.json` serta screenshot `t2.2-*.png`. FPS emulasi diukur pada hardware desktop, bukan bukti ≥30 fps HP fisik.

Dikonfirmasi lolos oleh Barkah pada 28 Okt 2026, kedua checklist ditutup dan commit/push ke develop diminta. Screenshot Squeeze yang dikirim sesuai implementasi: selang/nozzle tetap statis pada model utuh, arah semprotan mengikuti slider saat Sweep; animasi selang/bagian tetap L4. Rincian perangkat pemeriksaan Barkah tidak dicatat, sehingga acceptance tidak dianggap pengukuran ≥30 fps pada HP fisik. T2.3 tidak dimulai.

## T2.3
- [x] 8 soal sesuai content-and-assets.md, feedback + penjelasan, skor akhir.
- [x] Soal 'klik bagian' bisa dijawab dengan klik pin di 3D.
- [x] 6/8 → Lulus, 5/8 → Belum lulus.

- [x] Setelah feedback q6 tampil blok nomor darurat 113 & 112 + sumber Komdigi (EN/ID).

28 Okt 2026: validasi Q1–Q4, planning dan pelengkap teks bilingual disetujui Barkah sebelum implementasi. Implementasi/QA lokal tersedia, status tetap menunggu acceptance Barkah; checkbox di atas belum ditutup. Cek dari tab Train: Start → selesaikan/Skip empat langkah → Selesai → Ikuti kuis. Jawab delapan soal, uji pin bernomor q2/q5, ganti bahasa, periksa kontak sesudah q6 serta skor 5/8 dan 6/8. Ulangi kuis membuat attempt baru; Kembali ke latihan membuka kartu selesai. Refresh menjaga riwayat selesai, bukan sesi parsial.

Bukti AI di `.cursor/t2.3-qa.json`, `t2.3-dev-qa.json`, `t2.3-layout-qa.json`, `t2.3-training-regression-qa.json`, `t2.3-effects-regression-qa.json` dan screenshot T2.3. QA Chrome desktop/HP emulasi mencakup pin/keyboard/touch, sesi/skor/storage, EN/ID/teks kuis 100/200%/kedua snap pada lima viewport; uji layout tambahan mencakup pin, feedback darurat dan ringkasan. Tap sheet yang sempat memilih jawaban diperbaiki pada shared sheet dan diuji ulang. Preview `http://localhost:4183/#train`; HP satu Wi-Fi `http://192.168.100.4:4183/#train` (alamat LAN dapat berubah). HP fisik/AT/Firefox/Safari dan benchmark performa belum diverifikasi. T2.4 tidak dimulai.

28 Okt 2026: Barkah menyatakan pemeriksaan umum T2.3 lolos; empat checklist umum di atas ditutup berdasarkan konfirmasi tersebut. Barkah juga menemukan posisi nomor 1/2 keliru terhadap nama bagian. Pemeriksaan close-up dan percobaan klik membenarkan laporan; validasi serta rencana koreksi 1=tuas, 2=pin disetujui sebelum implementasi revisi. Catatan menunggu acceptance umum di riwayat sebelumnya ditutup, sedangkan task tetap 🟨 sampai revisi ini diterima.

Checklist revisi pemetaan (dikonfirmasi lolos oleh Barkah pada 28 Okt 2026):
- [x] Configure: nomor 1 membuka Tuas dan nomor 2 Pin pengaman; klik model serta fokus kamera cocok.
- [x] PASS: Pull menunjuk pin pengaman dan overlay pencabutan di lokasi bagian 2; Squeeze menargetkan tuas bagian 1. Nomor langkah tetap 1 dan 3.
- [x] Kuis q2: nomor 2 Benar dan nomor 1 Salah pada sesi terpisah; q5 tetap nomor 4.
- [x] EN/ID, desktop/HP, kedua snap panel serta keyboard/sentuhan tetap bekerja.

Muat ulang preview 4183 untuk mengambil build revisi. Cek Configure dahulu, lalu Train → Mulai → lakukan Pull/Aim/Squeeze/Sweep atau Skip → Selesai → Ikuti kuis. Gunakan sesi baru/refresh untuk mencoba jawaban q2 yang berbeda karena jawaban pertama terkunci. Bukti revisi memakai prefix `.cursor/t2.3-mapping-*`, termasuk close-up posisi fisik. Riwayat lama dipertahankan apa adanya dan tidak dihitung ulang; hasil sebelum revisi memakai pemetaan visual lama. Tidak commit/push/deploy atau lanjut T2.4 pada revisi ini.

28 Okt 2026: Barkah mengonfirmasi revisi nomor 1=tuas dan nomor 2=pin pengaman sudah benar dan lolos, meminta T2.3 ditandai selesai, dokumen/checklist ditutup serta commit/push ke develop. Seluruh catatan menunggu acceptance T2.3 pada riwayat di atas ditutup; checklist umum dan revisi selesai. Rincian perangkat pemeriksaan Barkah tidak dicatat, sehingga tidak diasumsikan sebagai uji HP fisik/AT/browser lain atau benchmark performa. Check/build dijalankan ulang sebelum commit. T2.4 tetap belum dimulai; main tidak diubah.

## T2.4
- [x] Setelah kuis: skor, grafik riwayat, tabel jawaban tampil.
- [x] Clear my data → data hilang setelah konfirmasi.

28 Okt 2026: Barkah menyetujui validasi Q1–Q5 lalu rencana sebelum meminta implementasi. Setelah memeriksa hasil, Barkah mengonfirmasi T2.4 lolos; kedua checkbox ditutup berdasarkan konfirmasi tersebut. Preview desktop: `http://localhost:4183/#results`; HP satu Wi-Fi: `http://192.168.100.4:4183/#results` (alamat LAN dapat berubah). Muat ulang untuk build T2.4.

Langkah cek:
1. Tanpa riwayat, buka Hasil: pesan kosong + tombol Latihan; konfigurasi tersimpan dan nama opsional tetap tersedia. Kelola konfigurasi membuka Configure.
2. Train → Mulai → lakukan/Skip empat langkah → Selesai → Ikuti kuis → jawab delapan soal → Lihat skor → Lihat hasil. Periksa skor/ring, tanggal/durasi, Lulus pada ≥6/8, grafik dan delapan baris jawaban. Ulangi kuis untuk menambah riwayat; tabel selalu percobaan tersimpan terbaru. Grafik maksimal 20, terlama di kiri.
3. Simpan konfigurasi dari Configure, lalu buka Hasil. Ringkasan memuat nama/agent/kapasitas/warna/bracket/harga ilustrasi saat simpan. Ganti EN/ID: teks, tanggal dan mata uang mengikuti bahasa. Nama konfigurasi tidak diterjemahkan.
4. Isi nama peserta, tekan Enter atau pindah fokus/tab, lalu refresh. Nama opsional, maksimal 60 karakter dan spasi tepi dipangkas. Nama adalah isian laporan pada browser ini, bukan identitas pemilik percobaan lama. PDF tetap T2.5.
5. Gunakan data uji untuk Clear: Batal/Escape menjaga data dan mengembalikan fokus. Konfirmasi menghapus riwayat/configs/nama/trainingDone dan mereset sesi kuis/PASS; bahasa tetap. Masuk Train kembali ke intro, daftar Configure kosong, refresh tidak memunculkan data lama.
6. Di HP, gulir konten atau perbesar sheet untuk grafik/tabel/nama/Clear/kontak. Coba kedua snap, portrait/landscape, serta keyboard dan teks diperbesar.

Bukti AI: `.cursor/t2.4-check.cjs`, `t2.4-dev-qa.json`, `t2.4-qa.json`, screenshot `t2.4-*.png`, dan `t2.4-design-gate.md`. QA Results mencakup delapan kelompok, termasuk 40 kombinasi lima viewport × EN/ID × teks 100/200% × kedua snap; sentuhan, data rusak/tidak tersedia, gagal simpan nama/kuis, Clear gagal sebagian/total dan retry eksplisit. Regresi produksi kuis/PASS/efek memakai wrapper `t2.4-regression.cjs` dengan bukti terpisah agar laporan task lama tidak ditimpa. Batas QA AI tetap: HP fisik, screen reader/AT, Firefox/Safari serta Lighthouse/4G belum diverifikasi. Acceptance Barkah diterima; rincian perangkat pemeriksaannya tidak dicatat.

28 Okt 2026: Barkah meminta status/checklist T2.4 selesai, dokumen diperbarui, serta commit/push ke develop. Seluruh catatan menunggu acceptance T2.4 pada riwayat sebelumnya ditutup. Tidak ada bug baru yang dilaporkan. Check/build dijalankan ulang sebelum commit; T2.5 tetap belum dimulai dan main tidak diubah.

## T2.5
- [x] Download PDF report → berisi nama, skor, tanggal, disclaimer & sumber.
- [x] PDF spec berisi gambar 3D & harga.
- [x] Bahasa PDF mengikuti toggle.
- [x] PDF report memuat nomor darurat 113 (Pemadam) & 112 (umum) + sumber Komdigi di bawah disclaimer.

28 Okt 2026: validasi Q1–Q5 dan rencana disetujui Barkah sebelum implementasi. Barkah kemudian mengonfirmasi T2.5 sudah dicek dan lolos; empat checkbox ditutup berdasarkan konfirmasi tersebut. Check/build lolos. Preview desktop `http://localhost:4183/#results` / `#configure`; HP satu Wi-Fi `http://192.168.100.4:4183/#results` / `#configure` (alamat LAN dapat berubah). Refresh untuk build T2.5.

Langkah cek T2.5:
1. Hasil tanpa riwayat: Unduh laporan PDF nonaktif. Selesaikan kuis delapan soal, buka Hasil, isi nama atau kosongkan, lalu Unduh laporan PDF. Cek nama, skor/persentase/status, tanggal kuis, durasi, delapan jawaban, disclaimer persis, sumber USFA/Permenaker, 113/112 + keterangan dan sumber Komdigi di bawah disclaimer, URL dan nomor halaman. Skor 5/8 tetap bisa diunduh sebagai Belum lulus; 6/8 Lulus.
2. Configure: pilih CO2, 9 kg, perak dan bracket; klik Ekspor PDF spesifikasi tanpa harus Save. Gambar harus utuh, pilihan dan delapan baris rincian termasuk warna/bracket cocok, harga ilustrasi IDR 1.100.000 atau USD 71. Putar model atau buka close-up pada desktop, ekspor lagi dan pastikan view kembali sama. Di HP, tutup kartu bagian untuk mengungkap opsi/tombol ekspor existing.
3. Ganti EN/ID lalu ekspor ulang kedua jenis PDF. Judul/isi/tanggal/mata uang mengikuti bahasa saat klik; nama peserta tetap. Coba nama kosong/panjang; nama seperti aksara non-Latin/emoji memberi pesan khusus, tetap tersimpan di input dan bisa diubah/dikosongkan untuk ekspor.
4. Di HP coba kedua snap dan portrait/landscape; gulir sampai tombol. Periksa PDF hasil unduh di pembaca PDF perangkat, teks dapat dipilih dan setiap halaman tidak terpotong. Selama proses tombol busy; pindah tab atau Clear sebelum proses selesai membatalkan unduhan yang masih menunggu.

Bukti AI: `.cursor/t2.5-check.cjs`, laporan dev/produksi `t2.5-dev-qa.json`/`t2.5-qa.json`, `t2.5-errors*.json`, PDF/raster dan validasi isi `.cursor/t2.5-pdf-qa.json`. QA empat kelompok mencakup report/snapshot/lifecycle/layout, 24 kombinasi capture dan 40 kombinasi viewport × EN/ID × teks 100/200% × dua snap untuk dua tombol, touch/keyboard, import/capture/model failure dan retry. Pemeriksaan 10 PDF produksi/20 halaman menguji teks, nama Latin/60/kosong/draft, harga, urutan disclaimer/kontak, link dan margin, lalu dirender dan ditinjau visual. Regresi Results/kuis/PASS/efek memiliki bukti T2.5 terpisah. Detail dan batas QA di known-issues; HP fisik, screen reader/AT, Firefox/Safari dan Lighthouse/4G belum diverifikasi. Tidak commit/push/deploy atau lanjut T3.1.

28 Okt 2026: acceptance final T2.5 diterima, status/checklist selesai dan pembaruan dokumen serta commit/push ke develop diminta Barkah. Catatan menunggu acceptance pada riwayat implementasi ditutup. Tidak ada bug baru yang dilaporkan; rincian perangkat pemeriksaan Barkah tidak dicatat sehingga batas QA AI di atas tetap berlaku. Check/build dijalankan ulang sebelum commit. T3.1 tidak dimulai dan main tidak diubah.

## T3.1
- [x] Lighthouse mobile Performance ≥ 85.
- [x] APAR tampil < 3 dtk di HP dengan 4G.

28 Okt 2026: **Barkah mengonfirmasi T3.1 sudah dicek dan lolos**, lalu meminta task/checklist selesai, update dokumen dan commit/push ke develop. Kedua checklist ditutup atas acceptance pengguna, bukan hasil audit baru. Angka audit AI tetap: median tiga run baseline → final Performance 42 → 42, APAR siap 5,11 → 4,04 dtk; rentang final 41–42 dan 4,02–4,79 dtk. Target numerik audit lokal belum tercapai; transfer final 2.319.573 byte (<3 MB), GLB 695.084 byte (<2 MB). Rincian perangkat/angka pemeriksaan Barkah tidak diberikan. Bukti lengkap di `.cursor/t3.1-report.md`; usulan revisi tetap belum diterapkan dan tidak menjadi pekerjaan lanjutan otomatis. T3.2 tidak dimulai, main tidak diubah.

Cara cek implementasi saat ini:
1. Buka desktop `http://localhost:4191/#configure`, atau HP satu Wi-Fi `http://192.168.100.4:4191/#configure`. Server audit dijalankan dengan `node .cursor/t3.1-server.cjs` setelah build; gzip hanya HTML/JS/CSS, binary unchanged. Untuk preview Vite biasa gunakan `npm run preview -- --host 0.0.0.0 --port 4183`; angka audit di atas bukan pengukuran kompresi Vite preview atau Vercel.
2. Refresh tanpa ?debug. Tunggu APAR terlihat, putar/zoom; coba warna merah/kuning/perak, CO2/9kg/bracket, buka/tutup hotspot, Save lalu Load konfigurasi. Periksa label/gauge dan pencahayaan tetap utuh.
3. Buka `http://localhost:4191/?debug#configure` (HP ganti localhost dengan 192.168.100.4). Panel FPS berada di bawah topbar, marker/HUD lama tetap ada. Saat halaman benar-benar idle statistik tidak membuat render tambahan; panel FPS dapat mempertahankan angka terakhir sampai ada render baru.
4. Coba PASS sampai Sweep, kuis, Results dan kedua PDF dalam EN/ID. Pada DevTools Network dengan cache dimatikan, halaman biasa hanya memuat model/HDR satu kali, tidak memuat chunk debug atau jsPDF sebelum ekspor.
5. Jalankan `node .cursor/t3.1-audit.cjs <nama-run-baru>` untuk tiga run Lighthouse dan 4G uji memakai alat lokal yang jalurnya dicatat dalam script; HTML/JSON/screenshot disimpan terpisah. Profil 4G uji 9/1,5 Mbps, latency 60ms, CPU 4×, viewport 412×823/DPR 1,75. Pemeriksaan HP fisik tetap diperlukan; hasil headless/emulasi tidak mewakilinya.

## T3.2
- [x] Semua alur dapat digunakan dengan keyboard native: Tab/Shift+Tab, Enter/Space, Escape; Sweep memakai panah/Home/End. Keenam bagian Configure, PASS tanpa Skip, kuis, Results dan PDF dapat dijangkau.
- [x] Fokus terlihat, tidak tertutup footer/panel, urutan masuk akal; dialog membatasi Tab dan memulihkan fokus sesudah Tutup/Escape/backdrop. Label/nomor dan status sesuai aksi.
- [x] About EN/ID menampilkan penjelasan demo, teknologi, disclaimer persis sumber, USFA/Permenaker, kontak existing, kredit CC0, portfolio/GitHub dan catatan Umami yang masih direncanakan.
- [x] Reduced motion sejak awal maupun perubahan tanpa reload menghentikan auto-rotate/pulse/tween/animasi dekoratif; hold satu detik dan Sweep tetap dapat diselesaikan. Jeda putaran manual berfungsi.
- [x] Gagal startup WebGL menampilkan pesan/gambar statis, bahasa/About termasuk #about langsung tetap bekerja, kontrol yang tidak tersedia tersembunyi dan data tersimpan utuh. Gagal model tetap Retry.
- [x] EN/ID, teks 200%, portrait/landscape dan kedua snap panel tetap terbaca/terjangkau; kontras AA dan Lighthouse Accessibility ≥90. Hasil otomatis tidak menggantikan uji screen reader.

28 Okt 2026: implementasi T3.2 mengikuti validasi Q1–Q3 serta planning yang disetujui Barkah. **Menunggu pemeriksaan/acceptance Barkah**; checklist di atas belum ditutup. Perubahan kriteria keyboard native dan penundaan video sampai T3.4 disetujui saat validasi; Umami belum dipasang sampai T3.6.

Cara cek:
1. Desktop buka `http://localhost:4183/#configure`; HP satu Wi-Fi buka `http://192.168.100.4:4183/#configure`. Gulir panel ke daftar enam bagian, pilih nomor/nama lalu Tutup. Gunakan Tab/Enter/Space/Escape untuk konfigurasi, Save/Load/Delete dan ekspor spesifikasi. Tombol putaran ada di awal panel Configure, di atas harga; pada reduced motion tombol menjelaskan putaran dijeda.
2. Train → Mulai → Lakukan langkah ini pada Pull/Aim → tahan tombol panel Squeeze satu detik (lepas lebih cepat harus batal) → Sweep dengan End/Home bergantian tiga kali → Selesai manual → Ikuti kuis. Pilih Bagian/Part bernomor pada dua soal bagian; delapan jawaban tetap dikunci sekali. Buka Results, isi nama, unduh laporan dan coba Batal/Escape pada Clear.
3. Dari setiap tab buka About; baca/gulir sampai catatan Umami dan dua tautan terakhir. Tab/Shift+Tab harus tetap di dialog, Tutup/Escape mengembalikan fokus ke About; klik area luar menutup. Buka `#about` langsung, coba Back/Forward dan EN/ID sebelum membuka ulang. Cek disclaimer/sumber/kredit/nomor darurat serta tujuan tautan.
4. Aktifkan pengaturan kurangi gerakan OS/browser ketika halaman sudah terbuka, termasuk saat kamera bergerak atau api aktif. Gerakan dekoratif berhenti, interaksi tetap bekerja. Perbesar teks sampai 200%, coba HP portrait/landscape dan kedua snap; handle/tombol tidak boleh saling menutupi. Putaran manual tersedia kembali ketika preferensi dikembalikan.
5. Fallback diuji AI dengan konteks WebGL mengembalikan null dan melempar error. Bukti visual di `.cursor/t3.2-production-fallback.png` dan `t3.2-production-fallback-throw.png`; gambar statis adalah screenshot aplikasi sendiri, bukan pengganti latihan 3D. Tidak ada URL demo video kosong. Runtime context loss setelah startup bukan cakupan task.

Bukti AI: `.cursor/t3.2-check.cjs` / `t3.2-production-qa.json`, `t3.2-layout.cjs` / `t3.2-layout-qa.json`, `t3.2-motion-touch.cjs` / hasil QA, serta `t3.2-contrast.cjs` / hasil QA. Matriks layout 160 keadaan, lima viewport × EN/ID × token teks 100/200% × dua snap untuk PASS serta Configure/kuis/Results, ditambah About/backdrop/fokus. Regresi tersimpan terpisah melalui `t3.2-regression.cjs`: PASS 11 kelompok, efek 8, kuis 7, Results 8, PDF 4 dan error/retry PDF 3. Screenshot About/daftar bagian/fallback ditinjau; rincian dan batas pengujian di known-issues. HP fisik/screen reader/Firefox/Safari belum diverifikasi. Tidak commit/push/deploy atau lanjut T3.3.

Audit final Lighthouse 12.8.2/Chrome lokal: Configure, Train, Results, About dan fallback masing-masing Accessibility **100**, tanpa failed audit (`.cursor/t3.2-lighthouse-qa.json`). Kontras 16 pasangan aktif lolos, minimum 4,65:1, batas kontrol 5,45:1, fokus primer 12,01:1 pada build produksi. Check/build lolos dengan 184 key i18n; gate antislop PASS di `.cursor/t3.2-design-gate.md`. Ini bukan audit Performance/4G baru atau bukti screen reader/HP fisik.

28 Okt 2026: **Barkah mengonfirmasi T3.2 sudah dicek dan lolos**, meminta task serta seluruh checklist selesai, dokumen diperbarui, lalu commit/push ke develop. Keenam checklist ditutup berdasarkan acceptance tersebut; catatan menunggu acceptance pada riwayat implementasi di atas ditutup. Tidak ada bug baru yang dilaporkan. Rincian perangkat pemeriksaan Barkah tidak diberikan, sehingga batas QA AI HP fisik/AT/Firefox/Safari dan Performance/4G tetap berlaku. Check/build dijalankan ulang sebelum commit. T3.3 tidak dimulai; main tidak diubah.

## T3.3
- [x] Share link di WhatsApp/LinkedIn → muncul gambar & judul.

28 Okt 2026: **Barkah mengonfirmasi T3.3 sudah dicek dan lolos**, meminta task/checklist selesai, dokumen diperbarui serta commit/push ke develop. Checklist ditutup berdasarkan acceptance tersebut. Catatan menunggu acceptance pada riwayat implementasi di bawah ditutup; rincian perangkat, URL dan hasil tiap platform tidak diberikan, sehingga tidak diklaim sebagai pengujian crawler live baru oleh AI. T3.4 tidak dimulai dan main tidak diubah.

Riwayat implementasi sebelum acceptance: 28 Okt 2026, validasi Q1–Q3 dan planning disetujui sebelum implementasi. Keyword WebXR/digital twin dikecualikan sesuai persetujuan karena fitur Later. Metadata/share EN statis, judul browser/UI tetap bilingual. Saat penyerahan implementasi, checklist masih terbuka dan belum ada otorisasi commit/push/deploy; otorisasi commit/push ke develop kini diberikan pada acceptance di atas.

Cara cek lokal:
1. Desktop buka `http://localhost:4184/#configure`; HP satu Wi-Fi buka `http://192.168.100.4:4184/#configure`. Coba EN/ID, ubah warna/bracket, pindah Train/Results, buka About lalu Escape/Tutup; aplikasi tetap berfungsi.
2. Buka `http://localhost:4184/og-image.jpg` (HP: ganti localhost dengan `192.168.100.4`). Gambar harus menampilkan aplikasi Configure EN dengan APAR merah dan panel konfigurasi; dimensi 1200×630. Bukan gambar generatif atau capture riwayat/nama peserta.
3. Buka `http://localhost:4184/robots.txt` dan `http://localhost:4184/sitemap.xml`; sitemap hanya berisi `https://trainer.barkahmauludi.com/`. Klik kanan halaman app → View page source/Lihat sumber halaman, cari description, canonical, og:title, twitter:card, dan application/ld+json; semuanya tersedia pada HTML awal, meskipun alamat canonical/gambar metadata memang menunjuk produksi.
4. Setelah publikasi diotorisasi dan selesai, cek halaman/gambar/robots/sitemap pada domain produksi bisa diakses tanpa login. Tempel tautan root `https://trainer.barkahmauludi.com/` pada kolom pesan WhatsApp dan composer LinkedIn; tunggu pratinjau, pastikan judul EN serta gambar muncul. Tidak perlu mengirim pesan atau menerbitkan post untuk memeriksa pratinjau. Bila cache platform masih lama, minta pengambilan ulang metadata melalui alat inspeksi platform yang tersedia; jangan menandai lulus sebelum hasil aktual terlihat.

Bukti lokal: `npm run check` dan `npm run build` sukses, `node scripts/seo-check.js dist/index.html` lolos. `.cursor/t3.3-check.cjs` / `t3.3-production-qa.json` mencatat 10 kelompok pemeriksaan: metadata tanpa JavaScript, HTTP/MIME/byte tiga aset, parse XML/dimensi JPEG, Configure/bahasa/About/PDF spec serta PASS tanpa Skip/kuis 8/8/Results/PDF report/Clear cancel pada desktop dan HP emulasi. Tidak ada pageerror/console error/requestfailed; gambar OG tidak diminta saat app dibuka. Screenshot OG dan dua screenshot Results ditinjau. HP fisik/AT/Firefox/Safari, Lighthouse/performa baru, crawler live dan share platform belum diuji. Gate scope T3.3 di `.cursor/t3.3-design-gate.md`.

## T3.4
- [x] README di GitHub menampilkan gambar, fitur, link live.
- [x] Video 30 dtk beserta script/checklist rekam ditunda atas keputusan Barkah dan dikecualikan dari acceptance T3.4 saat ini; video belum direkam.

28 Okt 2026: **Barkah mengonfirmasi T3.4 sudah dicek dan lolos**, meminta task/checklist selesai, dokumen diperbarui serta commit/push ke develop. README ditutup berdasarkan acceptance pengguna; tidak diklaim sebagai pengujian GitHub live baru oleh AI. Penundaan video karena evaluasi UX tetap berlaku: kriteria kedua diperjelas menjadi pengecualian scope yang ditutup secara administratif, bukan bukti rekaman. T3.4 selesai untuk scope README yang disepakati; video menunggu keputusan baru. T3.6 tidak dimulai dan main tidak diubah.

Riwayat implementasi sebelum acceptance: 28 Okt 2026, validasi dan planning disetujui Barkah sebelum implementasi. README portfolio EN memakai screenshot T3.3 existing, fitur/stack aktual, link demo/portfolio, cara run, kredit aset/sumber K3 dan disclaimer EN persis sumber. Pada penyerahan implementasi, README masih menunggu pemeriksaan Barkah dan kedua checklist belum ditutup; catatan tersebut kini ditutup oleh acceptance di atas.

Cara cek README:
1. Buka README.md di editor lalu pilih Markdown Preview. Pastikan screenshot muncul, teks/daftar/blok perintah terbaca, serta link demo dan portfolio menuju alamat yang benar. Periksa juga kredit, sumber K3, batas demo dan dokumentasi.
2. Setelah commit/push diotorisasi dan dilakukan, buka https://github.com/ludioo/apar-3d-trainer pada branch yang memuat perubahan. Gulir ke README dan pastikan gambar, fitur serta link live tampil; cek di desktop dan browser HP. Preview lokal bukan bukti README sudah terpublikasi di GitHub.
3. Acceptance README sudah dikonfirmasi Barkah. Bagian video tetap menunggu keputusan Barkah untuk melanjutkan rekaman; belum ada checklist/storyboard baru pada scope ini.

Bukti AI 28 Okt 2026: npm run check (184 key i18n) dan npm run build sukses, warning chunk >500 KB existing tetap. Preview lokal melalui marked/Chrome pada 1280×900 serta 390×844: screenshot asli termuat, dua blok perintah terbaca, tanpa overflow horizontal; kedua capture ditinjau. Sepuluh path relatif tersedia dan sembilan URL eksternal sesuai rujukan repo; bukan bukti HTTP/live baru. Disclaimer EN cocok persis dengan kamus dan dokumen sumber. Bukti sementara: %TEMP%/apar-t3.4-readme-qa. Rendering GitHub aktual, HP fisik dan instalasi bersih npm ci belum diperiksa; tidak commit/push/deploy.

Gate antislop untuk scope README (arah: portfolio calon klien, Markdown native dan screenshot aplikasi; ENERGY 1 / RHYTHM 1 / MOTION 1):
- Hard Gate PASS: tanpa klaim fitur/performa rekaan, disclaimer persis sumber, gambar existing dan seluruh path relatif valid; preview dua lebar tanpa overflow. UI aplikasi tidak diubah; interaksi/kontras aplikasi bukan audit ulang task ini.
- Purpose Gate PASS: screenshot memperlihatkan produk dan kontrol aktual; format heading/list/code native memudahkan pemindaian, tanpa dekorasi/aset baru.
- Liveliness PASS: screenshot menjadi fokus, heading/spasi memisahkan isi dan gaya teks teknis sederhana mengikuti arah README; tidak menambah gerakan.
- Craftsmanship/Copy PASS: fakta dicocokkan dengan data produk/hotspot, batas simpan, builder PDF dan stack terpasang; kredit/batas demo eksplisit, tanpa buzzword atau em dash. Screenshot hanya diklaim untuk PDF spesifikasi karena laporan latihan berisi teks hasil.

## T3.6
- [x] Di Umami → Events muncul variant_change, training_start, quiz_finish, pdf_export setelah kamu mencobanya di situs live (ad-blocker dimatikan).
- [x] Tidak ada banner cookie; nama peserta tidak muncul di Umami.
- [x] Skor Lighthouse tidak turun dibanding T3.1. **Pengecualian diterima Barkah 28 Okt 2026:** skor akhir 42 sama dengan historis T3.1, tetapi turun dari baseline baru 43/44; penutupan berdasarkan penerimaan catatan, bukan bukti nonregresi numerik.
- [x] Di localhost tidak ada event terkirim.

28 Okt 2026 — **Acceptance akhir T3.6 diterima Barkah:** setelah deploy produksi, Barkah menyatakan sudah mengecek juga dan Umami sudah terhubung. Seluruh checklist ditutup berdasarkan konfirmasi pengguna dan bukti QA lokal/live sebelumnya; tidak mengarang rincian Events/Properties/perangkat pemeriksaan Barkah atau mengklaim AI membuka dashboard akun. Catatan Lighthouse yang sudah diterima tetap pengecualian, bukan hasil audit numerik baru. Task ✅, dokumentasi penutupan diperbarui dan build diulang; tidak memulai T3.5. Catatan menunggu acceptance pada riwayat di bawah ditutup oleh konfirmasi ini.

28 Okt 2026 — **Merge main/deploy produksi diotorisasi Barkah dan dijalankan.** Main di-fast-forward ke kode T3.6 907ac0f; Vercel Production Ready di https://trainer.barkahmauludi.com. Live QA lolos: HTTP 200 halaman, script sesudah APAR terlihat, delapan nama custom event dan kedua jenis PDF mendapat HTTP 200 dari kolektor; nama uji peserta/konfigurasi tidak ada di payload, cookie kosong, mobile touch/About ID tanpa overflow. Bukti `.cursor/t3.6-live-qa.json` dan `.cursor/t3.6-deploy-report.md`. Dashboard Umami tidak diakses sehingga checklist tampilan Events tetap menunggu pemeriksaan Barkah; localhost sudah dibuktikan lokal. Status 🟨 dan batas Lighthouse yang diterima tetap berlaku, tanpa T3.5. Catatan publikasi tertunda di bawah merupakan riwayat sebelum konfirmasi deploy ini.

28 Okt 2026 — **Barkah menerima catatan Lighthouse dan mengotorisasi commit/push ke develop saja.** Env Production sudah diisi menurut konfirmasi Barkah; tidak diklaim diverifikasi nilainya oleh AI. Merge ke main/deploy produksi menunggu konfirmasi selanjutnya. Checklist live tetap belum dicentang; localhost sudah dibuktikan QA namun belum ditutup sebagai acceptance pengguna. Task T3.6 tetap 🟨 sampai pemeriksaan/acceptance yang tersisa, tanpa memulai T3.5. Check/build dijalankan ulang sebelum commit. Pembacaan catatan historis di bawah mengikuti pembaruan ini.

28 Okt 2026 — Implementasi T3.6 mengikuti validasi Q1–Q5 dan planning yang disetujui Barkah; **menunggu validasi/acceptance**, tanpa commit/push/deploy atau lanjut T3.5. Check/build dan QA analytics lokal (delapan payload, no-op, privasi, PDF batal/gagal, Retry, touch EN/ID dan tracker asli dengan kolektor dicegat) dicatat di `.cursor/t3.6-report.md`. Tidak ada event QA yang dikirim ke dashboard. Checklist live tetap kosong sampai Website ID/env Production diisi, kode ini dipublikasikan atas instruksi Barkah, dan dashboard diperiksa.

**Performa belum lolos pembanding baru:** Lighthouse awal median 43→42; audit tambahan berselang 44→42. Nilai akhir sama dengan historis T3.1 (42), tetapi tidak dianggap bukti tidak turun. Penyebab belum terisolasi; semua run dan batas metode dipertahankan dalam laporan.

Cara cek lokal: buka `http://localhost:4186/#configure`, ganti opsi/bahasa, buka bagian, Save/Load, jalankan PASS/kuis dan ekspor PDF. Di F12 → Network cari `umami`: tidak ada permintaan script/event di localhost. Periksa About EN/ID. HP satu Wi-Fi memakai alamat LAN yang diberikan AI; pemeriksaan LAN juga tidak mengirim analytics.

Cara cek produksi: ikuti `env-setup.md` bagian 7, tunggu APAR dan script siap, coba delapan aksi pada tabel architecture; periksa Events/Properties terutama variant_change, training_start, quiz_finish dan kedua pdf_export. Nama peserta/nama konfigurasi tidak boleh ada, banner cookie tidak muncul. Pengujian produksi dan konfirmasi Barkah diperlukan untuk penutupan checklist.

## T3.5
- [ ] Dari barkahmauludi.com ada link ke demo dan berfungsi.

## T4.1
- [x] Default load tanpa mengunduh HDRI 1.2 MB (Network tab).
- [x] APAR tetap terbaca jelas di studio gelap; tidak overexposed/underexposed parah.
- [x] Orbit/zoom tetap normal; tidak ada error konsol terkait env map.
- [x] Keputusan (RoomEnvironment atau HDRI terkompres) tercatat di decisions.md.

28 Okt 2026: **Acceptance final diterima Barkah.** Barkah menyatakan sudah memvalidasi dan lolos, lalu meminta update dokumen dan commit/push ke develop saja. Task dan empat checklist ditutup berdasarkan konfirmasi ini serta bukti QA existing. RoomEnvironment diterima sebagai default, HDRI lama tetap pembanding `?hdri=1`. Rincian perangkat acceptance tidak diberikan, sehingga tidak diklaim ada pengujian perangkat/AT/browser baru oleh AI. T3.5 tetap ditunda, T4.2 belum dimulai dan main/deploy produksi tidak diotorisasi. Catatan menunggu acceptance pada laporan implementasi sebelumnya ditutup.

Cara cek desktop: buka `http://localhost:4191/#configure`, lalu F12 → Network → centang Disable cache dan reload. Filter `hdr`: tidak ada file HDRI atau chunk HDRLoader. Bandingkan dengan `http://localhost:4191/?hdri=1#configure` setelah reload, yang memuat satu HDR gzip (atau HDR asli jika DecompressionStream tidak tersedia). Pilih merah/kuning/perak, aktif/nonaktifkan bracket, drag orbit/zoom, buka/tutup pin bagian, pindah Train/Results, ganti EN/ID dan periksa kredit About, lalu Export spec PDF. Pertahankan pilihan/kamera sama ketika membandingkan pantulan.

Cara cek HP satu Wi-Fi: `http://192.168.100.4:4191/#configure`, pembanding `http://192.168.100.4:4191/?hdri=1#configure`. Coba drag satu jari/pinch dua jari, warna/bracket, pin dan ekspor; gulir/perbesar panel existing untuk mencapai opsi. Pastikan body merah dan aksen kuning/detail masih terbaca pada layar fisik. Desktop/mobile screenshot perbandingan berada di `.cursor/t4.1-{desktop,mobile}-{room,hdri}-red.png`.

Bukti AI: `npm run check` (185 key i18n) dan build sukses; 14 kelompok environment + 11 PASS + delapan efek, empat kondisi kredit/keyboard/teks 200%, serta empat PDF/delapan halaman lolos. Detail di `.cursor/t4.1-report.md`. Transfer produksi lokal baseline 2.323.375 → 1.135.426 byte (-51,13%); median APAR 3,95 → 3,43 dtk pada tiga run 390×844/9 Mbps/60 ms/CPU4×. **Target <3 detik belum tercapai**, tanpa klaim Lighthouse baru/HP fisik/live. Task T4.25 tetap audit menyeluruh. HP fisik/AT/Firefox/Safari belum diuji AI. Tidak commit/push/deploy atau lanjut T4.2 otomatis.

## T4.2 — Bottom sheet tiga posisi

- [x] Mobile/narrow: sheet punya tiga posisi 25%/50%/75%, default sekitar 50%, model APAR masih terlihat saat half-open.
- [x] Drag antar snap halus; tap/Enter/Space menggilir posisi dan kontrol warna/agent bisa diubah sambil melihat model. Scroll konten terpisah dari drag handle.
- [x] Full 75% dan peek 25% berfungsi; input/kontrol penting dapat dijangkau lewat scroll. Pada layar pendek posisi boleh dibatasi/berimpit; keyboard/reduced motion dan label EN/ID tetap bekerja.
- [x] Desktop panel kanan tidak regress; posisi mobile bertahan antar tab/bahasa/hotspot/resize/breakpoint dan reload kembali 50%.
- [x] Check/build sukses; pilihan tanpa dependency, perubahan ukuran bundle aktual dan batas QA tercatat di decisions/known-issues.

28 Okt 2026: **Barkah mengonfirmasi sudah memvalidasi T4.2 dan lolos**, meminta pembaruan dokumen serta commit/push ke develop. Task dan lima checklist ditutup berdasarkan acceptance tersebut dan bukti QA existing. Rincian perangkat/browser pemeriksaan tidak diberikan; tidak diklaim ada uji HP fisik/Safari/keyboard OS baru oleh AI. Check/build dijalankan ulang sebelum commit. T4.3 belum dimulai, main dan deploy produksi tidak diotorisasi.

Riwayat sebelum acceptance: validasi Q1–Q6 dan planning disetujui sebelum implementasi. Barkah memilih perluasan pointer drag/snap existing tanpa library/CSS scroll-snap; kanvas mengikuti tinggi aktual sheet. Pada penyerahan implementasi, task/checklist masih menunggu acceptance dan commit/push belum diotorisasi; catatan tersebut kini ditutup oleh konfirmasi di atas.

Cara cek:
1. Desktop buka `http://localhost:4192/#configure`; HP satu Wi-Fi buka `http://192.168.100.4:4192/#configure`. Reload agar memakai revisi T4.2. Desktop harus tetap panel kanan, HP mulai half-open.
2. HP: gulir isi sheet ke pilihan warna/agent, ubah keduanya dan amati perubahan APAR di atas. Geser handle ke bawah/tengah/atas untuk peek/half/full; tap handle juga menggilir posisi. Model mengecil pada full karena kanvas mengikuti ruang tersisa; pembesaran/framing model tetap T4.7.
3. Dengan keyboard pada layar narrow, Tab ke handle lalu Enter/Space; fokus terlihat dan posisi bergilir tanpa menjawab kuis. Coba EN/ID serta pengaturan reduced motion, About/Tutup, Configure/Train/Results dan buka/tutup hotspot; pilihan snap tetap. Resize ke desktop lalu kembali mobile mempertahankan posisi, reload kembali 50%.
4. HP: Results, gulir ke kolom nama lalu buka keyboard; input harus dapat dicapai dan panel tetap di area layar yang tersedia. Coba landscape pendek: snap bisa dibatasi minimum 176px/ruang aman di bawah topbar; tinggi yang sama dilewati. Pastikan kontrol penting tetap bisa digulir.
5. Coba PASS/kuis, Results dan ekspor PDF; tidak ada jawaban/progres yang berubah hanya karena handle digeser. Catat perangkat/browser saat acceptance, khususnya gesture tap cepat setelah drag.

Bukti lokal dan gate antislop ada di `.cursor/t4.2-report.md`; QA Chrome mencakup 56 keadaan Configure, tiga snap pada matriks regresi PASS/kuis/Results/PDF, serta touch/keyboard/reduced motion. Keyboard virtual adalah simulasi VisualViewport, bukan keyboard OS nyata. Safari/iOS/Firefox, HP fisik, AT dan audit Lighthouse/4G baru belum diuji. Bundle tambahan aktual sekitar 0,55 KB gzip untuk JS+CSS (angka Vite dibulatkan), tanpa dependency baru.

## T4.3 — Layout kuis mobile (29 Okt 2026)

Status: **selesai — acceptance Barkah diterima 29 Okt 2026**. Barkah mengonfirmasi sudah mengecek T4.3 dan lolos, lalu meminta pembaruan dokumen serta commit/push ke develop. Empat checklist ditutup berdasarkan konfirmasi pengguna dan bukti QA existing. Rincian perangkat/browser pengguna tidak diberikan; batas pemeriksaan AI tetap dicatat.

- [x] Mobile sekitar 390px: semua opsi choice dapat digulir hingga terbaca utuh dan ditekan tanpa tertutup sticky Next, termasuk opsi keempat pada fixture UI terisolasi. Data produksi tetap tiga opsi; pada sheet pendek/teks 200% satu opsi panjang boleh membutuhkan scroll untuk dibaca seluruhnya.
- [x] Setelah memilih jawaban, pertanyaan yang masih terlihat tidak terdorong keluar karena auto-scroll; feedback dekat jawaban dan penjelasan/sumber dapat digulir. Posisi baca manual dipertahankan, tanpa perubahan snap otomatis.
- [x] Desktop tidak regress; Tab/Enter/Space, penguncian jawaban, Next/Lihat skor dan ulangi tetap berjalan. Tombol minimal 44×44px.
- [x] Soal pick-hotspot q2/q5 tetap berfungsi melalui pin 3D dan enam pilihan panel; status, sumber dan penilaian tetap benar.

Cara cek: buka desktop `http://localhost:4193/#train` atau HP satu Wi-Fi `http://192.168.100.4:4193/#train`. Mulai latihan, gunakan Lewati lalu Berikutnya untuk empat langkah PASS, kemudian Ikuti kuis. Pada HP uji sheet 25/50/75%, opsi pertama/terakhir, jawaban benar/salah, EN/ID dan teks besar. Pada desktop ulangi dengan keyboard. Selesaikan delapan soal sampai skor, lalu Ulangi kuis. Nomor 2/pin pada q2 dan nomor 4/manometer pada q5 tetap menjadi jawaban benar. Fixture empat opsi hanya dijalankan oleh QA, bukan ditambahkan ke kuis pengguna.

Bukti dan batas pemeriksaan ada di `.cursor/t4.3-report.md`. Check/build dijalankan ulang sebelum commit. Commit/push ke develop diotorisasi oleh acceptance di atas; T4.4 tetap tidak dimulai, main dan deploy produksi tidak diotorisasi.

## T4.8 — Squeeze press-and-hold (30 Okt 2026)

Status: **selesai — acceptance Barkah diterima 30 Oktober 2026**. Barkah mengonfirmasi sudah mengecek T4.8 dan lolos, lalu meminta pembaruan dokumen serta commit/push ke develop. Lima checklist ditutup berdasarkan konfirmasi tersebut dan QA existing. Validasi dan planning disetujui sebelum implementasi. Bug timer awal belum tereproduksi pada baseline lokal; celah ring panel sudah diperbaiki, tanpa mengklaim akar masalah timer ditemukan. Rincian perangkat/browser pengguna tidak diberikan; batas QA AI tetap berlaku.

- [x] Desktop mouse: tahan tombol Squeeze satu detik, ring pada tombol terisi penuh, status berhasil dan Next/Lanjut aktif tanpa Skip; perpindahan tetap manual.
- [x] Mobile touch sekitar 390px: lepas terlalu cepat membatalkan/reset ring, bisa mencoba lagi sampai berhasil; perubahan progres tidak menggeser tombol.
- [x] Keyboard: Tab menuju tombol dan tahan Space maupun Enter menyelesaikan hold; keyup lebih awal membatalkan, key repeat tidak mereset/menggandakan timer.
- [x] Interupsi pointercancel/kehilangan capture/fokus, About, halaman tersembunyi dan keluar Train membatalkan hold parsial; kembali memerlukan input baru.
- [x] Skip tetap tersedia dan menampilkan status dilewati tanpa ring penuh; Back menjaga hasil, Ulangi mereset sesi; Pull/Aim/Sweep, semprotan, EN/ID, tiga snap, teks besar dan reduced motion tetap berjalan.

Cara cek: desktop buka `http://localhost:4198/#train`; HP satu Wi-Fi buka `http://192.168.100.4:4198/#train`. Mulai latihan, gunakan aksi panel untuk Pull/Cabut dan Aim/Arahkan lalu Next/Lanjut, sampai langkah 3/4 Squeeze/Tekan. Tahan tombol **Tahan selama 1 detik / Hold for 1 second**, lepas lebih awal lalu ulangi sampai ring penuh. Tekan Lanjut secara manual untuk masuk Sweep. Ulangi latihan untuk pemeriksaan keyboard dan Skip; coba Tentang/About atau pindah tab di tengah hold, lalu kembali. Pada HP coba sheet 25/50/75% dan gulir isi untuk mencapai tombol. Refresh selalu memulai sesi dari intro.

Bukti AI: delapan kelompok khusus produksi, 11 regresi PASS, delapan efek, empat smoke normal dev/produksi, self-check 189 key dan build lolos. Detail, batas perangkat/browser, warning dan bukti awal yang gagal ada di `.cursor/t4.8-report.md`. Check/build dijalankan ulang sebelum commit; browser tidak diuji ulang karena penutupan ini hanya mengubah dokumentasi. Checklist ditutup berdasarkan acceptance Barkah; rincian perangkat pemeriksaannya tidak dicatat. Commit/push ke develop diotorisasi, tanpa lanjut task lain atau mengubah main/deploy produksi.

## T4.4 — Area tap dan pemisahan hotspot (30 Okt 2026)

Status: **selesai — acceptance Barkah diterima 30 Oktober 2026**. Barkah mengonfirmasi sudah mengecek T4.4 dan lolos, lalu meminta task/checklist selesai, pembaruan dokumen serta commit/push ke develop. Lima checklist ditutup berdasarkan konfirmasi tersebut dan QA existing; rincian perangkat/browser pengguna tidak diberikan sehingga batas QA AI tetap berlaku. Validasi Q1–Q3 dan planning disetujui sebelum implementasi. Visual 28px/hitbox 44×44px dipertahankan; Configure memakai batas panel existing agar area tap tuas pada close-up indikator tekanan tidak tertutup.

- [x] Mobile: area tap pin minimal 44×44px, mudah ditekan termasuk dekat tepi, dan tidak salah memilih pin tetangga.
- [x] Pin dekat tuas/pin pengaman/nozzle tidak bertumpuk tak terbaca; garis menghubungkan posisi layar ke bagian 3D yang benar pada sheet 25/50/75%.
- [x] Oklusi tetap benar saat orbit: pin bagian belakang tersembunyi dan muncul kembali saat terlihat. Nomor tetap 1 tuas, 2 pin pengaman, 3 nozzle, 4 indikator tekanan, 5 label, 6 tabung.
- [x] Desktop: pin tetap rapi dan seluruh area tap terhindar dari panel, termasuk close-up indikator tekanan. Klik/keyboard membuka info bagian yang benar, tween tetap bekerja, Tutup/Escape mengembalikan kamera.
- [x] Kuis q2/q5 dan target PASS/Squeeze tetap berfungsi; EN/ID, kapasitas, resize dan reduced motion tidak merusak interaksi.

Cara cek: desktop buka `http://localhost:4198/#configure`; HP satu Wi-Fi buka `http://192.168.100.4:4198/#configure`. Muat ulang, coba pin 1/2/3 termasuk tap sedikit di luar lingkaran kuning, lalu Tutup. Gulir panel sampai daftar bagian dan pilih **4. Indikator tekanan / Pressure gauge**; pada desktop coba pin 1 dekat panel. Orbit ke sisi/belakang lalu kembali, ubah kapasitas dan EN/ID. Di HP ulangi pada sheet 25/50/75% melalui handle. Jika pin tersembunyi karena oklusi/ruang sempit, pilih bagian melalui enam tombol panel. Pada desktop gunakan Tab, Enter/Space dan Escape. Di tab Latihan/Train coba PASS termasuk tahan Squeeze, kemudian kuis: nomor 2 untuk pin pengaman (q2), nomor 4 untuk indikator tekanan (q5).

Bukti AI: check/build, delapan kelompok khusus/310 keadaan produksi, 11 regresi PASS, delapan Squeeze, tujuh kuis dan dua smoke normal produksi lolos. URL desktop/LAN di atas merespons HTTP 200 pada 30 Oktober 2026. Detail screenshot, perintah ulang, gate antislop, probe awal yang gagal, warning serta batas perangkat/browser ada di `.cursor/t4.4-report.md`. Check/build dijalankan ulang sebelum commit; browser tidak diuji ulang karena penutupan hanya mengubah dokumentasi. Commit/push ke develop diotorisasi oleh acceptance ini, tanpa lanjut task berikutnya atau mengubah main/deploy produksi.

## T4.12: Chip nomor darurat persisten (30 Okt 2026)

Status: **selesai, acceptance Barkah diterima 30 Oktober 2026**. Barkah mengonfirmasi sudah mengecek T4.12 dan lolos, lalu meminta status/checklist selesai, pembaruan dokumen serta commit/push ke develop. Tiga checklist ditutup berdasarkan konfirmasi tersebut dan bukti QA existing; rincian perangkat/browser pemeriksaan pengguna tidak diberikan sehingga batas QA AI tetap berlaku. Validasi Q1–Q3 dan planning disetujui sebelum implementasi.

- [x] Chip 113/112 terlihat pada Configure, sepanjang Train/kuis, dan Results, termasuk saat panel digulir.
- [x] HP: tap nomor membuka dialer dengan nomor yang benar (tidak perlu menekan Panggil). Desktop menampilkan nomor, sumber Komdigi dan catatan 112 belum tersedia di semua daerah; EN/ID berganti tanpa reload.
- [x] Chip tidak menutupi tab, Next, handle sheet atau pin yang terlihat. Coba desktop, HP sekitar 390px, serta sheet 25/50/75%; About dan konfirmasi tetap memakai perilaku modal.

Cara cek: desktop buka `http://localhost:4202/#configure`, HP satu Wi-Fi buka `http://192.168.100.4:4202/#configure`. Refresh lalu ganti EN/ID, gulir Configure, buka kartu tabung dari daftar bagian dan coba pin di dekat topbar. Masuk Latihan/Train, lakukan PASS hingga kuis, kemudian buka Hasil/Results dan gulir. Dua chip, sumber dan catatan harus tetap tersedia. Tap chip di HP hanya sampai dialer terbuka; batalkan tanpa menelepon layanan darurat. Rincian QA/batas perangkat, screenshot dan gate antislop ada di `.cursor/t4.12-report.md`. Check/build dijalankan ulang sebelum commit; browser tidak diuji ulang karena penutupan hanya mengubah dokumentasi. Commit/push ke develop diotorisasi oleh acceptance ini, tanpa lanjut task berikutnya atau mengubah main/deploy produksi.

## T4.11: Ambang kelulusan dan review kuis (30 Okt 2026)

Status: **selesai, acceptance Barkah diterima 30 Oktober 2026**. Barkah mengonfirmasi sudah mengecek T4.11 dan lolos, lalu meminta task/checklist selesai, pembaruan dokumen serta commit/push ke develop. Enam checklist ditutup berdasarkan konfirmasi ini dan bukti QA existing; rincian perangkat/browser pemeriksaan pengguna tidak diberikan sehingga batas QA AI tetap berlaku. Validasi Q1–Q3 dan planning disetujui sebelum implementasi. Check/build dijalankan ulang sebelum commit; browser tidak diuji ulang karena penutupan hanya mengubah dokumentasi. Tidak lanjut task berikutnya atau mengubah main/deploy produksi.

- [x] Ambang ≥75% (6/8) terlihat dekat skor pada ringkasan kuis dan Results.
- [x] Review delapan soal memuat jawaban Anda, Benar/Salah, serta jawaban benar untuk soal salah.
- [x] Review memakai nama bagian; pilihan dan pin saat menjawab tetap bernomor.
- [x] 6/8 lulus; 5/8 belum lulus dan tampil 62,5% ID/62.5% EN.
- [x] EN/ID berganti tanpa reload; hasil/review tetap sama saat pindah tab.
- [x] Mobile sekitar 390 px: review sampai soal terakhir dan tombol aksi dapat digulir tanpa tertutup kontrol, pada semua tinggi snap yang tersedia.

Cara cek desktop: buka `http://localhost:4202/#train`, refresh, Mulai latihan, selesaikan PASS atau gunakan Lewati lalu Berikutnya pada empat langkah, kemudian Ikuti kuis. Jawab delapan soal, tekan Berikutnya setelah setiap jawaban dan Lihat skor pada akhir. Periksa ambang, gulir review sampai soal8 dan tombol Ulangi kuis/Kembali ke latihan/Lihat hasil. Ganti EN/ID, buka Lihat hasil untuk memeriksa ambang dekat skor Results, lalu kembali ke Latihan untuk melihat review sesi yang sama.

Untuk 6/8, jawab benar enam soal pertama: PASS; Bagian2/Pin pengaman; pangkal api; perlahan dan merata; Bagian4/Indikator tekanan; orang lain sudah diberi tahu, api kecil dan terbatas, jalur keluar bebas hambatan. Jawab salah dua soal terakhir. Untuk 5/8, Ulangi kuis dan jawab benar hanya lima soal pertama. Pilihan bernomor tetap mengikuti pemetaan existing 1=tuas, 2=pin, 3=nozzle, 4=tekanan, 5=label, 6=tabung.

Cara cek HP satu Wi-Fi: buka `http://192.168.100.4:4202/#train`, ulangi alur tersebut, lalu coba handle sheet 25/50/75% dan scroll sampai bagian terakhir. Konten tidak wajib muat sekaligus pada sheet pendek; tinggi snap yang berimpit karena ruang di bawah header tetap dilewati. Pada desktop, mode perangkat browser sekitar390px juga dapat dipakai.

Bukti AI: sembilan kelompok khusus pada dev dan produksi, tujuh regresi kuis serta delapan Results lolos; check/build lolos dengan196 key. Screenshot, matriks ringkasan16 permintaan keadaan, click-through, gate antislop, kegagalan probe awal dan batas QA dicatat di `.cursor/t4.11-report.md`. URL lokal/LAN merespons HTTP200 pada30 Oktober2026. HP fisik/AT/Safari/Firefox/zoom OS/Lighthouse/4G/FPS baru belum diuji; simulasi teks memakai token100/200%, bukan pengaturan OS.

## T4.14: Favicon (30 Okt 2026)

Status: **selesai, acceptance Barkah diterima 30 Oktober 2026**. Barkah mengonfirmasi sudah mengecek T4.14 dan lolos, lalu meminta task/dua checklist selesai, pembaruan dokumen serta commit/push ke develop. Checklist mengikuti prompt dan ditutup berdasarkan konfirmasi pengguna serta QA existing. Validasi Q1–Q2 dan planning disetujui sebelum implementasi. SVG utama341 byte dan ICO fallback16/32/48px1.554 byte menampilkan siluet APAR kuning pada bidang gelap. Check/build dijalankan ulang sebelum commit; tidak lanjut task berikutnya atau mengubah main/deploy produksi.

- [x] Favicon terlihat di tab browser; Network tidak menunjukkan favicon404.
- [x] Tampilan desktop/mobile serta OG image tetap benar; asumsi PWA existing tidak berubah.

Cara cek desktop: buka `http://localhost:4214/#configure` pada tab biasa, periksa ikon APAR kuning di sebelah judul tab. Klik Latihan/Train dan Hasil/Results, lalu reload. Jika browser masih menyimpan ikon lama, coba jendela Incognito. Untuk Network: tekan F12, pilih Network, centang Disable cache lalu reload, filter `favicon`; SVG harus200, tanpa404. Buka `/favicon.ico` pada origin yang sama bila ingin memeriksa fallback langsung.

Cara cek HP satu Wi-Fi: buka `http://192.168.100.4:4214/#configure`, pindah ketiga tab dan reload. Pada desktop, ulangi melalui mode perangkat390px. Pada browser HP yang tidak menampilkan bilah tab seperti desktop, periksa ikon melalui daftar tab sesuai browser. Kedua alamat preview lokal/LAN telah merespons200 pada30 Oktober2026, bukan URL deployment baru.

Bukti AI: check/build dan sembilan kelompok QA produksi lokal lolos, enam keadaan desktop1280×900/mobile390×844,12 respons favicon otomatis seluruhnya200; kedua file terverifikasi MIME/byte dan ICO berisi tiga PNG yang dapat didekode. Klik tiga tab dan toggle bahasa berhasil, tanpa overflow/pageerror/console error/request gagal. Metadata OG/Twitter/JSON-LD serta hash gambar share identik dengan baseline; manifest dan service worker tetap tidak ada. Bukti `.cursor/t4.14-production-qa.json`, screenshot dan gate antislop ada di `.cursor/t4.14-report.md`.

Batas QA AI: Computer Use menghentikan capture bilah tab native karena URL browser tidak dapat dipastikan untuk pemeriksaan policy. Chrome nyata sudah meminta SVG dengan200, namun itu bukan bukti visual bilah tab oleh AI. Acceptance visual ditutup berdasarkan konfirmasi Barkah di atas; rincian perangkat/browser pengguna tidak diberikan. HP fisik/Safari/Firefox/AT dan produksi live belum diuji AI; warning chunk besar/shader existing tetap. Browser tidak diuji ulang pada penutupan dokumentasi. Commit/push ke develop diotorisasi, tanpa lanjut task berikutnya atau mengubah main/deploy produksi.

## T4.7: Framing model dan tipografi panel (30 Okt 2026)

**Acceptance final diterima 30 Oktober 2026.** Barkah mengonfirmasi sudah mengecek T4.7 dan lolos, meminta task serta tiga checklist selesai, pembaruan dokumen dan commit/push ke develop. Validasi Q1–Q4, perilaku resize dan planning telah disetujui sebelum implementasi. Tiga cek inline prompt menjadi checklist task ini:

- [x] Desktop: APAR memenuhi porsi kanvas yang wajar saat load, bukan mini di tengah.
- [x] Teks panel terbaca; kontras AA; tidak overflow aneh.
- [x] Mobile sekitar390px: model dan teks tetap nyaman; sheet tidak memotong judul penting.

Cara cek:
1. Desktop buka `http://localhost:4247/#configure`, refresh. Default6kg harus lebih besar (sekitar68% area bebas); coba1/3/6/9kg dan bracket. Buka keenam bagian dari daftar lalu Tutup. Kamera kembali, ukuran antar kapasitas tetap berbeda.
2. Ubah ukuran jendela sebelum menggeser model: framing mengikuti ruang. Setelah orbit atau zoom, ubah ukuran lagi: kamera pilihan Anda dipertahankan. Coba Train lalu kembali Configure. Tap biasa tidak mengunci framing.
3. HP satu Wi-Fi buka `http://192.168.100.4:4247/#configure`, refresh pada portrait sekitar390px. Default half memperlihatkan model lebih besar; coba peek/half/full. Buka kartu bagian: judul/Tutup tetap terlihat, kontrol putaran sementara disembunyikan dan kembali setelah Tutup. Deskripsi panjang digulir.
4. Ganti EN/ID, periksa Configure, PASS/kuis dan Results; coba pembesaran teks. Font utama/kontrol16px, pendukung14px, judul20px/subjudul16px. Coba tahan Squeeze, soal pin, input nama dan ekspor PDF. Tidak ada perubahan arti konten K3.

Bukti AI: check/build196 key dan self-check framing lolos; QA produksi12 kelompok/200 keadaan pada1280×900,1024×900,390×844,844×390 × EN/ID × token100/200% × reduced motion × snap tersedia. Regresi11 PASS/delapan Squeeze/tujuh kuis/delapan Results/empat PDF lolos; 11 pasangan kontras aktif minimal4,63:1, muted komposit6,99:1. Matriks168 keadaan judul hotspot terpisah dan screenshot normal produksi ada di `.cursor/t4.7-report.md`. Dua URL merespons HTTP200 pada30 Oktober2026.

Batas QA AI: area landscape pendek dapat tersisa16px seperti existing; tidak diklaim nyaman untuk model. Pada peek/teks besar, deskripsi memiliki ruang scroll terbatas. Posisi snap yang tingginya sama bukan posisi visual berbeda. Teks200 adalah perubahan token, bukan zoom OS. HP fisik/Safari/Firefox/AT/Lighthouse/4G/FPS baru belum diuji AI. Rincian perangkat pemeriksaan Barkah tidak diberikan; acceptance tidak dianggap bukti pengujian perangkat tambahan oleh AI. Task dan tiga checklist ditutup berdasarkan konfirmasi pengguna. Check/build dijalankan ulang sebelum commit; browser tidak diuji ulang karena penutupan hanya dokumentasi. Commit/push ke develop diotorisasi, tanpa lanjut task berikutnya atau mengubah main/deploy produksi.

## Peta fitur → task
F1: T0.2–T0.3 · F2: T1.3–T1.4 · F3: T1.5–T1.6 · F4: T1.6 · F5: T1.7 · F6: T2.1–T2.2 · F7: T2.3 · F8: T2.4 · F9: T2.5 · F10: T1.1 · F11: T3.2–T3.3 · F15: T3.6 · F16: L4 · Wajib riset (Draco/KTX2, <3 dtk, HP, Vercel, video, GitHub, SEO): T0.3, T3.1, T0.4, T3.4, T3.3
