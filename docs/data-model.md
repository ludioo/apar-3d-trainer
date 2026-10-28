# Data model
Semua data statis di `src/data/*.json`; teks bilingual memakai objek `{ "en": "...", "id": "..." }`.

## product.json
```json
{
  "id": "apar",
  "bodyMaterialName": "<nama material body di GLB>",
  "basePrice": { "IDR": 0, "USD": 0 },
  "options": {
    "agent":    [{ "id": "powder_abc", "label": {"en":"Dry Powder ABC","id":"Serbuk Kimia ABC"}, "fireClasses": ["A","B","C"], "priceAdd": {"IDR":0,"USD":0}, "visual": {"nozzle": "hose"} }],
    "capacity": [{ "id": "6kg", "kg": 6, "scale": 1.0, "priceAdd": {"IDR":0,"USD":0} }],
    "color":    [{ "id": "red", "hex": "#C8102E", "label": {"en":"Red","id":"Merah"}, "priceAdd": {"IDR":0,"USD":0} }],
    "bracket":  { "priceAdd": {"IDR":0,"USD":0} }
  },
  "specTemplate": ["agent","capacity","fireClasses","dischargeTime","range","weight"]
}
```
Nilai harga & spek: **ilustrasi**, diisi AI sebagai placeholder bertanda `"illustrative": true` lalu ditampilkan dengan label "Illustrative price". Spek teknis (jarak semprot, waktu semprot) tetap ditandai ilustrasi; harga ilustrasi dikonfirmasi Barkah 27 Okt 2026.

T1.5 mengisi subset produk: `id`, `bodyMaterialName` = `korean_fire_extinguisher_01_body`, `options.color` (red `#C8102E`, yellow `#FFC629`, silver `#C0C0C0`, masing-masing label EN/ID), dan `options.bracket` kosong. Harga, agent, kapasitas, dan spek tetap T1.6. Label kontrol juga memiliki key `config.*` di kedua kamus i18n; self-check memastikan nama warna cocok data produk. State `colorId` dan `bracketEnabled` hanya di memori configurator; penyimpanan konfigurasi tetap T1.7, tidak ada perubahan skema localStorage.

T1.6 melengkapi produk dengan `illustrative: true`, `basePrice`, `priceAdd` pada semua opsi, empat `options.agent` (powder_abc/co2/foam_afff/water), empat `options.capacity`, dan `specTemplate` enam kolom. Setiap agent memiliki `visual: { strip, ink, nozzle: "hose" }`, `fireClasses` sebagai acuan umum bersumber, serta `specs` berkey `1kg`/`3kg`/`6kg`/`9kg`: `{ dischargeTime, range, weight }` dalam detik/meter/kg. Semua angka spek dan harga mengikuti tabel ilustrasi yang disetujui Barkah; berat = unit berisi tanpa bracket. `sources.fireClasses` menyimpan URL Damkar Banda Aceh untuk tautan UI dan dokumentasi.

Harga total = basePrice + tambahan agent + kapasitas + warna + bracket (jika aktif), dihitung independen untuk IDR dan USD. Base Water 1 kg = Rp200.000/US$13; warna tanpa tambahan, bracket Rp50.000/US$3. Skala kapasitas = 0,65/0,82/1/1,12; default Powder ABC 6 kg = Rp600.000/US$38. State kini satu objek `{ agentId, capacityId, colorId, bracketEnabled }` dalam memori; tidak ada key localStorage atau migrasi skema baru. Label pilihan agent EN/ID ada di data dan kamus UI, dijaga cocok oleh self-check.

## hotspots.json
`[{ "id":"pin", "position":[x,y,z], "pinPosition":[x,y,z], "radius":0.04, "cameraView":{ "position":[x,y,z], "target":[x,y,z] }, "title":{en,id}, "body":{en,id}, "sources":["usfa","permenaker"] }]` — posisi dalam koordinat lokal model (meter), diisi AI dengan cara tes klik (mode `?debug` menampilkan koordinat titik yang diklik).

T1.4: `position` + `radius` dipakai untuk picking; `pinPosition` adalah titik di permukaan bagian untuk pin HTML, oklusi, dan highlight, ditransformasikan memakai `localToWorld`. Keduanya terpisah karena titik picking dapat berada di dalam model. `cameraView.position` dan `cameraView.target` memakai koordinat dunia setelah normalisasi tinggi model 1,2. Nomor bagian mengikuti urutan array terkoreksi: handle, pin, nozzle, gauge, label, body. Tidak ada perubahan skema localStorage.

