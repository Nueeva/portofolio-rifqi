# Plan redesign hero — Cybersecurity Engineer

## Status against current source — 15 November 2026

This plan is retained as design history. Current production code uses CybersecurityHero, optional OpticalField, HomeMotion landing studies and ProjectDiagram case-study figures. No new dependency, 3D replacement or deployment is implied by this plan. Current app/backend setup and checks are in the codebase guide. See [the current codebase guide](current-codebase.md) and [the repository README](../README.md) for maintained commands and limitations.

## Historical record / original research

The remainder preserves the earlier revision, including its dates, observations and release receipts. Statements about “current”, “pending” or “deployed” below apply to that historical revision, not the present checkout.

Status: rencana implementasi; belum mengubah UI. Target: mengganti hero pada branch `codex/cinematic-rework`.

Revisi arah visual: pengguna menekankan bahwa desainnya sendiri harus khas. Diagram kode dan alur inspeksi di bawah adalah bahan cerita, bukan komposisi hero yang sudah dipilih. Tiga studi visual telah dibuat untuk dibandingkan: **Celah** (tipografi terbelah dan bidang yang membuka), **Berkas** (editorial investigatif dengan anotasi), dan **Interferensi** (poster kinetik dengan bidang bergeser yang menyatu). Storyboard dan copy berikut tetap tentatif sampai arah komposisi dinilai. Hindari menerjemahkan rencana langsung menjadi template teks-kiri/diagram-kanan.

Pilihan pengguna setelah eksplorasi: **Celah**. Feedback berikutnya meminta permainan warna dan kualitas visual yang lebih premium. Refinement mempertahankan celah diagonal, mengganti pita hijau datar dengan dua bidang yang memiliki kedalaman serta pantulan tipis, menata ulang tipografi sans/serif dan whitespace. Tiga palet yang dapat dibandingkan: Petrol & Champagne, Oxblood & Pearl, Graphite & Glacier. Palet final belum ditetapkan pengguna. Hero masih berupa studi interaktif di percakapan; belum diintegrasikan ke React. Arah visual Celah ini mengungguli rencana diagram inspeksi literal pada bagian-bagian awal dokumen.

## Tujuan

Pengunjung langsung memahami Rifqi Ariansyah sebagai **Cybersecurity Engineer** yang menguji, membangun tooling, dan memperbaiki keamanan sistem. Asumsi audiens: recruiter teknis, calon kolaborator, dan calon klien yang ingin melihat bukti pekerjaan.

Hero harus memiliki komposisi yang khas saat diam, lalu menjadi lebih bermakna ketika digerakkan. Identitas tidak bergantung pada pengunjung menunggu animasi atau menyelesaikan scroll.

## Fondasi dari codebase

- `About.tsx` sudah menjelaskan pendekatan attacker dan defender, pengujian keamanan, tooling, dan secure applications.
- `projects.ts` mendokumentasikan alur xssscope: parameter probing, reflection-context analysis, dan verification. Ini menjadi subjek visual pembukaan.
- Audit Apexsions menjadi bukti pengalaman pada sistem produksi: 13 critical + 19 major findings diperbaiki. Gunakan total 32 dalam satu kalimat, bukan dashboard statistik.
- `HeroFeed.tsx` memiliki sumber aktivitas GitHub nyata. Tidak perlu menambahkan feed kedua atau telemetry buatan.
- `useSiteSettings` harus kembali menjadi jalur konfigurasi nama, headline, dan deskripsi; PR saat ini menggantinya dengan copy hardcoded.
- `RivaAgent.tsx` dan `projects.ts` berbeda dalam deskripsi bahasa/fitur xssscope. Ikuti `projects.ts` sebagai sumber brief, dan verifikasi repo xssscope sebelum menampilkan kode atau output aslinya. Jangan membawa klaim Go, 94 payloads, atau fitur lain yang belum direkonsiliasi ke hero.
- Repo portofolio belum menyediakan laporan audit, screenshot scanner, atau diff perbaikan asli. Visual awal berupa diagram konsep yang diberi keterangan; tidak menyamar sebagai hasil scan nyata.

