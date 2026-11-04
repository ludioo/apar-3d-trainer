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

## Fase 4 — UX polish & perbaikan review (trim close, 29 Okt 2026)
Temuan review live https://trainer.barkahmauludi.com. Scope close: **13 task** di bawah (urutan prioritas). Library MUST yang masih relevan: RoomEnvironment (T4.1, sudah). Skip lisensi/berat: GSAP, postprocessing penuh, Shepherd, realism-effects. Task enhancement digeser ke Backlog v2.
- T4.8 Perbaiki bug Squeeze press-and-hold: timer jalan dengan mouse/touch/keyboard pada tombol; progress ring; pointerup/cancel batal.
- T4.3 Perbaiki layout kuis mobile: opsi tidak terpotong sticky Next; hilangkan auto-scroll yang menyembunyikan pertanyaan.
- T4.2 Bottom sheet mobile 3 snap (25% / 50% / 75%), default 50%, kanvas mengikuti tinggi sheet. Persetujuan Barkah 28 Okt 2026: perluas pointer drag/snap existing tanpa dependency; lihat decisions.md.
- T4.4 Pin hotspot tap target ≥44×44 px + de-cluster agar tidak bertumpuk di handle.
- T4.12 Tombol nomor darurat 112/113 persisten (chip sticky `tel:`) di chrome UI, EN/ID + sumber.
- T4.11 Hasil kuis: tampilkan ambang 75%, review per soal, nama bagian (bukan "Part 1–6").
- T4.14 Favicon (hilangkan 404) di `public/`.
- T4.1 Ganti HDRI 1.2 MB → RoomEnvironment (addon three.js); bandingkan visual, pertahankan yang lebih baik; catat keputusan.
- T4.7 Framing model lebih besar saat load + perbesar teks panel & naikkan kontras (token design-system, AA).
- T4.17 Terjemahan ID: Bracket, nozzle, gauge, "Config #1" (dan istilah sisa yang masih EN).
- T4.19 About: tombol Close tidak menimpa link.
- T4.16 Hilangkan loncatan layout Train/Kuis: tinggi area tetap / min-height stabil.
- T4.25 Audit ulang Lighthouse mobile + ukuran transfer: verifikasi load < 3 dtk / transfer awal < 3 MB setelah task close Fase 4; laporkan angka.

## Backlog v2 (skip untuk close)
Enhancement yang ditunda; boleh dikerjakan nanti jika project dibuka lagi.
- T4.5 Kartu hotspot menempel di pin (CSS2DRenderer + `@floating-ui/dom`).
- T4.6 Onboarding kunjungan pertama (`driver.js`).
- T4.9 Fidelity configurator: bracket jelas, CO₂ horn/label jujur, warna hanya body.
- T4.10 PDF: toast unduhan + `jspdf-autotable` + jawaban benar untuk soal salah.
- T4.13 Picking dengan `three-mesh-bvh` (hilangkan stall ReadPixels).
- T4.15 `:focus-visible` saja; hilangkan cincin fokus kuning di heading setelah ganti route.
- T4.18 Auto-restore konfigurasi terakhir saat bootstrap.
- T4.20 Splash: progress % akurat saat load model.
- T4.21 Kamera halus dengan `camera-controls` (ganti OrbitControls + lerp).
- T4.22 Animasi UI dengan `motion/mini` (sheet, kartu, toast).
- T4.23 `lil-gui` hanya saat `?debug` (jangan masuk bundle produksi).
- T4.24 Port CSS/vanilla efek React Bits (glow `#FFC629`, spotlight, shimmer CTA).

## Follow-up penutupan (31 Okt 2026)
- T4.26 Polish Results, About, dan loader: label status kuis utuh pada mobile/desktop EN/ID, regresi Close/Escape/backdrop/fokus About, hapus splash setelah fade sukses. Validasi dan planning disetujui sebelum implementasi; tanpa dependency atau fitur baru. Selesai, acceptance Barkah diterima31Oktober2026; empat checklist ditutup, commit/push develop→main dan deploy Vercel diotorisasi.

## Later
- L1 Panel sensor dummy (digital twin). L2 WebXR AR/VR. L3 Alat tambahan. L4 Pisah mesh di Blender + animasi bagian (pin tercabut, tuas ditekan, selang bergerak).

## Fase 5 - Upgrade to RoomFit standard (FireDrill, lean)

Sumber: audit live 4 Nov 2026 vs RoomFit (`docs/mobile-ux-spec.md`, `docs/mobile-testing.md`). Fokus **mobile + desktop**. Domain/DNS/`firedrill.` tetap **manual Barkah** (trainer sudah 307→firedrill; TLS/DNS bisa masih settle). Jangan over-engineer: sheet custom dipertahankan; tidak port `pure-web-bottom-sheet` / `motion/mini` / floating-ui di fase ini.

| ID | Task | Depends | Acceptance (ringkas) |
|---|---|---|---|
| U0 | Baseline bukti vs `mobile-ux-spec` + pasang docs/rules yang belum ada di working tree bila perlu | — | Screenshot Playwright 390×844 / 375×667 / 844×390 / 1440×900 + skor LHCI atau Lighthouse mobile tercatat di progress; isu spek dicentang. Tidak mengubah behaviour app kecuali menambah file docs/rules yang hilang. |
| U1 | Brand FireDrill + `siteConfig` + PWA chrome + About CTA | U0 | Title/header/i18n/manifest/OG-Twitter = FireDrill; `SITE_ORIGIN`/`SITE_NAME`/`CONTACT_URL` satu modul; `theme-color`, apple-touch 180, webmanifest; CTA **Work with me** di About; **tanpa** ubah Vercel domain. |
| U2 | Layout polish mobile + desktop (safe-area, landscape, topbar) | U1 | `viewport-fit=cover` + `env(safe-area-inset-*)`; short-landscape canvas ≥ ~40% tinggi (bukan ~16px), default peek; topbar/emergency compact di tinggi pendek; desktop panel tidak regresi; bukti bounding-box Playwright. |
| U3 | Onboarding tour (`driver.js` lazy) | U2 | First visit 3–5 langkah; Skip/Done simpan flag storage; revisit tanpa tour; reduced-motion aman; tidak blokir `tel:`; lazy import di luar critical path. |
| U4 | QA toolchain setara RoomFit | U3 | ESLint flat, Prettier, Vitest, Playwright config+scripts, `@lhci/cli`, GHA lint/test/build; `npm run check` tetap; tech-stack + AGENTS scripts diperbarui. |
| U5 | Playwright suite mobile+desktop | U4 | Spec smoke Configure/Train/About/brand/landscape/overlap; projects Pixel7/iPhone13/SE/landscape/desktop; video on; `e2e`+`e2e:mobile` hijau dengan screenshot bukti. |
| U6 | Performance pass + LHCI mobile | U5 | `npm run lhci` Perf ≥ 80 (median), A11y ≥ 90; atau blocker three.js terdokumentasi **tanpa** melonggarkan budget; lampirkan skor before/after; subagent performance-engineer. |

Backlog tetap (jangan otomatis masuk Fase 5): T4.5 floating-ui hotspot cards, T4.9 fidelity bracket/CO2, T4.10 PDF autotable, T4.13 mesh-bvh, T4.21 camera-controls, T4.22 motion/mini, T4.23 lil-gui, T4.24 React Bits CSS, Later L1–L4.
