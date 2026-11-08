# Celah: motion, light theme, dan pertumbuhan konten

Audit ulang terhadap commit `03f2aa3`, berdasarkan source, CSS hasil build, paket terpasang, dan riset sumber primer. Belum ada observasi browser baru: izin preview tetap ditolak. Dokumen ini berisi temuan dan rekomendasi; tidak ada perubahan UI, admin, database, atau deployment pada putaran riset ini.

## Temuan utama

### P1: timeline hero ikut mati ketika sticky tidak memenuhi syarat

`src/components/CybersecurityHero.tsx:35–38` membatasi progres scroll dengan `stage.scrollHeight <= innerHeight - 64`. Jika gagal, progres disetel ke nol. `src/components/cybersecurity-hero.css:98` menetapkan minimum stage 760 px: viewport setinggi 780–823 px gagal syarat tersebut meskipun memenuhi media query tinggi minimal 780 px.

Bidang dekoratif `.cyber-lower` mulai pada 54% + 10 px dengan tinggi 100% (CSS baris 33). Overflow dekoratif ini dapat ikut memperbesar scrollHeight walaupun terpotong secara visual. Mengaktifkan sticky kemudian mengubah ukuran yang dipakai sebagai syarat; ini juga berpotensi menciptakan feedback resize. Ukuran aktual dan feedback loop perlu dibuktikan dalam browser.

Tidak ada koreografi entrance terpisah. Transform DOM dan shader hanya mendapat progres scroll yang sama. Di bawah 1024 px atau ketika syarat fit gagal, tidak ada timeline pengganti. Shader memakai latar yang sangat halus dan pointer displacement hanya 0.001; efek yang berjalan pun dapat sulit terlihat.

Rekomendasi: pisahkan kebijakan sticky, motion, dan kualitas WebGL. Ukur wrapper konten bermakna, bukan wadah dekorasi. Berikan entrance material sekali selama sekitar 0.9–1.2 detik dan progres non-sticky pada SVG/DOM. Reduced motion tetap mendapat pose lengkap dan feedback warna.

### P1: light-mode cavity kehilangan foreground yang sesuai

`src/components/cybersecurity-hero.css:102` mengoverride `.cyber-seam-copy` menjadi `var(--site-ink)`. Pada light theme, `--site-ink` dan `--site-cavity` sama-sama `#10272e`: kontras 1.00:1. Override yang salah berada setelah aturan foreground cavity dalam CSS build.

Rekomendasi: token semantik `cavity-ink` dan `cavity-muted` yang kontras terhadap cavity di kedua tema. Foreground mengikuti surface tempat teks berada, bukan sekadar mode halaman.

### P1: hover global merusak foreground tombol berisi warna

`src/components/public/public-design.css:293` menetapkan semua `button:hover` ke cyan, termasuk tombol submit dan kirim RIVA. Pasangan cyan/bronze light sekitar 1.10:1; cyan/champagne dark sekitar 1.29:1, sebelum filter tambahan komponen. Label/icon aktif kehilangan kontras.

Rekomendasi: hapus override global; masing-masing varian kontrol memiliki foreground pada fill, hover, focus, pending, dan disabled yang disengaja. Periksa pasangan hasil cascade dan transparansi, bukan hanya tabel token dasar.

### P2: transisi tema publik belum diimplementasikan

`src/components/public/PublicChrome.tsx:16` memanggil `setTheme` langsung. `src/index.css:101–105` mematikan transisi DOM, sementara baris 315–324 meniadakan animasi View Transition bawaan. Komponen legacy `ThemeToggle` punya animasi, tetapi tidak dipakai shell publik.

Rekomendasi: controller tema publik dengan reveal diagonal 450–550 ms menggunakan View Transitions jika tersedia, fallback transisi surface/foreground 180–220 ms, dan update langsung untuk reduced motion. DOM, icon, portal, dan canvas mengikuti satu perubahan tema. Tunggu renderer menyelesaikan frame dengan palet baru sebelum snapshot transisi dinyatakan siap; MutationObserver yang hanya menjadwalkan RAF belum menjamin itu. Pilihan tema tetap tersimpan jika animasi gagal atau pengguna mengeklik cepat.

### P2: kebijakan reduced motion mengandalkan hook yang tidak reaktif di paket terpasang

Versi lokal `motion` dan `framer-motion` adalah 14.6.0. Implementasi `node_modules/framer-motion/dist/es/utils/reduced-motion/use-reduced-motion.mjs:32–44` menggunakan `useState(prefersReducedMotion.current)` tanpa setter, dan masih memiliki TODO mengenai pembaruan otomatis. Klaim sebelumnya bahwa seluruh perubahan OS langsung tercermin belum didukung implementasi ini.

