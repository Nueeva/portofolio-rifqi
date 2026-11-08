import { curatedProjects, type CaseStudy, type CuratedProject, type Project } from "./projects";

// Presentation only. IDs, links, technologies, categories and source records stay canonical.
const copy: Record<string, { problem: string; solution: string; caseStudy: CaseStudy }> = {
  "curated-xssscope": {
    problem: "Menguji reflected XSS secara manual berarti mengulang payload, memeriksa respons, dan menganalisis konteks untuk setiap parameter.",
    solution: "Scanner JavaScript tanpa dependency yang menguji parameter, mengklasifikasikan konteks refleksi, lalu memverifikasi temuan secara otomatis. Berjalan langsung di Node.js.",
    caseStudy: {
      role: "Perancang & Developer (mandiri)", period: "September 2026",
      overview: "xssscope lahir dari pekerjaan yang berulang. Pengujian reflected cross-site scripting secara manual mengharuskan kita mengirim payload, membaca respons, lalu mengulang penalaran yang sama untuk setiap parameter. xssscope mengotomatisasi alur itu: menguji parameter, mengenali tempat input dipantulkan, dan memverifikasi apakah refleksinya benar-benar dapat dieksploitasi. Seluruhnya berjalan di Node.js tanpa dependency.",
      challenges: [
        "Input yang dipantulkan belum tentu merupakan celah. Scanner perlu mengenali tempat payload muncul—body HTML, nilai atribut, atau konteks script—sebelum menilai dampaknya.",
        "False positive bisa lebih merugikan daripada pemindaian yang lambat. Temuan perlu diverifikasi secara otomatis, bukan sekadar mencocokkan refleksi mentah.",
        "Tanpa dependency berarti HTTP probing dan analisis konteks refleksi harus diimplementasikan langsung, tanpa bantuan framework.",
      ],
      approach: [
        "Menguji setiap parameter dengan marker payload dan melacak secara tepat bagaimana input kembali di dalam respons.",
        "Mengklasifikasikan konteks refleksi—markup, nilai atribut, string JavaScript, dan konteks sejenis—untuk memilih bentuk payload yang relevan.",
        "Memverifikasi kandidat temuan secara otomatis sebelum melaporkannya, sehingga keluaran menjadi daftar yang bisa ditindaklanjuti.",
        "Mengemas seluruh alur sebagai program Node.js tanpa dependency: clone repository, lalu jalankan.",
      ],
      outcomes: [
        "Scanner satu perintah yang mengubah rutinitas probing manual berulang menjadi proses otomatis.",
        "Temuan dilaporkan bersama konteks refleksinya untuk mempercepat triase dan konfirmasi manual.",
        "Tanpa beban instalasi framework atau dependency tree yang perlu diaudit dan dipelihara.",
      ],
      lessons: "Bagian tersulit dari scanner adalah memahami arti sebuah refleksi. Klasifikasi konteks dan verifikasi memberi nilai utamanya; mengirim payload hanyalah separuh pekerjaan.",
    },
  },
  "curated-apexsions": {
    problem: "Server Minecraft publik mencakup logika game, ekonomi pemain, website komunitas, database, dan hosting. Setiap komponen membawa risiko yang akan dirasakan pemain ketika sistem bermasalah.",
    solution: "Sistem yang saya dirikan, rancang, dan bangun dari ujung ke ujung: sembilan plugin Paper internal, website Azuriom dengan bridge dua arah, audit yang memperbaiki 13 temuan critical dan 19 major, serta produksi di dua host dengan fallback database.",
    caseStudy: {
      role: "Founder & Lead Developer — Arsitek Sistem & Operator", period: "Oktober 2026",
      overview: "Apexsions adalah sistem lengkap di balik server Minecraft yang sedang dikembangkan menjadi sebuah brand. Saya mendirikannya dan memimpin pengembangannya: sembilan plugin Paper internal, website komunitas Azuriom dengan bridge khusus, serta infrastruktur dua host, panel manajemen, domain, DNS, dan object storage. Audit keamanan dilakukan pada seluruh codebase sebelum digunakan pemain. Saya merancang arsitektur, membangun plugin dan website, mengaudit keamanan, serta menjalankan operasinya. Timnya terdiri dari tiga orang: rekan developer berkontribusi pada plugin dan fitur sekaligus mendanai hosting bersama, dan partner ketiga menangani branding, marketing, serta penjualan.",
      challenges: [
        "Satu celah plugin dapat menggandakan mata uang game, menghilangkan item pemain, atau membuat server hang. Kelas masalah ini kemudian benar-benar ditemukan dalam audit.",
        "Sembilan plugin berbagi data pemain, ekonomi, dan progres, sementara website perlu mencerminkan kondisi yang sama tanpa menjadikan satu lapisan sebagai titik kegagalan tunggal.",
        "Build berupa shaded JAR berukuran besar—plugin core sekitar 24 MB—harus dirakit dan diverifikasi secara manual karena jalur build Maven otomatis tidak tersedia di lingkungan build.",
        "Deployment melalui Pterodactyl di managed hosting, restart hanya saat tidak ada pemain, dan layanan harus tetap berjalan ketika database PostgreSQL utama gagal.",
      ],
      approach: [
        "Game: membangun monorepo sembilan plugin Paper dengan Java 21—Core, Economy, Chat, Shop, Crates, Battlepass, CustomEnchants, Fishing, dan Media—yang berbagi satu core library. Konsolidasi memindahkan 28 file duplikat, sekitar 5.300 baris, ke ApexsionsCore.",
        "Web: membangun website Azuriom dengan tema dan bridge khusus, sinkronisasi REST dua arah, penautan akun di dalam game, serta tampilan admin untuk data pemain dan keuangan territory.",
        "Infrastruktur: memisahkan game server di Jagoanhosting melalui Pterodactyl dan website di VPS produksi tersendiri, dengan domain apexsions.my.id, Cloudflare, serta R2 object storage.",
        "Keamanan: mengaudit seluruh codebase sebelum peluncuran. Terdapat 13 temuan critical—termasuk duplikasi uang, kehilangan item, server hang, pemanggilan async yang tidak aman, dan API key aktif di repository—serta 19 major. Semuanya diperbaiki melalui 16 commit, reviewed pull request, dan regression test.",
        "Operasi: mencadangkan JAR lama, memastikan pemain kosong sebelum restart, lalu memverifikasi seluruh 11 plugin aktif tanpa plugin nonaktif. Saat PostgreSQL tetap gagal, menerapkan fallback SQLite dengan migrasi SQL langsung V1–V7 agar layanan inti tetap berjalan.",
      ],
      outcomes: [
        "13 temuan critical dan 19 major ditemukan dan diperbaiki sebelum digunakan pemain, termasuk bug duplikasi uang dan API key aktif di repository.",
        "Sembilan plugin internal berjalan di produksi dan website Azuriom tersinkron melalui bridge. Seluruh 14 dari 14 skenario integrasi end-to-end—website, admin, database, sinkronisasi bridge, dan UI mobile—lolos.",
        "Ketika PostgreSQL utama gagal di produksi, fallback SQLite menjaga layanan inti tetap online.",
        "Game, web, infrastruktur, keamanan, dan operasi harian dijalankan pendirinya, dengan aturan restart hanya ketika tidak ada pemain online.",
      ],
      lessons: "Memegang setiap lapisan membuat keputusan bisa ditindaklanjuti sampai ke akar masalah. Kegagalan database menjadi skenario fallback yang dirancang sendiri, dan audit dapat menjangkau seluruh lapisan sistem.",
    },
  },
  "curated-portfolio71": {
    problem: "Siswa SMKN 71 Jakarta membutuhkan tempat terpusat untuk memamerkan karya yang dapat diverifikasi. Guru juga membutuhkan alur terstruktur untuk meninjau dan memvalidasinya.",
    solution: "Platform Laravel API dan Nuxt dengan akses berbasis peran untuk siswa, guru, dan admin, verifikasi proyek berbantuan AI, serta pengamanan produksi termasuk autentikasi, pemeriksaan otorisasi, dan patch CVE PHP critical.",
    caseStudy: {
      role: "Full-Stack Developer", period: "Oktober 2026",
      overview: "Portfolio 71 adalah platform portofolio siswa SMKN 71 Jakarta. Siswa menerbitkan karya, guru meninjau dan memvalidasinya melalui alur terstruktur, lalu profil publiknya dapat dibagikan dan diverifikasi. Platform ini menggabungkan Laravel REST API dengan frontend Nuxt dan berjalan di produksi melalui Cloudflare Tunnel.",
      challenges: [
        "Siswa yang menerbitkan karya, guru yang memvalidasi, dan admin yang mengelola platform harus berbagi sistem dengan batas akses yang tegas.",
        "Kredibilitas portofolio bergantung pada verifikasi. Peninjauan perlu berupa alur terstruktur agar karya dapat dipercaya.",
        "Profil siswa perlu aman secara default sekaligus mudah dibagikan kepada perusahaan dan untuk kompetisi.",
        "Platform menyimpan data pengguna nyata, sehingga autentikasi dan dependency harus diamankan untuk produksi.",
      ],
      approach: [
        "Memisahkan Laravel REST API dan frontend Nuxt, dengan autentikasi Sanctum serta akses berbasis peran siswa, guru, dan admin.",
        "Membangun alur verifikasi lima tahap berbantuan AI agar guru meninjau pengajuan proyek yang terstruktur.",
        "Menambahkan profil siswa publik dengan QR code dan tautan berbagi, untuk dibuka dari cetakan maupun pesan digital.",
        "Menyediakan ekspor PDF CV yang ATS-friendly dalam satu klik, langsung dari data profil.",
        "Mengamankan produksi melalui pemeriksaan otorisasi endpoint sensitif dan patch CVE PHP critical, dengan akses website melalui Cloudflare Tunnel.",
      ],
      outcomes: [
        "Data publik diperiksa pada 29 Oktober 2026: 51 karya dari tiga jurusan—RPL 20, Animasi 16, DKV 15—oleh 28 siswa, didampingi 4 guru pembimbing. Termasuk 5 proyek lintas jurusan yang melibatkan 10 siswa.",
        "Platform berjalan di portofolio.apexsions.com, menyatukan publikasi siswa dan verifikasi guru.",
        "Profil publik dengan QR code dan tautan berbagi dapat dipresentasikan dalam bentuk cetak maupun digital.",
        "Ekspor CV satu klik menghasilkan PDF siap melamar tanpa mengetik ulang data profil.",
        "Autentikasi, pemeriksaan otorisasi, dan patch CVE menjadi bagian dari pengiriman platform ke produksi.",
      ],
      lessons: "Verifikasi adalah fitur utama. Alur peninjauan guru yang terstruktur membuat profil siswa layak dipercaya.",
    },
  },
  "curated-ctf-toolkit": {
    problem: "Kompetisi CTF menggabungkan web, crypto, forensics, dan reversing. Menyiapkan ulang tooling untuk setiap kategori menghabiskan waktu kompetisi.",
    solution: "Toolkit Python pribadi yang mengumpulkan helper untuk pekerjaan berulang di berbagai kategori CTF, sehingga alurnya siap sebelum kompetisi dimulai.",
    caseStudy: {
      role: "Pembuat & Maintainer", period: "April – Mei 2026",
      overview: "CTF-Toolkit adalah toolkit Python pribadi untuk kompetisi capture-the-flag. Kategori web, crypto, forensics, dan reversing memiliki pekerjaan kecil yang terus berulang. Toolkit ini mengumpulkan helper tersebut, mengaturnya berdasarkan kategori, dan melengkapinya dengan alur penggunaan instrumen standar agar lingkungan siap sebelum waktu kompetisi berjalan.",
      challenges: [
        "Waktu kompetisi terbatas. Menginstal ulang alat atau menulis helper dari ingatan mengurangi waktu penyelesaian challenge.",
        "Setiap kategori memiliki pekerjaan kecil berulang yang terlalu sederhana untuk framework besar, tetapi membuang waktu jika selalu dibuat ulang.",
        "Toolkit harus tetap ringan dan cepat digunakan agar persiapannya sendiri tidak menjadi pekerjaan tambahan.",
      ],
      approach: [
        "Mengumpulkan helper yang berulang dalam kompetisi ke satu toolkit Python, dikelompokkan menjadi web, crypto, forensics, dan reversing.",
        "Melengkapi Burp Suite untuk web, Wireshark untuk trafik dan forensics, serta Ghidra untuk reversing melalui helper yang sesuai.",
        "Menjaga alur tetap scriptable dan siap dijalankan sebelum kompetisi, untuk menekan waktu setup saat ronde berlangsung.",
        "Memasukkan helper yang berguna dari setiap kompetisi kembali ke toolkit agar persiapannya terus berkembang.",
      ],
      outcomes: [
        "Toolkit pribadi siap pakai untuk kategori web, crypto, forensics, dan reversing.",
        "Persiapan lingkungan dilakukan sebelum waktu kompetisi dimulai.",
        "Helper dari setiap kompetisi menambah kelengkapan toolkit berikutnya.",
      ],
      lessons: "Dalam kompetisi berbatas waktu, persiapan merupakan bagian dari kemampuan teknis. Helper paling berguna ditulis setelah ronde yang memperlihatkan kebutuhannya.",
    },
  },
};

