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


## Fase 4 — UX polish & perbaikan review (trim close, 29 Okt 2026)
Urutan prioritas close (13 task): T4.8 → T4.3 → T4.2 → T4.4 → T4.12 → T4.11 → T4.14 → T4.1 → T4.7 → T4.17 → T4.19 → T4.16 → T4.25. Satu task per sesi (Codex/Cursor). Skip task yang sudah ✅ di `docs/progress.md`. Enhancement lain ada di Backlog v2 di `implementation-plan.md` (jangan dikerjakan untuk close).

## T4.8 — Perbaiki Squeeze press-and-hold
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T4.8 dari docs/implementation-plan.md.
Rujukan: docs/user-flows.md, docs/data-model.md, docs/content-and-assets.md

Masalah: langkah Squeeze di Train tidak selesai dengan menahan tombol — hanya Skip yang jalan (bug).

Tanpa library baru. Perbaiki interaksi hold:
1. `pointerdown` / keydown (Space/Enter) pada tombol Squeeze memulai timer ~1 dtk + progress ring.
2. `pointerup` / `pointercancel` / keyup membatalkan jika belum selesai.
3. Harus bekerja dengan mouse, touch, dan keyboard; jangan andalkan hover-only.
4. Setelah hold sukses → lanjut langkah berikutnya seperti acceptance Train.

Cek inline (desktop + mobile ~390 px):
- [ ] Desktop mouse: tahan tombol Squeeze → ring penuh → langkah selesai tanpa Skip.
- [ ] Mobile touch ~390 px: sama; lepas terlalu cepat → batal, bisa coba lagi.
- [ ] Keyboard: fokus tombol + tahan Space/Enter menyelesaikan hold.
- [ ] Skip interaction masih tersedia; langkah PASS lain tidak regress.

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T4.8 di docs/acceptance-criteria.md (jika belum ada, pakai cek inline di prompt ini), update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## T4.3 — Layout kuis mobile (opsi & scroll)
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T4.3 dari docs/implementation-plan.md.
Rujukan: docs/user-flows.md, docs/design-system.md

Masalah: di mobile, opsi jawaban ketiga terpotong tombol Next sticky; setelah menjawab, auto-scroll membuat pertanyaan hilang dari layar.

Tanpa library baru. Perbaiki CSS/JS kuis saja:
1. Area soal punya padding-bottom cukup di atas sticky Next agar semua opsi (termasuk ke-3/ke-4) terlihat.
2. Jangan `scrollIntoView` ke feedback yang mendorong pertanyaan keluar fold; pakai `scroll-margin-top` pada blok pertanyaan; feedback tampil dekat jawaban.
3. Pastikan tombol Next/Submit tetap mudah ditekan (tap ≥44 px).

Cek inline (desktop + mobile ~390 px):
- [ ] Mobile ~390 px: semua opsi choice terlihat penuh tanpa tertutup sticky Next.
- [ ] Setelah pilih jawaban, pertanyaan tetap di viewport; feedback terbaca tanpa scroll manual jauh.
- [ ] Desktop kuis tidak regress; keyboard/Next tetap jalan.
- [ ] Soal pick-hotspot tidak rusak.

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T4.3 di docs/acceptance-criteria.md (jika belum ada, pakai cek inline di prompt ini), update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## T4.2 — Bottom sheet 3 snap points
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T4.2 dari docs/implementation-plan.md.
Rujukan: docs/user-flows.md, docs/design-system.md, docs/architecture.md, library-research.md

Masalah: bottom sheet mobile hanya punya dua posisi (collapse terlalu sedikit / full menutup model), sehingga perubahan warna & varian tidak terlihat.

Library: install `pure-web-bottom-sheet` (~4,3 KB gzip, MIT). Snap 25% / **50%** / 75%; default terbuka di ~50% agar model tetap terlihat di atas. Caveat: butuh Safari/iOS ≥18.2. Jika tidak cocok setelah uji, jatuh ke CSS `scroll-snap` custom 3 posisi (0 dependency) dan catat di decisions.md — jangan biarkan regressi di browser target.

Kerjakan hanya di viewport mobile/narrow; desktop panel kanan jangan diubah perilakunya.

