# Implementasi redesign auth dan admin Celah

Tanggal: 17 November 2026. Berdasarkan [riset](research/AUTH_ADMIN_REDESIGN_RESEARCH.md) dan [brief](research/AUTH_ADMIN_REDESIGN_BRIEF.md). Implementasi dan validasi lokal selesai pada tanggal tersebut. Rilis berikutnya menggunakan domain produksi `https://rifqi.apexsions.my.id`; catatan deployment disimpan terpisah.

## Hasil

- Navbar auth/admin memakai identitas `hero_name` yang sama dengan halaman publik (default Rifqi Ariansyah), tanpa label Celah sebagai brand produk.
- Pergantian tema publik/auth/admin dan pilihan light/dark/system memakai komponen ink bersama. Fallback snapshot mendukung token console dan selector light/dark; reduced motion mengganti tema langsung.
- Console Celah dengan TembusMark, palet petrol/ivory dan champagne/bronze, tipografi yang lebih tenang, serta portal dialog yang mengikuti scope tema.
- Auth dengan komposisi dua kolom desktop dan form tunggal mobile. Autofill, show/hide password, validasi terkait field, fokus error, loading bernama, retry session-check dan state non-admin.
- Login sebagai jalan utama. Signup tetap tersedia melalui informasi pembuatan akun, tanpa menjanjikan hak admin. Kemampuan email mengikuti `/api/config`; SMTP yang belum tersedia dijelaskan dengan jujur. Reset malformed dan URL keluar dari recovery ditangani.
- Navigasi admin berlabel, dikelompokkan Konten/Pemantauan/Pengaturan. Drawer mobile memuat menu akun dan logout. Aksi tambah karya hanya ada pada daftar karya.
- Section, pencarian, filter, halaman dan editor berada di query URL. Dirty editor diblokir ketika berpindah menu, menekan Back atau kembali ke daftar; browser unload juga terlindungi. Cursor/scroll native menggantikan efek halaman publik pada area kerja.
- Editor halaman menyatukan informasi proyek, studi kasus, media/tautan dan featured. Penyimpanan kedua resource memakai satu transaksi PostgreSQL dengan validasi dan role guard di server.
- Unggahan memakai nama objek unik. Kegagalan unggah/save tidak menghapus cover sebelumnya. Referensi lama dibersihkan sesudah simpan terkonfirmasi dan pemeriksaan referensi; kegagalan cleanup dilaporkan terpisah.
- Selection memakai keanggotaan ID, cakupan di luar filter ditunjukkan, dan pagination di-clamp sesudah penghapusan.
- Filter event SSE dan pemeriksaan notifikasi mencegah login sukses dianggap login gagal.
- Ekspor JSON/CSV mencakup sembilan resource dengan batas dan cakupan yang jelas. Error atau batas 2.000 record membatalkan unduhan, bukan menghasilkan backup parsial yang terlihat sukses. CSV mengutip nilai dan menetralkan awalan formula spreadsheet.
- Provider tooltip dan Sonner yang sudah tidak digunakan dihapus dari root. Anggaran JavaScript publik tetap dipertahankan; tes batas tidak dilonggarkan.

## Bukti visual

Semua gambar memakai fixture lokal, bukan data atau akun produksi. Empat gambar berikut merekam implementasi awal; koreksi brand navbar dan integrasi ink sesudahnya dicatat pada bagian Hasil.

- [Auth desktop dark](media/console-redesign/auth-dark.png).
- [Auth mobile light](media/console-redesign/auth-light-mobile.png).
- [Admin desktop dark](media/console-redesign/admin-dark.png).
- [Admin mobile light](media/console-redesign/admin-light-mobile.png).

## Verifikasi

