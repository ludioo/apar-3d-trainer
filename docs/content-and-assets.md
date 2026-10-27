# Content & assets

## Model 3D (dicek 24 Okt 2026)
| Kandidat | Sumber | Lisensi | Detail | Status |
|---|---|---|---|---|
| **Korean Fire Extinguisher 01** (UTAMA) | https://polyhaven.com/a/korean_fire_extinguisher_01 ; API https://api.polyhaven.com/files/korean_fire_extinguisher_01 ; glTF 1K: https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/korean_fire_extinguisher_01/korean_fire_extinguisher_01_1k.gltf | CC0 (Poly Haven) | 9.913 tris, merah, gauge, hose, strap kuning, base; tekstur s/d 8K | Dipilih. Download 1K glTF → optimasi Draco+KTX2 → `public/models/apar.glb`. Diperlakukan sebagai satu mesh; hotspot berbasis posisi (keputusan 27 Okt 2026). Pemisahan bagian di Blender = fase L4. |
| Fire Extinguisher CO2 (3D Assets) | https://3dassets.dev/assets/fire-and-emergency-services-fire-extinguisher-co2-8ff6ff35 ; GLB https://cdn.3dassets.dev/assets/29911/v1/model.glb | CC0 1.0 | 364 tris, 4 mesh, 0,06 MB, low-poly, AI-generated menurut kontributor | Cadangan / varian CO2 (horn). Gaya low-poly, kurang premium. |
| Fire Extinguisher (Pixel Modern Office) | https://3dassets.dev/assets/pixel-modern-office-fire-extinguisher-d66bafd8 | CC0 1.0 | 148 tris, gaya pixel | Tidak dipakai (gaya tidak cocok). |
Belum diverifikasi: Sketchfab dan Quaternius untuk APAR — tidak dicek dalam riset ini, jangan dipakai tanpa cek lisensi per model.

