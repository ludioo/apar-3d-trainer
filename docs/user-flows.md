# User flows

Navigasi: single page dengan 3 tab di top bar — **Configure**, **Train**, **Results** — plus toggle bahasa EN/ID dan link "About". Kanvas 3D tetap satu (dipakai bersama semua mode). URL hash: `#configure`, `#train`, `#results`, `#about`.

T4.2 mobile/narrow (<1024px): sheet bersama Configure/Train/kuis/Results mulai pada 50%; drag handle memilih 25%/50%/75% terdekat, sedangkan tap/Enter/Space menggilir peek→half→full→peek. Kanvas mengikuti tinggi aktual agar perubahan opsi tetap dapat dilihat pada model. Scroll konten tidak mengubah snap. Posisi pilihan bertahan selama tab/bahasa/hotspot/About/resize dan mobile–desktop–mobile; reload kembali 50%, tanpa localStorage baru. Pada layar pendek snap dibatasi minimum 176px/ruang aman di bawah topbar; posisi berimpit dilewati. Perubahan viewport keyboard menjaga input bisa dijangkau melalui scroll. Desktop tetap panel kanan.

## UF0 — Masuk & loading
1. Buka URL → splash: logo/nama, progress bar % (dari LoadingManager), teks "Loading 3D model…".
2. Model tampil, auto-rotate pelan, tab default `Configure`.
- **Error WebGL tidak didukung/gagal membuat renderer saat startup**: pesan bilingual + gambar statis APAR aplikasi sendiri; navigasi fitur/panel/splash disembunyikan. Bahasa dan About tetap bekerja termasuk URL #about. Tautan video ditunda sampai video T3.4 benar-benar tersedia (disetujui Barkah pada T3.2); tidak menampilkan tautan kosong. Gagal model tetap jalur Retry, bukan fallback WebGL.
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
5. Tombol ringkasan: "Retry quiz", "Back to training", dan "View results" (tersedia sejak T2.4).

Implementasi T2.3 (28 Okt 2026, menunggu acceptance): tombol Ikuti kuis/Take the quiz pada kartu akhir PASS membuka subalur kuis dalam tab Train tanpa hash/tab baru. Latihan dan efek berhenti selama kuis; tampilan sementara ABC 6 kg/merah/tanpa bracket. Keluar tab memulihkan konfigurasi/kamera, masuk lagi mempertahankan soal/feedback/ringkasan. Kembali ke latihan membuka kartu PASS selesai yang tetap menyediakan Ulangi latihan; Retry quiz memulai sesi kuis baru.

Delapan soal tetap urut, tanpa acak/Back/ubah jawaban. Jawaban pertama langsung dikunci; feedback teks benar/salah, jawaban benar, penjelasan dan tautan sumber mendahului Next manual. Pin q2/q5 hanya bernomor, termasuk aria-label netral Bagian/Part 1–6; nama bagian baru muncul dalam feedback. Framing depan sama untuk kedua soal; drag memutar model tanpa menjawab, Pulihkan tampilan mengembalikan framing netral. Pin teroklusi disembunyikan dan posisi tombol dipisahkan; ringkas sheet untuk melihat model yang tertutup panel. Tab/Enter/Space dapat menjawab pin yang terlihat dari framing awal.

T4.3 (diterima Barkah 29 Okt 2026): setelah menjawab, feedback lengkap tampil tepat setelah opsi yang dipilih pada panel, termasuk ketika jawaban berasal dari pin 3D. Fokus masuk feedback tanpa auto-scroll; posisi baca dan pertanyaan yang masih terlihat dipertahankan. Petunjuk yang disembunyikan tetap menyisakan ruang agar opsi tidak meloncat. Footer Next tetap sticky dengan ruang bawah nyata; semua opsi/sumber dapat digulir melewatinya. Pada peek/teks besar, konten tidak wajib muat bersamaan. Sheet tetap 25/50/75% tanpa ekspansi otomatis; Next/Lihat skor manual dan membuka judul berikutnya dari atas. Tidak memaksa judul yang sudah digulir keluar secara manual untuk muncul kembali.

