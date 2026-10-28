# Architecture

## Struktur folder
```
apar-3d-trainer/
├─ AGENTS.md
├─ docs/
├─ index.html              # shell UI: topbar, panel, canvas container
├─ public/
│  ├─ models/apar.glb      # hasil optimasi (Draco+KTX2)
│  ├─ hdri/studio_1k.hdr
│  ├─ decoders/draco/  decoders/basis/   # dicopy dari node_modules/three/examples/jsm/libs
│  ├─ og-image.jpg  favicon.svg  robots.txt  sitemap.xml
├─ assets-src/             # model mentah (tidak di-deploy; boleh .gitignore jika besar)
├─ scripts/optimize-model.sh
├─ src/
│  ├─ main.js              # bootstrap: i18n → scene → router
│  ├─ core/
│  │  ├─ scene.js          # renderer, camera, lights, HDRI, resize, render loop (render on demand)
│  │  ├─ loader.js         # GLTF+Draco+KTX2, LoadingManager → event progress
│  │  ├─ controls.js       # OrbitControls + batas + idle auto-rotate
│  │  ├─ cameraTween.js    # fokus kamera ke target
│  │  ├─ picking.js        # raycaster ke model + jarak ke hotspot terdekat
│  │  ├─ highlight.js      # pulse ring/marker di posisi hotspot (bukan per-mesh)
│  │  ├─ analytics.js      # wrapper Umami: track(name, data), no-op jika tidak ada
│  │  ├─ storage.js        # wrapper localStorage (prefix apar3d:, try/catch, versi skema)
│  │  ├─ events.js         # event bus kecil (on/emit)
│  │  └─ router.js         # hash router → mode
│  ├─ i18n/ i18n.js en.json id.json
│  ├─ data/ product.json hotspots.json pass-steps.json quiz.json emergency.json
│  ├─ features/
│  │  ├─ configurator/ configurator.js appearance.js pricing.js hotspots.js saved-configs.js
│  │  ├─ training/ training.js training-state.js training-gestures.js training-view.js effects.js
│  │  ├─ quiz/ quiz.js
│  │  ├─ results/ results.js
│  │  └─ pdf/ pdf-report.js pdf-spec.js
│  ├─ ui/ toast.js modal.js components.css hotspot-pins.js hotspots.css configurator.css saved-configs.js saved-configs.css training.js training-target.js training.css
│  └─ styles/ tokens.css base.css layout.css
├─ vite.config.js  package.json  vercel.json  README.md  LICENSE (MIT)
```

