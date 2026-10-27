# Prompts (copy-paste satu per sesi)

Urutan: ikuti urutan di bawah. Buka chat baru di Cursor untuk tiap task (Agent mode). Setelah AI selesai, cek `acceptance-criteria.md` task itu; jika lolos, minta "commit dan push".

## T0.1 — Inisialisasi project
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T0.1 dari docs/implementation-plan.md.
Rujukan: docs/tech-stack.md, docs/architecture.md, docs/design-system.md

Buat project Vite template vanilla JS di folder ini (jangan timpa AGENTS.md/docs). Install three versi stabil terbaru. Buat struktur folder sesuai architecture.md (file kosong/stub boleh), src/styles/tokens.css berisi semua token design-system.md, README singkat, LICENSE MIT, .gitignore (termasuk .env.local). Setelah selesai, jalankan npm run dev dan beri aku alamat untuk dibuka.

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T0.1 di docs/acceptance-criteria.md, update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## T0.2 — Scene dasar
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T0.2 dari docs/implementation-plan.md.
Rujukan: docs/architecture.md, docs/design-system.md

Buat scene.js & controls.js: renderer (antialias, ACESFilmic, pixelRatio maks 2/HP 1.5), kamera perspektif, HDRI studio_small_09 1K dari Poly Haven ke public/hdri, ground dengan shadow lembut, OrbitControls dengan batas zoom & polar angle, idle auto-rotate 5 dtk, render on demand. Tampilkan silinder merah placeholder.

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T0.2 di docs/acceptance-criteria.md, update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## T0.3 — Pipeline & load model
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T0.3 dari docs/implementation-plan.md.
Rujukan: docs/content-and-assets.md, docs/architecture.md, docs/user-flows.md

Unduh glTF 1K Korean Fire Extinguisher 01 dari URL di content-and-assets.md ke assets-src/. Buat scripts/optimize-model.sh memakai @gltf-transform/cli (draco + KTX2 + tekstur maks 1024) → public/models/apar.glb; jika toktx tidak tersedia, pakai draco + webp dan catat di known-issues. JANGAN memotong mesh. Copy decoder Draco & Basis ke public/decoders. Buat loader.js dengan progress → splash loader, state error + Retry, pesan koneksi lambat. Laporkan ukuran file akhir, jumlah mesh, dan nama material.

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T0.3 di docs/acceptance-criteria.md, update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## T0.4 — Deploy Vercel + subdomain
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T0.4 dari docs/implementation-plan.md.
Rujukan: docs/env-setup.md

Siapkan vercel.json (header cache panjang untuk /models, /decoders, /assets). Pastikan npm run build sukses, buat commit. Lalu pandu aku langkah demi langkah sesuai env-setup.md bagian 4, 5, 6 (GitHub publik, project Vercel terpisah, domain trainer.barkahmauludi.com). Tunggu konfirmasiku di tiap langkah; jangan menebak nilai CNAME.

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T0.4 di docs/acceptance-criteria.md, update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## T1.1 — i18n
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T1.1 dari docs/implementation-plan.md.
Rujukan: docs/data-model.md, docs/content-and-assets.md, docs/user-flows.md

Buat src/i18n/i18n.js (t(key), setLang, event lang:change, atribut data-i18n), en.json & id.json dengan copy di content-and-assets.md, toggle EN|ID di topbar, simpan apar3d:lang, default dari navigator.language.

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T1.1 di docs/acceptance-criteria.md, update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## T1.2 — Layout UI & router
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T1.2 dari docs/implementation-plan.md.
Rujukan: docs/user-flows.md, docs/design-system.md, docs/architecture.md

Buat topbar, tabs Configure/Train/Results/About, router hash, panel kanan desktop & bottom sheet HP yang bisa di-drag, toast & modal. Semua teks lewat i18n.

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T1.2 di docs/acceptance-criteria.md, update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## T1.3 — Hotspot posisi & picking
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T1.3 dari docs/implementation-plan.md.
Rujukan: docs/architecture.md, docs/data-model.md, docs/content-and-assets.md, docs/known-issues.md

