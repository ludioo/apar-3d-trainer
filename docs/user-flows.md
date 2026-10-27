# User flows

Navigasi: single page dengan 3 tab di top bar — **Configure**, **Train**, **Results** — plus toggle bahasa EN/ID dan link "About". Kanvas 3D tetap satu (dipakai bersama semua mode). URL hash: `#configure`, `#train`, `#results`, `#about`.

## UF0 — Masuk & loading
1. Buka URL → splash: logo/nama, progress bar % (dari LoadingManager), teks "Loading 3D model…".
2. Model tampil, auto-rotate pelan, tab default `Configure`.
- **Error WebGL tidak didukung**: pesan + gambar statis APAR + link ke video demo.
- **Error gagal load model**: pesan + tombol "Retry".
- **Loading > 8 dtk**: tampilkan teks "Slow connection, still loading…".

## UF1 — Configure (F1–F5)
1. User orbit/zoom (drag/pinch). Idle 5 dtk → auto-rotate lagi.
2. Hotspot (ikon bulat bernomor, diletakkan per koordinat 3D) tampil di bagian model. Klik → kamera tween ke bagian itu, kartu info muncul (judul, deskripsi singkat). Tutup → kamera kembali.
3. Panel kanan (desktop) / bottom sheet (HP): pilih Agent type, Capacity, Body color, Bracket toggle.
4. Setiap perubahan: material/scale/label berubah < 100 ms, tabel spek & harga ikut berubah.
5. Tombol **Save configuration** → beri nama (default "Config #n") → toast "Saved". Daftar tersimpan di bagian "My configurations" (load / delete).
6. Tombol **Export spec PDF** → unduh PDF spesifikasi + screenshot.
- **Empty**: "My configurations" kosong → teks "No saved configurations yet."
- **Penuh (10)**: tawarkan hapus yang terlama.
- **localStorage tidak tersedia** (mode private tertentu): toast "Saving is not available in this browser"; fitur lain tetap jalan.

## UF2 — Train (F6)
1. Layar intro: "Learn the PASS technique" + tombol Start.
2. Step 1/4 Pull: hotspot pin berdenyut kuning, kamera fokus, instruksi teks; user klik hotspot pin → ikon pin "terlepas" (overlay 2D/sprite, bukan animasi mesh) → Next aktif.
3. Step 2/4 Aim: hotspot nozzle berdenyut; klik → ikon api kecil muncul di depan APAR + garis bidik ke pangkal api.
4. Step 3/4 Squeeze: hotspot tuas berdenyut; tekan & tahan 1 dtk (progress ring) → partikel semprot sederhana dari posisi nozzle.
5. Step 4/4 Sweep: geser kiri-kanan (drag) 3 kali → arah semprotan ikut, api mengecil & padam.
6. Selesai → "Training complete" → tombol "Take the quiz".
- Back/Next selalu ada; tombol "Skip interaction" untuk aksesibilitas.

## UF3 — Quiz (F7)
1. 8 soal, satu per layar, progress "3/8".
2. Tipe A pilihan ganda; Tipe B "klik hotspot yang benar di 3D" (hotspot tampil tanpa label).
3. Setelah jawab: benar (hijau) / salah (merah) + penjelasan; tombol Next.
4. Akhir: skor (mis. 6/8 = 75%), lulus jika ≥ 75%, waktu total. Disimpan otomatis ke riwayat.
5. Tombol: "View results", "Retry quiz".

## UF4 — Results (F8, F9)
1. Kartu skor terbaru + status lulus, grafik bar sederhana riwayat (maks 20 percobaan, CSS/SVG, tanpa library chart).
2. Tabel jawaban terakhir (soal, jawaban, benar/salah).
3. Ringkasan konfigurasi tersimpan.
4. Input nama peserta (opsional) → **Download PDF report** (sertifikat latihan + rincian).
5. Tombol "Clear my data" (konfirmasi).
- **Empty**: belum ada kuis → "Complete the training quiz to see your results" + tombol ke Train.

## UF5 — Bahasa (F10)
Toggle EN/ID → semua teks UI, data hotspot, soal kuis, mata uang harga, dan PDF berganti tanpa reload. Pilihan disimpan.

## UF7 — Analytics (F15)
Tidak terlihat user. Tanpa banner cookie (Umami tidak memakai cookie). Jika Umami diblokir ad-blocker, app tetap jalan normal.

## UF6 — About (F11)
Modal/section: penjelasan demo, tech yang dipakai, disclaimer K3, kredit aset (CC0), link barkahmauludi.com, GitHub, kontak.
