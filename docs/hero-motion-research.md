# Riset motion dan finishing visual — Celah

## Status against current source — 15 November 2026

This is design research, not a current implementation or benchmark report. CybersecurityHero and HomeMotion implement the current hero/landing choreography; readable text remains available without WebGL. Use the current source and design specification for actual timing and eligibility. Public theme reveal uses a 780 ms atlas, not the prototype timings proposed below. See [the current codebase guide](current-codebase.md) and [the repository README](../README.md) for maintained commands and limitations.

## Historical record / original research

The remainder preserves the earlier revision, including its dates, observations and release receipts. Statements about “current”, “pending” or “deployed” below apply to that historical revision, not the present checkout.

Tanggal: 8 November 2026. Cakupan: riset sumber primer dan pemetaan teknik ke desain Celah yang sudah dipilih. Belum mengubah motion pada preview atau aplikasi.

## Kesimpulan desain

Gerak utama: dua bidang terpisah secara diagonal, sementara pantulan menyusuri bibir celah dengan fase berbeda. Tipografi menjadi penyeimbang yang tetap terbaca. Kesan premium diupayakan melalui bobot, timing, hubungan cahaya dengan permukaan, dan kontinuitas.

Untuk permukaan metallic pada Celah, specular reflection dan iridescence tipis lebih koheren daripada distorsi seperti air. Refraction/dispersion adalah opsi bila desain benar-benar menambahkan material transparan; keduanya bukan efek wajib.

## Temuan dan referensi

