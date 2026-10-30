# Design system — arah visual "Industrial Safety Studio"

## Riset visual (sumber yang dibuka 24 Okt 2026)
- QuietCubes configurator (ADELT) — ulasan di https://www.webgpu.com/showcase/quietcubes-3d-product-configurator/ ; demo https://configurator.quietcubes.com . Pelajaran: kamera dibatasi ke sudut yang berguna, PBR + lighting rapi, optimasi load & mobile lebih penting dari efek berlebihan, harga dinamis.
- Campooz configurator (elgentos) — https://elgentos.com/cases/campooz-configurator . Pelajaran: panel opsi jelas, harga real-time, screenshot konfigurasi diekspor, widget ringan three.js + Preact.
- voyagi/3d-product-configurator — https://github.com/voyagi/3d-product-configurator (demo https://voyagi-configurator.vercel.app). Pelajaran: studio lighting + contact shadow, splash loading bermerek, fallback error WebGL, aksesibilitas keyboard/ARIA.
- Dappasol "3D Product Configurator Examples (2026)" — https://dappasol.com/guides/3d-product-configurator-examples/ . Pelajaran: "guided beats open-ended" — alur langkah demi langkah lebih sering diselesaikan; kecepatan respons adalah segalanya.
Catatan: hanya halaman di atas yang benar-benar dibuka; tidak ada klaim visual lain.

## Arah yang dipilih
**Dark studio + safety accent**: kanvas 3D gelap netral seperti studio foto (HDRI studio Poly Haven), produk merah APAR jadi fokus; UI berupa panel "glass" tipis mengambang; aksen kuning keselamatan (hazard yellow) untuk interaksi/training; tipografi teknis bersih dengan angka monospace untuk spek & harga. Alur training dibuat *guided* (stepper 1-4). Kesan: premium, teknis, cocok untuk klien industri/L&D.

## Warna (CSS custom properties di `src/styles/tokens.css`)
| Token | Hex | Pakai |
|---|---|---|
| `--bg` | #0E1013 | latar halaman/kanvas |
| `--bg-grad` | #1A1D22 | radial gradient tengah kanvas |
| `--surface` | rgba(22,25,30,0.92) + `backdrop-filter: blur(12px)` | panel; T3.2 menaikkan opacity agar teks/error tetap AA di atas model terang |
| `--border` | rgba(255,255,255,0.08) | garis panel |
| `--text` | #F2F3F5 | teks utama |
| `--text-muted` | #9AA1AC | teks sekunder |
| `--accent` | #FFC629 | aksen safety / CTA / highlight 3D |
| `--accent-ink` | #111111 | teks di atas accent |
| `--brand-red` | #D7263D | badge APAR, elemen api |
| `--success` | #2BC48A | jawaban benar |
| `--danger` | #FF5A5F | jawaban salah/error |
Kontras teks ≥ 4.5:1 (AA). Fallback tanpa backdrop-filter: surface solid #16191E.

## Tipografi
- Inter (400/500/600/700) — UI. JetBrains Mono (500) — angka spek, harga, skor, step counter.
- Skala: 12 / 14 / 16 / 20 / 28 / 40 px; line-height 1.5 teks, 1.2 judul.

T4.7 (acceptance Barkah diterima 30 Okt 2026): panel Configure/hotspot/PASS/kuis/Results memakai token semantik `--panel-fs-body` 16px untuk body/kontrol, `--panel-fs-meta` 14px untuk sumber/status/stepper, `--panel-fs-heading` 20px dan `--panel-fs-subheading` 16px. Harga/skor besar tetap. `--panel-text-muted` #B0B7C2 hanya pada panel/dialog terkait; topbar/PDF/pin tidak diperbesar global. Kontras aktif terburuk 4,63:1 pada komposit panel di atas putih. Label grafik memakai font14px aktual dan ruang sumbu mengikuti ukuran teks.

Overview T4.7 menargetkan APAR default6kg sekitar70% tinggi area bebas, dengan rentang60–75% pada desktop normal dan390×844/half. Pusat orbit tetap pusat model; area di bawah header dan sebelum panel kanan/di atas sheet diperhitungkan dengan margin16px, menyusut bila dimensi kanvas sangat pendek. Kapasitas lain tetap berbeda ukuran. Resize mengikuti ruang sampai orbit/zoom manual; tap dan idle rotation tidak mengunci kamera. Pembatasan aspek/ruang dapat mengecilkan model untuk mencegah clipping. Strip landscape16px existing tetap batas ruang, tanpa perubahan header/snap.

Pembacaan kartu hotspot mobile T4.7 menyembunyikan kontrol putaran bersama opsi konfigurasi, agar judul dan Tutup tetap utuh pada peek/teks200%. Keduanya pulih setelah kartu ditutup; kontrol putaran desktop tetap tampil. Deskripsi tetap scroll dalam ruang tersisa. Arah Industrial Safety Studio ENERGY1/RHYTHM1/MOTION1 dipertahankan.