Revisi T2.3 (28 Okt 2026, validasi dan rencana disetujui Barkah): lokasi nomor 1 adalah tuas (`handle`), lokasi nomor 2 adalah pin pengaman (`pin`). Entri pada dua lokasi mempertahankan position/pinPosition/radius/cameraView yang telah dilihat dalam close-up; ID, judul, body dan sumber mengikuti bagian fisik yang benar. Ini mengoreksi pemetaan pin/handle T1.3–T2.3 awal. Satu data bersama dipakai Configure, PASS dan kuis; tanpa pengecualian ID atau perubahan kunci soal q2=`pin`. Nomor target latihan tetap nomor langkah: Pull 1 menargetkan bagian 2/pin, Squeeze 3 menargetkan bagian 1/tuas.

Riwayat attempts sebelum koreksi tetap memakai ID dan skor saat dikerjakan; tidak dihapus, dihitung ulang atau dimigrasi. Hasil lama mungkin dipengaruhi pemetaan visual lama dan tidak boleh diasumsikan sudah dinilai memakai lokasi terkoreksi.

## pass-steps.json
`[{ "id":"pull", "hotspot":"pin", "interaction":"click|hold|drag", "title":{en,id}, "instruction":{en,id} }]`

T2.1 (28 Okt 2026): empat entri berurutan `pull/pin/click`, `aim/nozzle/click`, `squeeze/handle/hold`, `sweep/nozzle/drag`. `instruction.en/id` disalin persis dari tabel Langkah PASS di content-and-assets; `title` adalah nama pendek bilingual. Sumber instruksi USFA tetap pada dokumen sumber. Nomor target HTML mengikuti langkah 1–4, bukan urutan hotspot Configure.

Sesi hanya di memori: fase intro/langkah/selesai, indeks aktif, status tiap langkah (`null`, `done`, `skipped`), serta posisi, jumlah lintasan dan target Sweep. Next memerlukan status langkah; Back mempertahankan status. Tahan satu detik dihitung terus-menerus.

Revisi Sweep T2.1 (28 Okt 2026, disetujui Barkah): slider rentang 0–100, step 1, mulai 0/kiri dengan target kanan. Zona kiri 0–5, kanan 95–100; hanya masuk zona target berikutnya yang menambah satu lintasan. Kanan lalu kembali kiri = satu siklus; enam lintasan = tiga siklus. Input berulang di ujung yang sama/gerakan tengah tidak dihitung. `createSweep()` mengekspos pembacaan `value`, `count`, `cycles`, `target`, dengan operasi `update(value)` dan `reset()`. Nilai di luar rentang/non-finite ditolak; setelah enam lintasan posisi dan hitungan dibekukan. `interaction: "drag"` pada data PASS tetap menjadi kategori interaksi Sweep; drag, tap/klik rel, Arrow/Home/End semuanya diizinkan melalui kontrol range native.

Posisi parsial, target dan lintasan sah dipertahankan ketika melepas pegangan, mengganti bahasa/ukuran panel, About/blur/visibilitychange, Back, atau berpindah mode. Interupsi menghentikan input aktif; event lanjutan tidak menambah progres. Ulangi latihan mereset posisi 0, target kanan dan hitungan 0; refresh menghapus sesi parsial karena hanya di memori. Skip tidak mengubah hitungan parsial menjadi 3/3, tetapi tetap memenuhi syarat Next dan menonaktifkan slider.

`apar3d:trainingDone` ditulis sebagai boolean JSON `true` melalui storage.set hanya setelah Next terakhir, termasuk bila memakai Skip. Tidak dibungkus schemaVersion dan tidak berarti lulus/kompeten. Mengulang/refresh tidak menulis false atau menghapus status pernah selesai; refresh membuka intro dan tidak memulihkan progres parsial. Gagal menulis tetap menampilkan kartu selesai dengan pesan bahwa status belum tersimpan. Tidak ada migrasi atau perubahan configs/attempts.

`emergency.json` diisi sesuai dokumen sumber: `{ "fire": "113", "general": "112", "sourceUrl": "https://layanan112.komdigi.go.id/tentang" }`. Train memakai nomor untuk href telepon, sedangkan copy/keterangan layanan memakai key i18n existing.

## quiz.json
`[{ "id":"q1", "type":"choice|pick-hotspot", "question":{en,id}, "choices":[{id,label:{en,id}}], "answer":"<choiceId|hotspotId>", "explanation":{en,id}, "sources":[{label,url}] }]`

T2.3 (28 Okt 2026): array q1–q8, enam choice (ID pilihan a/b/c) dan dua pick-hotspot (q2/pin, q5/gauge). Entri pick-hotspot tidak memiliki choices. q6 memiliki `emergency: true`; blok kontak membaca emergency.json dan i18n existing. Sumber setiap soal memiliki label nama sumber dan URL HTTPS, PDF bertaut ke halaman pasal. Seluruh teks soal/pilihan/penjelasan persis content-and-assets termasuk pelengkap bilingual yang disetujui Barkah.