Cek inline (desktop + mobile ~390 px):
- [ ] Mobile: sheet punya ≥3 posisi; default ~50%; model APAR masih terlihat saat half-open.
- [ ] Drag antar snap halus; konten Configure (warna/agent) bisa diubah sambil melihat model.
- [ ] Full (75%) dan peek (25%) berfungsi; tidak menutup input penting.
- [ ] Desktop: panel kanan tidak regress.
- [ ] Bundle tambahan tercatat (~4 KB) di decisions/known-issues.

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T4.2 di docs/acceptance-criteria.md (jika belum ada, pakai cek inline di prompt ini), update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## T4.4 — Pin hotspot ≥44 px & de-cluster
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T4.4 dari docs/implementation-plan.md.
Rujukan: docs/design-system.md, docs/architecture.md, docs/data-model.md

Masalah: pin hotspot di mobile ~24 px (di bawah standar tap 44 px) dan bertumpuk dekat handle.

Tanpa library baru:
1. Hit area pin min 44×44 px (boleh visual lebih kecil + hitbox transparan).
2. De-cluster: stagger/offset posisi layar untuk pin yang saling dekat (terutama handle/pin/nozzle) tanpa menggeser posisi world 3D secara salah.
3. Pastikan oklusi (pin belakang model) dan nomor tetap benar.

Cek inline (desktop + mobile ~390 px):
- [ ] Mobile: tiap pin mudah ditap; tidak ada miss-tap ke pin tetangga.
- [ ] Pin dekat handle tidak saling menumpuk tak terbaca.
- [ ] Desktop: pin tetap rapi; klik masih membuka info/tween.

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T4.4 di docs/acceptance-criteria.md (jika belum ada, pakai cek inline di prompt ini), update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## T4.12 — Chip darurat 112/113 persisten
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T4.12 dari docs/implementation-plan.md.
Rujukan: docs/content-and-assets.md, docs/user-flows.md, docs/design-system.md

Masalah: nomor darurat hanya muncul di beberapa layar.

Tanpa library baru. Tambah chip/tombol kecil sticky di chrome UI (bukan hanya akhir Train/kuis/PDF):
- `tel:113` Pemadam, `tel:112` Darurat umum; sumber Komdigi; catatan 112 belum di semua daerah.
- EN/ID; di HP bisa ditap menelepon; jangan menutupi kontrol utama (taruh pojok aman).

Cek inline (desktop + mobile ~390 px):
- [ ] Chip terlihat di Configure, Train, Results (minimal), bukan hanya satu screen.
- [ ] Mobile: tap `tel:` membuka dialer; desktop menampilkan nomor + sumber.
- [ ] Tidak menutupi tab/Next/pin penting.

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T4.12 di docs/acceptance-criteria.md (jika belum ada, pakai cek inline di prompt ini), update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## T4.11 — Hasil kuis: ambang 75% & review
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T4.11 dari docs/implementation-plan.md.
Rujukan: docs/user-flows.md, docs/content-and-assets.md, docs/data-model.md

Masalah: hasil hanya "Not yet passed" tanpa menyebut batas 75%; soal memakai label "Part 1–6" bukan nama bagian; kurang review per soal.

Tanpa library baru. Update UI hasil + i18n:
1. Tampilkan skor vs ambang lulus 75% (mis. 63% — belum lulus, butuh ≥75%).
2. Review per soal: benar/salah + nama bagian (pin, handle/tuas, nozzle, gauge, label, body) bukan "Part 1–6".
3. EN dan ID konsisten dengan content-and-assets.md.

Cek inline (desktop + mobile ~390 px):
- [ ] Layar hasil menampilkan ambang 75% dengan jelas.
- [ ] Daftar/review per soal memakai nama bagian, bukan Part N.
- [ ] 6/8 lulus dan 5/8 belum lulus tetap benar secara logika.
- [ ] Mobile ~390 px: review bisa di-scroll tanpa ketutup sticky controls.

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T4.11 di docs/acceptance-criteria.md (jika belum ada, pakai cek inline di prompt ini), update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## T4.14 — Favicon
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T4.14 dari docs/implementation-plan.md.
Rujukan: docs/PRD.md, docs/architecture.md

