# Decisions log
Format: tanggal — keputusan — alasan — oleh (Barkah / Rekomendasi Neo / AI).

## Dari Barkah (24 Okt 2026)
- MVP satu alat: APAR; configurator + training PASS + kuis + dashboard PDF. Sensor dummy, WebXR, alat lain = fase berikutnya.
- Biaya nol: aset gratis/CC0, hosting gratis, library gratis.
- Project terpisah di subdomain barkahmauludi.com, di-link dari situs utama.
- Tanpa login/backend; simpan di browser.
- UI dua bahasa EN/ID.
- Vanilla three.js + JavaScript, dibuat dari nol (bukan port Unity), 100% lewat prompt di Cursor.
- Belum ada referensi visual → Neo yang meriset.

## Rekomendasi Neo (24 Okt 2026) — bisa diubah Barkah
- D1 Vite sebagai bundler: import npm three + addons, minify & hashing, hot reload; output tetap statis. Alternatif tanpa bundler (importmap CDN) ditolak karena mengandalkan CDN pihak ketiga dan tanpa minify.
- D2 Subdomain `trainer.barkahmauludi.com`: deskriptif dan sesuai fungsi. Alternatif: `demo.` / `3d.`. Butuh konfirmasi Barkah.
- D3 Model utama Poly Haven "Korean Fire Extinguisher 01" (CC0, ~10K tris, PBR) karena paling realistis di antara kandidat CC0 yang terverifikasi; varian lain dibuat lewat material swap/skala, bukan model terpisah.
- D4 Harga & spek ditandai "ilustrasi": tidak ada data harga asli dari Barkah; mencegah klaim palsu.
- D5 Arah visual "Industrial Safety Studio" (dark studio + aksen kuning safety): produk merah menonjol, terasa premium & industri, selaras referensi QuietCubes/voyagi.
- D6 Training dibuat guided stepper: riset Dappasol "guided beats open-ended".
- D7 Tanpa analytics di MVP: menjaga 0 cost & privasi; Vercel Web Analytics bisa ditambah nanti jika kuota gratis cukup.
- D8 Deploy di hari pertama (T0.4): target "live secepatnya", setiap task langsung terlihat live.
- D9 Lulus kuis ≥ 75% (6/8): angka umum untuk demo; bisa diubah.
- D10 Lisensi repo MIT: repo publik untuk portfolio; aset tetap CC0 sesuai sumbernya.
- D11 Mata uang ikut bahasa (ID→IDR, EN→USD).

## Update 27 Okt 2026 (jawaban Barkah)
- 2026-10-27 — Subdomain final `trainer.barkahmauludi.com` (D2 dikonfirmasi) — Barkah ikut rekomendasi, sesuai konteks showcase & mudah diingat.
- 2026-10-27 — DNS barkahmauludi.com dikelola Vercel (domain dibeli di Rumahweb); trainer dideploy sebagai project Vercel terpisah, subdomain ditambah lewat Settings → Domains project baru; cek nameserver Rumahweb hanya sebagai fallback — Barkah.
- 2026-10-27 — Konten K3 ditulis & dicek Neo berdasarkan USFA dan Permenakertrans PER.04/MEN/1980; flag needsReview dihapus. Kelas minyak masak (hanya di USFA) tidak dipakai karena regulasi Indonesia hanya golongan A–D — Barkah mendelegasikan review ke Neo.
- 2026-10-27 — Tanpa Blender di MVP: model satu mesh, hotspot berbasis posisi; efek PASS memakai overlay/sprite/partikel, bukan animasi mesh. Pemisahan mesh + animasi bagian = fase L4 — Barkah.
- 2026-10-27 — Lulus ≥75% dan mata uang IDR (ID) / USD (EN) dikonfirmasi; harga & spek tetap berlabel ilustrasi (D4, D9, D11) — Barkah.
- 2026-10-27 — D7 diganti: pakai Umami Cloud Hobby ($0, 100K events/bulan, 1 website, retensi 6 bulan, tanpa cookie banner). Script dimuat dinamis setelah model tampil (idle) sehingga tidak masuk jalur kritis load <3 dtk; `data-domains` membatasi ke domain produksi; tidak mengirim nama peserta — Barkah (pilih Umami), detail teknis rekomendasi Neo.
- 2026-10-27 — Soal kuis "pick-part" diganti "pick-hotspot" (konsekuensi model satu mesh) — Neo.
- 2026-10-27 — Nomor darurat pemadam (113) tidak ditampilkan sampai diverifikasi dari sumber resmi — Neo, mencegah info salah.
- 2026-10-27 — Tambah `.cursor/rules/*.mdc` (7 file) mengikuti format contoh Barkah; isi selaras AGENTS.md. `lazy-senior-dev.mdc` disalin dari contoh Barkah (bahasa Inggris, generik) + catatan project — Neo.
- 2026-10-27 — Nomor darurat 113 (Pemadam Kebakaran) & 112 (darurat umum) DITAMPILKAN di Train, Quiz q6, Results, About, PDF; sumber resmi Komdigi layanan112.komdigi.go.id (Permenkominfo 10/2016). Menggantikan keputusan sebelumnya "113 tidak ditampilkan" — Barkah.
- 2026-10-27 — Scope kelas kebakaran hanya A–D (Permenaker 04/1980) dikonfirmasi; kelas minyak goreng tetap tidak dibahas — Barkah.
- 2026-10-27 — Domain utama & project trainer di akun Vercel yang sama; langkah verifikasi TXT dihapus dari env-setup (sisa catatan singkat) — Barkah.
- 2026-10-27 — T0.1: scaffold Vite manual (`package.json` + `vite.config.js` + `index.html`) di repo yang sudah berisi docs/AGENTS, bukan `npm create vite` (hindari overwrite). `three@0.186.1` + `vite@8.3.5` terpasang. Stub penuh pohon architecture; `@fontsource` ditunda; `vercel.json` ditunda ke T0.4 — AI.
