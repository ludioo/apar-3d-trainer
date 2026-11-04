# Tech stack (semua gratis)
Versi: AI WAJIB memakai versi stabil terbaru saat install (`npm i three@latest` dst.) lalu mencatat versi persis di `decisions.md`. Jangan menebak nomor versi.

| Area | Pilihan | Alasan |
|---|---|---|
| 3D | three.js (terpasang 0.186.1) + addons: GLTFLoader, DRACOLoader, KTX2Loader, OrbitControls, RoomEnvironment; PMREMGenerator dari core, HDRLoader lazy hanya `?hdri=1` | T4.1: IBL prosedural menghapus transfer aset HDRI dari jalur default; tanpa dependency baru atau upgrade paket. |
| Bahasa | JavaScript ES modules, tanpa framework | Preferensi Barkah: ringan, native. |
| Bundler / dev server | Vite (`npm create vite@latest` template vanilla) | Justifikasi: import npm `three` + addons dengan tree-shaking, minify, hash file untuk cache, hot reload untuk iterasi prompt cepat, copy decoder Draco/Basis ke `public/`. Output tetap HTML/JS statis biasa. |
| Tween kamera | Implementasi kecil sendiri (lerp + easing) | Hindari dependensi; cukup untuk fokus hotspot. |
| PDF | jsPDF (MIT) | Gratis, client-side, dukung gambar (screenshot canvas). |
| UI | HTML + CSS custom properties (tanpa framework CSS) | Ringan; design token di `design-system.md`. |
| Sheet mobile | Pointer Events + CSS height existing, tiga snap 25/50/75% | T4.2: default 50%, kanvas mengikuti panel; tanpa dependency atau CSS scroll-driven animation dengan batas Safari 18.2. Pilihan ini disetujui Barkah saat planning. |
| Font | Inter + JetBrains Mono, self-host via `@fontsource` (OFL) | Gratis, tanpa request ke Google. |
| Optimasi aset | `@gltf-transform/cli` (MIT) — draco + KTX2 (etc1s/uastc) + resize tekstur | Wajib dari riset: GLB Draco/KTX2. KTX2 butuh `toktx` (KTX-Software, Apache-2.0) terinstall di mesin build. |
| Storage | `localStorage` | Tanpa login/backend (keputusan Barkah). |
| Hosting | Vercel Hobby (gratis) | Wajib dari riset; deploy otomatis dari GitHub; custom subdomain gratis. Catatan: Hobby untuk penggunaan non-komersial/pribadi — portfolio cocok. |
| Repo | GitHub publik | Wajib dari riset. |
| Analytics | Umami Cloud — paket **Hobby $0**: hingga 100K events/bulan, 1 website, retensi 6 bulan, custom events & event properties, tanpa cookie banner (dicek di https://umami.is/pricing, 27 Okt 2026) | Gratis, privasi-ramah, cukup rinci (permintaan Barkah). Script dimuat `defer` setelah model tampil agar tidak mengganggu target < 3 dtk. |
| QA | Lighthouse (Chrome DevTools), `stats.js` hanya di mode dev (`?debug`) | Ukur load < 3 dtk & fps. |
| Video demo | OBS Studio (gratis) atau screen recorder bawaan OS | Video 30 dtk. |

## Fase 5 addendum — libs & QA (selaras RoomFit, tetap hemat)

| Area | Pilihan | Catatan |
|---|---|---|
| Brand / URL | `src/core/siteConfig.js` (`SITE_ORIGIN`, `SITE_NAME`, `CONTACT_URL`) | Domain DNS manual; jangan sebar hardcode. |
| Onboarding | `driver.js@1.10.2` (MIT), **dynamic import** first visit | U3 / backlog T4.6; chunk terpisah dari entry. |
| Sheet mobile | Pointer Events + CSS existing (T4.2) | **Tidak** diganti `pure-web-bottom-sheet` di Fase 5. |
| Unit test | Vitest (terpasang ^5.1) | Pure: `tests/*.test.js` (sheetBounds/nearestSnap, pricing, storage, i18n). `npm test`. |
| E2E | Playwright (`@playwright/test` ^1.64) | Projects: mobile-pixel7 / mobile-iphone13 / mobile-iphone-se / mobile-landscape / desktop (Chromium + viewport); `video: on`; webServer build+preview. `npm run e2e` / `e2e:mobile`. Sekali: `npx playwright install chromium`. |
| Lint/format | ESLint flat (`eslint` ^10 + `@eslint/js`) + Prettier ^3 | `npm run lint` / `npm run format`. |
| Perf CI | `@lhci/cli` ^0.15, `lighthouserc.cjs` formFactor mobile | Perf ≥80, A11y ≥90; `npm run lhci` manual. GHA tanpa LHCI wajib. |
| CI | GitHub Actions (`.github/workflows/ci.yml`) | lint → test → build pada push/PR develop/main. |

Jangan menambah: React, Tailwind, Cypress, Jest, GSAP, Shepherd, Motion+, `lucide-static` penuh.
