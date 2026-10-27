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
- [ ] 6 pin hotspot terlihat di tempat yang benar; klik → kamera mendekat + kartu info dalam bahasa aktif, teks sama dengan content-and-assets.md.
- [ ] Pin di sisi belakang tersembunyi; pin tidak 'melayang' saat diputar.

## T1.5
- [ ] Ganti warna → body berubah instan, detail tekstur tetap.
- [ ] Toggle bracket muncul/hilang.

## T1.6
- [ ] Ganti kapasitas → ukuran & harga berubah.
- [ ] Ganti bahasa → mata uang berganti IDR/USD.
- [ ] Ada label 'Harga ilustrasi'.

## T1.7
- [ ] Save → muncul di daftar; refresh → masih ada; load → kembali ke konfigurasi itu; delete → hilang.
- [ ] Kosong → teks empty state.

## T2.1
- [ ] Bisa menyelesaikan 4 langkah PASS dengan klik/tahan/geser; instruksi sama dengan content-and-assets.md.
- [ ] Skip interaction berfungsi.
- [ ] Disclaimer terlihat.
- [ ] Kartu akhir Train menampilkan 113 & 112 + sumber; di HP `tel:` link bisa diketuk; teks ikut toggle bahasa.

## T2.2
- [ ] Api tampil, semprotan keluar dari arah nozzle, api padam di akhir Sweep.
- [ ] Di HP tetap halus.

## T2.3
- [ ] 8 soal sesuai content-and-assets.md, feedback + penjelasan, skor akhir.
- [ ] Soal 'klik bagian' bisa dijawab dengan klik pin di 3D.
- [ ] 6/8 → Lulus, 5/8 → Belum lulus.

- [ ] Setelah feedback q6 tampil blok nomor darurat 113 & 112 + sumber Komdigi (EN/ID).

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
