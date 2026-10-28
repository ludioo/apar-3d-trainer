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
| Font | Inter + JetBrains Mono, self-host via `@fontsource` (OFL) | Gratis, tanpa request ke Google. |
| Optimasi aset | `@gltf-transform/cli` (MIT) — draco + KTX2 (etc1s/uastc) + resize tekstur | Wajib dari riset: GLB Draco/KTX2. KTX2 butuh `toktx` (KTX-Software, Apache-2.0) terinstall di mesin build. |
| Storage | `localStorage` | Tanpa login/backend (keputusan Barkah). |
| Hosting | Vercel Hobby (gratis) | Wajib dari riset; deploy otomatis dari GitHub; custom subdomain gratis. Catatan: Hobby untuk penggunaan non-komersial/pribadi — portfolio cocok. |
| Repo | GitHub publik | Wajib dari riset. |
| Analytics | Umami Cloud — paket **Hobby $0**: hingga 100K events/bulan, 1 website, retensi 6 bulan, custom events & event properties, tanpa cookie banner (dicek di https://umami.is/pricing, 27 Okt 2026) | Gratis, privasi-ramah, cukup rinci (permintaan Barkah). Script dimuat `defer` setelah model tampil agar tidak mengganggu target < 3 dtk. |
| QA | Lighthouse (Chrome DevTools), `stats.js` hanya di mode dev (`?debug`) | Ukur load < 3 dtk & fps. |
| Video demo | OBS Studio (gratis) atau screen recorder bawaan OS | Video 30 dtk. |