| Sumber primer | Temuan yang didokumentasikan | Penerapan yang diusulkan |
| --- | --- | --- |
| [Fluid Glass — Exo Ape](https://www.awwwards.com/fluid-glass-case-study.html) | Tim membuat motion studies untuk transisi, menu, tombol, dan hover; variasi timing serta easing diuji sebelum menetapkan bahasa interaksi. | Pisahkan studi gerak bidang, cahaya, dan feedback tombol. Evaluasi keselarasan ketiganya sebelum menambah FX. Loader dari referensi ini tidak diadopsi karena kontrak first paint repo. |
| [Igloo — abeto](https://www.awwwards.com/igloo-inc-case-study.html) | Perjalanan kamera dirancang lewat previs. Tim menggunakan shader untuk intro real-time dan kombinasi efek untuk transisi adegan. | Susun satu perjalanan kamera Celah. Ambil metode previs dan kontinuitas; tidak menyalin tema es, intro tertutup, atau semua post-processing-nya. |
| [Reflection Scroll Effect — Manoela Ilic](https://tympanus.net/codrops/2024/02/15/reflection-scroll-effect/) · [demo](https://tympanus.net/Development/ReflectionScroll/) | Refleksi dibuat dengan clone yang dicerminkan dan bergerak bersama scroll, lalu diberi shading. | Uji refleksi tipografi yang sangat sempit pada bibir celah, dengan salinan dekoratif tersembunyi dari accessibility tree. Bukan refleksi seluruh halaman. |
| [MeshPhysicalMaterial — Three.js](https://threejs.org/docs/pages/MeshPhysicalMaterial.html) | Dokumentasi membedakan anisotropy untuk tampilan brushed metal, iridescence yang bergantung sudut, serta transmission dan dispersion pada material transparan. Fitur material menambah biaya per piksel. | Pilih bahasa material yang konsisten. Untuk baseline metallic, utamakan highlight dan perubahan warna tipis pada tepi; hindari simulasi kaca penuh tanpa kebutuhan visual. |
| [UnrealBloomPass — Three.js](https://threejs.org/docs/pages/UnrealBloomPass.html) | Bloom memiliki kontrol strength, radius, resolution, dan luminance threshold; dokumentasi mensyaratkan tone mapping. | Bloom menjadi eksperimen opsional pada highlight, dengan isolasi area/material. Tidak menerapkan glow pada semua teks atau seluruh permukaan. |
| [Scroll animations — Motion](https://motion.dev/docs/react-scroll-animations), [useVelocity](https://motion.dev/docs/react-use-velocity), [useSpring](https://motion.dev/docs/react-use-spring) | Scroll-linked menghubungkan nilai animasi dengan posisi scroll. Velocity dapat menjadi input efek; spring dapat mengikuti target motion value. | Satu timeline utama untuk bukaan dan kamera. Velocity hanya mengendalikan intensitas finishing kecil; pointer mendapat respons yang teredam. Tidak menambahkan GSAP untuk meniru demo. |
| [Speed / Graph Editor — Adobe](https://helpx.adobe.com/after-effects/desktop/animate-in-after-effects/speed-between-keyframes/speed.html) dan [Generate effects — Adobe](https://helpx.adobe.com/after-effects/desktop/apply-effects-and-animation-presets/list-of-effects/generate-effects.html) | Graph Editor mengatur kecepatan dan pengaruh keyframe. Adobe mencantumkan CC Light Sweep sebagai efek yang dibundel. | Bila Adobe After Effects digunakan, fungsinya adalah previs timing dan studi sapuan cahaya. Produksi hero tetap interaktif di web. Tidak menjanjikan ekspor video/JSON akan mempertahankan seluruh efek tersebut. |

## Koreografi yang direkomendasikan

Angka berikut adalah titik awal prototipe, bukan hasil benchmark atau ukuran yang disalin dari situs referensi.

| Fase | Perilaku |
| --- | --- |
| Kedatangan | Judul, identitas, dan CTA sudah terlihat. Selama sekitar 600–750 ms, bidang melakukan settling kecil dan satu highlight pendek memberi petunjuk kedalaman. Tidak ada gerbang visibilitas atau intro wajib. |
| Scroll 0–20% | Ada sedikit perpindahan perspektif, sedangkan bukaan masih sempit. Judul bergerak lebih sedikit daripada bidang untuk membentuk kedalaman. |
| Scroll 20–60% | Dua bidang memisah dengan arah berbeda. Pantulan mulai bergerak setelah bukaan terbentuk, bukan dimulai bersamaan. |
| Scroll 60–85% | Sorotan melintasi tepi; informasi xssscope di dalam celah mendapat ruang baca. Efek warna optik hanya muncul pada edge bila benar-benar membantu material. |
| Scroll 85–100% | Gerak melambat dan melepas ke konten berikutnya. Arah diagonal dipertahankan agar tidak terasa seperti pergantian section yang tidak berhubungan. |
| Scroll balik | Komposisi bergerak kembali mengikuti posisi. Tidak memutar ulang intro atau memberi efek acak. |

Satu fase tidak harus berisi satu efek. Kamera, crop, dan cahaya memakai kurva/fase berbeda tetapi berangkat dari progress yang sama. Hindari satu easing tunggal yang membuat semua elemen bergerak serentak.

Untuk entrance, kurva deselerasi adalah titik awal. Untuk scroll, gunakan pemetaan jarak yang jelas dengan easing lokal per fase. Karena layout sudah memakai Lenis, hindari smoothing ganda pada timeline utama yang menimbulkan keterlambatan. Hover/arrow dapat mendapat feedback sekitar 140–220 ms, tanpa bounce.

## Urutan efek

1. **Wajib:** pemisahan bidang, occlusion/crop yang terkontrol, perpindahan kamera kecil, dan light sweep pada edge.
2. **Layak diprototipe:** refleksi tipografi yang sempit dan iridescent highlight. Pilih berdasarkan hasil perbandingan dengan versi tanpa efek.
3. **Opsional:** local bloom atau sedikit directional blur pada gerakan tercepat. Tidak boleh mengaburkan judul dan CTA.
4. **Di luar baseline:** RGB split penuh, glitch acak, gelombang cair, kamera berguncang, flash, grain global, serta particle background generik.

## Kesesuaian dengan repo

- Preview `celah-refined.html` saat ini memakai satu progress easing untuk sejumlah nilai, termasuk `top` dan `height`. Ini studi komposisi; belum menjadi bukti performa atau motion final.
- Produksi memakai Motion dan CSS untuk layout/typography. Animasi utama diupayakan lewat transform pada layer terisolasi; masks dan blur tetap perlu diukur, tidak otomatis dianggap murah.
- Bila versi shader memberi peningkatan nyata, gunakan Three.js yang sudah ada hanya untuk lapisan edge/material. Post-processing canvas tidak otomatis memproses teks HTML di luar canvas. Refleksi teks memerlukan representasi dekoratif tersendiri yang sinkron dengan font/layout.
- `Hero3D.tsx` mempunyai chassis yang berguna: render berhenti offscreen, DPR dibatasi, dan resource dibersihkan. Gunakan prinsip lifecycle-nya; jaringan node/aurora existing bukan bagian konsep Celah.
- Shader dimuat sebagai enhancement setelah konten tersedia. Kegagalan WebGL tetap menghasilkan hero yang lengkap dan rapi.
- Dokumentasi Three.js online sudah menyebut perubahan r187; repo memakai r186.1. Verifikasi API pada dependency lokal sebelum memakai properti dari dokumentasi terbaru.
- `WelcomeScreen` yang menutupi halaman harus dipertimbangkan ketika menguji first visit. Motion hero baru tidak boleh dinilai hanya pada repeat visit.

## Mobile, aksesibilitas, dan verifikasi

Mobile memakai rentang perpindahan lebih pendek, tanpa pointer parallax. Reduced motion menggunakan komposisi statis yang lengkap serta feedback warna/fokus seperlunya. Teks utama tetap HTML yang dapat dibaca dan dipilih; TembusMark tetap bergeometri asli.

Pemeriksaan implementasi nanti: first/repeat visit, scroll lambat/cepat/balik, berhenti di tengah adegan, resize, navigasi keyboard, font terlambat, WebGL tidak tersedia, serta tab hidden/offscreen. Ukur performa dan first paint pada desktop/mobile; jangan menyamakan build lolos dengan FX yang mulus.

Hasil riset ini berdasarkan dokumentasi dan penjelasan pembuat. Demos/video belum diverifikasi langsung secara interaktif dalam sesi browser; sebagian halaman media mengembalikan 403. Belum ada klaim FPS atau biaya GPU hasil pengukuran.