// Exact source matches are intentional: a later admin edit must pass through untouched.
const cmsCopy = new Map<string, string>([
  ["Building Secure Digital Solutions", "Menguji keamanan aplikasi."],
  ["Identifying vulnerabilities before they become threats.", "Membangun tooling dan memperbaiki celah pada sistem produksi."],
  ["Many web applications implement authentication incorrectly, leading to session hijacking, credential stuffing, and broken access control vulnerabilities.", "Implementasi autentikasi yang keliru dapat membuka celah session hijacking, credential stuffing, dan broken access control pada aplikasi web."],
  ["Developed a TypeScript library implementing secure authentication patterns including proper password hashing, JWT rotation, rate limiting, and CSRF protection following OWASP guidelines.", "Library TypeScript yang menerapkan pola autentikasi aman: password hashing, rotasi JWT, rate limiting, dan perlindungan CSRF sesuai panduan OWASP."],
  ["Manual security testing is time-consuming and prone to human error. Organizations need automated ways to identify common web vulnerabilities like XSS, SQL injection, and insecure headers.", "Pengujian manual membutuhkan waktu dan rentan kesalahan. Otomatisasi membantu mengidentifikasi celah web seperti XSS, SQL injection, dan header yang tidak aman."],
  ["Built a Python-based scanner that automates detection of OWASP Top 10 vulnerabilities. Implements custom payloads, response analysis, and generates detailed reports with remediation guidance.", "Scanner Python untuk mengotomatisasi deteksi celah OWASP Top 10 melalui payload khusus, analisis respons, dan laporan dengan panduan perbaikan."],
  ["Complex CTF challenges often lack clear documentation, making it difficult for beginners to learn exploitation techniques and understand attack vectors.", "Dokumentasi challenge CTF yang terbatas menyulitkan pemula memahami teknik eksploitasi dan vektor serangan."],
  ["Documented solutions for 50+ challenges across categories including web exploitation, reverse engineering, and cryptography. Each writeup explains the vulnerability, exploitation process, and defensive measures.", "Dokumentasi solusi untuk 50+ challenge web exploitation, reverse engineering, dan cryptography. Setiap writeup menjelaskan celah, proses eksploitasi, dan langkah pertahanannya."],
]);

export const presentText = (text: string): string => cmsCopy.get(text) ?? text;

export function publicProject<T extends Project>(project: T): T & { caseStudy?: CaseStudy } {
  const localized = copy[project.id];
  return localized ? { ...project, ...localized } : { ...project, problem: presentText(project.problem), solution: presentText(project.solution) };
}

export const publicProjects: CuratedProject[] = curatedProjects.map(publicProject);
export const getPublicProject = (id: string) => publicProjects.find(project => project.id === id);

export const categoryLabels: Record<string, string> = {
  all: "Semua karya", pentesting: "Penetration Testing", tools: "Security Tools", "web-security": "Web Security",
};

export function mergeProjects(managed: Project[] = []): Project[] {
  const curatedTitles = new Set(curatedProjects.map(project => project.title.toLowerCase()));
  return [...curatedProjects, ...managed.filter(project => !curatedTitles.has(project.title.toLowerCase()))].map(publicProject);
}

export const filterProjects = (projects: Project[], category: string): Project[] =>
  projects.filter(project => category === "all" || project.category === category);