Rekomendasi: subscription `matchMedia` melalui `useSyncExternalStore` untuk kebijakan bersama dan SSR snapshot yang stabil. Kebijakan tersebut mengendalikan MotionConfig, shader, Lenis, cursor, dan SVG. Paket LazyMotion/domMax serta frame.setup tersedia; tidak ada bukti dependensi Motion hilang.

### P2: visual proyek masih memakai satu struktur gerak

`src/components/public/ProjectDiagram.tsx:26–34` mengulang dua path horizontal dan node lingkaran untuk empat proyek. Animasi utama berupa line draw 400 ms dan perubahan skala 4%. Label dan beberapa ornamen berbeda, tetapi hubungan visual dan alur interaksinya masih sangat serupa.

Rekomendasi: empat renderer dengan bahasa bersama tetapi mekanisme berbeda:

- xssscope: sorotan lokasi refleksi berpindah di antara konteks markup, atribut, dan script; hanya potongan contoh yang jelas berlabel ilustrasi atau bersumber dari artefak nyata.
- Apexsions: dua host dan suite plugin terbuka sebagai lapisan arsitektur; koneksi bridge dan jalur fallback database tersorot sesuai pilihan.
- Portfolio 71: alur publikasi/verifikasi dan batas peran; nama tahap rinci hanya ditampilkan jika didukung implementasi asli.
- CTF: eksplorasi empat kategori beserta media/helper yang benar-benar tersedia.

Media asli menjadi jenis visual utama untuk karya berikutnya. Diagram khusus digunakan ketika memang menjelaskan sistem, bukan menjadi kewajiban semua proyek.

## Kemampuan pengelolaan saat ini

| Konten | Jalur yang sudah bekerja | Batas saat ini |
| --- | --- | --- |
| Proyek | Admin → Projects → Supabase `projects` → Karya | Ditambahkan setelah empat proyek kurasi; belum otomatis menjadi featured Home, pengalaman Tentang, studi kasus, atau topik RIVA. |
| Sertifikasi | Admin → Certifications → Supabase `certifications` → Tentang | Editor sertifikasi lain di tab Content hanya memakai localStorage dan memiliki contoh lama. Dua jalur ini membingungkan. |
| Keahlian | Admin → Settings → Skills & Tools → tiga daftar dipisah koma | Kelompok security/dev/tools tetap; belum ada kelompok baru, urutan individual, atau hubungan ke bukti proyek. |
| CV | Content mengunggah PDF ke bucket resume | URL tersimpan lokal; tautan publik masih `/cv-rifqi-ariansyah.pdf`. Upload tersebut belum memperbarui tautan hero/Tentang. |

Sumber penting: `src/pages/Index.tsx:8`, `src/data/projectCopy.id.ts:133–142`, `src/pages/ProjectCaseStudy.tsx:12`, `src/components/public/projectVisuals.ts:6`, `src/lib/publicRiva.ts:7–20`, `src/components/admin/ContentManager.tsx:34–45`, dan `src/pages/About.tsx:21–25`.

Temuan tambahan yang perlu diperbaiki sebelum mengandalkan admin:

- Proyek CMS dengan judul sama seperti kurasi disaring secara diam-diam oleh `mergeProjects`; pengelolaan tidak dapat mengganti proyek kurasi.
- Input kategori admin berupa teks bebas, tetapi migration yang tersimpan membatasi tiga kategori. Ini temuan source/schema; database live belum diperiksa.
- SiteSettingsManager menunggu Promise.all tanpa memeriksa setiap `.error`, sehingga save bisa melaporkan sukses walaupun gagal.
- Admin belum menginvalidasi query publik yang sesuai setelah save. Cache publik 60 detik bukan publikasi lintas halaman yang langsung terlihat.

## Arah sistem konten yang direkomendasikan

Rekomendasi awal audit adalah mempertahankan Supabase. Setelah riset ini, pemilik secara eksplisit memilih melepas seluruh layanan Supabase; rekomendasi platform tersebut digantikan oleh [backend mandiri dan PostgreSQL](celah-selfhosted-postgres.md). Prinsip berikut tetap berlaku: gunakan konten terstruktur dan komponen editorial yang dikurasi, sehingga penambahan karya rutin tidak memerlukan JSX baru.