Model diperlakukan SATU mesh (tanpa Blender, tanpa memotong mesh). Buat mode ?debug yang menampilkan koordinat lokal titik yang diklik pada model. Tentukan sendiri koordinat 6 hotspot (pin, handle, nozzle, gauge, label, body) dengan mengklik bagian yang terlihat di model, isi hotspots.json (position, radius, cameraView) dengan teks EN/ID PERSIS dari content-and-assets.md. Buat picking.js (raycast → hotspot terdekat dalam radius) dan highlight.js (pulse ring kuning di posisi hotspot, hormati reduced motion). Kirim aku screenshot/daftar posisi untuk dicek.

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T1.3 di docs/acceptance-criteria.md, update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## T1.4 — Hotspot UI
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T1.4 dari docs/implementation-plan.md.
Rujukan: docs/user-flows.md, docs/data-model.md, docs/design-system.md

Render pin HTML bernomor yang mengikuti posisi hotspot (update saat kamera berubah), sembunyikan saat di belakang model, klik → cameraTween ke cameraView + info card bahasa aktif, tutup → kamera kembali.

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T1.4 di docs/acceptance-criteria.md, update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## T1.5 — Warna & bracket
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T1.5 dari docs/implementation-plan.md.
Rujukan: docs/PRD.md, docs/data-model.md, docs/known-issues.md

Chip warna (merah, kuning, perak) mengubah material body real-time tanpa menghapus tekstur detail (pakai color multiplier pada bodyMaterialName); laporkan jika bagian lain ikut berubah. Toggle bracket (geometri sederhana three.js).

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T1.5 di docs/acceptance-criteria.md, update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## T1.6 — Agent, kapasitas, spek & harga
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T1.6 dari docs/implementation-plan.md.
Rujukan: docs/PRD.md, docs/data-model.md

Isi product.json (agent 4, kapasitas 1/3/6/9 kg) dengan harga & spek ilustrasi bertanda illustrative. Kapasitas mengubah skala, agent mengubah strip warna/label overlay. Spec table mono + price tag (IDR saat ID, USD saat EN) update < 100 ms.

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T1.6 di docs/acceptance-criteria.md, update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## T1.7 — Simpan konfigurasi
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T1.7 dari docs/implementation-plan.md.
Rujukan: docs/user-flows.md, docs/data-model.md

Buat storage.js (prefix apar3d:, try/catch, schemaVersion) dan saved-configs.js: save dengan nama, list, load, delete, maks 10, state kosong & storage tidak tersedia.

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T1.7 di docs/acceptance-criteria.md, update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## T2.1 — Mode Train PASS
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T2.1 dari docs/implementation-plan.md.
Rujukan: docs/user-flows.md, docs/data-model.md, docs/content-and-assets.md

Isi pass-steps.json PERSIS dari content-and-assets.md. Buat training.js: intro, stepper 4 langkah, pulse hotspot + fokus kamera per langkah, interaksi klik hotspot (pull, aim), hold 1 dtk dengan progress ring (squeeze), drag kiri-kanan 3x (sweep), Back/Next/Skip interaction, simpan apar3d:trainingDone. Efek pin terlepas = overlay/sprite, BUKAN animasi mesh. Tampilkan disclaimer.

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T2.1 di docs/acceptance-criteria.md, update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## T2.2 — Efek api & semprotan
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T2.2 dari docs/implementation-plan.md.
Rujukan: docs/user-flows.md, docs/architecture.md

Buat effects.js: api sprite/particle ringan di depan APAR, semprotan dari posisi hotspot nozzle saat squeeze/sweep, api mengecil lalu padam. Hentikan animasi saat tidak dipakai. Jaga ≥30 fps di HP.

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T2.2 di docs/acceptance-criteria.md, update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## T2.3 — Kuis
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T2.3 dari docs/implementation-plan.md.
Rujukan: docs/user-flows.md, docs/data-model.md, docs/content-and-assets.md

Isi quiz.json dengan 8 soal PERSIS dari content-and-assets.md (choice & pick-hotspot, EN/ID, penjelasan, sumber). Buat quiz.js: progress, untuk pick-hotspot tampilkan pin tanpa label, feedback benar/salah + penjelasan, skor, lulus ≥75%, simpan attempt (maks 20).

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T2.3 di docs/acceptance-criteria.md, update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## T2.4 — Dashboard Results
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T2.4 dari docs/implementation-plan.md.
Rujukan: docs/user-flows.md, docs/design-system.md