## Alur data
1. `main.js` load i18n (bahasa dari storage → navigator.language → `en`) lalu buat scene, mulai load model.
2. `loader.js` emit `load:progress`, `load:done`(gltf), `load:error`.
3. Model Poly Haven diperlakukan sebagai **satu mesh**. Bagian (pin, handle, nozzle, gauge, label, body) didefinisikan sebagai **hotspot posisi** di `hotspots.json` (koordinat lokal model + radius klik). Klik → raycast ke model → titik kena dibandingkan ke hotspot terdekat dalam radius. T1.5 memakai tint selektif pada material `bodyMaterialName` lewat `onBeforeCompile`, menggantikan multiplier global atas persetujuan Barkah: atlas sudah merah dan juga mencakup bagian noncat. `appearance.js` menetralkan hue hanya pada cat tabung/alas dengan mask dominasi merah, tinggi lokal, dan pengecualian UV label/strap/nozzle/selang. Seluruh map dan properti PBR asli tetap; merah melewati recolor untuk mengembalikan tampilan asli. Mask dikalibrasi khusus `apar.glb`, perlu diperiksa ulang bila model/atlas diganti.
4. Fitur membaca data JSON + state, mengubah scene lewat API `scene.js`/`highlight.js`, dan menulis hasil via `storage.js`.
5. `router.js` mengaktifkan satu fitur sekaligus (`enter()`/`exit()`), kanvas tetap.
   T1.4: `configurator.js` mengelola listener picking hanya selama Configure; `hotspots.js` mengelola kartu/sesi fokus; `ui/hotspot-pins.js` mengelola proyeksi, oklusi, dan pemisahan pin. Event internal `scene:resize` memperbarui proyeksi setelah kamera/renderer di-resize; `hotspot:pick` membawa hasil picking ke HUD debug (bukan analytics). Timer auto-rotate dapat dijeda/dilanjutkan melalui `controls.pauseAutoRotate()` / `resumeAutoRotate()`; objek kembalian tetap OrbitControls.
   T1.5: kontrol warna/bracket mengikuti lifecycle Configure, tanpa mengubah API `enter/exit/setModel`. Desktop menampilkan kontrol di atas kartu; HP menggantinya sementara dengan kartu ketika `hotspots.js` memasang class `is-reading-hotspot` pada panel. Header judul/Tutup tetap terlihat, hanya deskripsi yang di-scroll; menutup kartu memulihkan opsi dan posisi scroll sebelumnya. Resize/breakpoint mengungkap header tanpa mengubah pilihan/hotspot/snap; keluar Configure membersihkan class dan listener. State hanya memori (default merah/bracket mati), bertahan antar tab/bahasa, reset saat refresh. `appearance.js` menambahkan group bracket setelah normalisasi sebagai child model; mesh aksesori diberi `configuratorAccessory`, raycast no-op, dan dikecualikan dari oklusi pin. Toggle hanya mengubah visibility. Penggantian model melepas bracket, membebaskan geometri/material aksesori, mengembalikan hook shader lama, dan menerapkan pilihan aktif ke model baru. Tidak menambah loop render atau tekstur.
   Revisi UX T1.5: `ui/sheet.js` mengubah tinggi panel sebenarnya saat drag dan snap, bukan menggeser panel 80% keluar layar. CSS token menentukan snap 30%/80%, minimum ringkas 176px, maksimum ruang di bawah topbar dengan jarak 16px; `sheetBounds()` memakai ukuran viewport dan batas CSS yang sama untuk drag serta self-check. Kanvas HP memakai ruang di atas snap ringkas; ResizeObserver scene yang tersedia memperbarui kamera dan pin. Gesture pointer diproses sekali pada pointerup, sedangkan click detail 0 menangani keyboard/assistive activation. Reduced motion meniadakan transisi tinggi melalui aturan panel existing.
   T1.7: `features/configurator/saved-configs.js` mengelola validasi dan operasi daftar/simpan/muat/hapus lewat `core/storage.js`; DOM/dialog dipisahkan di `ui/saved-configs.js` dan CSS pendamping (modul <300 baris). UI ditempatkan di dalam `.config-options` setelah bracket, mengikuti penyembunyian kartu HP existing. Configurator memberikan callback pembacaan state dan penerapan empat pilihan, lalu menjalankan `syncOptions()` serta `hotspots.refreshTransform(scale)` saat Load. Lifecycle enter/exit memasang/melepas dialog dan memuat ulang daftar. Dialog native memakai helper modal/toast existing, label EN/ID, textContent untuk nama, serta pengembalian fokus sesudah simpan/batal/hapus. Tidak ada loop render atau resource 3D baru.
   T2.1: `initTraining(context)` mengembalikan `enter/exit/setModel` dan dipasang bootstrap pada mode Train. `training-state.js` memuat sesi/hold/Sweep yang bisa diuji tanpa DOM; `training-gestures.js` menangani hold pointer/keyboard dan input slider native. `ui/training.js` mengelola panel, stepper, navigasi, disclaimer dan kontak; `ui/training-target.js` memproyeksikan satu tombol target memakai `projectPin/placePin`, oklusi dan pinPosition existing. ResizeObserver panel memperbarui ruang target; observer footer menyediakan scroll-padding sesuai tinggi navigasi sehingga scroll ke kontrol tidak tertutup footer. Kedua observer dilepas saat exit.
   Train memanggil callback `setTrainingAppearance(enabled)` milik configurator yang diberikan oleh bootstrap, tanpa import silang fitur. Callback hanya memilih tampilan default Powder ABC 6 kg/merah/tanpa bracket; objek pilihan Configure tetap utuh. Listener bahasa configurator menggunakan pilihan tampilan efektif sehingga bahasa/label saat Train tidak mengembalikan varian lama. Exit memulihkan tampilan, snapshot kamera/batas kontrol dan auto-rotate; sesi latihan tetap di memori.
   Fokus memakai cameraTween 700ms (langsung pada reduced motion); interaksi orbit membatalkan tween, tombol fokus memulihkannya. Ring highlight hanya aktif selama langkah belum berhasil/dilewati. Blur/visibilitychange/About/exit membatalkan hold parsial dan menghentikan input Sweep aktif, tanpa membuang posisi/progres slider; About tidak mengganti mode. Efek pin berupa SVG overlay internal tanpa perubahan mesh; api/semprotan tetap T2.2 dan analytics tetap T3.6.
   Revisi Sweep T2.1: satu `input type=range` 0–100/step 1 dibuat saat init UI, tidak dibuat ulang saat render/bahasa. Event input memperbarui state target ujung bergantian 95–100/0–5 dan progres 0–3 siklus; algoritma threshold piksel serta pointer capture Sweep dihapus. Pointer capture untuk hold tetap. Input ditolak ketika mode/langkah tidak aktif, selesai, modal terbuka, halaman tersembunyi atau interaksi terinterupsi; nilai DOM dikembalikan ke state terakhir. Fokus/input baru yang diizinkan melanjutkan interaksi. Tujuan/progres/aria-valuetext diperbarui tanpa mengganti elemen atau fokus. Kontrol/progres ditempatkan sebelum petunjuk rinci, scroll nearest saat masuk Sweep menjaga akses HP, dan footer berada di atas layer range/zona. Tidak ada rAF slider atau API lifecycle/storage baru.
   T2.2: bootstrap memberikan `scene` existing ke training, API fitur `enter/exit/setModel` tetap. `effects.js` mengelola satu group berisi Points api (24), Points semprotan (72) dan garis bidik; dua CanvasTexture prosedural 64×64 memakai palette token, buffer posisi/warna dipakai ulang. `fireLevel(session,sweep)` mengikuti status sesi dan 0–6 lintasan existing; tidak membuat hitungan keberhasilan kedua. Model.localToWorld(pinPosition nozzle) menjadi sumber semprotan, pangkal api dunia berada di lantai di depan APAR, slider menggeser sasaran sepanjang lebar api. Geometri APAR tidak dipisah atau digerakkan.
   Pengelola efek menyediakan `setModel/sync/setSpray/pause/resume/dispose`. Hold memperbarui emisi selama progres 0–1; callback input Sweep memicu burst dengan batas diam 180ms. Api mengecil mengikuti progres dan padam 250ms; Skip/intro/Pull/keluar mode menyembunyikan langsung. Satu rAF efek meminta render melalui requestRender existing hanya selama diperlukan; pause/exit/padam membatalkannya. About/blur/visibility juga menghentikan pulse highlight, close/focus/visibility memulihkan sesuai status tanpa mengulang semprotan. Reduced motion mengubah posisi/ukuran secara statis; listener media-query efek mengikuti perubahan preferensi. Resource efek dipakai ulang sepanjang umur aplikasi, model baru mengkalibrasi ulang anchor dan menghentikan emisi/timer lama; dispose melepas geometri/material/tekstur/listener.
   `training-view.js` menghitung framing dari batas model dan api menggunakan FOV/aspek serta area bebas panel desktop, lalu training memanggil cameraTween existing. Arah depan sedikit dari kanan menjaga target tuas dan nozzle terlihat. Pull tetap memakai cameraView hotspot; Aim–Sweep memakai framing bersama, tombol Fokus dan event scene:resize memulihkannya setelah orbit/resize. Kanvas HP existing menggunakan ruang di atas sheet ringkas; snap sheet tetap pilihan pengguna. Bridge debug existing menambahkan scene/renderer hanya pada ?debug untuk pemeriksaan efek/render calls, tanpa bridge produksi normal.
   T2.3: bootstrap membungkus mode Train dengan stage training/quiz. `quiz:start` menutup training sebelum memulai/enter kuis, `quiz:training` menutup kuis lalu membuka kartu latihan selesai. Router/hash tetap tiga tab; tidak ada import silang fitur. `initQuiz(context)` menyediakan start/enter/exit/setModel; bootstrap meneruskan model dan callback appearance existing. Exit memulihkan snapshot kamera/batas kontrol serta konfigurasi. Sesi tetap di memori saat keluar/masuk tab; hanya start/Retry mereset.
   `quiz-state.js` mengelola fase/locking jawaban/skor/waktu/attempt tanpa DOM; `attempts.js` memvalidasi dan menyimpan riwayat versi 1 via storage read/set. `ui/quiz.js` dan quiz.css mengelola teks/opsi/feedback/kontak/ringkasan dalam scroll panel existing dengan footer Next sticky dan scroll-padding dari ResizeObserver. Fokus pindah ke feedback atau judul soal; status feedback juga diumumkan melalui role=status. Teks UI lewat i18n, konten K3/sumber lewat quiz.json. Tidak ada renderer, efek, loop animasi, dependency atau aset baru.
   `initHotspotPins` dipakai ulang dengan callback label netral dan panel opsional; default Configure tetap. Panel membatasi area tombol pin dan ResizeObserver memperbarui layout saat sheet berubah. setDisabled mengunci pin sesudah jawab/interupsi. Framing kedua soal pin memakai overview depan yang sama dari Box3/FOV/aspek/ruang panel melalui cameraTween; tidak fokus pada jawaban benar. About/blur/visibility menghentikan tween dan menolak input; resume memerlukan dokumen fokus/terlihat tanpa dialog. Semua listener/observer/pin dilepas saat exit.
   Koreksi sheet T2.3: tap mengubah snap pada click, bukan pointerup, agar posisi handle tetap sampai browser menentukan target click. Drag tetap snap pada release; flag tapPending memisahkan tap dari drag/keyboard dan bertahan melewati lostpointercapture. Ini mencegah tap handle memilih jawaban yang bergeser ke bawah jari; enam nomor pin tetap tidak mengubah hash atau membuka kartu Configure.
