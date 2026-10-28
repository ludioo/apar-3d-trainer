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
- [ ] README di GitHub menampilkan gambar, fitur, link live.
- [ ] Video 30 dtk sudah direkam.

## T3.6
- [ ] Di Umami → Events muncul variant_change, training_start, quiz_finish, pdf_export setelah kamu mencobanya di situs live (ad-blocker dimatikan).
- [ ] Tidak ada banner cookie; nama peserta tidak muncul di Umami.
- [ ] Skor Lighthouse tidak turun dibanding T3.1.
- [ ] Di localhost tidak ada event terkirim.

## T3.5
- [ ] Dari barkahmauludi.com ada link ke demo dan berfungsi.

## Peta fitur → task
F1: T0.2–T0.3 · F2: T1.3–T1.4 · F3: T1.5–T1.6 · F4: T1.6 · F5: T1.7 · F6: T2.1–T2.2 · F7: T2.3 · F8: T2.4 · F9: T2.5 · F10: T1.1 · F11: T3.2–T3.3 · F15: T3.6 · F16: L4 · Wajib riset (Draco/KTX2, <3 dtk, HP, Vercel, video, GitHub, SEO): T0.3, T3.1, T0.4, T3.4, T3.3
