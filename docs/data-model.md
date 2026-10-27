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

## hotspots.json
`[{ "id":"pin", "position":[x,y,z], "pinPosition":[x,y,z], "radius":0.04, "cameraView":{ "position":[x,y,z], "target":[x,y,z] }, "title":{en,id}, "body":{en,id}, "sources":["usfa","permenaker"] }]` — posisi dalam koordinat lokal model (meter), diisi AI dengan cara tes klik (mode `?debug` menampilkan koordinat titik yang diklik).

T1.4: `position` + `radius` tetap untuk picking T1.3; `pinPosition` adalah titik di permukaan bagian untuk pin HTML, oklusi, dan highlight, ditransformasikan memakai `localToWorld`. Keduanya terpisah karena titik picking dapat berada di dalam model. `cameraView.position` dan `cameraView.target` memakai koordinat dunia setelah normalisasi tinggi model 1,2. Nomor pin mengikuti urutan array: pin, handle, nozzle, gauge, label, body. Tidak ada perubahan skema localStorage.

## pass-steps.json
`[{ "id":"pull", "hotspot":"pin", "interaction":"click|hold|drag", "title":{en,id}, "instruction":{en,id} }]`

## quiz.json
`[{ "id":"q1", "type":"choice|pick-hotspot", "question":{en,id}, "choices":[{id,label:{en,id}}], "answer":"<choiceId|hotspotId>", "explanation":{en,id} }]`

## localStorage (prefix `apar3d:`, semua menyertakan `schemaVersion: 1`)
| Key | Isi |
|---|---|
| `apar3d:lang` | `"en"` / `"id"` |
| `apar3d:configs` | `[{ id, name, createdAt(ISO), agent, capacity, color, bracket, priceSnapshot:{IDR,USD} }]` maks 10 |
| `apar3d:attempts` | `[{ id, startedAt, finishedAt, durationSec, score, total, passed, answers:[{qId, given, correct}] }]` maks 20 |
| `apar3d:trainingDone` | `true/false` |
| `apar3d:participantName` | string opsional (untuk PDF) |
Relasi: tidak ada relasi antar entitas; Results membaca `attempts` dan `configs`.
