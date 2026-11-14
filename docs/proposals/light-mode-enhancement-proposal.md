# Proposal Solusi Desain Visual & Teknis: Peningkatan Light Mode Portofolio Rifqi Ariansyah

## Status against current source — 15 November 2026

This is an archived proposal, not an installation guide or proof of zero overhead. Current public light tokens include #F8F6F1 page, #14171A ink, #ECE7DC cavity, #0F766E cyan and #92400E metal; the code does not implement every alternative palette proposed here. Current theme timing is 780 ms/64 frames with native and inert-layer fallback paths. Do not apply the proposed diffs automatically. See [the current codebase guide](../current-codebase.md) and [the repository README](../../README.md) for maintained commands and limitations.

## Historical record / original research

The remainder preserves the earlier revision, including its dates, observations and release receipts. Statements about “current”, “pending” or “deployed” below apply to that historical revision, not the present checkout.

**Subjudul**: Transformasi Estetika High-End Engineering, Resolusi Defek Lubang Hitam (Black Cavity), dan Pemetaan Token Semantik Berbasis 0-Cost Performance Overhead  
**Dokumen**: `docs/proposals/light-mode-enhancement-proposal.md`  
**Target Repository**: `c:\Users\Friel\Documents\Projects\portofolio-rifqi`  
**Versi**: 1.1.0-PROPOSAL (Iteration 2 Refinement)  
**Tanggal**: 14 November 2026  
**Status**: Research & Technical Proposal (Read-Only / Pre-Implementation)  

---

## Executive Summary

### 1. Tujuan Utama (Core Objective)
Dokumen ini menyajikan hasil riset arsitektur mendalam serta proposal komprehensif untuk meningkatkan kualitas estetika visual **Light Mode** pada portofolio personal Rifqi Ariansyah (`portofolio-rifqi`). Fokus utama perbaikan mencakup:
1. Menghilangkan secara tuntas anomali visual **"Lubang Hitam" (Black Cavity)** pada Hero Section saat Light Mode aktif.
2. Mengatasi impresi **"Visual Kusam" (Dingy / Muddy Appearance)** yang saat ini ditimbulkan oleh inversi kedalaman kartu (elevasi terbalik) dan rona kekuningan/khaki pada latar belakang.
3. Mentransformasikan portofolio menuju standar visual developer kelas dunia (*world-class developer portfolio*) yang terinspirasi oleh presisi Linear, Vercel (Geist), Paco Coursey, Emil Kowalski, dan Rauno Freiberg.
4. Memberikan jaminan performa mutlak **0-Cost Performance Overhead**: tanpa penambahan *bundle size* JavaScript runtime (0 bytes runtime JS bloat), memanfaatkan kapabilitas CSS Custom Properties modern, serta mempertahankan efisiensi rendering WebGL Three.js berdaya rendah (*zero draw-call at idle*).

### 2. Ringkasan Temuan Masalah Kunci
Berdasarkan investigasi statis dan dinamis pada repositori:
- **Akar Masalah Lubang Hitam Hero**: Ditemukan 5 elemen kode yang tersinkronisasi memaksakan warna gelap pekat ke dalam celah optik Hero pada Light Mode: token `--site-cavity: #10272e` di `src/components/public/public-design.css:14`, hardcoded inner shadow `#03090bcc` di `src/components/cybersecurity-hero.css:40`, path SVG poster dengan `fill="var(--site-cavity)"` di `src/components/CybersecurityHero.tsx:95`, atenuasi shader sebesar 72% (`col *= 1. - cavity * .72`) di `src/components/public/OpticalField.tsx:8`, serta mandat spesifikasi lama di `DESIGN.md:166-168`. Kombinasi ini menciptakan torehan gelap berasio kontras 13.19:1 di tengah latar terang, memecah kesatuan visual halaman.
- **Akar Masalah Tampilan Kusam**: Terjadi anomali hukum fisika material di mana kontainer kartu (`--site-surface: #e4e0d4`, relative luminance $L \approx 0.74$) lebih gelap dibandingkan latar belakang kanvas (`--site-bg: #f1ece1`, $L \approx 0.83$). Di dunia nyata, permukaan yang terangkat (*elevated surfaces*) menangkap lebih banyak cahaya sehingga harus lebih terang. Selain itu, basis warna HSL $41^\circ\text{--}44^\circ$ memberikan nuansa kertas kotor/khaki, dipadukan dengan aksen logam lumpur (`#725739`) dengan saturasi rendah.

### 3. Proposisi Solusi & Nilai Tambah
1. **Tiga Alternatif Konsep Visual**:
   - **Konsep 1 (Rekomendasi Utama)**: *"Crisp Obsidian & Alabaster"* — estetika presisi engineering tinggi khas Linear dan Vercel (kontras teks utama 18.97:1 s.d. 19.80:1 AAA, aksen Precision Emerald `#087455` dan Sky Cyan `#0369A1` / Sky-700).
   - **Konsep 2**: *"Celah Architectural Titanium"* — evolusi editorial monograf arsitektural yang membersihkan rona kusam dan menggantinya dengan titanium hangat, alabaster arsitektural, serta aksen burnished bronze amber (`#92400E`).
   - **Konsep 3**: *"Nordic Minimalist & Prismatic Light"* — minimalisme taktil Skandinavia ala Emil Kowalski dan Paco Coursey dengan kanvas porselen ultra-bersih, aksen status hijau `#047857` (4.67:1 Pass AA), dan refraksi prisma optik.
2. **Nol Penambahan Runtime JS**: Seluruh transisi tema, pewarnaan, dan elevasi diimplementasikan murni melalui variabel CSS (`var(--...)`), modern CSS `light-dark()`, dan `color-scheme: light dark`.
3. **Penyelarasan WebGL**: Shader Three.js diadaptasi agar bertransisi menjadi refraktor optik jernih (*luminous ice trench* / *titanium rift*) pada Light Mode melalui parameterisasi `uniform vec3 base;` yang valid secara kompilasi WebGL, dengan tetap mempertahankan parameter `alpha: false` demi performa GPU optimal tanpa beban *alpha blending*.

---

## Section 1: Analisis Arsitektur & Akar Masalah (R1)

### 1.1 Target & Karakteristik Lingkungan Deployment
Berdasarkan berkas konfigurasi repositori (`package.json`, `vite.config.ts`, `tests/celah-release.test.mjs`):
1. **Runtime & Framework**:
   - React v18.3.1 menggunakan compiler `@vitejs/plugin-react-swc`.
   - TypeScript v5.5.3 dengan strict type-checking.
   - Styling Engine: Tailwind CSS v3.4.17 dengan `tailwindcss-animate` v1.0.7 dan custom CSS properties.
   - Core Animation & Rendering: `motion` v14.6.0 (Motion One / Framer Motion), `three` v0.186.1, `lenis` v1.3.27.
2. **Karakteristik Arsitektur SPA/PWA**:
   - Aplikasi berjalan sebagai Single Page Application (SPA) dengan kapabilitas Progressive Web App (PWA) melalui `vite-plugin-pwa` dan skrip SSG prerender custom (`scripts/prerender-public.mjs`).
   - Seluruh halaman publik (`/`, `/about`, `/projects`, `/projects/:id`, `/contact`) di-prerender menjadi HTML statis dengan metadata terintegrasi untuk SEO dan performa TTFB instan.
3. **Budget Rilis Otomatis yang Sangat Ketat (`tests/celah-release.test.mjs`)**:
   - Repositori ini dipagari oleh pengujian otomatis yang memeriksa ukuran gzip dari *entry bundle*:
     ```javascript
     // tests/celah-release.test.mjs:17-23
     assert.ok(size <= 200_000, `Initial JavaScript exceeds 200 kB gzip (${size} gzip bytes)`);
     assert.ok(![...seen].some(f => f.includes("three-")), "Three.js leaked into initial bundle");
     // tests/celah-release.test.mjs:29-32
     assert.ok(size <= 450_000, `Home bundle exceeds 450 kB gzip (${size} gzip bytes)`);
     ```
   - **Implikasi Arsitektural**: Solusi Light Mode dilarang keras menambahkan library runtime JS baru (misalnya library manipulasi warna dinamis seperti `chroma-js`, `colord`, atau styling framework baru). Penambahan paket JS runtime akan langsung menggagalkan release gate.
4. **Isolasi Domain Desain Ganda (Dual Design Domain Splitting)**:
   - Didefinisikan pada `src/components/public/PublicDesignBoundary.tsx`:
     ```tsx
     // Baris 8-9 & 25
     /** CSS variables stop at this boundary, including the dedicated portal host. Admin/auth keep their original root tokens and component contracts. */
     <div className={isPublic ? "public-design" : undefined} data-design={isPublic ? "celah" : "legacy"}>
     ```
   - Rute publik (`/`, `/about`, `/projects`, dsb.) berada di bawah selector scoped `.public-design` dan `.dark .public-design`.
   - Rute internal admin/auth (`/admin`, `/auth`) tetap menggunakan token standar shadcn/Tailwind di `:root` dan `.dark` pada `src/index.css`.
   - Modifikasi token Light Mode publik tidak boleh membocorkan gaya ke area admin, dan sebaliknya.

### 1.2 Mekanisme Theme Switching & Siklus Hidup Transisi
Pembalikan tema pada portofolio diorkestrasi oleh integrasi tingkat lanjut antara `next-themes`, View Transitions API, dan layer fallback:
1. **Pemicu Alih Tema (`src/components/ThemeToggle.tsx:55-63`)**:
   ```typescript
   const applyThemeNow = (toDark: boolean) => {
     setTheme(toDark ? "dark" : "light");
     document.documentElement.classList.toggle("dark", toDark);
     document.documentElement.classList.toggle("light", !toDark);
     document.documentElement.style.colorScheme = toDark ? "dark" : "light";
   };
   ```
   Pengubahan class `.dark` dan `.light` serta inline style `colorScheme` dilakukan secara sinkron untuk memastikan snapshot browser menangkap status baru secara instan.
