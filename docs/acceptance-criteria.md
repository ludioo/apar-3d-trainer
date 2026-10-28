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
- [ ] Setelah kuis: skor, grafik riwayat, tabel jawaban tampil.
- [ ] Clear my data → data hilang setelah konfirmasi.

## T2.5
- [ ] Download PDF report → berisi nama, skor, tanggal, disclaimer & sumber.
- [ ] PDF spec berisi gambar 3D & harga.
- [ ] Bahasa PDF mengikuti toggle.
- [ ] PDF report memuat nomor darurat 113 (Pemadam) & 112 (umum) + sumber Komdigi di bawah disclaimer.

## T3.1
- [ ] Lighthouse mobile Performance ≥ 85.
- [ ] APAR tampil < 3 dtk di HP dengan 4G.

## T3.2
- [ ] Bisa dipakai dengan Tab/Enter saja.
- [ ] About menampilkan disclaimer, sumber K3, kredit.

## T3.3
- [ ] Share link di WhatsApp/LinkedIn → muncul gambar & judul.

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