Masalah: favicon 404 di Network.

Tanpa library. Tambah favicon (SVG dan/atau .ico) di `public/`, link di `index.html`, cocok tema Industrial Safety Studio (APAR/aksentuasi `#FFC629` sederhana). Pastikan 404 hilang di production path.

Cek inline (desktop + mobile ~390 px):
- [ ] Tab browser menampilkan favicon; Network tidak 404 untuk favicon.
- [ ] Tidak merusak OG image / PWA asumsi existing.

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T4.14 di docs/acceptance-criteria.md (jika belum ada, pakai cek inline di prompt ini), update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## T4.1 — RoomEnvironment ganti HDRI
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T4.1 dari docs/implementation-plan.md.
Rujukan: docs/architecture.md, docs/tech-stack.md, library-research.md, .cursor/rules/performance-budget.mdc

Masalah: file HDRI studio ~1,2 MB lebih besar dari model APAR; total transfer awal ~2,1 MB membuat target load <3 dtk di HP mepet.

Install/pakai: RoomEnvironment dari addon three.js (0 KB aset tambahan; sudah di paket `three`). JANGAN tambah dependency npm baru di task ini.

Kerjakan:
1. Implementasikan IBL via RoomEnvironment + PMREMGenerator; di HP boleh turunkan size PMREM (128/64).
2. Sediakan cara bandingkan cepat (flag `?hdri=1` atau toggle debug) antara RoomEnvironment vs HDRI lama.
3. Hapus atau jangan preload HDRI di jalur default jika RoomEnvironment dipilih; pastikan file besar tidak ikut transfer awal.
4. Bandingkan visual (studio gelap, APAR merah, aksen kuning) di desktop dan mobile ~390 px; pertahankan opsi yang lebih baik dan catat keputusan di decisions.md.
5. Laporkan ukuran transfer awal sebelum/sesudah.

Cek inline (desktop + mobile ~390 px):
- [ ] Default load tanpa mengunduh HDRI 1.2 MB (Network tab).
- [ ] APAR tetap terbaca jelas di studio gelap; tidak overexposed/underexposed parah.
- [ ] Orbit/zoom tetap normal; tidak ada error konsol terkait env map.
- [ ] Keputusan (RoomEnvironment atau HDRI terkompres) tercatat di decisions.md.

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T4.1 di docs/acceptance-criteria.md (jika belum ada, pakai cek inline di prompt ini), update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## T4.7 — Framing model & tipografi panel
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T4.7 dari docs/implementation-plan.md.
Rujukan: docs/design-system.md, docs/architecture.md

Masalah: di desktop model terlalu kecil saat pertama muncul (~1/4 tinggi layar); teks panel ~10–11 px dan kontras rendah.

Tanpa library baru di task ini. Sesuaikan jarak/target kamera awal (fit lebih dekat) dan token tipografi/warna panel (min ~14 px body UI di mobile, kontras AA vs latar gelap). Jangan ubah makna copy K3.

Cek inline (desktop + mobile ~390 px):
- [ ] Desktop: APAR memenuhi porsi kanvas yang wajar saat load (bukan mini di tengah).
- [ ] Teks panel terbaca; kontras AA; tidak overflow aneh.
- [ ] Mobile ~390 px: model dan teks tetap nyaman; sheet tidak memotong judul penting.

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T4.7 di docs/acceptance-criteria.md (jika belum ada, pakai cek inline di prompt ini), update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## T4.17 — Terjemahan ID istilah sisa
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T4.17 dari docs/implementation-plan.md.
Rujukan: docs/content-and-assets.md, .cursor/rules/i18n-content.mdc

Masalah: di UI ID masih ada istilah Inggris: Bracket, nozzle, gauge, "Config #1", dll.

Tanpa library. Lengkapi `id.json` (dan key terkait): Bracket→Braket (atau "Dudukan dinding"), nozzle→nozél/selang semprot sesuai istilah di content-and-assets, gauge→indikator tekanan, "Config #1"→"Konfigurasi #1". Jangan ubah teks K3 bersumber tanpa menyalin dari content-and-assets.md. Pastikan `npm run check` paritas key EN/ID.