- Production build client/SSR/prerender/PWA dan explicit TypeScript application/config projects.
- Frontend source/contract/release suites, termasuk batas awal 200 kB gzip dan enhanced Home 450 kB.
- Backend unit/contract tests untuk validasi workspace, transaksi/rollback, HTTP Retry-After dan capability email.
- PostgreSQL integration pada database lokal terisolasi, termasuk project + study commit dan rollback serta akses anonim yang ditolak.
- Browser Chromium headless terhadap production preview lokal, API sepenuhnya diintersep fixture: auth validation/autofill/visibility/login; retry session; recovery unavailable/token malformed; navigasi dan dialog bertema; failed replacement; atomic-save UI; dirty navigation/Back; pagination; desktop/mobile dua tema; logout mobile; export failure; contrast CTA light.
- **Hasil akhir:** 72 tes frontend, 19 tes backend, 4 integrasi PostgreSQL dan 17 skenario browser lulus. TypeScript dan build lulus. ESLint memiliki 0 error dan 12 warning yang masih ada pada komponen lama. Detail hasil akhir disimpan pada `media/console-redesign/results.json`.

Perintah browser: `CONSOLE_BASE_URL=http://127.0.0.1:4190 node tests/console.browser.cjs`. Playwright/Chromium harus tersedia, dan preview sudah berjalan. Variabel `PLAYWRIGHT_MODULE`, `CHROME_PATH` dan `CONSOLE_SCREENSHOTS` dapat digunakan tanpa mengubah dependency manifest.

## Operasi dan batas

Frontend baru memerlukan backend baru yang menyediakan `POST /api/projects/save` dan metadata capability tambahan. Deploy keduanya bersama; tidak ada migrasi schema baru. Tes browser fixture tidak membuktikan kredensial production, real SMTP, Turnstile live, Safari/iOS atau kepatuhan aksesibilitas menyeluruh.

Tidak ada fitur passkey/MFA, draft server, autosave server, scheduling atau deployment job yang ditambahkan. Preferensi tema memakai light/dark/system yang tersimpan di browser; editor palet sementara lama tidak dipromosikan sebagai pengaturan situs yang dipersist.

Kandidat media dari hasil save yang tidak dapat dikonfirmasi dipertahankan agar tidak merusak commit yang mungkin sudah berhasil. Pembersihan orphan media adalah pekerjaan operator berikutnya, dengan pemeriksaan referensi. Jika koneksi putus tepat setelah membuat proyek, muat ulang daftar sebelum mengulangi pembuatan; endpoint menolak ID create yang sudah tersimpan.

## Koreksi identitas dan integrasi ink

Navbar auth/admin kini membaca `hero_name` dari provider pengaturan publik yang sama, dengan fallback Rifqi Ariansyah. Ukuran mark dan wordmark mengikuti navbar publik, termasuk batas lebar mobile. Label Celah pada navbar, footer console, panel auth dan breadcrumb admin dihapus.

`InkThemeSwitch` digunakan oleh navbar publik, auth/admin, serta pilihan Terang/Gelap/Sistem. Mesin ink tetap lazy-loaded. Pilihan Sistem disimpan sebagai `system`, sementara target warna animasi mengikuti OS. Snapshot fallback mengisolasi selector light/dark terhadap kelas tema dokumen, memakai warna latar console dan memperbarui ikon toggle. Resize dan owner yang dilepas membatalkan animasi dengan cleanup cache.

Uji console mencakup kedua renderer ink pada auth/admin, isi login dan draf proyek yang dipertahankan, preferensi sistem, branding CMS, persistensi tema antarhalaman dan reduced motion. Suite ink publik juga memeriksa cache atlas tunggal yang memang dipertahankan untuk klik berikutnya, reuse, cleanup, kegagalan worker/capture dan pembatalan. Isolasi browser fixture memblokir service worker agar auto-update tidak me-reload sesi pengujian, serta menginisialisasi preferensi sekali per context sehingga navigasi menguji persistensi sebenarnya.

Bukti fixture lokal terbaru: [auth](media/console-identity-ink/auth.png), [admin](media/console-identity-ink/admin.png), [ink auth mobile](media/console-identity-ink/auth-ink-mobile.png), [ink admin mobile](media/console-identity-ink/admin-ink-mobile.png).

Hasil koreksi: build dan TypeScript lulus, 73 tes frontend, 25 skenario browser console dan 16 skenario ink publik lulus. ESLint: 0 error, 12 warning lama. JavaScript awal 185.622 byte gzip, di bawah batas 200.000 byte. [Detail verifikasi lokal](media/console-identity-ink/results.json).
