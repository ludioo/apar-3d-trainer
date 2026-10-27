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
- 2026-10-27 — T0.2: HDRI Poly Haven `studio_small_09` 1K disimpan sebagai `public/hdri/studio_1k.hdr` (ikut path architecture.md); loader `HDRLoader` (bukan `RGBELoader`, yang sudah legacy di r186); shadow map default `PCFShadowMap` (`PCFSoftShadowMap` dihapus di r186); renderer `alpha: true` + latar CSS radial `--bg-grad`/`--bg`; pan OrbitControls dimatikan (PRD F1 bilang "pan dibatasi" — AC T0.2 tidak butuh pan); batas kamera minDistance 1.5 / maxDistance 8 / minPolar 0.1 / maxPolar π/2−0.05; silinder placeholder sementara di `main.js` (dihapus T0.3) — Barkah setujui plan, AI.
- 2026-10-27 — T0.3: `toktx` tidak ada → tekstur WebP (Draco tetap); script otomatis pakai KTX2 jika `toktx` terpasang, dicoba lagi di T3.1. `@gltf-transform/cli@4.5.1` devDependency (versi dikunci). `--simplify false` agar geometri tidak diubah (9.913 tris tetap). KTX2Loader + decoder Basis tetap dipasang (tidak diunduh selama tidak ada tekstur KTX2). Model dinormalisasi tinggi 1,2 (asli 0,659 m) agar batas kamera T0.2 tetap berlaku. Retry memuat ulang model tanpa reload halaman. Progress % hanya untuk model. Teks splash sementara dibaca langsung dari `en.json` (key juga ada di `id.json`) sampai T1.1. Fallback "WebGL tidak didukung" ditunda ke T3.2. `assets-src/` di-gitignore — Barkah setujui validasi & plan, AI.
- 2026-10-27 — T0.4: alur branch — kerja di `develop` (push = preview Vercel, terkunci login), `main` = produksi; `main` di-fast-forward ke `develop` hanya setelah Barkah memvalidasi task, tanpa PR. Agar yang live selalu yang sudah dicek — Barkah.
- 2026-10-27 — T0.4: `vercel.json` — `/assets/*` cache 1 tahun `immutable` (nama ber-hash Vite); `/models/*`, `/decoders/*`, `/hdri/*` cache 1 hari (`max-age=86400`) karena nama file tetap, sehingga update model (mis. T3.1) sampai ke pengunjung ≤ 1 hari. Menyimpang dari env-setup bagian 9 lama (semua immutable) — Barkah.
- 2026-10-27 — T0.4: DNS barkahmauludi.com ternyata di Rumahweb (nameserver `nsid1–4.rumahweb.*`), bukan Vercel — mengoreksi catatan sebelumnya. CNAME `trainer` → nilai unik dari Vercel ditambahkan di DNS Management Rumahweb. `VITE_UMAMI_WEBSITE_ID` belum diisi (ditunda ke T3.6) — Barkah, AI.
- 2026-10-27 — T1.1: topbar minimal (nama app, tagline, toggle EN|ID) dibuat sekarang dan dilengkapi tab/About di T1.2; mengambang di atas kanvas (glass, 56px) dan di atas splash (z-index 110 > 100) agar bahasa bisa dipilih saat loading/error. Tagline + judul tab browser jadi bukti ganti bahasa; tagline disembunyikan < 1024px — Barkah setujui validasi, AI.
- 2026-10-27 — T1.1: `apar3d:lang` disimpan sebagai string JSON polos (`"en"`/`"id"`) tanpa `schemaVersion`; `schemaVersion` dipakai untuk data objek/array (configs, attempts) di T1.7/T2.3. Bahasa awal: storage → `navigator.language` diawali `id` → ID, selain itu EN. Key yang tak ada di bahasa aktif jatuh ke EN, lalu ke nama key. Kamus di-import statis (kecil, tanpa fetch). Event `lang_change` ke Umami ditunda ke T3.6 (sekarang hanya `lang:change` internal). Font tetap system sampai @fontsource dipasang — Barkah, AI.
- 2026-10-27 — T1.1: `scripts/self-check.js` (`npm run check`, node assert, tanpa dependency) memastikan key `en.json` = `id.json` dan tidak ada nilai kosong. Bold `**113**`/`**112**` di content-and-assets disimpan sebagai teks biasa (markdown dokumen, bukan isi copy); `emergency.source` & `credits.assets` sama di EN/ID sesuai dokumen — AI.
- 2026-10-27 — T1.2: tab utama hanya 3 (Configure/Train/Results); About = link di topbar yang membuka modal `<dialog>` native (`#about`, fokus/Esc/backdrop/top layer gratis), tutup → `replaceState` kembali ke tab sebelumnya. Isi About sementara = disclaimer + nomor darurat + kredit (lengkap di T3.2). Panel hanya judul tab; toast dibuat tanpa pemicu (dipakai T1.7) — Barkah.
- 2026-10-27 — T1.2: tab memakai link `<a href="#…">` + `aria-current="page"`, bukan ARIA tablist (hash berubah native, tanpa logika tombol panah). `router.js` menerima objek modes `{ configure, train, results }` dari `main.js` (fitur mengisi `enter/exit` nanti, tanpa import silang), emit `route:change` & `about:open`; hash kosong/tak dikenal → `#configure` — Barkah setujui plan, AI.
- 2026-10-27 — T1.2: HP (< 1024px) — tab di baris kedua topbar (56 + 44px); area 3D mulai di bawah topbar setinggi 70dvh (menggantikan "~60vh" di design-system agar pas dengan sheet tertutup 30%); bottom sheet 2 posisi 30%/80% (snap ke terdekat, tap/Enter pada handle = toggle). File baru `src/ui/sheet.js` (di luar daftar architecture.md) untuk logika drag — Barkah.