Cek inline (desktop + mobile ~390 px):
- [ ] Mode ID: tidak ada sisa Bracket/nozzle/gauge/"Config #1" di UI utama Configure/Train/Results.
- [ ] Mode EN tetap English.
- [ ] `npm run check` paritas key lolos.

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T4.17 di docs/acceptance-criteria.md (jika belum ada, pakai cek inline di prompt ini), update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## T4.19 — About: Close tidak menimpa link
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T4.19 dari docs/implementation-plan.md.
Rujukan: docs/user-flows.md, docs/design-system.md

Masalah: tombol Close di modal About menimpa/ menutupi link (kredit, GitHub, dll).

Tanpa library. Perbaiki layout modal: spacing header, posisi Close (pojok aman), scroll body, agar semua link bisa diklik/ditap. Cek EN/ID dan keyboard (Esc tutup).

Cek inline (desktop + mobile ~390 px):
- [ ] Semua link About bisa diklik; Close tidak overlapping.
- [ ] Mobile ~390 px: scroll isi About OK; Close tetap terjangkau.
- [ ] Esc / tombol Close menutup modal.

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T4.19 di docs/acceptance-criteria.md (jika belum ada, pakai cek inline di prompt ini), update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## T4.16 — Tinggi tetap Train/Kuis (anti layout jump)
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T4.16 dari docs/implementation-plan.md.
Rujukan: docs/design-system.md, docs/user-flows.md

Masalah: layout Train/Kuis meloncat saat ganti langkah/soal (tinggi konten berubah-ubah).

Tanpa library. Tetapkan min-height / tinggi area konten stepper & kuis yang stabil; skeleton/spacer untuk feedback; hindari reflow yang menggeser tombol Next secara mencolok.

Cek inline (desktop + mobile ~390 px):
- [ ] Ganti langkah PASS → chrome/tombol tidak meloncat jauh.
- [ ] Ganti soal kuis → posisi progress/Next stabil.
- [ ] Mobile ~390 px: tidak ada "jump" yang membuat salah tap.

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T4.16 di docs/acceptance-criteria.md (jika belum ada, pakai cek inline di prompt ini), update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## T4.25 — Audit Lighthouse mobile & budget akhir
```
Baca AGENTS.md lalu docs/progress.md dan docs/known-issues.md. Kerjakan HANYA task T4.25 dari docs/implementation-plan.md.
Rujukan: docs/PRD.md, docs/architecture.md, .cursor/rules/performance-budget.mdc, library-research.md

Setelah task close Fase 4 (T4.8, T4.3, T4.2, T4.4, T4.12, T4.11, T4.14, T4.1, T4.7, T4.17, T4.19, T4.16) selesai atau sudah ✅ di progress: audit ulang performa.

Kerjakan:
1. Lighthouse mobile (atau setara) pada build produksi / URL live; catat Performance, LCP, total transfer awal.
2. Verifikasi target: load model/APAR siap < 3 dtk di 4G simulasi; transfer awal < 3 MB.
3. Bandingkan sebelum (catatan T3.1: median LH ~42, APAR ~4,04 dtk, transfer ~2,32 MB; catatan T4.1: transfer ~1,14 MB setelah RoomEnvironment) vs sesudah task close. Jangan mengasumsikan library backlog (camera-controls, motion, floating-ui, driver, bvh, autotable, lil-gui) sudah terpasang.
4. Jika gagal budget: usulkan 1–2 potongan konkret (jangan kerjakan task lain tanpa diminta).
5. Update progress/decisions dengan angka aktual.

Cek inline:
- [ ] Angka Lighthouse mobile + transfer awal dilaporkan ke Barkah.
- [ ] Lolos atau tidaknya budget <3 dtk / <3 MB dinyatakan eksplisit.
- [ ] `npm run build` + `npm run check` sukses.

Selesai: ikuti .cursor/rules/step-validation.mdc, jalankan npm run build, cek acceptance criteria T4.25 di docs/acceptance-criteria.md (jika belum ada, pakai cek inline di prompt ini), update docs/progress.md, docs/decisions.md, docs/known-issues.md, lalu beri aku ringkasan berbahasa Indonesia + langkah cek + commit message.
```