## Environment & tekstur
| Aset | Sumber | Lisensi |
|---|---|---|
| HDRI `studio_small_09` (1K .hdr) → file disk `public/hdri/studio_1k.hdr` (~1577 KB) | https://polyhaven.com/a/studio_small_09 | CC0 |
| Ikon UI | Lucide (https://lucide.dev, ISC) — SVG inline, hanya yang dipakai | ISC |
| Font Inter, JetBrains Mono | @fontsource (npm) | OFL-1.1 |
| Api/semprotan | sprite/particle dibuat procedural di kode | — |
| Bracket T1.5 | Geometri prosedural `BoxGeometry` + `TorusGeometry` three.js di `appearance.js`; tanpa unduhan aset | kode proyek MIT |
| Strip/label agent T1.6 | CanvasTexture prosedural 512×128 di shader body; nama agent/kapasitas bilingual, tanpa unduhan. Biru Powder, arang CO2, krem Foam, merah Water = kode visual demo, bukan standar warna APAR | kode proyek MIT |
| Overlay pin T2.1 | SVG inline digambar di `ui/training-target.js` (lingkaran + batang pin); hanya ilustrasi pin terlepas, tanpa unduhan atau animasi mesh | kode proyek MIT |
| OG image | screenshot dari app sendiri (1200×630) | milik Barkah |

## Copy inti (EN / ID) — disimpan di `src/i18n/*.json`
- Title: "Interactive 3D Fire Extinguisher Trainer & Configurator" / "Pelatihan & Konfigurator APAR 3D Interaktif"
- Tagline: "Configure it. Learn PASS. Prove it." / "Konfigurasi. Pelajari PASS. Buktikan."
- Tabs: Configure/Konfigurasi · Train/Latihan · Results/Hasil · About/Tentang
- PASS: Pull — "Pull the pin." / "Cabut pin pengaman." · Aim — "Aim the nozzle at the base of the fire." / "Arahkan nozzle ke pangkal api." · Squeeze — "Squeeze the handle." / "Tekan tuas." · Sweep — "Sweep side to side." / "Sapukan ke kiri dan kanan."
- Disclaimer: lihat bagian Disclaimer di bawah.
- Harga: "Illustrative price" / "Harga ilustrasi".
- Kredit: "3D model & HDRI: Poly Haven (CC0)".

## Sumber K3 (dibuka & dicek 27 Okt 2026)
- **[USFA]** U.S. Fire Administration (FEMA), "Choosing and Using Fire Extinguishers": https://www.usfa.fema.gov/prevention/home-fires/prepare-for-fire/fire-extinguishers/ — PASS, checklist kapan boleh memadamkan, kelas api, perawatan (gauge, selang, nozzle).
- **[PERMENAKER]** Permenakertrans No. PER.04/MEN/1980 tentang Syarat-syarat Pemasangan dan Pemeliharaan APAR (salinan PDF: https://www.its.ac.id/burb/wp-content/uploads/sites/106/2023/07/PER.04-1980-APAR.pdf) — Pasal 1 (definisi APAR), Pasal 2 (golongan kebakaran A–D), Pasal 8 (tinggi pasang 1,2 m), Pasal 11–12 (pemeriksaan 6 & 12 bulan).
- Tidak bisa dibuka: halaman OSHA eTools (403 dari server kami) dan halaman NFPA (konten tidak termuat). Tidak dikutip.
- **Perbedaan sumber:** USFA menyebut 5 tipe utama termasuk untuk minyak nabati/hewani & lemak di peralatan masak (dapur komersial); Permenaker 04/1980 hanya golongan A, B, C, D. App memakai golongan A–D sesuai regulasi Indonesia dan **tidak** membuat soal tentang kelas minyak masak. Jika ingin menambahkannya, tandai `needsReview: true`.

## Teks hotspot (salin persis ke `src/data/hotspots.json`)
| id | EN | ID | Sumber |
|---|---|---|---|
| `pin` | **Safety pin** — Locks the handle so it can't be squeezed by accident. Step 1 of PASS: pull the pin, keeping the nozzle pointed away from you. | **Pin pengaman** — Mengunci tuas agar tidak tertekan tanpa sengaja. Langkah 1 PASS: cabut pin, dengan nozzle mengarah menjauhi tubuh. | USFA |
| `handle` | **Handle / lever** — Squeeze it slowly and evenly to discharge the agent. Release it to stop. | **Tuas** — Tekan perlahan dan merata untuk menyemprotkan isi. Lepaskan untuk berhenti. | USFA (lepas untuk berhenti = cara kerja tuas; deskriptif) |
| `nozzle` | **Hose & nozzle** — Aim low, at the base of the fire, and sweep side to side. Check it is not blocked, cracked or damaged. | **Selang & nozzle** — Arahkan rendah ke pangkal api, lalu sapukan ke kiri dan kanan. Pastikan tidak tersumbat, retak, atau rusak. | USFA; PERMENAKER Ps.12(1)c |
| `gauge` | **Pressure gauge** — Shows whether pressure is too high or too low. Check it during every inspection. | **Indikator tekanan** — Menunjukkan apakah tekanan terlalu tinggi atau terlalu rendah. Periksa setiap inspeksi. | USFA; PERMENAKER Ps.12(1)a |
| `label` | **Label** — Shows which fire classes it can fight. A multipurpose "A-B-C" unit covers ordinary solids, flammable liquids/gases, and live electrical fires. Keep the label readable. | **Label** — Menunjukkan golongan kebakaran yang bisa dipadamkan. APAR serbaguna "ABC" untuk bahan padat, cairan/gas mudah terbakar, dan instalasi listrik bertegangan. Label harus selalu terbaca. | USFA; PERMENAKER Ps.2 & Ps.12(1)b |
| `body` | **Cylinder** — Must be free of dents and rust. In Indonesia, APAR is inspected twice a year (6- and 12-month checks) and mounted with its top 1.2 m above the floor. | **Tabung** — Tidak boleh penyok atau berkarat. Di Indonesia, APAR diperiksa 2 kali setahun (pemeriksaan 6 dan 12 bulan) dan dipasang dengan puncak 1,2 m dari lantai. | USFA; PERMENAKER Ps.8, Ps.11 |

## Langkah PASS (`pass-steps.json`)
| id | hotspot | EN | ID |
|---|---|---|---|
| `pull` | pin | Pull the pin. Keep the nozzle pointed away from you. | Cabut pin pengaman. Jaga nozzle mengarah menjauhi tubuh. |
| `aim` | nozzle | Aim low, at the base of the fire. | Arahkan rendah, ke pangkal api. |
| `squeeze` | handle | Squeeze the lever slowly and evenly. | Tekan tuas perlahan dan merata. |
| `sweep` | nozzle | Sweep the nozzle from side to side. | Sapukan nozzle ke kiri dan kanan. |
Sumber: USFA.

## Kuis 8 soal (`quiz.json`) — jawaban benar ditandai ✅
1. `q1` choice — EN: What does PASS stand for? / ID: Apa kepanjangan PASS?
   a) Pull, Aim, Squeeze, Sweep ✅ · b) Push, Aim, Spray, Stop · c) Pull, Activate, Spray, Sweep
   Penjelasan EN: PASS = Pull the pin, Aim low, Squeeze the lever, Sweep side to side. / ID: PASS = Pull (cabut pin), Aim (arahkan), Squeeze (tekan tuas), Sweep (sapukan). [USFA]
