# Env setup, run, build, deploy (panduan untuk non-coder)

Kamu tidak perlu mengetik kode. Bagian yang harus kamu lakukan sendiri hanya klik-klik di website (GitHub, Vercel, Umami) dan menyalin-tempel nilai. Sisanya minta AI di Cursor.

## 1. Sekali saja: siapkan alat (semua gratis)
1. **Node.js LTS**: buka https://nodejs.org → unduh tombol "LTS" → install (Next, Next, Finish).
2. **Git**: https://git-scm.com/downloads → install dengan pilihan default.
3. **Cursor**: sudah kamu punya. Login GitHub di Cursor bila diminta.
4. **Akun**: GitHub (https://github.com), Vercel (sudah ada — dipakai untuk barkahmauludi.com), Umami Cloud (https://cloud.umami.is, daftar paket Hobby gratis).
Cek: di Cursor buka Terminal (menu Terminal → New Terminal), minta AI: "cek apakah node dan git sudah terpasang".

## 2. Menjalankan di komputer sendiri
Kamu cukup bilang ke AI di Cursor: **"jalankan project ini di lokal"**. AI akan menjalankan `npm install` lalu `npm run dev`, dan memberi alamat seperti `http://localhost:5173` — buka di browser.
Perintah yang dipakai AI (untuk referensi): `npm run dev` (jalan lokal), `npm run build` (cek siap deploy), `npm run preview`, `npm run optimize:model`.

## 3. Env variables (hanya nama, nilai TIDAK di repo)
| Nama | Isi | Di mana diisi |
|---|---|---|
| `VITE_UMAMI_WEBSITE_ID` | Website ID dari Umami (lihat bagian 6) | Vercel → Project → Settings → Environment Variables (Production), dan file `.env.local` di komputermu (AI yang buat, file ini di-.gitignore) |
Kalau kosong, analytics otomatis mati; app tetap jalan.

## 4. Upload ke GitHub (repo publik)
1. Di Cursor minta AI: "buat commit pertama dan siapkan repo untuk GitHub dengan nama `apar-3d-trainer`".
2. Di Cursor, panel Source Control (ikon cabang di kiri) → **Publish to GitHub** → pilih **Public repository**. (Alternatif: buat repo kosong di github.com → New repository → nama `apar-3d-trainer` → Public → Create, lalu minta AI menghubungkannya.)
3. Cek: buka https://github.com/<username-mu>/apar-3d-trainer, file-file terlihat.

## 5. Deploy ke Vercel sebagai project TERPISAH
Project ini berdiri sendiri; project barkahmauludi.com (Next.js) tidak disentuh.
1. Buka https://vercel.com/dashboard → tombol **Add New…** → **Project**.
2. Di daftar repo GitHub, cari `apar-3d-trainer` → **Import**. (Jika tidak muncul: klik "Adjust GitHub App Permissions" dan beri akses ke repo itu.)
3. Framework Preset: **Vite** (biasanya terdeteksi otomatis). Build Command `npm run build`, Output Directory `dist` — biarkan default.
4. Buka **Environment Variables** → tambah `VITE_UMAMI_WEBSITE_ID` (boleh dilewati dulu, isi nanti).
5. Klik **Deploy**. Tunggu ±1 menit → muncul alamat `apar-3d-trainer-xxx.vercel.app`. Buka dan cek app tampil.
6. Mulai sekarang setiap AI melakukan push ke GitHub branch `main`, Vercel otomatis deploy ulang.

## 6. Pasang subdomain `trainer.barkahmauludi.com`
> Update T0.4 (27 Okt 2026): DNS barkahmauludi.com ternyata di **Rumahweb**, jadi yang dipakai adalah jalur **Fallback** di bawah. Di form "Tambah Record" Rumahweb: Domain = `trainer` (akhiran `.barkahmauludi.com` sudah otomatis), Tipe = CNAME, **Hostname = nilai CNAME dari Vercel** (kolom ini = tujuan). Sudah terpasang dan Valid.
Karena barkahmauludi.com sudah dikelola di Vercel (DNS di Vercel), biasanya **tidak perlu mengubah apa pun di Rumahweb**.
1. Di Vercel buka project **apar-3d-trainer** (bukan project situs utama) → **Settings** → **Domains**.
2. Klik **Add Domain** → ketik `trainer.barkahmauludi.com` → konfirmasi/Add. (Jika muncul pilihan environment, pilih Production.)
3. Tunggu status. Domain utama ada di akun Vercel yang sama (sudah dikonfirmasi), jadi status biasanya langsung atau dalam beberapa menit berubah menjadi **Valid Configuration** (perilaku otomatis ini tidak tertulis eksplisit di halaman docs yang dicek; jika belum valid setelah ±10 menit, lakukan langkah 4) — dengan SSL otomatis (gembok HTTPS) dalam beberapa menit.
4. Jika Vercel menampilkan "Invalid Configuration" dan meminta **CNAME**: buka Vercel Dashboard → tab **Domains** (tingkat tim) → klik `barkahmauludi.com` → bagian **DNS Records** → **Add**: Type `CNAME`, Name `trainer`, Value = nilai CNAME yang ditampilkan di halaman domain project (unik per project, contoh format dari dokumen Vercel: `d1d4fc829fe7bc7c.vercel-dns-017.com`; jangan salin contoh ini, pakai nilai di layarmu). Simpan.
5. Cek: buka https://trainer.barkahmauludi.com di HP & laptop → app tampil dengan gembok.

Catatan: verifikasi TXT hanya diperlukan jika domain dipakai akun Vercel lain — tidak berlaku di sini.

**Fallback (hanya jika langkah di atas gagal / DNS ternyata bukan di Vercel):** login Rumahweb → Layanan/Domain → barkahmauludi.com → Nameserver. Jika nameserver BUKAN `ns1.vercel-dns.com` & `ns2.vercel-dns.com`, berarti DNS masih di Rumahweb: tambahkan record CNAME `trainer` → nilai dari Vercel di menu DNS Management Rumahweb (jangan ubah record lain/MX email). Propagasi bisa beberapa menit sampai beberapa jam.

Sumber: Vercel Docs "Adding & Configuring a Custom Domain" (last updated 16 Sep 2026, dibuka 27 Okt 2026) https://vercel.com/docs/domains/working-with-domains/add-a-domain — subdomain dikonfigurasi dengan CNAME unik per project; Settings → Domains → Add Domain; Hobby: maks 50 custom domain per project.

## 7. Umami (analytics gratis)
1. Login https://cloud.umami.is → **Add website** (Settings → Websites) → Name `APAR 3D Trainer`, Domain `trainer.barkahmauludi.com` → Save.
2. Buka website itu → **Edit / Tracking code** → salin **Website ID** (format UUID).
3. Vercel → project apar-3d-trainer → Settings → Environment Variables → `VITE_UMAMI_WEBSITE_ID` = Website ID → Save → tab Deployments → titik tiga deployment terbaru → **Redeploy**.
4. Cek: buka situs, klik beberapa varian → di Umami menu **Events** muncul `variant_change` (bisa tertunda beberapa menit). Jika kamu memakai ad-blocker, matikan dulu untuk tes.
Batas paket Hobby (dicek 27 Okt 2026, https://umami.is/pricing): 100K events/bulan, 1 website, retensi 6 bulan.

## 8. Link dari barkahmauludi.com
Lihat prompt T3.5 (dikerjakan di repo situs utama / Sanity Studio).

## 9. vercel.json
`Cache-Control: public, max-age=31536000, immutable` untuk `/assets/*` (nama file ber-hash). `Cache-Control: public, max-age=86400` (1 hari) untuk `/models/*`, `/decoders/*`, `/hdri/*` karena nama filenya tetap — lihat decisions.md (T0.4).

## 10. Kalau ada yang gagal
Salin pesan error / screenshot ke AI di Cursor dengan prompt "Prompt perbaikan bug" di `prompts.md`. Untuk deploy gagal: Vercel → Deployments → klik yang merah → salin isi **Build Logs**.