6. PDF: `renderer.domElement.toDataURL()` (renderer dibuat dengan `preserveDrawingBuffer: true` hanya saat capture, atau render ulang sebelum capture) → jsPDF.

## Performa
- Render on demand (hanya saat ada perubahan/animasi), pixelRatio maks 2 (HP maks 1.5).
- Tekstur 1K (KTX2), HDRI 1K, satu directional light + environment, shadow pakai contact shadow/plane sederhana.
- jsPDF di-*lazy import* (`import('jspdf')`) saat tombol PDF diklik.

## Layanan eksternal
Vercel (hosting), GitHub (repo), Umami Cloud (analytics). Umami disisipkan oleh `analytics.js` secara dinamis setelah event `load:done` + `requestIdleCallback`, dengan `data-website-id` dari env `VITE_UMAMI_WEBSITE_ID` dan `data-domains="trainer.barkahmauludi.com"` (tidak melacak localhost/preview).

## Analytics events (nama ≤ 50 karakter, aturan Umami)
| Event | Data |
|---|---|
| `variant_change` | `{ option, value }` |
| `hotspot_open` | `{ id }` |
| `config_save` | `{ agent, capacity, color }` |
| `training_start` | `{}` |
| `training_finish` | `{ durationSec, skipped }` |
| `quiz_finish` | `{ score, total, passed }` |
| `pdf_export` | `{ type: "report"|"spec" }` |
| `lang_change` | `{ lang }` |
Tidak ada data pribadi (nama peserta TIDAK dikirim).
