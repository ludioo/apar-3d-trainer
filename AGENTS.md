# AGENTS.md — APAR 3D Trainer & Configurator
Kamu (AI di Cursor) membangun seluruh project ini. Pemilik (Barkah) TIDAK menyentuh kode; dia hanya mengirim prompt dari `docs/prompts.md` dan mengecek hasil via `docs/acceptance-criteria.md`.

## Cursor rules
Aturan rinci ada di `.cursor/rules/*.mdc` (core-rules, lazy-senior-dev selalu aktif; lainnya aktif sesuai file/situasi). Jika ada konflik, AGENTS.md dan `docs/decisions.md` yang berlaku.

## Wajib dibaca sebelum setiap task
1. `docs/progress.md` (status terakhir) dan `docs/known-issues.md`
2. Task terkait di `docs/implementation-plan.md` (ID mis. `T1.3`)
3. Dokumen yang dirujuk task: `PRD.md`, `architecture.md`, `data-model.md`, `design-system.md`, `content-and-assets.md`, `tech-stack.md`
4. `docs/decisions.md` — jangan membalik keputusan tanpa mencatat keputusan baru.

## Konvensi
- Vanilla JavaScript (ES modules), three.js, Vite. TANPA framework UI (no React/Vue/Svelte), tanpa TypeScript, tanpa Tailwind.
- File & identifier bahasa Inggris, camelCase untuk variabel, kebab-case untuk nama file.
- Semua teks UI lewat `src/i18n/en.json` & `src/i18n/id.json` — jangan hardcode string di HTML/JS.
- Data produk (varian, harga, hotspot, langkah PASS, kuis) hanya di `src/data/*.json`.
- Satu modul = satu tanggung jawab (lihat `architecture.md`). Maks ~300 baris per file.
- Penyimpanan hanya `localStorage` via `src/core/storage.js` (key berprefix `apar3d:`).
- Mobile-first; target load < 3 dtk di 4G, 60 fps desktop, ≥30 fps HP mid-range.

## Dilarang
- Menambah backend, login, database, atau layanan berbayar. Satu-satunya layanan pihak ketiga yang diizinkan: Umami Cloud (Hobby, gratis) lewat `src/core/analytics.js`.
- Mengubah teks K3 (hotspot/kuis/PASS) yang sudah ada di `docs/content-and-assets.md` tanpa sumber; salin apa adanya.
- Memotong/memisah mesh model atau memakai Blender (fase Later L4).
- Memakai aset 3D/gambar/font/audio yang lisensinya bukan CC0/OFL/MIT atau tidak dicatat di `content-and-assets.md`.
- Menyimpan secret/API key di repo.
- Menghapus atau menulis ulang file docs selain update yang diminta.
- Mengerjakan lebih dari satu task ID per prompt.

## Di akhir SETIAP task
1. Jalankan `npm run build` — harus sukses tanpa error.
2. Update `docs/progress.md` (status task, tanggal, catatan singkat).
3. Catat keputusan teknis baru di `docs/decisions.md` (tanggal + alasan).
4. Catat bug/solusi di `docs/known-issues.md`.
5. Tulis ringkasan untuk Barkah dalam Bahasa Indonesia: apa yang berubah, cara mengecek (langkah klik), dan commit message yang disarankan.
