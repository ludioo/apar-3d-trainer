# Mobile + desktop UX spec (Fase 5 / FireDrill upgrade)

Target: HP mid-range Indonesia (Android Chrome + iOS Safari) **dan** desktop Chrome/Edge. Spec ini menyetarakan APAR 3D Trainer dengan standar RoomFit **tanpa** mengganti sheet custom yang sudah ada.

Sumber kebenaran visual: `docs/design-system.md`. Spec ini merinci viewport, sheet, landscape, safe-area, tap target, dan **isu yang terbukti di audit live 4 Nov 2026**.

## Perangkat & viewport target

| Label | CSS viewport | Catatan |
|---|---|---|
| Narrow Android | 360 × 800 | Topbar + emergency chrome paling rapat |
| iPhone 13/14 logical | 390 × 844 | Default Playwright mobile |
| iPhone SE | 375 × 667 | Tinggi pendek; peek & landscape risk |
| Landscape phone | 844 × 390 / 800 × 360 | **Kritis**: audit live canvas hanya ~16px |
| Desktop | 1280 × 800 / 1440 × 900 | Panel kanan `--panel-w` 360px |
| Tablet portrait | 768–1023 | Tetap layout sheet (breakpoint desktop APAR = **1024px**) |

Emulasi Playwright: lihat `docs/mobile-testing.md`.

## Breakpoints

| Lebar | Layout |
|---|---|
| `< 1024px` | Mobile: canvas di atas sheet; sheet snap peek/half/full (25/50/75%) |
| `≥ 1024px` | Desktop: panel kanan 360px; kanvas full-bleed di sisa ruang |
| Short landscape (`h ≤ 500` dan `w < 1024`) | Mode khusus: default **peek**, emergency chrome dipadatkan/disembunyikan di balik ringkas, kanvas **≥ 40%** tinggi viewport |

Jangan hanya cek `matchMedia` sekali di mount — rotasi harus merespon (`src/ui/sheet.js` sudah punya `syncViewport`; pastikan topbar/emergency ikut).

## Layout mobile

### Canvas
- Mengisi ruang antara topbar terukur dan tinggi sheet aktual.
- `touch-action: none` pada canvas; body **tidak** scroll (`overflow: hidden` pada `html, body` di mobile).
- Framing kamera memperhitungkan ruang bebas (sudah T4.7); jangan biarkan canvas < ~120px di portrait usable.

### Topbar + emergency
- Tap target tab/lang/About ≥ 44px (sudah).
- Emergency chips tetap ada (K3), tapi pada tinggi pendek / landscape harus **compact**: satu baris atau collapse agar tidak memakan 200px+ (audit iPhone 13: topbar **206px**).
- Safe-area: `padding-top: env(safe-area-inset-top)` pada topbar; sheet bawah pakai `env(safe-area-inset-bottom)`.

### Bottom sheet (custom — jangan ganti ke pure-web-bottom-sheet di Fase 5)
- Snap: peek / half / full (nama data-attribute existing).
- Handle ≥ 44px; affordance grabber jelas di landscape.
- Konten scroll di `.panel__body`; handle tidak ikut scroll.
- Default portrait: half. Default short-landscape: **peek**.

### Toast
- Satu host `#toast`; `showToast` sudah reset timer (tidak menumpuk) — pertahankan.
- Posisi di atas sheet / safe-area; jangan overlap handle utama.

## Layout desktop
- Panel kanan mengambang margin 16px; tidak menutupi emergency chips secara permanen.
- Hotspot pins tidak masuk area panel/topbar (batasan T4.12 tetap).
- About / Saved modal: header tetap, body scroll; Close tidak menimpa tautan (T4.19).
- Keyboard: fokus-visible, Esc menutup modal, Tab trap wajar di dialog.

## Meta & PWA chrome
- `viewport` + `viewport-fit=cover`.
- `theme-color`, `apple-touch-icon` 180×180, `site.webmanifest` (name/short_name FireDrill).
- Canonical + OG/Twitter memakai **satu** `SITE_ORIGIN` di `src/core/siteConfig.js` (domain/DNS tetap manual Barkah).

## Onboarding
- Tour `driver.js` lazy pada kunjungan pertama (localStorage flag `apar3d:onboarding` atau key setara lewat `storage.js`).
- 3–5 langkah: Configure options → hotspot → Train PASS → (opsional) Results.
- Skip/Done; hormati `prefers-reduced-motion`; jangan blokir emergency `tel:`.

## About lead-gen
- CTA utama **Work with me** → `CONTACT_URL` (default `https://barkahmauludi.com/contact`) di atas GitHub/portfolio.

## Performance budget (mobile)
- Ikuti `.cursor/rules/performance-budget.mdc`.
- LHCI mobile Performance **≥ 80** (jangan longgarkan diam-diam). Audit live 4 Nov 2026 via `apar-3d-trainer.vercel.app`: Perf **36**, A11y/BP/SEO **100**.
- Transfer awal tetap prefer < 3 MB; GLB tetap teroptimasi.
- `driver.js` / PDF / debug stats **lazy**; jangan masuk critical path.

## Current issues (audit live 4 Nov 2026)

Sumber: Playwright + Lighthouse di box terhadap `https://apar-3d-trainer.vercel.app` (alias produksi). `trainer.barkahmauludi.com` sudah 307 → `firedrill.barkahmauludi.com` (TLS/DNS firedrill belum stabil dari jaringan audit).

1. ~~**Brand** "APAR 3D Trainer"~~ — **done U1** (FireDrill).
2. ~~**Tidak ada** `theme-color`, `apple-touch-icon`, `manifest`~~ — **done U1**.
3. ~~**Viewport** tanpa `viewport-fit=cover`; **nol** `env(safe-area-inset-*)`~~ — **done U2**.
4. ~~**Landscape 844×390** canvas **16px**~~ — **done U2** (peek + compact; baseline **197,5px / 50,6%**).
5. ~~**iPhone SE** opsi terpotong tanpa scroll~~ — **done U2** (panel body scroll; half tetap default portrait).
6. ~~**Topbar mobile ~206px** emergency fully expanded~~ — **done U2** (details collapsed mobile; short-landscape overlay).
7. ~~**Onboarding tour** belum ada~~ — **done U3** (`driver.js@1.10.2` lazy; flag `apar3d:onboarding`).
8. ~~**About** tanpa CTA "Work with me"~~ — **done U1**.
9. **QA toolchain** belum setara RoomFit: tidak ada Vitest / Playwright config / ESLint / Prettier / LHCI / GitHub Actions (U4–U5). Hanya `npm run check` + skrip ad-hoc di `.cursor/`.
10. **Perf mobile 36** (historis T4.25 median ~47) — di bawah target 80 (U6).
11. ~~OG/Twitter refresh FireDrill + `SITE_ORIGIN`~~ — **done U1** (`og-image.jpg` reuse).

Out of scope Fase 5: ganti dependency sheet ke `pure-web-bottom-sheet`, `motion/mini`, `@floating-ui/dom` hotspot cards, Blender mesh split (L4), WebXR (L2), ubah DNS/Vercel domain (manual Barkah).