Sesi kuis hanya memori: fase idle/question/feedback/summary, indeks, answers dan attempt. Start/Retry membuat ID acak 128-bit via crypto.getRandomValues serta startedAt ISO. Jawaban pertama yang valid dikunci, Next manual; q8 membuat finishedAt, durationSec (detik dibulatkan, tidak negatif), score (jumlah benar), total 8 dan passed (≥6). Waktu termasuk feedback, About dan jeda pindah tab, berhenti saat menjawab q8, sebelum membuka ringkasan. Bahasa/tab/About menjaga sesi; refresh kembali intro PASS, Retry mulai kosong. Sesi tidak memulihkan jawaban dari localStorage.

## localStorage (prefix `apar3d:`)
Data kompleks memakai versi skema sesuai implementasi task terkait. `apar3d:lang` tetap string JSON polos sesuai keputusan T1.1; tidak dibungkus objek versi.

| Key | Isi |
|---|---|
| `apar3d:lang` | `"en"` / `"id"` |
| `apar3d:configs` | `{ schemaVersion: 1, configs: [{ id, name, createdAt(ISO), agent, capacity, color, bracket, priceSnapshot:{IDR,USD} }] }` maks 10 |
| `apar3d:attempts` | `{ schemaVersion: 1, attempts: [{ id, startedAt, finishedAt, durationSec, score, total, passed, answers:[{qId, given, correct}] }] }` maks 20 |
| `apar3d:trainingDone` | `true/false` |
| `apar3d:participantName` | string opsional (untuk PDF) |
Relasi: tidak ada relasi antar entitas; Results membaca `attempts` dan `configs`.

T2.3 attempts: `given` adalah ID pilihan/hotspot, bukan teks terjemahan; `correct` boolean. Validasi seluruh envelope/entri mencakup versi, batas/ID unik, ISO/urutan tanggal/durasi, delapan qId berurutan, jawaban valid dan konsistensi skor/status. Riwayat dibaca ulang sebelum setiap simpan, terbaru dahulu menurut finishedAt; timestamp sama menempatkan entri baru di depan. Attempt ke-21 membuang yang tertua lewat satu setItem. ID sama dengan isi sama tidak ditulis lagi; ID sama dengan isi berbeda ditolak. Tidak menimpa JSON rusak, versi asing atau entri invalid dan tidak memigrasi array polos yang belum pernah dirilis. Gagal baca/tulis tetap menampilkan hasil dengan pesan belum tersimpan; tidak ada retry tulis otomatis. Baca–ubah–tulis localStorage bukan transaksi antar tab simultan.

T1.7 (28 Okt 2026): `agent`/`capacity`/`color` menyimpan ID opsi produk; `bracket` boolean. Pemetaan ke state aktif adalah `{ agentId: agent, capacityId: capacity, colorId: color, bracketEnabled: bracket }`. ID berupa 32 digit hex acak 128-bit dari `crypto.getRandomValues`, tersedia juga pada HTTP LAN. Nama dipangkas spasi tepi, wajib berisi 1–60 unit karakter sesuai maxlength input native; nama duplikat tetap entri berbeda. Default bilingual `Config #n`/`Konfigurasi #n`, n = jumlah simpanan + 1, bukan penghitung permanen. Nama tersimpan tidak diterjemahkan.

Daftar diurutkan berdasarkan `createdAt` terbaru dahulu; timestamp sama mempertahankan urutan entri (simpanan baru di depan). Snapshot harga IDR/USD dicatat saat Save, sedangkan Load menghitung harga/spek dari katalog saat ini. Refresh hanya mempertahankan daftar; state aktif kembali ke default sampai pengguna menekan Muat. Batas 10 menawarkan penggantian entri terlama dengan konfirmasi bernama; Delete juga memerlukan konfirmasi.

`storage.read()` membedakan `empty`/`ok`/`invalid`/`unavailable`; API get/set bahasa tetap kompatibel. Seluruh envelope dan entri divalidasi: versi, array maksimal 10, ID unik, nama, tanggal ISO, ID opsi, boolean bracket, serta harga numerik finite nonnegatif. Data tidak valid/versi asing dipertahankan dan tidak dimigrasi/dihapus otomatis. Tidak ada data configs versi lama yang dirilis sebelum T1.7. Penulisan penggantian menggunakan satu setItem untuk seluruh daftar; UI sukses hanya setelah berhasil. Target Delete/penggantian dibaca ulang dan jika berubah harus dikonfirmasi kembali. Tidak menambahkan sinkronisasi realtime atau transaksi lintas tab.