2. `q2` pick-hotspot — EN: Click the part you remove first. / ID: Klik bagian yang dicabut pertama kali. → `pin` ✅. Penjelasan: Pin pengaman mengunci tuas; harus dicabut dulu. [USFA]
3. `q3` choice — EN: Where should you aim? / ID: Ke mana semprotan diarahkan?
   a) At the top of the flames · b) At the base of the fire ✅ · c) At the smoke
   Penjelasan EN: Aim low, at the base of the fire. / ID: Arahkan rendah ke pangkal api. [USFA]
4. `q4` choice — EN: How should you squeeze the lever? / ID: Bagaimana cara menekan tuas?
   a) Slowly and evenly ✅ · b) In quick short bursts · c) As hard as possible, once
   Penjelasan: "Squeeze the lever slowly and evenly." / Tekan perlahan dan merata. [USFA]
5. `q5` pick-hotspot — EN: Click the part that shows if pressure is too high or too low. / ID: Klik bagian yang menunjukkan tekanan terlalu tinggi/rendah. → `gauge` ✅ [USFA]
6. `q6` choice — EN: When is it OK to fight a fire yourself? / ID: Kapan boleh memadamkan api sendiri?
   a) Others are alerted, the fire is small and contained, and you have a clear escape route ✅ · b) Whenever you have an extinguisher nearby · c) When the room is filling with smoke but you are close to the fire
   Penjelasan EN: Only if all checklist answers are "yes"; otherwise alert others, leave, and call the fire department. / ID: Hanya jika semua jawaban checklist "ya"; jika ragu, beri tahu orang lain, keluar, dan hubungi pemadam kebakaran. [USFA]
   Catatan UI: setelah feedback q6 tampilkan blok nomor darurat (lihat §Nomor darurat). [KOMDIGI112]
7. `q7` choice — EN: Under Indonesian regulation, a Class C (Golongan C) fire is… / ID: Menurut regulasi Indonesia, kebakaran Golongan C adalah…
   a) Solid materials like wood or paper · b) Live electrical installations ✅ · c) Burning metals
   Penjelasan: Permenaker 04/1980 Ps.2: A padat (bukan logam), B cair/gas mudah terbakar, C instalasi listrik bertegangan, D logam. USFA juga: Class C = peralatan listrik, agen tidak menghantarkan listrik. [PERMENAKER, USFA]
8. `q8` choice — EN: In Indonesia, how often must an APAR be inspected? / ID: Di Indonesia, berapa kali APAR wajib diperiksa?
   a) Once every 5 years · b) Twice a year (6- and 12-month checks) ✅ · c) Only after it is used
   Penjelasan: Permenaker 04/1980 Ps.11(1). [PERMENAKER]
Lulus: ≥ 6/8 (75%).