## Prompt perbaikan bug (umum)
```
Baca AGENTS.md. Ada masalah: <jelaskan apa yang kamu lihat, di HP/desktop, langkahnya, tempel error/screenshot>. Cari penyebab, perbaiki seminimal mungkin tanpa mengubah fitur lain, catat di docs/known-issues.md, update docs/progress.md.
```

## Prompt commit & push
```
Commit semua perubahan dengan commit message yang kamu sarankan, lalu push ke GitHub branch main. Beri tahu aku kalau Vercel perlu dicek.
```

## Fase 5 - Upgrade to RoomFit standard (FireDrill)

Jalankan satu ID per sesi dengan `/ship U<n>`. Agent membaca task di `implementation-plan.md` + prompt di bawah. Domain/DNS tidak dikerjakan di sini.

### U0 - Baseline audit bukti
```
/ship U0

Konteks: Audit Neo 4 Nov 2026 (alias https://apar-3d-trainer.vercel.app): LH mobile Perf 36 / A11y 100 / BP 100 / SEO 100; landscape canvas ~16px; topbar mobile ~206px; brand masih APAR 3D Trainer; tanpa theme-color/apple-touch/manifest; tanpa Work with me. Docs spek: mobile-ux-spec.md + mobile-testing.md; rules mobile.mdc + testing.mdc.

Skills: webapp-testing, verification-before-completion, code-review. Subagent: explore.

1. Pastikan docs/mobile-ux-spec.md, docs/mobile-testing.md, .cursor/rules/mobile.mdc, .cursor/rules/testing.mdc ada dan konsisten (jangan rewrite besar).
2. Ambil baseline Playwright screenshot: 390x844, 375x667, 844x390, 1440x900 (Configure). Simpan di docs/_baselines/u0/ atau .cursor/u0/.
3. Catat skor Lighthouse/LHCI mobile (atau ulang 1 run) di progress + known-issues. Jangan ubah behaviour UI produk di U0.

VERIFY: path screenshot + skor tercantum di progress.md; known-issues mencatat isu spek #1-#11. build/check tetap hijau bila dijalankan. Commit docs/baseline saja.
```

### U1 - Brand FireDrill + siteConfig + PWA chrome + About CTA
```
/ship U1

Konteks: Rename in-app ke FireDrill. Ikuti mobile-ux-spec, design-system, i18n-content. JANGAN ubah domain/Vercel/DNS (Barkah manual; trainer sudah redirect ke firedrill).

Skills: frontend-design, web-design-guidelines, antislop-ui, tdd, code-review, verification-before-completion. Subagent: explore.

1. Tambah src/core/siteConfig.js: SITE_ORIGIN (sementara https://firedrill.barkahmauludi.com atau nilai yang disepakati di decisions — satu tempat saja), SITE_NAME=FireDrill, CONTACT_URL=https://barkahmauludi.com/contact, OG path.
2. Update i18n app.name/tagline bila perlu, index.html title/meta/canonical/OG/Twitter/JSON-LD, splash, About copy agar brand FireDrill. Refresh og:site_name/title/description; og-image existing boleh dipakai ulang bila masih valid, atau regenerate sederhana bertema FireDrill.
3. theme-color, apple-touch-icon 180x180, site.webmanifest (name/short_name FireDrill).
4. About: CTA utama "Work with me" (EN) / padanan ID di atas GitHub; href CONTACT_URL.

Out of scope: DNS, redirect Vercel, Sanity portfolio.

VERIFY: grep hardcode trainer.barkahmauludi.com di src hanya lewat siteConfig atau docs legacy yang disengaja; Playwright cek title/header/manifest/CTA; screenshot mobile+desktop About; lint/check/build (dan test jika ada). Update progress/decisions/known-issues.
```

