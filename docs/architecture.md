# Architecture

## Struktur folder
```
apar-3d-trainer/
├─ AGENTS.md
├─ docs/
├─ index.html              # shell UI: topbar, panel, canvas container
├─ public/
│  ├─ models/apar.glb      # hasil optimasi (Draco+KTX2)
│  ├─ hdri/studio_1k.hdr
│  ├─ decoders/draco/  decoders/basis/   # dicopy dari node_modules/three/examples/jsm/libs
│  ├─ og-image.jpg  favicon.svg  robots.txt  sitemap.xml
├─ assets-src/             # model mentah (tidak di-deploy; boleh .gitignore jika besar)
├─ scripts/optimize-model.sh
├─ src/
│  ├─ main.js              # bootstrap: i18n → scene → router
│  ├─ core/
│  │  ├─ scene.js          # renderer, camera, lights, HDRI, resize, render loop (render on demand)
│  │  ├─ loader.js         # GLTF+Draco+KTX2, LoadingManager → event progress
│  │  ├─ controls.js       # OrbitControls + batas + idle auto-rotate
│  │  ├─ cameraTween.js    # fokus kamera ke target
│  │  ├─ picking.js        # raycaster ke model + jarak ke hotspot terdekat
│  │  ├─ highlight.js      # pulse ring/marker di posisi hotspot (bukan per-mesh)
│  │  ├─ analytics.js      # wrapper Umami: track(name, data), no-op jika tidak ada
│  │  ├─ storage.js        # wrapper localStorage (prefix apar3d:, try/catch, versi skema)
│  │  ├─ events.js         # event bus kecil (on/emit)
│  │  └─ router.js         # hash router → mode
│  ├─ i18n/ i18n.js en.json id.json
│  ├─ data/ product.json hotspots.json pass-steps.json quiz.json emergency.json
│  ├─ features/
│  │  ├─ configurator/ configurator.js pricing.js hotspots.js saved-configs.js
│  │  ├─ training/ training.js effects.js (api, semprotan partikel)
│  │  ├─ quiz/ quiz.js
│  │  ├─ results/ results.js
│  │  └─ pdf/ pdf-report.js pdf-spec.js
│  ├─ ui/ toast.js modal.js components.css hotspot-pins.js hotspots.css
│  └─ styles/ tokens.css base.css layout.css
├─ vite.config.js  package.json  vercel.json  README.md  LICENSE (MIT)
```

## Alur data
1. `main.js` load i18n (bahasa dari storage → navigator.language → `en`) lalu buat scene, mulai load model.
2. `loader.js` emit `load:progress`, `load:done`(gltf), `load:error`.
3. Model Poly Haven diperlakukan sebagai **satu mesh**. Bagian (pin, handle, nozzle, gauge, label, body) didefinisikan sebagai **hotspot posisi** di `hotspots.json` (koordinat lokal model + radius klik). Klik → raycast ke model → titik kena dibandingkan ke hotspot terdekat dalam radius. Ganti warna memakai `material.color` multiplier pada material body.
4. Fitur membaca data JSON + state, mengubah scene lewat API `scene.js`/`highlight.js`, dan menulis hasil via `storage.js`.
5. `router.js` mengaktifkan satu fitur sekaligus (`enter()`/`exit()`), kanvas tetap.
   T1.4: `configurator.js` mengelola listener picking hanya selama Configure; `hotspots.js` mengelola kartu/sesi fokus; `ui/hotspot-pins.js` mengelola proyeksi, oklusi, dan pemisahan pin. Event internal `scene:resize` memperbarui proyeksi setelah kamera/renderer di-resize; `hotspot:pick` membawa hasil picking ke HUD debug (bukan analytics). Timer auto-rotate dapat dijeda/dilanjutkan melalui `controls.pauseAutoRotate()` / `resumeAutoRotate()`; objek kembalian tetap OrbitControls.
6. PDF: `renderer.domElement.toDataURL()` (renderer dibuat dengan `preserveDrawingBuffer: true` hanya saat capture, atau render ulang sebelum capture) → jsPDF.

## Performa
- Render on demand (hanya saat ada perubahan/animasi), pixelRatio maks 2 (HP maks 1.5).
- Tekstur 1K (KTX2), HDRI 1K, satu directional light + environment, shadow pakai contact shadow/plane sederhana.
- jsPDF di-*lazy import* (`import('jspdf')`) saat tombol PDF diklik.

## Layanan eksternal
Vercel (hosting), GitHub (repo), Umami Cloud (analytics). Umami disisipkan oleh `analytics.js` secara dinamis setelah event `load:done` + `requestIdleCallback`, dengan `data-website-id` dari env `VITE_UMAMI_WEBSITE_ID` dan `data-domains="trainer.barkahmauludi.com"` (tidak melacak localhost/preview).

## Analytics events (nama ≤ 50 karakter, aturan Umami)
| Event | Data |
|---|---|
| `variant_change` | `{ option, value }` |
| `hotspot_open` | `{ id }` |
| `config_save` | `{ agent, capacity, color }` |
| `training_start` | `{}` |
| `training_finish` | `{ durationSec, skipped }` |
| `quiz_finish` | `{ score, total, passed }` |
| `pdf_export` | `{ type: "report"|"spec" }` |
| `lang_change` | `{ lang }` |
Tidak ada data pribadi (nama peserta TIDAK dikirim).
