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

T1.4: `position` + `radius` tetap untuk picking T1.3; `pinPosition` adalah titik di permukaan bagian untuk pin HTML, oklusi, dan highlight, ditransformasikan memakai `localToWorld`. Keduanya terpisah karena titik picking dapat berada di dalam model. `cameraView.position` dan `cameraView.target` memakai koordinat dunia setelah normalisasi tinggi model 1,2. Nomor pin mengikuti urutan array: pin, handle, nozzle, gauge, label, body. Tidak ada perubahan skema localStorage.

## pass-steps.json
`[{ "id":"pull", "hotspot":"pin", "interaction":"click|hold|drag", "title":{en,id}, "instruction":{en,id} }]`

## quiz.json
`[{ "id":"q1", "type":"choice|pick-hotspot", "question":{en,id}, "choices":[{id,label:{en,id}}], "answer":"<choiceId|hotspotId>", "explanation":{en,id} }]`

## localStorage (prefix `apar3d:`)
Data kompleks memakai versi skema sesuai implementasi task terkait. `apar3d:lang` tetap string JSON polos sesuai keputusan T1.1; tidak dibungkus objek versi.

| Key | Isi |
|---|---|
| `apar3d:lang` | `"en"` / `"id"` |
| `apar3d:configs` | `{ schemaVersion: 1, configs: [{ id, name, createdAt(ISO), agent, capacity, color, bracket, priceSnapshot:{IDR,USD} }] }` maks 10 |
| `apar3d:attempts` | `[{ id, startedAt, finishedAt, durationSec, score, total, passed, answers:[{qId, given, correct}] }]` maks 20 |
| `apar3d:trainingDone` | `true/false` |
| `apar3d:participantName` | string opsional (untuk PDF) |
Relasi: tidak ada relasi antar entitas; Results membaca `attempts` dan `configs`.

T1.7 (28 Okt 2026): `agent`/`capacity`/`color` menyimpan ID opsi produk; `bracket` boolean. Pemetaan ke state aktif adalah `{ agentId: agent, capacityId: capacity, colorId: color, bracketEnabled: bracket }`. ID berupa 32 digit hex acak 128-bit dari `crypto.getRandomValues`, tersedia juga pada HTTP LAN. Nama dipangkas spasi tepi, wajib berisi 1–60 unit karakter sesuai maxlength input native; nama duplikat tetap entri berbeda. Default bilingual `Config #n`/`Konfigurasi #n`, n = jumlah simpanan + 1, bukan penghitung permanen. Nama tersimpan tidak diterjemahkan.

Daftar diurutkan berdasarkan `createdAt` terbaru dahulu; timestamp sama mempertahankan urutan entri (simpanan baru di depan). Snapshot harga IDR/USD dicatat saat Save, sedangkan Load menghitung harga/spek dari katalog saat ini. Refresh hanya mempertahankan daftar; state aktif kembali ke default sampai pengguna menekan Muat. Batas 10 menawarkan penggantian entri terlama dengan konfirmasi bernama; Delete juga memerlukan konfirmasi.

`storage.read()` membedakan `empty`/`ok`/`invalid`/`unavailable`; API get/set bahasa tetap kompatibel. Seluruh envelope dan entri divalidasi: versi, array maksimal 10, ID unik, nama, tanggal ISO, ID opsi, boolean bracket, serta harga numerik finite nonnegatif. Data tidak valid/versi asing dipertahankan dan tidak dimigrasi/dihapus otomatis. Tidak ada data configs versi lama yang dirilis sebelum T1.7. Penulisan penggantian menggunakan satu setItem untuk seluruh daftar; UI sukses hanya setelah berhasil. Target Delete/penggantian dibaca ulang dan jika berubah harus dikonfirmasi kembali. Tidak menambahkan sinkronisasi realtime atau transaksi lintas tab.
