# Mobile + desktop testing (Fase 5)

Cara membuktikan upgrade standar RoomFit pada FireDrill tanpa Barkah membaca kode. Skor dan path bukti dilampirkan di `docs/progress.md` / `known-issues.md`.

## Playwright — projects (target U4/U5)

| Project name | Device / viewport | Orientasi |
|---|---|---|
| `mobile-pixel7` | Pixel 7 | portrait |
| `mobile-iphone13` | iPhone 13 (390×844) | portrait |
| `mobile-iphone-se` | iPhone SE 3rd (375×667) | portrait |
| `mobile-landscape` | 844×390 | landscape |
| `desktop` | Desktop Chrome 1440×900 | — |

`video: on` (atau retention on-failure + explicit baseline). Output `test-results/` (gitignore).

Scripts (setelah U4):
- `npm test` — Vitest unit
- `npm run e2e` — semua project
- `npm run e2e:mobile` — empat project mobile
- `npm run lhci` — Lighthouse CI mobile
- `npm run lint` / `npm run format`

## Skenario wajib

| Spec | Dicek |
|---|---|
| Smoke Configure | Splash selesai → canvas terlihat → ganti agent/kapasitas/warna → Save → toast |
| Smoke Train | Langkah PASS bisa dimulai; Squeeze hold tidak putus di mobile |
| Smoke Quiz/Results | Satu soal + buka Results (data uji) |
| Topbar density | Tab/lang/About ≥44px; tidak overflow horizontal di 360/SE |
| Sheet snaps | peek/half/full; handle aria; short-landscape default peek |
| Landscape canvas | Tinggi canvas ≥ 40% viewport (bukan ~16px) |
| Safe-area | Meta `viewport-fit=cover`; padding env pada topbar/sheet |
| About CTA | "Work with me" terlihat dan mengarah ke `CONTACT_URL` |
| Brand | Title/header/manifest = FireDrill |
| Onboarding | First visit menampilkan tour; skip menyimpan flag; revisit tanpa tour |
| Desktop regress | Panel kanan 360px; modal About Close tidak menimpa link |
| Overlap | Toast tidak overlap handle sheet; bounding-box assert |

Jangan `sleep` panjang — locator + `expect`.

## Lighthouse CI — mobile

- Form factor **mobile** tersurat di `lighthouserc.cjs`.
- Assert: Performance ≥ 0.8, Accessibility ≥ 0.9.
- Baseline audit 4 Nov 2026 (vercel.app): Perf **36**, A11y/BP/SEO **100**.
- Jika Perf < 80 karena three.js: **jangan** longgarkan budget; catat blocker di `known-issues.md`.
- GHA: lint → test → build pada push/PR; LHCI manual (sama pola RoomFit).

## Manual — perangkat nyata

1. Production: `https://firedrill.barkahmauludi.com` (setelah DNS/TLS Barkah selesai) atau alias Vercel.
2. Redirect: `https://trainer.barkahmauludi.com` harus 301/307 ke FireDrill.
3. LAN: `npm run dev -- --host`.

### Checklist singkat
- [ ] Portrait 360–412: topbar + sheet rapi, model terlihat
- [ ] Landscape: model usable, sheet peek
- [ ] Notch/home indicator tidak memotong CTA/handle
- [ ] Tour first-visit OK; `tel:` 112/113 tidak terblokir tour
- [ ] Share preview (OG) menampilkan FireDrill + gambar
- [ ] Desktop 1440: panel + hotspot tidak bentrok

## Perintah cepat

```bash
npm run build
npm run check
npm test
npm run e2e
npm run e2e:mobile
npm run lhci
npm run lint
```

Jelaskan ke Barkah (ID): beda emulasi Playwright vs HP fisik.