## Arah desain

Satu bidang inspeksi yang terbuka, bukan jendela terminal atau susunan kartu. Tipografi **Cybersecurity Engineer** berukuran besar berpotongan secara komposisi dengan fragmen respons/kode dan satu jejak input yang ditelusuri. Fragmen tersebut merupakan konten yang diperiksa, sehingga visual memiliki fungsi dan hubungan dengan pekerjaan Rifqi.

Gunakan grafit dan putih hangat sebagai bidang utama, dengan emerald identitas existing untuk fokus inspeksi. Penanda konteks harus dibantu teks/garis, tidak mengandalkan warna saja. Space Grotesk untuk judul, Inter untuk penjelasan, JetBrains Mono hanya untuk kode dan data.

TembusMark tetap memakai komponen dan geometri asli, dalam peran identitas. Hentikan motif logo raksasa yang terus diperbesar dan diputar sebagai daya tarik utama.

## Storyboard desktop

| Keadaan | Yang terlihat | Perubahan yang membawa cerita |
| --- | --- | --- |
| First paint | Judul profesi, nama, deskripsi, CTA, dan bidang inspeksi sudah terlihat. Satu input ditandai dalam fragmen respons. | Entrance singkat berupa pergeseran kecil; tidak ada loader, opacity gate, atau intro wajib. |
| Scroll awal | Bidang inspeksi mendekat secara perspektif. Fokus berpindah dari input menuju lokasi refleksinya. | Kamera dan penanda mengikuti satu timeline. Pengunjung melihat hubungan input dengan konteks respons. |
| Scroll berikutnya | Konteks yang relevan menjadi pusat perhatian; penjelasan singkat menerangkan bahwa refleksi perlu dianalisis dan diverifikasi. | Penekanan tipografi, crop, dan kedalaman berubah bersama. Bukan sekadar membesarkan objek. |
| Pelepasan hero | Bidang kembali terbaca utuh, dengan akses ke case study xssscope dan satu bukti audit Apexsions. | Gerak melambat lalu melepas sticky ke konten home. Tidak ada bab, progress rail, atau signage scroll. |

Anggaran awal desktop: total tinggi hero sekitar 160–180svh; validasi terhadap ukuran konten dan kenyamanan scroll. Hindari banyak layar kosong untuk satu efek. Rentang ini adalah target prototipe, bukan aturan mutlak.

Pointer hanya menambah sedikit kedalaman. Semua informasi dan navigasi tetap bisa diakses tanpa pointer, hover, atau drag.

## Copy awal

- Judul utama: **Cybersecurity Engineer**.
- Identitas: **Rifqi Ariansyah**, sebagai bagian komposisi judul/signature, bukan kicker dekoratif.
- Deskripsi: **Menguji keamanan aplikasi, membangun security tooling, dan memperbaiki celah pada sistem produksi.**
- CTA utama: **Lihat xssscope** → `/projects/curated-xssscope`.
- CTA sekunder: **Hubungi saya** → `/contact`.
- Bukti pendukung: **Apexsions — 32 temuan keamanan ditemukan dan diperbaiki.** Link ke `/projects/curated-apexsions`.
- Keterangan diagram: **Ilustrasi alur pemeriksaan xssscope.** Tidak menampilkan endpoint klien, credential, log live, atau hasil pengujian rekaan.

Jika verifikasi sumber berhasil menyediakan contoh input/output yang autentik dan aman dipublikasikan, contoh tersebut dapat menggantikan diagram konsep dengan atribusi yang jelas. Klaim hasil harus tetap dapat ditelusuri.

## Mobile dan reduced motion