Buat results.js: kartu skor + score ring, bar chart SVG riwayat, tabel jawaban terakhir, ringkasan konfigurasi tersimpan, input nama peserta, Clear my data dengan konfirmasi, state kosong.

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T2.4 di docs/acceptance-criteria.md, update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## T2.5 — Ekspor PDF
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T2.5 dari docs/implementation-plan.md.
Rujukan: docs/PRD.md, docs/user-flows.md, docs/content-and-assets.md

Install jsPDF, lazy import. pdf-report.js: laporan latihan (nama, tanggal, skor, status, jawaban, disclaimer + sumber, URL). pdf-spec.js: spesifikasi konfigurasi + screenshot kanvas + harga ilustrasi. Bahasa mengikuti toggle.

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T2.5 di docs/acceptance-criteria.md, update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## T3.1 — Performa
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T3.1 dari docs/implementation-plan.md.
Rujukan: docs/PRD.md, docs/architecture.md

Audit Lighthouse mobile & ukuran aset, laporkan angkanya. Optimalkan sampai target (load model < 3 dtk 4G, total awal < 3 MB). Tambah stats.js hanya saat ?debug.

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T3.1 di docs/acceptance-criteria.md, update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## T3.2 — Aksesibilitas & About
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T3.2 dari docs/implementation-plan.md.
Rujukan: docs/user-flows.md, docs/design-system.md, docs/content-and-assets.md

Navigasi keyboard, ARIA, fokus terlihat, kontras AA, prefers-reduced-motion, fallback WebGL, modal About dengan tech stack, disclaimer, sumber K3 (USFA, Permenaker 04/1980), kredit CC0, link barkahmauludi.com & GitHub, catatan 'analytics tanpa cookie (Umami)'.

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T3.2 di docs/acceptance-criteria.md, update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## T3.3 — SEO
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T3.3 dari docs/implementation-plan.md.
Rujukan: docs/PRD.md

Title, meta description EN, keyword dari PRD, Open Graph & Twitter card dengan og-image.jpg (screenshot app 1200×630), canonical https://trainer.barkahmauludi.com, sitemap.xml, robots.txt, JSON-LD SoftwareApplication.

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T3.3 di docs/acceptance-criteria.md, update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## T3.4 — README & video
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T3.4 dari docs/implementation-plan.md.
Rujukan: docs/content-and-assets.md, docs/PRD.md

Tulis README portfolio (judul, GIF/screenshot, fitur, stack, link live, cara run, kredit aset & sumber K3). Buat checklist rekam video 30 dtk mengikuti storyboard untuk aku rekam sendiri.

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T3.4 di docs/acceptance-criteria.md, update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## T3.6 — Analytics Umami
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T3.6 dari docs/implementation-plan.md.
Rujukan: docs/architecture.md, docs/tech-stack.md, docs/env-setup.md

Buat src/core/analytics.js: jika import.meta.env.VITE_UMAMI_WEBSITE_ID ada dan hostname = trainer.barkahmauludi.com, sisipkan script https://cloud.umami.is/script.js secara dinamis (defer, data-website-id, data-domains) SETELAH event load:done + requestIdleCallback. Fungsi track(name,data) aman no-op. Pasang 8 event di tabel architecture.md; jangan kirim nama peserta. Pastikan Lighthouse tidak turun. Lalu pandu aku env-setup.md bagian 7.

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T3.6 di docs/acceptance-criteria.md, update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## T3.5 — Link dari situs utama
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T3.5 dari docs/implementation-plan.md.
Rujukan: docs/env-setup.md

Ini untuk repo barkahmauludi.com (Next.js + Sanity), bukan repo ini. Jelaskan langkahku: tambah item project di Sanity / link di halaman portfolio ke https://trainer.barkahmauludi.com dengan judul, deskripsi singkat, thumbnail og-image.

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T3.5 di docs/acceptance-criteria.md, update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## Prompt perbaikan bug (umum)
```
Baca AGENTS.md. Ada masalah: <jelaskan apa yang kamu lihat, di HP/desktop, langkahnya, tempel error/screenshot>. Cari penyebab, perbaiki seminimal mungkin tanpa mengubah fitur lain, catat di docs/known-issues.md, update docs/progress.md.
```

## Prompt commit & push
```
Commit semua perubahan dengan commit message yang kamu sarankan, lalu push ke GitHub branch main. Beri tahu aku kalau Vercel perlu dicek.
```