### U2 - Layout polish mobile + desktop
```
/ship U2

Konteks: mobile-ux-spec current issues #3-#6. Landscape live 844x390 canvas height 16px; topbar 206px. Pertahankan sheet custom (jangan pure-web-bottom-sheet).

Skills: frontend-design, web-design-guidelines, antislop-ui, antislop-layoutmobile, tdd, code-review, webapp-testing, verification-before-completion. Subagent: explore.

1. meta viewport-fit=cover; env(safe-area-inset-*) pada topbar dan sheet; prefer dvh/svh.
2. Short-landscape mode: default snap peek; compact/collapse emergency chrome; pastikan canvas tinggi usable (>= ~40% viewport) — bukti bounding box.
3. Portrait SE: opsi konfigurasi tidak terpotong tanpa cara scroll; peek/half usable.
4. Desktop: tidak regresi panel 360px / hotspot clamp.
5. html/body overflow hidden di layout sheet agar page tidak ikut scroll.

VERIFY: Playwright projects SE + iPhone13 + landscape + desktop; assert canvas height landscape; screenshot before/after; check/build/(test) hijau. Update docs.
```

### U3 - Onboarding tour driver.js
```
/ship U3

Konteks: Backlog T4.6 diangkat ke Fase 5. Ikuti tech-stack (tambah driver.js MIT lazy).

Skills: frontend-design, antislop-ui, webapp-testing, tdd, code-review, verification-before-completion. Subagent: explore.

1. npm i driver.js (versi stabil terbaru; catat di decisions). Dynamic import() hanya saat first visit.
2. Tour 3-5 langkah: panel Configure → hotspot/pin → Train PASS → (opsional) Results/About. Skip + Done menulis flag via storage.js.
3. Styling token design-system (accent #FFC629). Hormati prefers-reduced-motion. Jangan blokir tel:112/113.
4. Jangan masuk critical path bundle awal (bukti: lazy chunk atau network conditional).

VERIFY: e2e first-visit melihat overlay; second visit tidak; reduced-motion path; screenshot mobile+desktop; check/build/test. Update tech-stack + progress.
```

### U4 - QA toolchain
```
/ship U4

Konteks: Setara RoomFit quality gate tanpa mengubah fitur produk.

Skills: webapp-testing, verification-before-completion, code-review, tdd. Subagent: explore.

1. ESLint flat + Prettier; Vitest + tes awal pure (sheetBounds/nearestSnap, pricing, storage, i18n lookup).
2. Playwright config matrix (Pixel7, iPhone13, SE, landscape, desktop) + scripts e2e / e2e:mobile.
3. lighthouserc.cjs formFactor mobile; npm run lhci.
4. .github/workflows/ci.yml: lint → test → build (tanpa LHCI wajib di GHA).
5. Update package.json scripts, AGENTS.md, tech-stack.md, testing.mdc. Pertahankan npm run check.

VERIFY: npm run lint, test, build hijau; playwright install didokumentasikan; progress mencantumkan perintah. Jangan push secrets.
```

### U5 - Playwright suite mobile+desktop
```
/ship U5

Konteks: mobile-testing.md skenario wajib. Skills: webapp-testing, verification-before-completion, antislop-layoutmobile, code-review, tdd. Subagent: explore.

1. Spec smoke Configure/Train/About brand+CTA/landscape canvas/toast-no-overlap (bounding box).
2. video on; artefak test-results gitignored.
3. Baseline opsional docs/_baselines/u5/.

VERIFY: npm run e2e dan e2e:mobile hijau; tempel ringkas output; screenshot mobile+desktop di progress. build tetap hijau.
```

### U6 - Performance pass + LHCI
```
/ship U6

Konteks: Live Perf 36 (Nov 2026); historis T4.25 ~47. Target LHCI mobile Perf >=80 tanpa melonggarkan budget. Ikuti performance-budget.mdc.

Skills: webapp-testing, verification-before-completion, code-review. Subagent: explore + performance-engineer.

1. Profile boot: pecah/defer kerja main-thread three.js non-kritis; pastikan driver/PDF/debug tetap lazy.
2. Jangan naikkan resolusi tekstur/DPR di luar budget.
3. npm run lhci — lampirkan skor 3 run / median. Jika tetap <80, dokumentasikan blocker konkret (file/fungsi) di known-issues; budget assert tetap.

VERIFY: skor before/after di progress; e2e/lint/test/build tidak regresi; keputusan D-PERF tercatat.
```
