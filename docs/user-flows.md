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
4. Step 3/4 Squeeze: hotspot tuas berdenyut; selama tekan & tahan 1 dtk (progress ring), semprotan putih keluar dari nozzle. Lepas lebih awal membatalkan hold; sukses 1 dtk menghentikan semprotan. Api belum mengecil.
5. Step 4/4 Sweep: slider kanan→kiri tiga siklus (enam lintasan sah) → arah semprotan ikut, api mengecil per lintasan & padam pada lintasan keenam. Next tetap manual.
6. Selesai → "Training complete" → tombol "Take the quiz".
- Back/Next selalu ada; tombol "Skip interaction" untuk aksesibilitas.

Implementasi T2.1 (28 Okt 2026): Next aktif setelah interaksi/Skip dan perpindahan tetap manual; Back menjaga status langkah. Train sementara memakai ABC 6 kg/merah/tanpa bracket dan mengembalikan pilihan Configure ketika keluar. Pindah tab menjaga sesi, refresh kembali intro; About/blur menghentikan interaksi aktif. Hold parsial diulang dari nol, sedangkan posisi/progres slider Sweep tetap. Disclaimer berada dalam konten panel yang dapat di-scroll, Back/Next di footer tetap. Pada panel diperbesar/layar sangat pendek, ringkas panel untuk memberi ruang target 3D; Fokus ke bagian mengembalikan kamera sesudah orbit.

Revisi Sweep: slider pada panel terpisah dari orbit. Mulai kiri → tujuan kanan disorot; mencapai kanan mengalihkan tujuan ke kiri, dan kembali kiri menyelesaikan satu siklus. Ulangi tiga kali hingga 3/3. Pegangan mengikuti drag, klik/tap rel, atau Arrow/Home/End; label Kiri/Kanan, zona ujung, teks Tujuan dan progres siklus memberi feedback langsung. Gerakan di tengah tidak menambah hitungan. Posisi/tujuan/progres tetap saat jari dilepas, bahasa/panel berubah atau sesi terputus. Pada 3/3 slider nonaktif dan tombol Selesai/Finish aktif; tetap klik manual. Skip menampilkan status dilewati dengan hitungan sebenarnya. Saat masuk Sweep, panel menggulir secukupnya untuk mengungkap kontrol/progres di atas footer, tanpa mengubah snap sheet; petunjuk rinci berada setelah kontrol dan bisa di-scroll.

Implementasi T2.2 (diterima Barkah 28 Okt 2026): api/garis muncul setelah Aim berhasil atau dilewati, dan tetap tersedia saat masuk Squeeze/Sweep. Semprotan dari hotspot nozzle menuju pangkal api, mengikuti slider; setiap input sah memicu emisi yang berhenti setelah 180ms tanpa input. Api mengecil sesuai hitungan enam lintasan, bukan waktu menunggu; padam 250ms setelah lintasan terakhir. Skip Sweep langsung menyembunyikan efek dengan status dilewati dan hitungan asli. Back tidak mereset kondisi api; kembali Pull menyembunyikan efek, Ulangi mereset sesi, keluar/masuk Train mempertahankan progres. Kamera Pull tetap close-up; Aim–Sweep membingkai APAR/nozzle/api bersama, menyesuaikan aspek layar dan area bebas di kiri panel desktop. Snap sheet tidak berubah otomatis; ringkas sheet untuk melihat area 3D yang tertutup.

About/blur/halaman tersembunyi menjeda api serta menghentikan semprotan dan pulse target. Kembali ke halaman/menutup About melanjutkan api sesuai progres; semprotan menunggu input baru. Keluar Train menyembunyikan seluruh efek. Reduced motion memakai api/semprotan statis, perubahan ukuran/arah langsung mengikuti input, tanpa loop partikel atau transisi padam. Efek prosedural tetap ilustrasi pada model/nozzle yang tidak bergerak. Pin terlepas tetap overlay T2.1. Kartu akhir memuat 113/112 + sumber Komdigi, tautan telepon, Ulangi latihan dan informasi kuis menyusul; tombol kuis diaktifkan saat T2.3 diimplementasikan. Status trainingDone menandai alur selesai termasuk Skip, bukan penilaian kompetensi.

## UF3 — Quiz (F7)
1. 8 soal, satu per layar, progress "3/8".
2. Tipe A pilihan ganda; Tipe B "klik hotspot yang benar di 3D" (hotspot tampil tanpa label).
3. Setelah jawab: benar (hijau) / salah (merah) + penjelasan; tombol Next.
4. Akhir: skor (mis. 6/8 = 75%), lulus jika ≥ 75%, waktu total. Disimpan otomatis ke riwayat.
5. Tombol T2.3: "Retry quiz" dan "Back to training". Tombol "View results" menyusul ketika dashboard T2.4 tersedia.

Implementasi T2.3 (28 Okt 2026, menunggu acceptance): tombol Ikuti kuis/Take the quiz pada kartu akhir PASS membuka subalur kuis dalam tab Train tanpa hash/tab baru. Latihan dan efek berhenti selama kuis; tampilan sementara ABC 6 kg/merah/tanpa bracket. Keluar tab memulihkan konfigurasi/kamera, masuk lagi mempertahankan soal/feedback/ringkasan. Kembali ke latihan membuka kartu PASS selesai yang tetap menyediakan Ulangi latihan; Retry quiz memulai sesi kuis baru.

Delapan soal tetap urut, tanpa acak/Back/ubah jawaban. Jawaban pertama langsung dikunci; feedback teks benar/salah, jawaban benar, penjelasan dan tautan sumber mendahului Next manual. Pin q2/q5 hanya bernomor, termasuk aria-label netral Bagian/Part 1–6; nama bagian baru muncul dalam feedback. Framing depan sama untuk kedua soal; drag memutar model tanpa menjawab, Pulihkan tampilan mengembalikan framing netral. Pin teroklusi disembunyikan dan posisi tombol dipisahkan; ringkas sheet untuk melihat model yang tertutup panel. Tab/Enter/Space dapat menjawab pin yang terlihat dari framing awal.

Setelah menjawab q6, tampil blok 113/112 + sumber Komdigi, keterangan cakupan 112 dan link telepon. Jawaban q8 menutup waktu serta menyimpan attempt sekali; feedback q8 tetap sampai Lihat skor/View score ditekan. Ringkasan menampilkan skor/persentase, Lulus/Belum lulus, durasi total termasuk jeda, status simpan dan disclaimer. Penyimpanan maksimal 20 terbaru; gagal storage/riwayat rusak tidak menghalangi skor dan tidak menimpa data lama. Bahasa/About/pindah tab tidak membuat attempt tambahan. Refresh menghapus sesi parsial, menjaga riwayat selesai, dan membuka intro PASS. Tidak ada dashboard/grafik/tabel/Clear data/PDF pada T2.3.

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
