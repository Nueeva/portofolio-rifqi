# Brief redesign auth dan admin Celah

> Implementasi lokal hasil riset ini sekarang tersedia; lihat [catatan implementasi 17 November](../AUTH_ADMIN_REDESIGN_IMPLEMENTATION.md). Pernyataan “belum diimplementasikan” di bawah menjelaskan status saat laporan riset ditulis, bukan status working tree setelah implementasi. Bukti riset tetap bertanggal 15 November.

Diselesaikan 17 November 2026 berdasarkan [riset lengkap](AUTH_ADMIN_REDESIGN_RESEARCH.md), audit commit `c6aa304`, 16 sumber primer dan bukti browser lokal bertanggal 15 November. Arah pemilik: **Celah yang lebih matang dan konsisten**. Ini rekomendasi implementasi; UI/backend belum diubah.

## Keputusan desain

Auth menjadi pintu masuk pengelolaan yang sederhana. Admin menjadi ruang kerja editorial dengan navigasi berlabel dan konteks yang dapat dipulihkan. Keduanya mempertahankan TembusMark, petrol/ivory, champagne/bronze, Space Grotesk dan Inter. Gunakan seam sebagai detail identitas; monospace untuk data teknis yang benar-benar berguna.

Hapus indikator protokol/hash/live yang hardcoded dari rancangan baru. Informasi status harus mengikuti respons atau kemampuan layanan. Form memakai scroll/cursor native dan feedback yang tetap terbaca tanpa animasi.

## Auth

- Header: logo asli, nama, kembali ke portofolio dan tema.
- Form: heading “Masuk ke pengelolaan portofolio”, email, password, kontrol tampil/sembunyikan, bantuan pemulihan dan satu tindakan utama “Masuk”.
- Login-first. Registrasi tidak dipromosikan sebagai cara memperoleh hak admin; kebijakan provisioning perlu ditentukan sebelum endpoint signup diubah.
- State wajib: mengecek sesi, anonim, gagal cek sesi, login ditolak, dibatasi percobaan, CAPTCHA bermasalah, non-admin, pemulihan tidak tersedia, link reset invalid/expired dan reset berhasil.
- Pertahankan autofill/paste; gunakan autocomplete sesuai mode, error terhubung, fokus terarah dan teks pengiriman yang tetap bernama.

## Admin

Navigasi utama dikelompokkan **Konten / Pemantauan / Pengaturan**. Desktop memakai navigasi samping ringkas; mobile memakai drawer berlabel. Satu menu akun/keluar. Aksi utama mengikuti halaman, bukan tombol tambah proyek yang selalu muncul.

- Konten: karya/studi kasus, profil/kontak, keahlian/sertifikasi, CV/media.
- Pemantauan: kunjungan, keamanan dan aktivitas.
- Pengaturan: preferensi serta ekspor dengan cakupan yang jujur.
- Tujuan navigasi menyimpan konteks URL; nested `/admin/*` memerlukan penyesuaian router, guard dan design boundary yang sekarang exact-route.

Editor proyek menggabungkan Informasi, Studi kasus, Media/tautan, Penempatan dan Review. Gunakan workspace halaman untuk penulisan panjang; dialog untuk konfirmasi singkat. Local dirty state, unggahan, penyimpanan, sukses dan gagal harus dapat dibedakan. Jangan menyebut perubahan lokal sebagai draf server atau autosave yang belum tersedia.

Penyatuan layar belum menyatukan transaksi: resource proyek dan editorial masih terpisah. Tentukan atomic save atau partial-result handling sebelum membuat tombol “Simpan semua”. Jelaskan kepada pengelola bahwa data CMS tersimpan, sementara HTML/SEO statis mengikuti rilis situs berikutnya.

## Urutan implementasi

| Urutan | Scope | Bukti selesai |
| --- | --- | --- |
| 1 | Upload replacement aman; filter notifikasi login; selection dan pagination; label ekspor yang benar | Kasus gagal tidak kehilangan media/data; pilihan dan alert sesuai event |
| 2 | Auth/session states, layout/token/portal console dan aksesibilitas dasar | Form serta dialog konsisten; fokus, nama kontrol dan kontras terverifikasi |
| 3 | Navigasi responsif dan editor karya terpadu | Deep link/Back/refresh bekerja; tugas utama dan pemulihan error dapat diselesaikan |
| 4 | Profil, CV, kunjungan, keamanan, ekspor dan preferensi | Status mengikuti kemampuan backend; tidak ada sukses palsu atau data parsial tersembunyi |
| 5 | Validasi browser, regresi API, build dan dokumentasi | Bukti current build sebelum pembahasan rilis |

## Gate kualitas

Kontras teks biasa minimal 4,5:1 pada pasangan yang relevan; kontrol mobile ditargetkan 44 px untuk kenyamanan. Angka 44 px adalah target desain internal, bukan minimum WCAG 2.2 AA yang memakai 24 px dengan pengecualian. Periksa light/dark, portal, focus/error/disabled dan destructive states.

Uji 320–1440 px, zoom 200%, keyboard, screen reader, password manager, slow/offline API, session expiry, CAPTCHA dan kegagalan unggahan. Capture awal sudah mencakup delapan kombinasi desktop/mobile dengan fixture; itu bukan bukti login production, email, save atau full accessibility compliance.

Keputusan backend terpisah: signup/invite, policy password baru, passkey/MFA, server draft/autosave/version history dan deployment jobs. Redesign pertama tidak boleh menampilkan kemampuan tersebut seolah sudah bekerja.

## Bukti visual saat ini

[Auth desktop](media/auth-admin-current/auth-dark-1440.png) · [Auth light](media/auth-admin-current/auth-light-1440.png) · [Admin desktop](media/auth-admin-current/admin-dark-1440.png) · [Admin mobile](media/auth-admin-current/admin-dark-390.png) · [Mismatch dialog](media/auth-admin-current/admin-project-dialog-dark-1440.png).

Gambar adalah baseline implementasi sekarang dengan API fixture, bukan mockup desain baru. Spesifikasi detail, temuan dengan referensi source, daftar sumber dan matriks validasi ada pada [laporan lengkap](AUTH_ADMIN_REDESIGN_RESEARCH.md).