## Disclaimer (tetap tampil di Train, Results, PDF)
EN: "Demo for portfolio purposes. Based on USFA guidance and Permenakertrans PER.04/MEN/1980. Not a substitute for certified fire-safety training." / ID: "Demo untuk portfolio. Mengacu pada panduan USFA dan Permenakertrans PER.04/MEN/1980. Bukan pengganti pelatihan K3 kebakaran bersertifikat."

## Konten yang diisi AI
- T1.6: spek & harga ilustrasi 16 varian sudah diisi di `src/data/product.json` sesuai angka rencana yang disetujui Barkah, 27 Okt 2026; implementasi diterima Barkah pada tanggal yang sama. Default Powder ABC 6 kg Rp600.000/US$38; CO2 9 kg + bracket Rp1.100.000/US$71; Water 1 kg Rp200.000/US$13. Bracket Rp50.000/US$3, warna tanpa tambahan. Bukan harga pasar atau spesifikasi pabrikan; UI menampilkan “Illustrative price”/“Harga ilustrasi” dan “Illustrative specifications”/“Spek ilustrasi”.
- T1.6: kelas agent sebagai acuan umum (Powder ABC A/B/C; CO2 B/C; Foam AFFF A/B; Water A) bersumber dari [Damkar Banda Aceh, Jenis-jenis Alat Pemadam Api Ringan (APAR), bagian 1–4](https://damkar.bandaacehkota.go.id/2020/08/09/jenis-jenis-alat-pemadam-api-ringan-apar/), dibuka 27 Okt 2026. Hanya bagian tersebut dipakai, tanpa menambahkan kelas di luar cakupan A–D. Kesesuaian umum ini bukan rating tersertifikasi untuk 16 varian dummy.
- T1.6: catatan UI EN/ID menjelaskan spek/kode visual ilustrasi, model/nozzle/gauge yang sama untuk semua agent, konteks penjelasan bagian model dasar ABC, kapasitas seluruhnya kg sesuai brief, dan berat unit berisi tanpa bracket. Teks hotspot/PASS/kuis/disclaimer existing tetap persis sumber di atas.
- Koordinat hotspot (diisi saat T1.3).

## Video demo 30 dtk (storyboard)
0–5 load & rotate · 5–12 ganti warna/kapasitas, harga berubah · 12–16 klik hotspot · 16–24 PASS cepat (api padam) · 24–28 kuis + skor · 28–30 PDF terunduh + URL & nama Barkah.


## Nomor darurat (Indonesia)
Sumber [KOMDIGI112]: Komdigi, "Tentang Layanan Panggilan Darurat 112", https://layanan112.komdigi.go.id/tentang (dibuka 27 Okt 2026); dasar hukum Permenkominfo No. 10/2016 tentang Layanan Nomor Tunggal Panggilan Darurat & Kepdirjen PPI No. 112/2019. Halaman menyebut 112 mengintegrasikan 110 (Polisi), 113 (Pemadam Kebakaran), 119 (Ambulans); gratis, bisa saat ponsel terkunci; diselenggarakan pemerintah daerah (belum semua kab/kota).

Key i18n `emergency.*`:
- `emergency.title` — EN: Fire emergency in Indonesia / ID: Darurat kebakaran di Indonesia
- `emergency.fire` — EN: Fire department: **113** / ID: Pemadam Kebakaran: **113**
- `emergency.general` — EN: General emergency: **112** (free, works on a locked phone; available in areas whose local government runs a 112 service) / ID: Darurat umum: **112** (gratis, bisa saat ponsel terkunci; tersedia di daerah yang pemdanya menyelenggarakan layanan 112)
- `emergency.source` — EN/ID: Source: Komdigi — layanan112.komdigi.go.id

Tampil di: (1) Train mode, kartu akhir setelah langkah Sweep; (2) Quiz, setelah feedback q6; (3) Results; (4) About; (5) PDF report, di bawah disclaimer. Data nomor di `src/data/emergency.json` (`{ "fire": "113", "general": "112", "sourceUrl": "https://layanan112.komdigi.go.id/tentang" }`). Di HP nomor boleh berupa link `tel:113` / `tel:112`.