Setelah menjawab q6, tampil blok 113/112 + sumber Komdigi, keterangan cakupan 112 dan link telepon. Jawaban q8 menutup waktu serta menyimpan attempt sekali; feedback q8 tetap sampai Lihat skor/View score ditekan. Ringkasan menampilkan skor/persentase, Lulus/Belum lulus, durasi total termasuk jeda, status simpan dan disclaimer. Penyimpanan maksimal 20 terbaru; gagal storage/riwayat rusak tidak menghalangi skor dan tidak menimpa data lama. Bahasa/About/pindah tab tidak membuat attempt tambahan. Refresh menghapus sesi parsial, menjaga riwayat selesai, dan membuka intro PASS. Tidak ada dashboard/grafik/tabel/Clear data/PDF pada T2.3.

## UF4 — Results (F8, F9)
1. Kartu skor terbaru + status lulus, grafik bar sederhana riwayat (maks 20 percobaan, CSS/SVG, tanpa library chart).
2. Tabel jawaban terakhir (soal, jawaban, benar/salah).
3. Ringkasan konfigurasi tersimpan.
4. Input nama peserta (opsional) → **Download PDF report** (sertifikat latihan + rincian).
5. Tombol "Clear my data" (konfirmasi).
- **Empty**: belum ada kuis → "Complete the training quiz to see your results" + tombol ke Train.

Implementasi T2.4 (diterima Barkah 28 Okt 2026): ringkasan kuis menyediakan Lihat hasil/View results menuju #results. Dashboard memakai panel/bottom sheet existing tanpa mengganti snap pengguna. Kartu memuat skor tersimpan terbaru, ring persentase, status lulus, tanggal dan durasi. Grafik SVG membaca maksimal 20 simpanan terlama→terbaru dengan garis batas 75% dan deskripsi aksesibel; tabel delapan jawaban selalu percobaan terbaru, tidak memilih percobaan dengan klik bar. Persentase kuis/Results memakai maksimal satu desimal agar 5/8 tetap 62,5%, tanpa mengubah skor atau ambang lulus.

Konfigurasi diringkas baca saja (maksimal 10): nama, agent, kapasitas, warna, bracket dan harga ilustrasi saat simpan, IDR/USD menurut bahasa. Kelola konfigurasi menuju Configure. Tidak ada riwayat kuis tetap menampilkan konfigurasi/nama; data rusak atau storage tidak tersedia diberi pesan terpisah per bagian, bukan dianggap kosong. Hasil kuis gagal simpan tetap di ringkasan Train selama sesi; Results memberi keterangan dan hanya menampilkan riwayat yang tersimpan. Refresh tetap menghapus sesi sementara.

Nama peserta opsional dan satu untuk browser ini; maksimal 60 unit karakter native maxlength, trim spasi tepi, simpan pada blur/change/Enter/keluar tab. Ganti bahasa menjaga input/fokus; gagal tulis mempertahankan draft untuk dicoba lagi. Nama bukan identitas historis tiap attempt, dan belum ada tombol PDF sampai T2.5. Disclaimer serta 113/112/sumber Komdigi tetap tersedia di bawah konten.

Clear my data meminta konfirmasi dengan fokus awal Batal; Escape/Batal/backdrop menutup tanpa menghapus dan mengembalikan fokus. Konfirmasi menghapus attempts/configs/participantName/trainingDone, menjaga bahasa dan key aplikasi lain, serta mereset PASS ke intro dan kuis ke idle termasuk hasil belum tersimpan. Clear juga membuang draft nama agar blur/keluar tab tidak menyimpannya kembali. Penghapusan multi-key bukan transaksi: setiap key dicoba; gagal sebagian/total menampilkan pesan sesuai keadaan dan data yang masih dapat dibaca. Sesi memori tetap direset, percobaan ulang hanya lewat konfirmasi Clear berikutnya.

### Ekspor T2.5 (diterima Barkah 28 Okt 2026)