## Spacing, radius, shadow
Grid 4px: 4, 8, 12, 16, 24, 32, 48. Radius: 8 (tombol), 14 (panel), 999 (chip/hotspot). Shadow panel: `0 8px 32px rgba(0,0,0,.35)`.

## Layout
- Desktop ≥1024px: topbar minimum 56px, tinggi aktual mengikuti teks; kanvas full-bleed; panel kanan 360px mengambang (margin 16). T3.2 memakai wrapping nama/tagline dan ResizeObserver topbar untuk memperbarui ruang scene/panel ketika teks diperbesar, termasuk HP.
- HP (<1024px), T4.2: kanvas mengisi ruang antara topbar dan tinggi panel aktual, termasuk saat drag/transisi. Bottom sheet punya tiga posisi tinggi nyata 25%/50%/75% dari viewport dinamis, default 50%, minimum 176px dan maksimum ruang di bawah topbar dengan jarak 16px. Layar pendek boleh menyatukan posisi; siklus melewati tinggi yang sama. Keyboard virtual membatasi sheet ke area visual yang tersedia; konten tetap scroll terpisah dari handle. Tap/Enter/Space berputar peek→half→full→peek; label EN/ID menyebut posisi dan aksi berikutnya. Target handle min 44×44px, fokus terlihat dan reduced motion tanpa transisi. Saat hotspot dibuka, opsi konfigurasi dan judul tab di panel disembunyikan sementara; kartu menampilkan judul bagian + Tutup di header tetap dan deskripsi yang bisa di-scroll. Tutup mengembalikan opsi beserta pilihan/posisi scroll; snap tidak diubah otomatis. Desktop mempertahankan opsi di atas kartu.

## Komponen
T4.12 (acceptance Barkah diterima 30 Okt 2026): baris darurat di bawah navigasi menjadi bagian topbar yang diukur, bukan overlay viewer/panel. Desktop rata kanan dan membungkus bila perlu; HP dua chip sejajar dengan sumber/catatan di bawah. Semua tautan minimal 44×44px; chip memakai surface-solid/text, border text-muted, radius-pill serta fokus accent. Font 14px untuk nomor dan 12px untuk sumber/catatan, mengikuti token existing. Tanpa ikon/animasi baru; ENERGY 1 / RHYTHM 1 / MOTION 1. Label tab dapat membungkus pada teks besar. Pin desktop membatasi seluruh hitbox ke bawah topbar; layar pendek mempertahankan batas sheet dan boleh menyembunyikan pin yang tidak muat, dengan aksi panel tetap tersedia.

Topbar (logo teks "APAR 3D Trainer", tabs, toggle EN|ID, About) · Tab · Chip pilihan (warna = swatch bulat) · Segmented control (kapasitas) · Toggle switch (bracket) · Spec table (mono) · Price tag besar + label "Illustrative" · Hotspot pin (lingkaran 28px, nomor, pulse ring accent) · Info card · Stepper PASS (4 dot + label) · Hold button dengan progress ring · Quiz option card (state default/selected/correct/wrong) · Score ring · Bar chart SVG · Toast · Modal · Splash loader (progress bar accent).

## 3D look
T4.1: RoomEnvironment + PMREM sebagai IBL studio default, size 128 untuk pointer coarse / 256 untuk pointer fine. Background studio gelap tetap; `ACESFilmicToneMapping`, exposure 1.0, directional light, material dan ground/shadow existing tidak dituning ulang. Pantulan RoomEnvironment lebih lebar/merata daripada HDRI; merah, kuning, perak serta detail tuas/pin tetap terbaca pada desktop dan HP emulasi 390 px. HDRI studio lama tetap dapat dibandingkan lewat `?hdri=1` lalu reload. Pilihan default diterima Barkah pada 28 Okt 2026 setelah menyatakan validasi lolos; rincian perangkat tidak diberikan. Highlight bagian = emissive accent 0.4 + pulse. Api & semprotan: sprite/particle sederhana, bukan simulasi berat.

## Motion
Durasi 150–250ms UI, kamera tween 600–800ms ease-in-out. Hormati `prefers-reduced-motion` (matikan auto-rotate & pulse).

T3.2: perubahan preferensi diikuti tanpa reload; tween aktif langsung mencapai tujuan, highlight/efek statis, durasi hold PASS tetap. Tombol jeda/lanjut putaran berada di panel Configure, dengan label penjelasan/nonaktif bila reduced motion aktif. Fokus di viewer/panel/dialog menjeda putaran. Batas kontrol minimal 3:1; opsi konfigurasi memakai text-muted, fokus primer memakai tinta gelap pada kuning.

## Tone copy
Singkat, jelas, instruktif, ramah. EN: kalimat aktif ("Pull the pin."). ID: baku santai ("Cabut pin pengaman."). Hindari jargon tanpa penjelasan.