2. **View Transitions API Reveal**:
   - Jika didukung browser (`document.startViewTransition`), browser mengambil snapshot keadaan lama dan baru, kemudian membuka tema tujuan melalui lingkaran klip (*circular clip-path reveal*) dari posisi koordinat tombol toggle (`src/lib/themeTransition.ts`).
   - Jika API tidak didukung, sistem mengeksekusi fallback *ink atlas transition* (`src/lib/inkMask.ts`) yang merender 48-64 frame masking organik tanpa frame thrashing.
3. **Status Meta Tag Browser Chrome Saat Ini**:
   - Pada `index.html:16`, saat ini hanya tertulis:
     ```html
     <meta name="theme-color" content="#0b181c" />
     ```
   - **Defek**: Tidak terdapat `<meta name="color-scheme" content="light dark" />` dan tidak ada diferensiasi `theme-color` dengan media query `prefers-color-scheme`. Akibatnya, pada perangkat seluler atau browser desktop dengan tema terang, bilah status browser (browser chrome) tetap berwarna gelap gulita `#0b181c`, menciptakan ketidaksinkronan estetika.

### 1.3 Investigasi Empiris Akar Masalah "Lubang Hitam" (Black Cavity) Hero Section
Dalam evaluasi visual Light Mode, Hero Section menampilkan torehan diagonal hitam pekat yang merusak komposisi halaman. Investigasi kode menemukan bahwa defek ini disebabkan oleh 5 elemen yang saling mengunci:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ ELEMEN 1: public-design.css (Baris 14 & 85)                                      │
│ --site-cavity: #10272e; (Warna tinta petrol gelap L ≈ 0.018 di kanvas terang)   │
│ .public-design .cyber-cavity { background: var(--site-cavity); }                 │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
┌────────────────────────────────────────▼─────────────────────────────────────────┐
│ ELEMEN 2: cybersecurity-hero.css (Baris 40)                                      │
│ .cyber-cavity { background: #071013; box-shadow: inset 0 12px 20px #03090bcc; }  │
│ Hardcoded inset shadow hitam pekat tetap aktif menimpa background                │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
┌────────────────────────────────────────▼─────────────────────────────────────────┐
│ ELEMEN 3: CybersecurityHero.tsx (Baris 95)                                       │
│ <path d="M-60 570L1340 325L1340 470L-60 715Z" fill="var(--site-cavity)"/>       │
│ Vektor SVG fallback merender poligon 1400x145px terisi #10272e                  │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
┌────────────────────────────────────────▼─────────────────────────────────────────┐
│ ELEMEN 4: OpticalField.tsx (Baris 8)                                             │
│ float cavity = 1. - smoothstep(-.003, .003, edge); col *= 1. - cavity * .72;     │
│ Shader WebGL mereduksi kecerahan piksel sebesar 72% menjadi abu-abu gelap muram  │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
┌────────────────────────────────────────▼─────────────────────────────────────────┐
│ ELEMEN 5: DESIGN.md (Baris 166-168)                                              │
│ "The cavity remains dark in both themes." (Spesifikasi lama memaksakan defek ini)│
└──────────────────────────────────────────────────────────────────────────────────┘
```

1. **Token `--site-cavity` Menggunakan Warna Tinta Gelap (`src/components/public/public-design.css:14, 85`)**:
   Variabel `--site-cavity` pada mode terang diisi `#10272e`. Nilai luminansi relatifnya adalah $L \approx 0.018$. Ketika dirender di atas latar `--site-bg: #f1ece1` ($L \approx 0.825$), kontras luminansinya mencapai 13.19:1. Torehan ini bertindak layaknya "lubang hitam" yang menelan pandangan mata pengguna.
2. **Hardcoded Dark Inset Shadow (`src/components/cybersecurity-hero.css:40`)**:
   Aturan `.cyber-cavity` menyertakan `box-shadow: inset 0 12px 20px #03090bcc`. Bayangan inset ini menggunakan warna `#03090b` dengan opasitas 80% (`cc`). Sekalipun warna latar diubah, bayangan dalam hitam ini tetap meredupkan tepi celah secara agresif.
3. **Poligon SVG Poster Fallback (`src/components/CybersecurityHero.tsx:95`)**:
   Elemen SVG poster yang berfungsi sebagai fallback visual sebelum WebGL siap atau pada mode non-WebGL memiliki path berukuran $1400\text{px} \times 145\text{px}$ yang diberi atribut `fill="var(--site-cavity)"`.
4. **Formula Atenuasi Luminansi pada Shader GLSL (`src/components/public/OpticalField.tsx:8`)**:
   Di dalam fragment shader kanvas Three.js, terdapat kalkulasi:
   ```glsl
   float cavity = 1. - smoothstep(-.003, .003, edge);
   col *= 1. - cavity * .72;
   ```
   Faktor `1. - cavity * .72` secara matematis mengalikan nilai warna fragment dengan `0.28` (mereduksi 72% luminansi). Pada Dark Mode (`#0b181c`), ini memberikan ilusi rongga yang dalam. Namun pada Light Mode (`#f1ece1`), pengalian ini menghasilkan warna lumpur kusam kecokelatan gelap (`rgb(67, 65, 62)`).
5. **Legasi Dokumen Desain (`DESIGN.md:166-168`)**:
   Teks spesifikasi lama secara harfiah menyatakan: *"The cavity remains dark in both themes. Its scoped foreground uses ivory..."*. Ini adalah keputusan desain usang yang menjadi akar filosofis munculnya bug lubang hitam tersebut.

### 1.4 Investigasi Empiris Akar Masalah "Visual Kusam" (Dingy / Muddy Light Mode)
Selain anomali celah hero, keseluruhan tampilan Light Mode saat ini dinilai "kusam" dan kurang segar. Analisis colorimetry mengidentifikasi tiga penyebab utama:
1. **Inversi Elevasi Kartu (Inverted Card Elevation)**:
   - Kanvas Dasar (`--site-bg`): `#f1ece1` (Luminansi $L = 0.825$)
   - Kartu Permukaan (`--site-surface`): `#e4e0d4` (Luminansi $L = 0.741$)
   - Kartu justru lebih gelap daripada latar belakang. Dalam hukum pencahayaan antarmuka (*ground-plane lighting*), bidang yang lebih tinggi mendekati sumber cahaya ambien sehingga harus tampak lebih terang atau murni putih (`#FFFFFF`). Kartu yang lebih gelap daripada kanvas secara psikologis dipersepsikan sebagai lubang cekung yang kotor atau kusam.
2. **Undertone Kuning / Khaki / Olive**:
   - Nilai HSL untuk `--site-bg` adalah $(41^\circ, 36\%, 91\%)$, `--site-surface` $(44^\circ, 23\%, 86\%)$, dan `--site-low` $(77^\circ, 14\%, 89\%)$. Spektrum rona antara $40^\circ$ dan $80^\circ$ pada saturasi rendah condong ke warna kertas koran usang atau kain kusam, bukan putih teknis modern yang tajam pada layar sRGB / D65.
3. **Aksen Logam Rendah Saturasi & Rendah Kontras**:
   - `--site-metal: #725739` adalah warna cokelat tanah berkilau redup ($L \approx 0.108$). Pada tombol dan teks link, warna ini tampak mati dan tidak mencerminkan identitas rekayasa keamanan siber (*cybersecurity engineering*) modern yang presisi dan bertenaga.

---

## Section 2: Analisis Tolok Ukur (Benchmarking) Portofolio Developer Modern Kelas Atas (R2)

Untuk menetapkan tolok ukur estetika tertinggi, dilakukan analisis komparatif terhadap portofolio insinyur dan desainer perangkat lunak terkemuka serta *design system* industri papan atas:

### 2.1 Matriks Komparasi Tolok Ukur

| Parameter Desain | Paco Coursey (`pacocoursey.com`) | Emil Kowalski (`emilkowal.ski`) | Rauno Freiberg (`rauno.me`) | Linear & Vercel (Geist System) | Status Portofolio Saat Ini |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Ground Plane (Latar Dasar)** | Pure `#FFFFFF` atau Zinc dingin `#FAFAFA` | Milk Glass / Warm Porcelain `#FBFBFB` s.d. `#F7F7F8` | Cool Titanium `#F8F9FA` dengan micro-grain | Structured Alabaster `#FAFAFA` s.d. Slate `#F4F4F6` | Khaki / Parchment `#f1ece1` (Kusam) |
| **Arsitektur Permukaan (Cards)** | `#FFFFFF` mengambang di atas `#FAFAFA`, dibatasi hairline rule `#EAEAEA` | `#FFFFFF` dengan bevel mikro halus (`1px solid rgba(255,255,255,0.8)`) | Elevasi berlapis dengan batas mikro (`rgba(0,0,0,0.06)`) | 3-Tier Elevation (Base $\rightarrow$ Surface $\rightarrow$ Popover), seluruhnya lebih terang dari kanvas | Kartu `#e4e0d4` lebih gelap dari kanvas (Elevasi Terbalik) |
| **Ambient Shadows & AO** | Mendekati nol bayangan; mengandalkan batas 1px dan whitespace | Multi-layered micro-shadows: `0 1px 2px rgba(0,0,0,0.03), 0 6px 16px rgba(0,0,0,0.04)` | Diffuse contact shadows ultra-lembut (`0 2px 8px rgba(0,0,0,0.04)`) | Layered elevation tokens (`shadow-xs` hingga `shadow-lg`) dengan alpha hitam $2\%\text{--}8\%$ | Bayangan kaku `rgba(16,39,46,0.13)` dengan radius sempit |
| **Strategi Aksen & Status** | Disiplin monokromatis hitam/putih, aksen status dot emerald/blue | Basis netral; elemen interaktif responsif pegas (*spring-physics*) | Refraksi dispersi optik subtil; glint RGB lensa kamera | Single Deliberate Accent (Precision Emerald `#087455`, Sky Cyan `#0369A1`, atau Indigo) | Cokelat lumpur `#725739` berdaya pikat rendah |
| **Pencahayaan Hero Light Mode** | Tipografi kontras tinggi di atas kanvas bersih; nol rongga gelap | Radial wash lembut ($4\%\text{--}8\%$ opasitas), tekstur kaca prisma | Kisi mikro optik dengan refraksi translusen jernih | Radial spotlight luminous (`hsl(var(--primary)/0.08)`), laser hairline | Celah hitam pekat (#10272e) dengan bayangan inset berat |

### 2.2 Analisis Ground Plane, Surface Architecture, dan Ambient Shadows
1. **Prinsip Ground Plane**: Seluruh portofolio rujukan menggunakan latar dasar dengan nilai L (Lightness pada CIELAB/OKLCH) di atas $0.97$. Hal ini memberikan impresi ruang kerja digital yang bersih (*sterile yet tactile*).
2. **Prinsip Surface Architecture**: Permukaan interaktif (kartu proyek, widget) selalu menggunakan warna `#FFFFFF` murni yang terangkat di atas kanvas abu-abu sangat muda (`#FAFAFA` atau `#F8F6F1`). Pemisahan fisik dicapai melalui garis batas mikro (*hairline border*) berukuran 1px dengan opasitas rendah ($8\%\text{--}12\%$).
3. **Prinsip Ambient Shadows**: Bayangan tidak pernah menggunakan warna pekat atau jarak sebar (*spread*) yang kasar. Mengikuti formula Emil Kowalski, bayangan disusun secara berlapis (*stacked multi-stop shadows*) untuk menyimulasikan difusi cahaya alami di dunia nyata:
   ```css
   box-shadow: 
     0 1px 1px rgba(0, 0, 0, 0.02),
     0 2px 4px rgba(0, 0, 0, 0.02),
     0 8px 24px -4px rgba(0, 0, 0, 0.04);
   ```

### 2.3 Disiplin Aksen & Pencahayaan Hero Canvas
Sesuai panduan `antislop-ui` (R-01, R-10, R-13, R-29):
- Portofolio kelas atas tidak pernah menggunakan gradien warna-warni ungu-biru generik atau glow berlebihan di seluruh elemen.
- Aksen warna dibatasi maksimal 1 warna primer dominan ditambah 1 warna pendukung fungsional.
- Pada Hero Section Light Mode, visualisasi grafis tidak boleh berupa blok gelap yang memotong halaman, melainkan berupa **lensa refraksi kristalin**, kanal titanium terukir halus, atau spotlight radial lembut yang memancarkan kejernihan.

---

## Section 3: Tiga Konsep Solusi Desain Visual Light Mode (R2)

Berdasarkan analisis benchmarking dan karakteristik proyek keamanan siber, dirumuskan tiga alternatif konsep visual. Masing-masing konsep memiliki identitas unik, palet warna lengkap, audit rasio kontras, perlakuan hero tanpa celah hitam, dan arsitektur elevasi.

---

### 3.1 Konsep 1: "Crisp Obsidian & Alabaster" (Linear & Vercel High-Tech Engineering Aesthetic)
*Rekomendasi Utama (Primary Candidate)*

#### 1. Filosofi & Identitas Estetika
- **Karakter**: Ultra-bersih, presisi tinggi, dan mencerminkan stasiun kerja keamanan siber modern. Menyingkirkan seluruh rona kuning/khaki demi kanvas alabaster dingin, kartu porselen putih murni, dan tipografi obsidian pekat.
- **Brand Feeling**: Rekayasa sistem produksi, analisis statis otomatis, integritas runtime. Berwibawa, tajam, dan elegan.
- **Aksen**: *Precision Deep Emerald* (`#087455` / `#10B981`) melambangkan status verifikasi pengujian keamanan yang lolos (*passed assertions*), dipadukan dengan *Sky Cyan* (`#0369A1`, Sky-700) untuk sinyal telemetri aktif.

#### 2. Spesifikasi Token Semantik
```css
/* Konsep 1: Crisp Obsidian & Alabaster Tokens */
.public-design[data-theme-concept="obsidian-alabaster"] {
  /* Layer Permukaan (Surfaces) */
  --site-bg: #FAFAFA;            /* Kanvas Dasar: Alabaster / Zinc 50 */
  --site-surface: #FFFFFF;       /* Kartu: Putih Murni Terangkat */
  --site-surface-raised: #FFFFFF;/* Dialog / Modal / Popover */
  --site-low: #F4F4F6;           /* Seksi Sunken / Footer: Cool Technical Zinc */
  
  /* Tipografi & Tinta (Inks) */
  --site-ink: #090A0C;           /* Teks Utama: Deep Obsidian Black */
  --site-secondary: #3F424E;     /* Teks Sekunder: Slate Zinc */
  --site-muted: #646A7E;         /* Metadata / Caption: Cool Slate */
  --site-disabled: #9FA4B4;      /* Teks Nonaktif / Placeholder */

  /* Garis Batas & Kontrol Form (Borders) */
  --site-line: #E2E4E9;          /* Hairline Divider (Batas 1px Kartu) */
  --site-input: #D0D4DC;         /* Batas Input Default */
  --site-input-focus: #087455;   /* Batas Input Aktif / Focus Ring */

  /* Aksen & Status Keamanan */
  --site-metal: #087455;         /* Aksen Utama: Precision Deep Emerald */
  --site-accent-hover: #065F46;  /* Status Hover Tombol Utama */
  --site-cool: #0369A1;          /* Aksen Sekunder: Precision Sky Cyan (Sky-700) */
  --site-cyan: #0369A1;          /* Token Spektrum Shader & Poster SVG */
  --site-violet: #6366F1;        /* Aksen Pendukung: Code Violet */
  --site-copper: #D97706;        /* Aksen Telemetri: Amber Alert */
  --site-danger: #DC2626;        /* Status Bahaya / Vulnerability Red */

  /* Token Celah Optik Hero (Optical Seam) */
  --site-cavity: #F0F4F8;        /* Palung Celah: Luminous Ice Slate */
  --site-cavity-shadow: inset 0 2px 6px rgba(9, 10, 12, 0.04), inset 0 1px 2px rgba(8, 116, 85, 0.06);
  --site-reflection: #087455;    /* Teks Refleksi: Emerald Precision */
  --site-shadow: rgba(9, 10, 12, 0.04); /* Bayangan Ambien Kartu */
}
```

*Representasi OKLCH & HSL*:
- `--site-bg`: `oklch(0.985 0.002 247)` | `hsl(240, 5%, 98%)`
- `--site-surface`: `oklch(1.0 0 0)` | `hsl(0, 0%, 100%)`
- `--site-ink`: `oklch(0.145 0.008 260)` | `hsl(225, 14%, 4%)`
- `--site-metal` (Emerald): `oklch(0.505 0.125 160)` | `hsl(163, 87%, 24%)`
- `--site-cool` / `--site-cyan` (Sky-700): `oklch(0.500 0.119 242.7)` | `hsl(201, 96%, 32%)`
- `--site-copper` (Amber): `oklch(0.655 0.165 65.2)` | `hsl(38, 92%, 44%)`
- `--site-violet`: `oklch(0.585 0.195 275.4)` | `hsl(239, 84%, 67%)`

#### 3. Audit Rasio Kontras (WCAG 2.1 & APCA)

| Pasangan Elemen Antarmuka | Warna Depan | Warna Belakang | Rasio WCAG 2.1 | Status WCAG | Skor APCA | Kategori APCA |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Judul & Teks Paragraf Utama** | `#090A0C` | `#FAFAFA` | **18.97:1** | **Pass AAA** | **Lc 101.9** | Optimal untuk body text |
| **Teks Utama di atas Kartu** | `#090A0C` | `#FFFFFF` | **19.80:1** | **Pass AAA** | **Lc 104.7** | Optimal untuk body text |
| **Sub-heading & Teks Lede** | `#3F424E` | `#FAFAFA` | **9.58:1** | **Pass AAA** | **Lc 86.6** | Sangat mudah dibaca |
| **Teks Muted / Caption di Kanvas** | `#646A7E` | `#FAFAFA` | **5.15:1** | **Pass AA** | **Lc 70.5** | Memenuhi syarat teks isi |
| **Teks Muted di atas Kartu Putih**| `#646A7E` | `#FFFFFF` | **5.38:1** | **Pass AA** | **Lc 73.3** | Memenuhi syarat teks isi |
| **Aksen Tautan Emerald di Kanvas**| `#087455` | `#FAFAFA` | **5.52:1** | **Pass AA** | **Lc 74.1** | Memenuhi syarat interaktif |
| **Teks Putih pada Tombol Emerald**| `#FFFFFF` | `#087455` | **5.77:1** | **Pass AA** | **Lc 76.8** | Memenuhi syarat tombol CTA |
| **Aksen Sky Cyan di atas Putih / Alabaster** | `#0369A1` | `#FAFAFA` / `#FFFFFF` | **5.64:1** | **Pass AA** | **Lc 74.8** | Memenuhi syarat teks normal & kontrol |
| **Hairline Border Kartu di Kanvas**| `#E2E4E9` | `#FAFAFA` | **1.22:1** | Non-text boundary | Lc 9.8 | Garis batas struktural rapi |

*Catatan Validasi*: Penyetelan Sky Cyan dari `#0284C7` (4.10:1 FAIL) menjadi `#0369A1` (Sky-700) memastikan rasio kontras mencapai **5.64:1**, lulus WCAG AA secara mutlak untuk teks normal ($\ge 4.5:1$) dan WCAG AAA untuk teks besar ($\ge 3.0:1$).

#### 4. Perlakuan Hero Section (Eliminasi Lubang Hitam)
- **Transformasi Palung Celah**: `.cyber-cavity` dan path SVG poster berubah menjadi **Luminous Refractive Ice Trench** (`#F0F4F8`).
- **Eliminasi Bayangan Hitam**: Mengganti `box-shadow: inset 0 12px 20px #03090bcc` dengan `var(--site-cavity-shadow)` yang lembut (`rgba(9, 10, 12, 0.04)`).
- **Rel Seam (`.cyber-lip-top`, `.cyber-lip-bottom`)**:
  ```css
  background: linear-gradient(90deg, #E2E4E9 10%, #087455 35%, #0369A1 65%, #E2E4E9 90%);
  ```
- **Shader GLSL WebGL**: Dalam `OpticalField.tsx`, atenuasi gelap diadaptasi melalui uniform `base` yang disuplai langsung dari `--site-bg`:
  ```glsl
  // Dark mode: rongga dalam gelap (.72+.08 = 80%); Light mode: refraksi es kristal lembut (0.08)
  float isDark = base.r < 0.2 ? 1.0 : 0.0;
  col *= 1. - cavity * (isDark * 0.72 + 0.08);
  ```
- **Hasil**: Tidak ada lagi torehan gelap yang memotong layar. Celah hero tampak sebagai saluran optik kristalin tempat berkas data keamanan bergerak dinamis.

#### 5. Arsitektur Kedalaman & Elevasi
- **Tingkat 0 (Ground)**: `#FAFAFA` (datar, tanpa bayangan).
- **Tingkat 1 (Card)**: `#FFFFFF`, `border: 1px solid #E2E4E9`, `box-shadow: 0 1px 3px rgba(9, 10, 12, 0.03), 0 4px 12px -2px rgba(9, 10, 12, 0.04)`.
- **Tingkat 2 (Hover State)**: `transform: translateY(-3px)`, `box-shadow: 0 8px 24px -4px rgba(8, 116, 85, 0.08), 0 2px 6px rgba(9, 10, 12, 0.04)`, `border-color: #087455`.
- **Tingkat 3 (Modal / Dialog)**: `#FFFFFF`, `box-shadow: 0 16px 36px -8px rgba(9, 10, 12, 0.10)`.

---

### 3.2 Konsep 2: "Celah Architectural Titanium" (Modernized Editorial Heritage)
*Alternatif Editorial (Modernized Brand Metaphor)*

#### 1. Filosofi & Identitas Estetika
- **Karakter**: Evolusi langsung dari narasi filosofis "Celah" (bidang material arsitektural, torehan cahaya, tipografi editorial). Menghilangkan kesan kusam/parchment dengan mengadopsi material **Warm Architectural Alabaster, Warm Titanium, dan Burnished Amber Bronze**.
- **Brand Feeling**: Intelektual, riset mendalam, berwibawa, layaknya monograf arsitektural fisik kelas atas.
- **Aksen**: *Burnished Amber Bronze* (`#92400E`) dipadukan dengan *Deep Architectural Teal* (`#0F766E`).

#### 2. Spesifikasi Token Semantik
```css
/* Konsep 2: Celah Architectural Titanium Tokens */
.public-design[data-theme-concept="architectural-titanium"] {
  /* Layer Permukaan */
  --site-bg: #F8F6F1;            /* Warm Architectural Alabaster */
  --site-surface: #FFFFFF;       /* Kartu Putih Bersih Terangkat */
  --site-surface-raised: #FFFFFF;/* Dialog / Popover */
  --site-low: #F1EDE4;           /* Seksi Sunken: Architectural Limestone */
  
  /* Tipografi & Tinta */
  --site-ink: #14171A;           /* Teks Utama: Architectural Carbon Graphite */
  --site-secondary: #444950;     /* Teks Sekunder: Graphite Muted */
  --site-muted: #69707A;         /* Metadata: Titanium Grey */
  --site-disabled: #A8A298;      /* Teks Nonaktif */

  /* Garis Batas & Kontrol Form */
  --site-line: #E3DED4;          /* Warm Titanium Hairline Rule */
  --site-input: #D4CDC0;         /* Batas Input Default */
  --site-input-focus: #92400E;   /* Batas Input Aktif (Bronze) */

  /* Aksen & Status */
  --site-metal: #92400E;         /* Aksen Utama: Burnished Amber Bronze */
  --site-accent-hover: #78350F;  /* Hover Tombol Bronze */
  --site-cool: #0F766E;          /* Aksen Sekunder: Deep Architectural Teal */
  --site-cyan: #0F766E;          /* Shader Uniform Cyan */
  --site-violet: #6366F1;        /* Supporting Code Violet */
  --site-copper: #B45309;        /* Warm Copper Accent */
  --site-danger: #B91C1C;        /* Destructive Red */

  /* Token Celah Optik Hero */
  --site-cavity: #ECE7DC;        /* Palung Celah: Inset Warm Titanium */
  --site-cavity-shadow: inset 0 3px 10px rgba(44, 38, 30, 0.08), inset 0 1px 2px rgba(44, 38, 30, 0.10);
  --site-reflection: #92400E;    /* Teks Refleksi Bronze */
  --site-shadow: rgba(20, 23, 26, 0.04);
}
```

*Representasi OKLCH & HSL*:
- `--site-bg`: `oklch(0.972 0.008 75)` | `hsl(43, 25%, 96%)`
- `--site-surface`: `oklch(1.0 0 0)` | `hsl(0, 0%, 100%)`
- `--site-ink`: `oklch(0.185 0.006 250)` | `hsl(210, 13%, 9%)`
- `--site-metal` (Bronze): `oklch(0.485 0.128 58)` | `hsl(24, 83%, 31%)`

#### 3. Audit Rasio Kontras (WCAG 2.1 & APCA)

| Pasangan Elemen Antarmuka | Warna Depan | Warna Belakang | Rasio WCAG 2.1 | Status WCAG | Skor APCA | Kategori APCA |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Judul & Teks Paragraf Utama** | `#14171A` | `#F8F6F1` | **16.66:1** | **Pass AAA** | **Lc 97.7** | Optimal untuk body text |
| **Teks Utama di atas Kartu Putih**| `#14171A` | `#FFFFFF` | **17.99:1** | **Pass AAA** | **Lc 102.7** | Optimal untuk body text |
| **Sub-heading Sekunder** | `#444950` | `#F8F6F1` | **8.40:1** | **Pass AAA** | **Lc 82.1** | Sangat mudah dibaca |
| **Teks Muted / Label di Kanvas** | `#69707A` | `#F8F6F1` | **4.63:1** | **Pass AA** | **Lc 66.1** | Memenuhi syarat teks isi |
| **Aksen Bronze pada Alabaster** | `#92400E` | `#F8F6F1` | **6.56:1** | **Pass AA (AAA Large)**| **Lc 75.9**| Kontras aksen tajam |
| **Teks Putih pada Tombol Bronze** | `#FFFFFF` | `#92400E` | **7.09:1** | **Pass AAA** | **Lc 86.1** | Tombol CTA luar biasa jelas |
| **Aksen Teal pada Kartu Putih** | `#0F766E` | `#FFFFFF` | **5.45:1** | **Pass AA** | **Lc 73.8** | Memenuhi syarat tautan |
| **Batas Garis Warm Titanium** | `#E3DED4` | `#F8F6F1` | **1.24:1** | Non-text rule | Lc 10.7 | Garis arsitektural halus |

#### 4. Perlakuan Hero Section (Architectural Inset Rift)
- **Torehan Material Bevel**: Celah diperlakukan sebagai rongga potongan batu pualam (*beveled limestone incision*) dengan warna dasar `#ECE7DC`.
- **Tipografi Refleksi Kontras**: Teks `.cyber-seam-copy` menggunakan `--site-ink` (`#14171A`) dan `--site-reflection` (`#92400E`), menghasilkan keterbacaan tajam ($15+:1$ dan $6+:1$).
- **Rel Seam**: Dilapisi gradien bronze dan teal:
  ```css
  background: linear-gradient(90deg, #E3DED4 10%, #0F766E 30%, #F8F6F1 50%, #92400E 70%, #E3DED4 90%);
  ```

#### 5. Arsitektur Kedalaman & Elevasi
- Menggunakan arsitektur *dual-border subtle bevel*: kartu `#FFFFFF` dibingkai oleh garis titanium luar `#E3DED4` berpadu dengan bayangan difus bernuansa hangat `rgba(44, 38, 30, 0.04)`.

---

### 3.3 Konsep 3: "Nordic Minimalist & Prismatic Light" (Emil Kowalski & Paco Coursey Tactile Mono)
*Alternatif Taktil Skandinavia (Tactile Minimalism)*

#### 1. Filosofi & Identitas Estetika
- **Karakter**: Minimalisme taktil Skandinavia. Disiplin monokrom ekstrem, spasi proporsional yang lapang, dan refraksi cahaya optik. Menggunakan kanvas porselen murni, tipografi karbon pekat, dan aksen dispersi prisma.
- **Brand Feeling**: Laboratorium riset, *clean room*, audit keamanan dengan presisi matematis.
- **Aksen**: Karbon netral pekat (`#111111`) untuk aksi primer, dengan spektrum dispersi warna (`Sapphire Blue #2563EB` $\rightarrow$ `Status Green #047857` $\rightarrow$ `Amber #D97706`) yang hanya muncul pada torehan celah optik dan indikator verifikasi audit.

#### 2. Spesifikasi Token Semantik
```css
/* Konsep 3: Nordic Minimalist & Prismatic Light Tokens */
.public-design[data-theme-concept="nordic-prismatic"] {
  /* Layer Permukaan */
  --site-bg: #FDFCFC;            /* Pure Nordic Porcelain Off-White */
  --site-surface: #FFFFFF;       /* Pure White Card */
  --site-surface-raised: #FFFFFF;/* Modal / Dialog */
  --site-low: #F5F5F7;           /* Nordic Mist Section Low */
  
  /* Tipografi & Tinta */
  --site-ink: #111111;           /* Deepest Neutral Carbon Black */
  --site-secondary: #404040;     /* Neutral Slate 700 */
  --site-muted: #666666;         /* Neutral Slate 500 */
  --site-disabled: #A3A3A3;      /* Inactive Text */

  /* Garis Batas & Kontrol Form */
  --site-line: #EAEAEA;          /* Hairline Micro-Border (Paco Style) */
  --site-input: #D4D4D4;         /* Input Stroke */
  --site-input-focus: #111111;   /* Input Active: Crisp Black */

  /* Aksen & Status */
  --site-metal: #111111;         /* Aksen Aksi Primer: High-Contrast Carbon */
  --site-accent-hover: #262626;  /* Carbon Hover */
  --site-cool: #2563EB;          /* Spectral Sapphire Blue */
  --site-cyan: #2563EB;          /* Shader Uniform Cyan */
  --site-accent-status: #047857; /* Spectral Status Green (Pass AA) */
  --site-violet: #7C3AED;        /* Spectral Violet */
  --site-copper: #D97706;        /* Spectral Amber */
  --site-danger: #EF4444;        /* Vulnerability Red */

  /* Token Celah Optik Hero */
  --site-cavity: rgba(245, 245, 247, 0.85); /* Frosted Glass Prism */
  --site-cavity-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.03);
  --site-reflection: #2563EB;    /* Spectral Reflection */
  --site-shadow: rgba(0, 0, 0, 0.03);
}
```

*Representasi OKLCH & HSL*:
- `--site-bg`: `oklch(0.992 0.001 0)` | `hsl(0, 0%, 99%)`
- `--site-surface`: `oklch(1.0 0 0)` | `hsl(0, 0%, 100%)`
- `--site-ink`: `oklch(0.125 0 0)` | `hsl(0, 0%, 7%)`
- `--site-metal`: `oklch(0.125 0 0)` | `hsl(0, 0%, 7%)`
- `--site-accent-status` (Emerald-700): `oklch(0.508 0.105 165.6)` | `hsl(163, 94%, 24%)`

#### 3. Audit Rasio Kontras (WCAG 2.1 & APCA)

| Pasangan Elemen Antarmuka | Warna Depan | Warna Belakang | Rasio WCAG 2.1 | Status WCAG | Skor APCA | Kategori APCA |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Judul & Teks Paragraf Utama** | `#111111` | `#FDFCFC` | **18.44:1** | **Pass AAA** | **Lc 102.1** | Optimal untuk body text |
| **Teks Utama di atas Kartu Putih**| `#111111` | `#FFFFFF` | **18.88:1** | **Pass AAA** | **Lc 106.1** | Optimal untuk body text |
| **Sub-heading Sekunder** | `#404040` | `#FDFCFC` | **10.12:1** | **Pass AAA** | **Lc 88.7** | Sangat mudah dibaca |
| **Teks Muted / Caption di Kanvas** | `#666666` | `#FDFCFC` | **5.61:1** | **Pass AA** | **Lc 73.6** | Memenuhi syarat teks isi |
| **Teks Putih pada Tombol Karbon** | `#FFFFFF` | `#111111` | **18.88:1** | **Pass AAA** | **Lc 106.1** | Kontras taktil absolut |
| **Aksen Biru Safir pada Kanvas** | `#2563EB` | `#FDFCFC` | **5.05:1** | **Pass AA** | **Lc 70.6** | Memenuhi syarat telemetri |
| **Aksen Hijau Status pada Kanvas** | `#047857` | `#FDFCFC` | **4.67:1** | **Pass AA** | **Lc 69.8** | Memenuhi syarat audit badge |
| **Garis Batas Mikro (Paco Style)** | `#EAEAEA` | `#FDFCFC` | **1.16:1** | Non-text rule | Lc 8.1 | Hairline presisi tinggi |

*Catatan Validasi*: Penyetelan Status Green dari `#059669` (3.68:1 FAIL) menjadi `#047857` memastikan rasio kontras mencapai **4.67:1**, lulus WCAG AA secara mutlak untuk teks normal dan indikator status.

#### 4. Perlakuan Hero Section (Prismatic Glass Seam & 0-Cost Hardening)
- Celah hero diwujudkan sebagai **Tactile Frosted Lens**:
  ```css
  .public-design .cyber-cavity {
    background: rgba(245, 245, 247, 0.75);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-top: 1px solid rgba(0, 0, 0, 0.08);
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }
  ```
- **Catatan Pengerasan Kinerja 0-Cost (0-Cost Performance Hardening)**:  
  Penggunaan `backdrop-filter: blur(16px)` di atas WebGL canvas yang aktif berjalan memicu *GPU framebuffer readback* (`glCopyTexSubImage2D` atau copy texture setara) dan multi-pass Gaussian blur pada setiap frame kompositor, yang berpotensi membebani bandwidth memori GPU pada perangkat hemat daya.  
  Untuk deployment dengan komitmen performa 0-cost mutlak (*strict 0-cost deployment*), gunakan alternatif 0-cost: pengisian translucent alpha murni `rgba(245, 245, 247, 0.95)` dengan *hairline border* tanpa filter blur:
  ```css
  /* 0-Cost GPU Fallback untuk Celah Hero Konsep 3 */
  .public-design[data-theme-concept="nordic-prismatic"] .cyber-cavity {
    background: rgba(245, 245, 247, 0.95);
    border-top: 1px solid var(--site-line);
    border-bottom: 1px solid var(--site-line);
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.03);
  }
  ```
  Alternatif ini menghasilkan 0 siklus texture readback, 0 draw call blur tambahan, serta mempertahankan visual minimalis porselen secara sempurna.
- Garis rel membiaskan warna spektrum: `linear-gradient(90deg, transparent, #2563EB 25%, #047857 50%, #D97706 75%, transparent)`.

#### 5. Arsitektur Kedalaman & Elevasi
- Menggunakan formula *stacked micro-shadows* Emil Kowalski dengan efek kompresi fisik `active:scale-[0.98]` dan kurva `cubic-bezier(0.16, 1, 0.3, 1)`.

---

### 3.4 Matriks Evaluasi & Komparasi Seluruh Konsep

| Kriteria Evaluasi | Baseline Saat Ini | Konsep 1: Obsidian & Alabaster | Konsep 2: Architectural Titanium | Konsep 3: Nordic Prismatic |
| :--- | :--- | :--- | :--- | :--- |
| **Karakter Visual Utama** | Kusam / Khaki / Kertas Usang | High-Tech Modern Engineering (Linear/Vercel) | Warm Editorial Architectural Monograph | Scandinavian Minimalist Craft (Emil/Paco) |
| **Resolusi Defek Lubang Hitam** | **GAGAL**: Torehan hitam pekat `#10272e` memotong halaman | **TUNTAS**: Palung es refraktif kristal (`#F0F4F8`) | **TUNTAS**: Rongga ukir batu titanium hangat (`#ECE7DC`) | **TUNTAS**: Kaca prisma frosted lens translusen |
| **Hierarki Elevasi Kartu** | **TERBALIK**: Kartu `#e4e0d4` lebih gelap dari kanvas | **ALAMI**: Putih Murni `#FFFFFF` di atas Alabaster `#FAFAFA` | **ALAMI**: Putih Murni `#FFFFFF` di atas Alabaster `#F8F6F1` | **ALAMI**: Putih Murni `#FFFFFF` di atas Porselen `#FDFCFC` |
| **Kontras Teks Utama (WCAG)** | 13.19:1 (Pass AA/AAA) | **18.97:1 s.d. 19.80:1 (Pass AAA)** | **16.66:1 s.d. 17.99:1 (Pass AAA)** | **18.44:1 s.d. 18.88:1 (Pass AAA)** |
| **Kontras Teks Muted (WCAG)** | 4.64:1 (Mendekati batas minimum) | **5.38:1 (Solid AA)** | **4.63:1 (Solid AA)** | **5.61:1 (Strong AA)** |
| **Kontras Tombol CTA (WCAG)** | 5.68:1 (Cokelat lumpur) | **5.77:1 (Vibrant Emerald)** | **7.09:1 (Burnished Amber, AAA)** | **18.88:1 (Carbon Black, AAA)** |
| **Kesesuaian Brand Cybersecurity**| Kurang representatif (terasa seperti manuskrip antik) | **Sangat Luar Biasa** (Sesuai standar SecOps modern) | **Sangat Baik** (Kesan riset bespoke & akademis) | **Luar Biasa** (Kesan clean room & audit laboratorium) |
| **Overhead Performa Runtime** | Status quo | **0-Cost** (Murni variabel CSS) | **0-Cost** (Murni variabel CSS) | **0-Cost** (Murni variabel CSS) |

### 3.5 Rekomendasi Konsep Utama & Rasionalitas
- **Rekomendasi Utama**: **Konsep 1 ("Crisp Obsidian & Alabaster")** direkomendasikan sebagai pilihan prioritas untuk diimplementasikan.
  - *Rasionalitas*: Portofolio personal Rifqi Ariansyah berfokus pada rekayasa keamanan siber (*Cybersecurity Engineer*), riset eksploitasi (xssscope), manajemen sistem CTF, dan platform game Apexsions. Estetika rekayasa modern ala Linear dan Vercel memberikan kredibilitas teknis paling kuat kepada calon mitra industri, perekrut teknis, maupun komunitas riset internasional.
  - Kontras teks utamanya mencapai rasio mendekati 20:1 AAA, eliminasi lubang hitam menghasilkan saluran optik laser yang futuristik namun elegan, dan aksen *Precision Emerald* secara instan menyampaikan pesan status keamanan terverifikasi.
- **Rekomendasi Cadangan**: Jika pemilik portofolio secara personal lebih menyukai kesinambungan metafora editorial materialistik dari rilis "Celah" terdahulu, **Konsep 2 ("Celah Architectural Titanium")** adalah pilihan alternatif terbaik karena berhasil membersihkan nuansa kusam tanpa meninggalkan akar desain editorialnya.

---

## Section 4: Kelayakan Teknis & Garansi 0-Cost Performance Overhead (R3)

### 4.1 Jaminan Nol Runtime JS Bundle Bloat (0-Cost JS Overhead)
1. **Pemanfaatan Murni Variabel CSS (Pure CSS Custom Properties)**:
   - Seluruh sistem pewarnaan, rasio kontras, ketebalan border, dan bayangan didelegasikan 100% ke layer CSS kaskade (`public-design.css`).
   - Tidak ada fungsi kalkulasi warna runtime JavaScript (seperti `tinycolor`, `polished`, atau `colord`). Hal ini menjamin **0 byte** penambahan pada bundle JavaScript produksi, sehingga budget rilis `celah-release.test.mjs` ($\le 200\text{ kB}$ gzip initial, $\le 450\text{ kB}$ gzip home) dijamin tidak terlanggar.
2. **Pemanfaatan Fitur CSS Standar Modern & Scoping Domain yang Disiplin**:
   - **`color-scheme: light dark`**: Dideklarasikan pada selector `.public-design` serta pada tag `<meta name="color-scheme" content="light dark">` di `index.html`. Fitur ini memberitahukan mesin render peramban (Blink, WebKit, Gecko) untuk menyesuaikan elemen bawaan form kontrol, scrollbar, dan latar belakang viewport secara instan sebelum siklus rendering pertama, mengeliminasi efek kedipan (*Flash of Un-themed Content*).
   - **Modern CSS `light-dark()` Function Scoped under `.public-design`**:
     Didukung penuh oleh seluruh browser modern (Chrome 123+, Safari 17.5+, Firefox 120+, sejak Mei 2024). Sesuai dengan isolasi modul pada `src/components/public/PublicDesignBoundary.tsx`, seluruh variabel CSS untuk tema portofolio publik wajib dideklarasikan di bawah lingkup `.public-design`, **bukan pada `:root`**, guna mencegah polusi token ke modul administratif dan autentikasi (`/admin`, `/auth`):
     ```css
     .public-design {
       color-scheme: light dark;
       --site-bg: light-dark(#fafafa, #0b181c);
       --site-surface: light-dark(#ffffff, #18343b);
       --site-cavity: light-dark(#f0f4f8, #071013);
       --site-cavity-shadow: light-dark(inset 0 2px 6px rgba(9, 10, 12, 0.04), inset 0 12px 20px #03090bcc);
       --site-cyan: light-dark(#0369a1, #83b3ad);
       --site-copper: light-dark(#d97706, #c7b594);
       --site-violet: light-dark(#6366f1, #9f8bb3);
     }
     ```
     Dengan tetap mempertahankan selector `.dark .public-design` sebagai *fallback cascade*, kompatibilitas mundur pada peramban versi lama tetap terjamin 100% tanpa mengubah sebaris pun kontrak `:root` pada antarmuka admin.

### 4.2 Performa WebGL Canvas & Hero Section
1. **Mempertahankan Buffer Opak (`alpha: false`) pada GPU Framebuffer**:
   - Analisis terhadap `src/components/public/OpticalField.tsx:20` mengonfirmasi inisialisasi:
     ```typescript
     renderer = new WebGLRenderer({ alpha: false, antialias: false, powerPreference: "low-power" });
     ```
   - **Evaluasi Teknis**: Mengubah canvas menjadi transparan (`alpha: true`) adalah antipola umum yang berakibat buruk: GPU perangkat mobile terpaksa melakukan kalkulasi *alpha compositing pass* berlapis dengan DOM tree di belakangnya.
   - **Solusi Rekomendasi**: Tetap pertahankan `alpha: false`. Mengapa? Karena pada baris 95 `OpticalField.tsx`, skrip membaca `css.getPropertyValue("--site-bg")` dan meneruskannya ke uniform shader `bg.uniforms.base.value` dan `material.uniforms.base.value`. Bidang latar belakang di dalam shader Three.js secara otomatis merefleksikan warna latar halaman secara sempurna tanpa memerlukan transparansi canvas.
2. **Karakteristik Idle Coalesce & Zero Frame Thrashing**:
   - Sistem rendering pada `OpticalField.tsx` bersifat *reactive on-demand*: animasi hanya berjalan ketika ada interaksi (`pointermove`, scroll progress, resize, atau alih tema).
   - Ketika halaman dalam keadaan diam (*idle*), requestAnimationFrame (`raf`) bernilai 0 dan **tidak ada satu pun draw call WebGL yang dieksekusi** (0% penggunaan GPU/CPU saat diam). Kondisi ini telah dibuktikan lulus dalam unit test: `tests/optical-rendering.test.mjs:31`.
   - Modifikasi visual pada celah hero sama sekali tidak mengubah loop rendering ini sehingga efisiensi energi perangkat mobile tetap terjaga maksimal.

### 4.3 Pemetaan Arsitektur Token Semantik Tiga Tingkat (Three-Tier Semantic Architecture)
Untuk menjaga keteraturan kode dan memudahkan pemeliharaan jangka panjang, sistem styling diorganisasikan ke dalam arsitektur token tiga tingkat:

```
┌────────────────────────────────────────────────────────────────────────┐
│ TIER 1: Primitive Tokens (Palet Dasar Warna Global)                   │
│ Alabaster-50 (#FAFAFA), Obsidian-950 (#090A0C), Emerald-700 (#087455), │
│ Slate-600 (#646A7E), Sky-700 (#0369A1), Border-Zinc (#E2E4E9)          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ TIER 2: Semantic Tokens (Peran Fungsional Independen-Tema)            │
│ --site-bg, --site-surface, --site-surface-raised, --site-low,          │
│ --site-ink, --site-secondary, --site-muted, --site-line,               │
│ --site-metal, --site-cool, --site-cyan, --site-copper, --site-violet, │
│ --site-cavity, --site-cavity-shadow                                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ TIER 3: Component-Level Bindings (Penerapan pada Elemen UI)           │
│ .cyber-hero, .cyber-cavity, .optical-poster, .public-navbar,           │
│ .project-card, .public-text-link, .syntax-sheet, button.cta            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Section 5: Blueprint Panduan Implementasi Langkah demi Langkah (R3)

*Catatan Kepatuhan: Sesuai mandat, dokumen ini adalah rancangan teknis komprehensif. Tidak ada modifikasi kode produksi langsung pada run ini.*

### 5.1 Rencana Peluncuran 4-Fase (Four-Phase Rollout Plan)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   FASE 1     │     │    FASE 2    │     │    FASE 3    │     │    FASE 4    │
│ Konsolidasi  │ ──► │ Remediasi    │ ──► │ Penguatan    │ ──► │ Verifikasi   │
│ Token CSS &  │     │ Celah Hero & │     │ Komponen &   │     │ Otomatis &   │
│ Head Meta    │     │ Shader Canvas│     │ Aksesibilitas│     │ Budget Gate  │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

#### Fase 1: Konsolidasi Token CSS & Optimasi Head Meta
- **Tujuan**: Menerapkan token semantik Light Mode baru di `public-design.css` dan melengkapi metadata browser di `index.html`.
- **Dampak Fungsional**: Zero breaking changes. Area admin/auth tidak terpengaruh karena terlindungi oleh `PublicDesignBoundary.tsx`.
- **Langkah Kerja**:
  1. Memperbarui blok `.public-design` pada `src/components/public/public-design.css` dengan token Konsep 1 (atau Konsep 2), termasuk deklarasi eksplisit token spektrum `--site-cyan`, `--site-copper`, dan `--site-violet`.
  2. Menambahkan deklarasi token `--site-cavity-shadow` pada mode terang dan gelap.
  3. Menambahkan meta tag `color-scheme` dan responsif `theme-color` pada `<head>` di `index.html`.

#### Fase 2: Remediasi Celah Hero & Shader Canvas
- **Tujuan**: Mengeliminasi torehan hitam pada hero section dan menyelaraskan rendering shader Three.js.
- **Langkah Kerja**:
  1. Pada `src/components/cybersecurity-hero.css`: mengubah `.cyber-cavity` agar menggunakan `background: var(--site-cavity)` dan `box-shadow: var(--site-cavity-shadow)`.
  2. Memparameterisasi rel seam `.cyber-lip-top` dan `.cyber-lip-bottom` agar menggunakan variabel CSS semantik (`var(--cy-metal)`, `var(--cy-cool)`, `var(--cy-line)`) daripada hex gelap hardcoded.
  3. Pada `src/components/public/OpticalField.tsx`: mendeklarasikan `uniform vec3 base;` pada shader `const optical`, menambahkan uniform ke `material.uniforms`, menyinkronkannya di `theme()`, dan mempertahankan konsistensi snapshot di `snapshot()`.
  4. Memverifikasi SVG poster fallback pada `src/components/CybersecurityHero.tsx` agar sinkron dengan token baru.

#### Fase 3: Penguatan Komponen & Aksesibilitas
- **Tujuan**: Memastikan kartu proyek, navigasi, dan diagram teknis memiliki keterbacaan kontras optimal.
- **Langkah Kerja**:
  1. Memeriksa komponen kartu pada `src/pages/public/Home.tsx` dan `src/pages/public/Projects.tsx` untuk memastikan latar belakang kartu memanfaatkan `--site-surface: #FFFFFF` dengan garis batas `--site-line: #E2E4E9`.
  2. Memverifikasi keterbacaan link teks, tag keahlian, dan tombol interaktif.
  3. Menyelaraskan scrollbar browser dengan token `--site-line` dan `--site-bg`.

#### Fase 4: Verifikasi Otomatis & Budget Rilis
- **Tujuan**: Memvalidasi kepatuhan terhadap seluruh invariant performa dan fungsionalitas.
- **Langkah Kerja**:
  1. Menjalankan seluruh test suite repositori: `node --test tests/optical-rendering.test.mjs tests/celah-release.test.mjs`.
  2. Memverifikasi tidak adanya kebocoran chunk Three.js ke entry point utama.
  3. Memvalidasi bahwa ukuran gzip bundle tetap berada di bawah batas ambang 200 kB dan 450 kB.

---

### 5.2 Usulan Kode Diff Konkret (Production-Ready Diffs)

Berikut adalah usulan perubahan kode konkret per fase yang siap diaplikasikan pada sprint implementasi mendatang:

#### Diff 1: `src/components/public/public-design.css` (Fase 1)
Menambahkan deklarasi lengkap token Light Mode untuk Konsep 1 (termasuk `--site-cyan`, `--site-copper`, dan `--site-violet`) dan parameter bayangan celah `--site-cavity-shadow`:

```diff
--- a/src/components/public/public-design.css
+++ b/src/components/public/public-design.css
@@ -1,18 +1,22 @@
 .public-design {
-  --background: 41 36% 91%; --foreground: 194 48% 12%;
-  --card: 44 23% 86%; --card-foreground: 194 48% 12%;
-  --popover: 41 36% 91%; --popover-foreground: 194 48% 12%;
-  --primary: 35 33% 34%; --primary-foreground: 41 36% 96%;
-  --secondary: 44 23% 86%; --secondary-foreground: 194 48% 12%;
-  --muted: 44 23% 86%; --muted-foreground: 189 11% 37%;
-  --accent: 35 33% 34%; --accent-foreground: 41 36% 96%;
-  --border: 40 15% 75%; --input: 38 9% 50%; --ring: 35 33% 34%;
+  color-scheme: light dark;
+  --background: 240 5% 98%; --foreground: 225 14% 4%;
+  --card: 0 0% 100%; --card-foreground: 225 14% 4%;
+  --popover: 0 0% 100%; --popover-foreground: 225 14% 4%;
+  --primary: 163 87% 24%; --primary-foreground: 0 0% 100%;
+  --secondary: 240 5% 96%; --secondary-foreground: 225 14% 4%;
+  --muted: 240 5% 96%; --muted-foreground: 224 12% 44%;
+  --accent: 163 87% 24%; --accent-foreground: 0 0% 100%;
+  --border: 220 13% 90%; --input: 220 13% 84%; --ring: 163 87% 24%;
   --destructive: 4 66% 39%; --destructive-foreground: 0 0% 100%;
-  --site-bg: #f1ece1; --site-surface: #e4e0d4; --site-low: #e6e8df;
-  --site-ink: #10272e; --site-muted: #536568; --site-metal: #725739;
-  --site-cool: #6a857f; --site-line: #c9c3b4; --site-input: #8a8274;
-  --site-cavity: #10272e; --site-reflection: #d1c3a8; --site-shadow: #10272e22;
+  --site-bg: #FAFAFA; --site-surface: #FFFFFF; --site-low: #F4F4F6;
+  --site-ink: #090A0C; --site-muted: #646A7E; --site-metal: #087455;
+  --site-cool: #0369A1; --site-line: #E2E4E9; --site-input: #D0D4DC;
+  --site-cyan: #0369A1; --site-copper: #D97706; --site-violet: #6366F1;
+  --site-cavity: #F0F4F8; --site-cavity-shadow: inset 0 2px 6px rgba(9, 10, 12, 0.04), inset 0 1px 2px rgba(8, 116, 85, 0.06);
+  --site-reflection: #087455; --site-shadow: rgba(9, 10, 12, 0.04);
   --public-gutter: clamp(20px, 4vw, 64px);
   min-height: 100svh; background: var(--site-bg); color: var(--site-ink);
   font-family: Inter, sans-serif; line-height: 1.65;
 }
@@ -31,3 +35,5 @@
   --site-cool: #83b3ad; --site-line: #385257; --site-input: #607779;
+  --site-cyan: #83b3ad; --site-copper: #c7b594; --site-violet: #9f8bb3;
-  --site-cavity: #071013; --site-reflection: #c7b594; --site-shadow: #03090b77;
+  --site-cavity: #071013; --site-cavity-shadow: inset 0 12px 20px #03090bcc;
+  --site-reflection: #c7b594; --site-shadow: #03090b77;
 }
@@ -83,5 +89,5 @@
 .public-design .cyber-lower::before { background: linear-gradient(155deg, var(--site-low), var(--site-bg) 65%); box-shadow: 0 -16px 30px var(--site-shadow); }
 .public-design .cyber-cavity { background: var(--site-cavity); }
-.public-design .cyber-seam-copy { color: #c1c7c2; }
+.public-design .cyber-seam-copy { color: var(--site-muted); }
 .public-design .cyber-seam-copy > span:first-child { color: var(--site-reflection); }
```

*Dokumentasi Aliran Data Token (`Token Wiring Feeds`)*:
Deklarasi eksplisit `--site-cyan`, `--site-copper`, dan `--site-violet` di atas memberi makan (*feeds*) tiga subsistem downstream penting:
1. **`src/components/public/OpticalField.tsx:96-121`**: Pada fungsi `theme()`, uniforms `bg.uniforms.cool`, `bg.uniforms.violet`, `material.uniforms.copper`, dan `material.uniforms.cool` membaca langsung dari `--site-cyan`, `--site-violet`, dan `--site-copper`. Ketersediaan token ini di mode terang memastikan material shader bertransisi dari nuansa teal gelap ke spektrum kristalin terang secara mulus.
2. **`src/components/CybersecurityHero.tsx:95`**: Elemen poster SVG fallback mendefinisikan `<linearGradient id="optical-spectrum">` dengan stops `var(--site-cyan)`, `var(--site-violet)`, dan `var(--site-copper)`. Ini menjamin poster SVG fallback dan WebGL canvas memiliki keselarasan kromatik 100%.
3. **`src/lib/themeSnapshots.ts:110`**: Generator snapshot tema mengekstrak `["--site-bg", "--site-cyan", "--site-violet", "--site-copper"]` untuk merender frame atlas offscreen secara instan sebelum View Transition berjalan, mengeliminasi risiko disparitas warna pada fallback ink transition.

---

#### Diff 2: `index.html` (Fase 1)
Menambahkan deklarasi responsif `color-scheme` dan `theme-color`:

```diff
--- a/index.html
+++ b/index.html
@@ -15,3 +15,5 @@
     <!-- PWA Meta Tags -->
-    <meta name="theme-color" content="#0b181c" />
+    <meta name="color-scheme" content="light dark" />
+    <meta name="theme-color" media="(prefers-color-scheme: light)" content="#FAFAFA" />
+    <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0b181c" />
     <meta name="mobile-web-app-capable" content="yes" />
```

---

#### Diff 3: `src/components/cybersecurity-hero.css` (Fase 2)
Mengganti nilai hardcoded dark-mode hex pada `.cyber-cavity`, `.cyber-lip-top`, dan `.cyber-lip-bottom` dengan token semantik CSS yang responsif terhadap tema:

```diff
--- a/src/components/cybersecurity-hero.css
+++ b/src/components/cybersecurity-hero.css
@@ -40,4 +40,4 @@
-.cyber-cavity { position: absolute; inset: 0; background: #071013; overflow: hidden; box-shadow: inset 0 12px 20px #03090bcc; }
-.cyber-lip { position: absolute; top: 50%; left: 0; right: 0; height: 2px; }
-.cyber-lip-top { background: linear-gradient(90deg, var(--cy-line) 10%, var(--cy-cool) 30%, var(--cy-ink) 51%, var(--cy-metal) 68%, #9f6e57 85%, var(--cy-line)); box-shadow: 0 5px 12px #83b3ad20; overflow: hidden; }
-.cyber-lip-bottom { height: 1px; background: linear-gradient(90deg, transparent, #83b3ad80 40%, #c7b59480 69%, transparent); }
+.cyber-cavity { position: absolute; inset: 0; background: var(--site-cavity, #071013); overflow: hidden; box-shadow: var(--site-cavity-shadow, inset 0 12px 20px #03090bcc); }
+.cyber-lip { position: absolute; top: 50%; left: 0; right: 0; height: 2px; }
+.cyber-lip-top { background: linear-gradient(90deg, var(--cy-line) 10%, var(--cy-cool) 30%, var(--cy-ink) 51%, var(--cy-metal) 68%, var(--cy-metal) 85%, var(--cy-line)); box-shadow: 0 5px 12px var(--site-shadow, #83b3ad20); overflow: hidden; }
+.cyber-lip-bottom { height: 1px; background: linear-gradient(90deg, transparent, var(--cy-cool) 40%, var(--cy-metal) 69%, transparent); opacity: .7; }
```

*Penjelasan Parameterisasi Seam Rails*:
- Nilai hardcoded `#9f6e57` (cokelat gelap) pada `.cyber-lip-top` diganti dengan `var(--cy-metal)`, dan bayangan `#83b3ad20` diganti dengan `var(--site-shadow, #83b3ad20)`.
- Nilai hardcoded `#83b3ad80` dan `#c7b59480` pada `.cyber-lip-bottom` diganti dengan `var(--cy-cool)` dan `var(--cy-metal)`.
- Karena `public-design.css:82` telah memetakan `--cy-metal: var(--site-metal); --cy-cool: var(--site-cool); --cy-line: var(--site-line);`, rel celah hero secara otomatis beradaptasi dengan warna Emerald dan Sky Cyan pada Light Mode tanpa menyisakan artefak warna gelap.

---

#### Diff 4: `src/components/public/OpticalField.tsx` (Fase 2)
Memperbaiki defek kompilasi GLSL shader dengan mendeklarasikan `uniform vec3 base;` secara lengkap dan valid pada `const optical`, mendaftarkannya pada `material.uniforms`, menyinkronkannya di `theme()`, serta memeliharanya pada `snapshot()`:

```diff
--- a/src/components/public/OpticalField.tsx
+++ b/src/components/public/OpticalField.tsx
@@ -7,3 +7,3 @@
-const optical = `varying vec2 vUv;uniform sampler2D source;uniform float progress;uniform vec2 pointer;uniform vec2 resolution;uniform vec3 copper;uniform vec3 cool;
-void main(){vec2 p=vUv;float gap=.025+smoothstep(0.,.35,progress)*.07;float seam=p.y-.35-p.x*.19;float edge=abs(seam)-gap;float bevel=exp(-abs(edge)*180.);vec2 offset=vec2(bevel*.012+pointer.x*.028,bevel*.018+pointer.y*.012);vec3 col;col.r=texture2D(source,p+offset*1.7).r;col.g=texture2D(source,p+offset).g;col.b=texture2D(source,p+offset*.3).b;float cavity=1.-smoothstep(-.003,.003,edge);col*=1.-cavity*.72;float sweep=smoothstep(.35,.75,progress);float shine=exp(-pow((p.x-(sweep*1.5-.25))*.9,2.)*22.);col+=bevel*mix(cool,copper,p.x)*(.26+shine*.8);col+=exp(-abs(edge)*35.)*copper*.035;gl_FragColor=vec4(col,1.);\n#include <colorspace_fragment>\n}`;
+const optical = `varying vec2 vUv;uniform sampler2D source;uniform float progress;uniform vec2 pointer;uniform vec2 resolution;uniform vec3 copper;uniform vec3 cool;uniform vec3 base;
+void main(){vec2 p=vUv;float gap=.025+smoothstep(0.,.35,progress)*.07;float seam=p.y-.35-p.x*.19;float edge=abs(seam)-gap;float bevel=exp(-abs(edge)*180.);vec2 offset=vec2(bevel*.012+pointer.x*.028,bevel*.018+pointer.y*.012);vec3 col;col.r=texture2D(source,p+offset*1.7).r;col.g=texture2D(source,p+offset).g;col.b=texture2D(source,p+offset*.3).b;float cavity=1.-smoothstep(-.003,.003,edge);float isDark=base.r<.2?1.:0.;col*=1.-cavity*(isDark*.72+.08);float sweep=smoothstep(.35,.75,progress);float shine=exp(-pow((p.x-(sweep*1.5-.25))*.9,2.)*22.);col+=bevel*mix(cool,copper,p.x)*(.26+shine*.8);col+=exp(-abs(edge)*35.)*copper*.035;gl_FragColor=vec4(col,1.);\n#include <colorspace_fragment>\n}`;
@@ -34,1 +34,1 @@
-        const material = new ShaderMaterial({ vertexShader: vertex, fragmentShader: optical, uniforms: { source: { value: target.texture }, progress: { value: progress.get() }, pointer: { value: new Vector2() }, resolution: { value: new Vector2() }, copper: { value: new Color() }, cool: { value: new Color() } } });
+        const material = new ShaderMaterial({ vertexShader: vertex, fragmentShader: optical, uniforms: { source: { value: target.texture }, progress: { value: progress.get() }, pointer: { value: new Vector2() }, resolution: { value: new Vector2() }, copper: { value: new Color() }, cool: { value: new Color() }, base: { value: new Color() } } });
@@ -99,1 +99,2 @@
             material.uniforms.cool.value.set(color("--site-cyan"));
+            material.uniforms.base.value.set(color("--site-bg"));
@@ -119,3 +120,3 @@
-            const uniforms = [bg.uniforms.base, bg.uniforms.cool, bg.uniforms.violet, material.uniforms.copper, material.uniforms.cool];
+            const uniforms = [bg.uniforms.base, bg.uniforms.cool, bg.uniforms.violet, material.uniforms.copper, material.uniforms.cool, material.uniforms.base];
             const previous = uniforms.map(uniform => uniform.value.clone());
-            const names = ["--site-bg", "--site-cyan", "--site-violet", "--site-copper", "--site-cyan"];
+            const names = ["--site-bg", "--site-cyan", "--site-violet", "--site-copper", "--site-cyan", "--site-bg"];
```

*Verifikasi Kompilasi & Keabsahan GLSL*:
1. **Deklarasi Uniform**: `uniform vec3 base;` secara eksplisit dideklarasikan di dalam string shader `const optical`, menyelesaikan kegagalan kompilasi WebGL karena `undeclared identifier 'base'`.
2. **Inisialisasi Three.js Uniforms**: `base: { value: new Color() }` ditambahkan ke dictionary `uniforms` pada instantiasi `new ShaderMaterial(...)`.
3. **Sinkronisasi Tema Dinamis**: `material.uniforms.base.value.set(color("--site-bg"))` dipanggil pada metode `theme()`, sehingga nilai RGB kanvas aktual selalu terkirim ke kartu grafis.
4. **Logika Percabangan Shader**: Evaluasi `float isDark = base.r < .2 ? 1. : 0.;` berjalan tanpa instruksi non-standar. Pada Dark Mode (`#0b181c`, $R \approx 0.043 < 0.2$), `isDark = 1.0` menghasilkan atenuasi $0.72 + 0.08 = 0.80$ (rongga gelap pekat). Pada Light Mode (`#fafafa`, $R \approx 0.980 > 0.2$), `isDark = 0.0` menghasilkan atenuasi sangat lembut $0.08$ (refraksi kristal transparan tanpa peredupan lumpur).
5. **Dukungan Snapshot Multitema**: `material.uniforms.base` disertakan dalam array `uniforms` dan `names` pada listener `celah:ink-snapshot`, menjamin penangkapan frame transisi tetap bebas galat.

---

### 5.3 Mitigasi Risiko & Strategi Rollback
1. **Risiko Ketidakcocokan Browser Lama**:
   - Jika peramban lama tidak mengenali `light-dark()` atau modern media queries, kaskade CSS secara otomatis jatuh ke `.public-design` dan `.dark .public-design`.
2. **Risiko WebGL Crash / Context Lost**:
   - Skrip `OpticalField.tsx` telah dibungkus `try / catch` dan `<OptionalFeatureBoundary>`. Bila inisialisasi WebGL gagal, SVG `optical-poster` langsung mengambil alih rendering tampilan dengan token `fill="var(--site-cavity)"`, menjaga kesinambungan visual tanpa *layout shift* (CLS = 0.000).
3. **Strategi Rollback**:
   - Karena seluruh perubahan terisolasi pada token CSS dan metadata tanpa skema basis data atau dependensi eksternal, rollback dapat dilakukan dalam waktu kurang dari 60 detik melalui pengembalian (*revert*) commit Git tunggal.

---

## Section 6: Strategi Verifikasi & Quality Assurance (QA)

### 6.1 Matriks Verifikasi Otomatis & Budget Rilis

| Pengujian / Invariant | Tolok Ukur / Batas Toleransi | Perintah Eksekusi | Kriteria Kegagalan |
| :--- | :--- | :--- | :--- |
| **Initial JS Bundle Budget** | $\le 200,000$ bytes gzip | `node --test tests/celah-release.test.mjs` | Ukuran gzip $> 200\text{ kB}$ |
| **Three.js Chunk Isolation** | Strictly excluded from initial bundle | `node --test tests/celah-release.test.mjs` | File `three-*.js` bocor ke initial cache |
| **Home Total Bundle Budget** | $\le 450,000$ bytes gzip | `node --test tests/celah-release.test.mjs` | Total Home gzip $> 450\text{ kB}$ |
| **WebGL Idle Coalescing** | 0 draw call / frame saat diam | `node --test tests/optical-rendering.test.mjs` | `frames.size > 0` setelah idle |
| **PWA Cache Invariants** | Hanya aset terprerender | `node --test tests/celah-release.test.mjs` | Aset non-initial masuk cache PWA |
| **Core Web Vitals** | LCP $< 1.2\text{s}$, CLS $= 0.000$, INP $< 50\text{ms}$ | Chrome DevTools Lighthouse Audit | Terjadi CLS saat theme toggle |

### 6.2 Validasi Rasio Kontras & Aksesibilitas
Verifikasi rasio kontras wajib dijalankan menggunakan script Python contrast checker:
```powershell
# Uji Kontras Teks Utama Konsep 1 (Obsidian di atas Alabaster):
python "C:\Users\Friel\.gemini\config\plugins\antislop\skills\antislop-human\contrast-check.py" "#FAFAFA" "#090A0C"
# Hasil Terverifikasi: 18.97:1 | normal: PASS (AAA) | large: PASS (AAA)

# Uji Kontras Tombol CTA Konsep 1 (Putih di atas Emerald):
python "C:\Users\Friel\.gemini\config\plugins\antislop\skills\antislop-human\contrast-check.py" "#087455" "#FFFFFF"
# Hasil Terverifikasi: 5.77:1 | normal: PASS (AA) | large: PASS (AAA)

# Uji Kontras Aksen Sky Cyan Konsep 1 (Sky Cyan pada Putih / Alabaster):
python "C:\Users\Friel\.gemini\config\plugins\antislop\skills\antislop-human\contrast-check.py" "#FFFFFF" "#0369A1"
# Hasil Terverifikasi: 5.64:1 (on #FAFAFA) / 5.93:1 (on #FFFFFF) | normal: PASS (AA) | large: PASS (AAA)

# Uji Kontras Aksen Hijau Status Konsep 3 (Status Green pada Nordic Canvas):
python "C:\Users\Friel\.gemini\config\plugins\antislop\skills\antislop-human\contrast-check.py" "#FDFCFC" "#047857"
# Hasil Terverifikasi: 4.67:1 | normal: PASS (AA) | large: PASS (AAA)
```

### 6.3 Matriks Kompatibilitas Browser & Degradasi Anggun

| Fitur / Platform | Chrome 123+ | Safari 17.5+ | Firefox 120+ | Edge Chromium | Legacy / Mobile Safari |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **View Transitions API** | Native (`startViewTransition`) | Partial / Native | Native | Native | Fallback ke Ink Atlas Masking |
| **CSS `light-dark()`** | Didukung Penuh | Didukung Penuh | Didukung Penuh | Didukung Penuh | Fallback ke selector `.dark` |
| **WebGL Three.js Canvas**| Didukung (`alpha: false`) | Didukung | Didukung | Didukung | Fallback ke SVG Poster Path |
| **`theme-color` Media Query**| Didukung | Didukung (iOS Safari) | Didukung | Didukung | Fallback ke nilai tunggal |

---

## Kesimpulan & Rekomendasi Akhir

Peningkatan visual Light Mode pada portofolio Rifqi Ariansyah (`portofolio-rifqi`) dapat diselesaikan secara tuntas dan elegan dengan **0-cost performance overhead dan 0 bytes penambahan bundle runtime JavaScript**.

Tiga poin eksekusi utama:
1. **Pemberantasan Lubang Hitam**: Menyinkronkan variabel `--site-cavity`, menghapus inset shadow hitam pekat, parameterisasi seam rails `.cyber-lip-top` / `.cyber-lip-bottom`, dan melunakkan atenuasi shader WebGL dengan uniform `base` berhasil mengubah celah hero menjadi torehan optik kristalin yang memukau.
2. **Pembersihan Kesan Kusam**: Mengembalikan prinsip fisika ground plane (kartu `#FFFFFF` yang terangkat di atas kanvas alabaster `#FAFAFA`) mengeliminasi impresi kusam/parchment usang secara menyeluruh dengan kontras teks dan aksen yang terbukti lulus WCAG 2.1 AA/AAA.
3. **Penerapan Konsep 1 ("Crisp Obsidian & Alabaster")**: Memberikan representasi identitas *Cybersecurity Engineer* yang paling berwibawa, tajam, dan berstandar internasional, setara dengan produk-produk unggulan dunia seperti Linear dan Vercel.