Configure menyediakan Ekspor PDF spesifikasi setelah tabel/catatan/sumber, aktif setelah model siap. PDF memakai pilihan aktif, harga saat ekspor dan spek ilustrasi, tanpa wajib Save. Gambar APAR memakai framing utuh standar dengan model/bracket/warna/label aktif; orbit/kamera/fokus/snap tidak berubah sesudah capture, termasuk bila capture gagal.

Results menyediakan Unduh laporan PDF setelah input nama/petunjuk. Tombol aktif hanya bila ada attempt tersimpan valid; report sama dengan percobaan terbaru pada dashboard, termasuk skor belum lulus, tanggal selesai, durasi dan delapan jawaban. Nama dipangkas dari input saat klik, kosong menjadi tanda -, termasuk draft yang gagal disimpan; nama bukan bukti identitas pemilik riwayat lama. Pesan status simpan berada di bawah tombol agar perubahan teks saat blur tidak menggeser target klik. Nama dengan karakter di luar dukungan Helvetica/WinAnsi menampilkan pesan untuk mengubah/mengosongkan nama; input tetap dipertahankan.

Kedua PDF A4 putih berisi teks selectable, disclaimer existing, kontak 113/112 dan sumber Komdigi di bawah disclaimer, sumber K3, serta URL produksi. Bahasa dan format angka/tanggal/harga memakai pilihan saat klik (ID→IDR, EN→USD); perubahan selama pemuatan library berlaku pada ekspor berikutnya. Nama file apar-report/spec-bahasa-tanggal.pdf tidak memuat nama peserta. Tombol busy mencegah ekspor ganda. Gagal library/capture/pembuatan PDF memberikan pesan dan dapat dicoba lagi. Keluar dari fitur atau Clear membatalkan unduhan yang masih menunggu; masuk lagi memungkinkan permintaan baru. Tidak mengubah simpanan atau hasil historis.

## UF5 — Bahasa (F10)
Toggle EN/ID → semua teks UI, data hotspot, soal kuis, mata uang harga, dan PDF berganti tanpa reload. Pilihan disimpan.

## UF7 — Analytics (F15)
Tidak terlihat user. Tanpa banner cookie (Umami tidak memakai cookie). Jika Umami diblokir ad-blocker, app tetap jalan normal.

## UF6 — About (F11)
Modal/section: penjelasan demo, tech yang dipakai, disclaimer K3, kredit aset (CC0), link barkahmauludi.com, GitHub, kontak.

T3.2: About memuat JavaScript ES modules/three.js/Vite/jsPDF, sumber USFA dan salinan Permenaker PER.04/MEN/1980, disclaimer persis existing, kontak 113/112/sumber Komdigi, tautan dua aset Poly Haven CC0, portfolio/kontak dan repo GitHub. Umami diberi label "Direncanakan" sampai T3.6. Fokus awal judul, Tab/Shift+Tab dibatasi dalam dialog; Tutup/Escape/backdrop mengembalikan fokus ke tautan About. Back/Forward hash juga menutup/membuka overlay tanpa mengganti sesi fitur.

### Akses keyboard T3.2
Tab/Shift+Tab berpindah kontrol, Enter/Space mengaktifkan tombol, Escape menutup dialog/kartu. Configure menyediakan enam nama bagian sesuai urutan nomor existing; membuka kartu menyembunyikan daftar dan Tutup mengembalikan fokus/scroll. PASS memiliki aksi panel untuk Pull/Aim dan tahan satu detik untuk Squeeze, berbagi handler dengan target 3D; lepas awal membatalkan. Sweep tetap panah/Home/End untuk tiga siklus, Next manual dan Skip terpisah. Soal pick-hotspot menyediakan enam pilihan panel netral Bagian/Part 1–6 dengan penguncian/feedback yang sama. Semua pilihan tetap tersedia ketika pin 3D tertutup sheet/model. Jeda putaran di panel Configure mempertahankan pilihan manual selama sesi; fokus di viewer/panel/dialog juga menjeda, lalu idle lima detik sebelum putaran boleh kembali. Reduced motion dinamis meniadakan gerakan dekoratif.