- Judul dan CTA mendahului bidang inspeksi dalam urutan baca; potongan kode dibatasi supaya tidak menghasilkan horizontal overflow.
- Gunakan framing dan perpindahan fokus yang lebih sederhana. Awali prototipe mobile tanpa sticky panjang; tambahkan hanya jika benar-benar meningkatkan keterbacaan.
- Tidak ada fitur hover-only. Diagram dapat dibaca statis dan link memiliki target sentuh yang cukup besar.
- Reduced motion menampilkan komposisi final yang lengkap, tanpa perjalanan kamera, parallax pointer, atau animasi ambient terus-menerus.
- Diagram dekoratif tidak membanjiri screen reader. Informasi substantif memiliki padanan teks, urutan DOM logis, dan fokus keyboard yang jelas.

## Implementasi

1. **Verifikasi bahan dan perilaku existing.** Cek sumber xssscope; petakan setting hero; periksa dampak `WelcomeScreen` yang saat ini menutup halaman pada sesi pertama. Intro itu tidak boleh menghalangi hero yang baru.
2. **Komposisi statis desktop/mobile.** Bangun struktur, tipografi, diagram, copy, dan CTA sebelum animasi. Review dalam screenshot untuk kedua viewport.
3. **Prototipe gerak hero.** Gunakan Motion yang sudah ada dengan satu scroll timeline. CSS perspective, transform, dan penanda fokus cukup untuk versi pertama; Three.js bukan prasyarat. Tidak menambah dependency.
4. **Integrasi.** Pulihkan penggunaan site settings, pertahankan analytics dan TembusMark, serta rapikan CSS hero lama yang tidak terpakai. Bagian home di luar hero tidak ikut didesain ulang.
5. **Verifikasi nyata.** Uji first visit dan repeat visit, navigasi CTA, keyboard, mobile, reduced motion, SSR/hydration, dan perilaku saat data settings terlambat atau gagal. Jalankan build lengkap serta lint pada file yang berubah.
6. **Perbarui PR existing.** Ringkasan dan dokumentasi mengikuti hero final. Tidak merge atau deploy dalam pekerjaan redesign ini.

File utama: `src/pages/Index.tsx`, komponen baru `src/components/CybersecurityHero.tsx`, dan stylesheet hero terisolasi. `WelcomeScreen.tsx`/pemanggilnya hanya diubah bila diperlukan untuk menghapus penghalang first paint; semua rute tetap utuh. Perubahan `DESIGN.md` mengikuti hasil final, bukan sekadar niat awal.

## Kriteria selesai

- Identitas Cybersecurity Engineer terlihat pada layar pertama, termasuk tanpa animasi.
- Gerak memperlihatkan proses inspeksi yang dapat dijelaskan, dengan satu momen utama yang mudah diingat.
- Komposisi diam tetap kuat dan CTA selalu mudah ditemukan.
- Tidak ada klaim teknis baru, hasil scan palsu, atau angka di luar sumber yang disepakati.
- TembusMark tetap asli; tidak ada terminal palsu, hujan karakter, shield dekoratif, numbered rail, atau kartu statistik berulang.
- Pengaturan hero, analytics, routing, tema, dan navigasi publik tetap berfungsi.
- Screenshot serta pengujian desktop/mobile dan reduced motion benar-benar dilakukan. Build/lint tidak dianggap pengganti verifikasi visual.
- Build client + SSR + postbuild dan lint file yang berubah lolos. Tidak menyentuh `.env`, konfigurasi deployment, scripts, Supabase, data proyek, atau admin.

## Dasar referensi

- [Igloo — case study pembuat](https://www.awwwards.com/igloo-inc-case-study.html): previs untuk perjalanan kamera dan transisi adegan.
- [Exo Ape — wawancara art director](https://www.commarts.com/webpicks/exo-ape): komposisi, aset spesifik, dan motion studies sebelum implementasi.
- [Bruno Simon](https://bruno-simon.com/): interaksi sebagai demonstrasi kemampuan.
- [Devin AI — Lusion](https://lusion.co/projects/devin_ai/): animasi untuk menjelaskan produk teknis.

Referensi dipakai sebagai prinsip. Penampilan dan materi hero berasal dari identitas dan pekerjaan Rifqi. Riset sebelumnya berbasis halaman resmi/case study; animasi referensi belum diuji langsung di browser sesi ini.
