# Implementation plan (lean, task kecil, satu prompt = satu task)

## Fase 0 — Setup (target: hari 1)
- T0.1 Inisialisasi Vite vanilla JS, struktur folder, `tokens.css`, README, LICENSE MIT, `.gitignore`.
- T0.2 Scene dasar: renderer, kamera, HDRI, ground, OrbitControls + batas, resize, render on demand, placeholder silinder.
- T0.3 Pipeline aset: script `scripts/optimize-model.sh` (gltf-transform draco + KTX2 + resize 1K), copy decoder, load `apar.glb` + splash progress + state error.
- T0.4 Deploy awal ke Vercel + subdomain (ikuti `env-setup.md`). → **Live sejak hari pertama.**

## Fase 1 — MVP Configurator
- T1.1 i18n engine + toggle EN/ID + `en.json`/`id.json` awal.
- T1.2 Layout UI: topbar, tabs, router hash, panel desktop / bottom sheet HP.
- T1.3 Hotspot posisi: mode `?debug` untuk baca koordinat klik, isi posisi 6 hotspot di `hotspots.json`, `picking.js` (hotspot terdekat) + `highlight.js` (pulse ring).
- T1.4 Hotspot + kamera tween + info card.
- T1.5 Opsi warna & bracket (material swap real-time).
- T1.6 Opsi agent & kapasitas (scale/label/nozzle) + spec table + harga dinamis.
- T1.7 Simpan/muat/hapus konfigurasi (localStorage).

## Fase 2 — MVP Training & Results
- T2.1 Mode Train: stepper PASS + highlight + interaksi click/hold; Sweep memakai slider berpegangan, target kiri/kanan dan tiga siklus (drag/tap rel/keyboard).
- T2.2 Efek api & semprotan sederhana + padam.
- T2.3 Kuis (choice + pick-hotspot, teks dari content-and-assets.md), feedback, skor, simpan attempt.
- T2.4 Dashboard Results (skor, riwayat SVG, tabel jawaban, clear data).
- T2.5 PDF laporan latihan + PDF spesifikasi konfigurasi (jsPDF, lazy import, bilingual).

## Fase 3 — Polish & launch
- T3.1 Performa: audit Lighthouse, ukuran aset, pixelRatio, target < 3 dtk.
- T3.2 Aksesibilitas & reduced motion, fallback WebGL, About + disclaimer + kredit.
- T3.3 SEO: meta, OG image, sitemap, robots, JSON-LD, keyword.
- T3.4 README portfolio (GIF/screenshot, fitur, stack, link live). README diterima Barkah 28 Okt 2026; video 30 dtk beserta script/checklist rekam ditunda atas keputusan Barkah karena UX masih akan dievaluasi, dikecualikan dari acceptance T3.4 saat ini. Video belum direkam; dilanjutkan setelah keputusan baru.
- T3.6 Analytics Umami (script defer setelah load, custom events, env var).
- T3.5 Link dari barkahmauludi.com (dikerjakan di repo situs utama, lihat prompt).

## Later
- L1 Panel sensor dummy (digital twin). L2 WebXR AR/VR. L3 Alat tambahan. L4 Pisah mesh di Blender + animasi bagian (pin tercabut, tuas ditekan, selang bergerak).
