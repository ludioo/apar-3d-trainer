# Known issues & lessons
Format: tanggal — masalah — penyebab — solusi.

## Log
- 2026-10-27 — T0.1: tidak ada issue baru. Catatan: folder `public/models|hdri|decoders` sengaja kosong; favicon/OG belum ada; `scripts/optimize-model.sh` stub (isi di T0.3; di Windows nanti butuh Git Bash/WSL).

## Antisipasi (belum terjadi)
- Model Poly Haven kemungkinan 1 mesh (info pihak ketiga: "1 part, 3 materials") → DIPUTUSKAN 27 Okt 2026: hotspot berbasis posisi, tanpa animasi bagian. Jangan coba memotong mesh lewat kode. Animasi bagian = L4.
- Pin hotspot HTML bisa "melayang" saat kamera bergerak jika posisi tidak diupdate tiap frame kamera berubah → update di event `controls.change`.
- Ad-blocker sering memblokir Umami → `analytics.js` wajib no-op aman (`window.umami?.track`).
- Ganti warna body: jika material body juga dipakai bagian lain (strap/gauge), semua ikut berubah → cek nama material di T1.5, catat temuan.
- KTX2 butuh `toktx` di mesin; jika tidak ada, fallback tekstur WebP via gltf-transform dan catat.
- Decoder Draco/Basis harus dicopy ke `public/decoders`; path salah = model gagal load tanpa pesan jelas.
- Screenshot kanvas untuk PDF bisa hitam jika `preserveDrawingBuffer` false → render ulang tepat sebelum `toDataURL()`.
- Ganti warna body jangan menimpa `map` tekstur; ubah `color` multiplier atau gunakan tekstur netral.
- localStorage bisa throw (Safari private/kuota) → selalu try/catch di storage.js.
- jsPDF font default tidak mendukung semua karakter; teks Indonesia aman (Latin), hindari emoji di PDF.
- DNS subdomain bisa butuh beberapa menit–jam untuk propagasi.