- Proyek: ringkasan, kategori, peran/periode, teknologi, link, media beserta caption/alt, bukti hasil, dan isi studi kasus.
- Editorial: pilihan featured, urutan, dan preview sebelum publish; Home membaca pilihan tersebut.
- Visual: kemampuan media, proses, arsitektur, dan workflow peran. Renderer khusus tetap tersedia untuk karya unggulan; konten lain punya fallback media yang dirancang dengan baik.
- Sertifikasi: satu sumber data dan satu editor publik yang jelas.
- Keahlian: kelompok, nama, urutan, dan relasi ke proyek sebagai bukti; tanpa persentase keahlian yang dikarang.
- CV: satu referensi publik yang disimpan secara persisten dan digunakan seluruh tautan download.
- RIVA: jawaban proyek disusun dari konten yang sama; proyek baru mendapat penjelasan dan tautan tanpa menambah cabang ID di kode.

Home dan studi kasus yang benar-benar dapat dikelola membutuhkan perluasan lingkup admin/data yang sebelumnya dikecualikan. Jangan memaksakan seluruh konten baru ke string settings untuk menghindari migration. UUID proyek di database dan ID publik `curated-*` juga membutuhkan mapping slug/alias yang mempertahankan URL lama; jangan menyalin string curated langsung ke kolom UUID.

## Riset eksternal dan penerapan

1. [Motion: scroll-triggered dan scroll-linked](https://motion.dev/docs/react-scroll-animations). Entrance dan respons scroll adalah mekanisme berbeda. Keduanya perlu dirancang sehingga kegagalan sticky tidak mematikan seluruh koreografi.
2. [Motion: SVG animation](https://motion.dev/docs/react-svg-animation). ViewBox, path, dan line offset mendukung perpindahan fokus dan alur penjelasan. Morph native memerlukan path yang kompatibel; jangan menambahkan library morph untuk kebutuhan yang bisa diselesaikan dengan layout/rendering yang jelas.
3. [MDN: scrollHeight](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight). Overflow yang tidak tampak dan pseudo-elements dapat memengaruhi pengukuran fit; pengukuran konten dan dekorasi perlu dipisahkan.
4. [MDN: startViewTransition](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition) dan [penggunaan View Transitions](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API/Using). Callback perubahan dapat menunggu Promise; gunakan untuk menyinkronkan frame DOM/canvas sebelum transisi. Feature detection dan fallback tetap diperlukan.
5. [Dash Creative, studi kasus oleh pembuatnya](https://tympanus.net/codrops/2026/07/21/magnetic-commerce-building-the-dash-creative-website/). Konsep brand mengarahkan perilaku material. Adaptasi untuk Celah: perubahan bidang dan cahaya harus terbaca jelas dan meneruskan metafora inspeksi. Artikel tersedia melalui indeks pencarian; pembukaan halaman langsung mengembalikan 403 saat riset. Tidak ada klaim bahwa demo interaktifnya telah diuji.
6. [Bartosz Ciechanowski: Curves and Surfaces](https://ciechanow.ski/curves-and-surfaces/). Kontrol yang mengubah hubungan visual memberi alasan untuk berinteraksi. Terapkan prinsip ini pada konteks refleksi dan topologi sistem, bukan sekadar mengganti label.
7. [Sanity: content modeling](https://www.sanity.io/content-modeling). Pisahkan data bermakna dari presentasi agar satu konten dapat dipakai lintas Home, Karya, studi kasus, dan asisten. Ini referensi arsitektur konten, bukan rekomendasi migrasi platform ke Sanity.

## Urutan revisi dan bukti penerimaan

1. Perbaiki cascade light/hover, pisahkan motion/sticky, dan perbaiki subscription preferensi.
2. Bangun hero dengan entrance yang terlihat tanpa scroll, respons scroll non-sticky, dan fallback SVG yang tetap mempunyai koreografi untuk pengunjung tanpa reduced motion.
3. Tambahkan transisi tema yang menyinkronkan DOM dan canvas. Uji klik cepat, perubahan preferensi, dan browser tanpa View Transitions.
4. Bedakan visual/motion proyek; prototipe satu scene xssscope dan satu arsitektur Apexsions sebelum memperluasnya.
5. Rapikan jalur admin yang menyesatkan, lalu bangun pengelolaan featured/studi kasus/skills dengan model data yang disepakati.

Penerimaan harus menguji perilaku nyata: intro berjalan tanpa scrolling; resize tidak menyebabkan progres terpaku/berosilasi; mobile non-sticky tetap bergerak; reduced motion berubah selama sesi; kedua tema dan seluruh state kontrol terbaca; tema tidak meninggalkan canvas dengan palet lama; proyek/sertifikat/skill baru dapat dipublikasikan tanpa edit kode dan terlihat pada surface yang dipilih. Tambahkan uji perilaku ini ke pengujian kontrak/build yang sudah ada. Angka 39 tes sebelumnya tidak membuktikan koreografi, kontras hasil cascade, atau kelengkapan CMS.
