# PRD — Interactive 3D Equipment Trainer & Configurator (APAR)

## 1. Latar belakang & masalah
Barkah Mauludi adalah Unity developer (4+ tahun) yang ingin masuk pasar freelance web 3D. Riset Kiko (22 Okt 2026, sampel ~17 job post + 5 post forum, bukan statistik pasar) menunjukkan kategori yang paling sering dicari: product configurator (8/17, $750–1.500) dan training/edukasi berbasis browser ($750–SGD 5.000). Klien sering hanya mempertimbangkan pelamar yang punya contoh live. Barkah belum punya showcase web 3D live.

## 2. Tujuan
- G1: Satu demo live yang sekaligus membuktikan skill *configurator* dan *browser-based training simulation*.
- G2: Bisa dilink dari barkahmauludi.com dan dari proposal freelance.
- G3: Biaya Rp0 (aset CC0, hosting gratis, library open source).
- G4: Live secepatnya (lihat fase di `implementation-plan.md`).

## 3. Non-goals (MVP)
Login/akun, backend/database, pembayaran nyata (harga hanya ilustrasi), lebih dari satu alat, panel sensor dummy, WebXR, CMS. Konten bukan pengganti pelatihan K3 resmi (wajib disclaimer).

## 4. Persona
- **P1 Calon klien/recruiter** (pemilik bisnis, agensi, L&D manager): buka link dari proposal, punya <1 menit, sering di HP. Ingin lihat: cepat, halus, profesional, fitur mirip kebutuhan mereka.
- **P2 Pengunjung umum/pelajar K3**: ingin belajar cara memakai APAR (PASS) dan menguji diri.

## 5. Fitur
| ID | Fitur | Prioritas |
|---|---|---|
| F1 | Viewer 3D: model APAR GLB (Draco/KTX2), orbit/zoom/pan dibatasi, auto-rotate idle, loading progress | MVP |
| F2 | Hotspot berbasis **posisi 3D** (model satu mesh): pin, tuas/handle, selang/nozzle, gauge, label, tabung; klik → kamera fokus + kartu info. Bagian tidak bisa dianimasi terpisah di MVP | MVP |
| F3 | Configurator varian: tipe isi (Powder ABC, CO2, Foam AFFF, Water), kapasitas (1/3/6/9 kg), warna body (merah, kuning, perak/chrome), bracket opsional | MVP |
| F4 | Spek & harga dinamis: tabel spek + harga ilustrasi (IDR/USD sesuai bahasa) update real-time | MVP |
| F5 | Simpan konfigurasi ke localStorage (maks 10), muat ulang & hapus | MVP |
| F6 | Mode Training PASS: 4 langkah (Pull, Aim, Squeeze, Sweep) dengan penanda hotspot yang berdenyut, fokus kamera, efek visual sederhana (ikon/overlay, api & semprotan partikel), instruksi teks | MVP |
| F7 | Kuis: 8 soal pilihan ganda (termasuk "klik hotspot yang benar" di 3D), feedback langsung + penjelasan, skor | MVP |
| F8 | Dashboard hasil: skor, waktu, jawaban benar/salah, riwayat percobaan (localStorage), ringkasan konfigurasi tersimpan | MVP |
| F9 | Ekspor PDF (jsPDF): sertifikat/laporan latihan + spesifikasi konfigurasi dengan screenshot 3D | MVP |
| F10 | Bilingual EN / ID dengan toggle, ingat pilihan, default dari bahasa browser | MVP |
| F11 | SEO & share: meta, Open Graph image, keyword dari riset, halaman "About this demo" + link ke barkahmauludi.com & GitHub | MVP |
| F15 | Analytics privasi-ramah: Umami Cloud (tanpa cookie) + custom events | MVP |
| F16 | Pemisahan mesh di Blender + animasi bagian (pin tercabut, tuas ditekan) | Later (L4) |
| F12 | Panel sensor dummy (digital twin: tekanan, suhu, status inspeksi) | Later (Fase 2) |
| F13 | WebXR (AR lihat APAR di ruangan / VR latihan) | Later (Fase 3) |
| F14 | Alat tambahan (mis. hydrant box, mesin industri) | Later |

## 6. Metrik sukses
- Load pertama (LCP model tampil) < 3 dtk di Lighthouse mobile (Slow 4G throttling bisa lebih; target utama 4G).
- Lighthouse Performance ≥ 85 mobile, Accessibility ≥ 90.
- Total transfer awal < 3 MB (model + tekstur + JS).
- Live di https://trainer.barkahmauludi.com, repo GitHub publik, video demo 30 dtk tersedia.
- Dipakai di ≥ 1 proposal freelance dalam minggu pertama live.

## 7. Keyword SEO (dari riset)
Three.js, WebGL, WebXR, GLTF/GLB, 3D product configurator, interactive 3D viewer, hotspots, real-time material swapping, digital twin, browser-based training simulation.
