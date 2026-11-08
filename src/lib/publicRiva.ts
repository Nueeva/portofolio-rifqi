import { getPublicProject, publicProjects } from "@/data/projectCopy.id";

export const rivaGreeting = "Halo, saya RIVA. Saya bisa membantu mengenalkan pekerjaan Rifqi, keahlian, dan cara menghubunginya. Pilih topik atau tulis pertanyaanmu.";

export function publicRivaReply(input: string): string {
  const question = input.toLowerCase();
  const projectTopics = [
    { id: "curated-xssscope", words: ["xssscope", "xss"] },
    { id: "curated-apexsions", words: ["apexsions", "minecraft", "plugin"] },
    { id: "curated-portfolio71", words: ["portfolio 71", "portfolio71", "smkn", "sekolah"] },
    { id: "curated-ctf-toolkit", words: ["ctf", "toolkit", "capture the flag"] },
  ];
  for (const topic of projectTopics) {
    if (topic.words.some(word => question.includes(word))) {
      const project = getPublicProject(topic.id)!;
      return `${project.title}. ${project.solution} Baca uraian lengkapnya di halaman Karya.`;
    }
  }
  if (/proyek|project|karya|portfolio|works/.test(question)) return `Karya pilihan Rifqi: ${publicProjects.map(project => project.title.split(" — ")[0]).join(", ")}. Setiap studi kasus menjelaskan masalah, pendekatan, dan hasilnya. Kamu bisa membacanya di halaman Karya.`;
  if (/keahlian|skill|stack|tech|bahasa|tools|bisa apa/.test(question)) return `Teknologi dalam proyek kurasinya meliputi ${[...new Set(publicProjects.flatMap(project => project.tech_stack))].join(", ")}. Pekerjaannya mencakup analisis konteks XSS, audit codebase, pengamanan akses aplikasi, dan operasi sistem. Rinciannya ada di halaman Tentang.`;
  if (/kontak|contact|email|hubungi|hire|kerja|magang|freelance|harga|price|bayar|cost/.test(question)) return "Hubungi Rifqi melalui halaman Kontak. Kamu bisa menjelaskan kebutuhan tim, peluang kerja, atau lingkup proyek. Alamat email dan tautan sosial juga tersedia di halaman itu.";
  if (/\bcv\b|resume|unduh|download/.test(question)) return "CV Rifqi tersedia sebagai PDF melalui tombol Unduh CV di halaman Tentang.";
  if (/siapa|about|profil|who|rifqi itu/.test(question)) return "Rifqi Ariansyah adalah Cybersecurity Engineer. Ia membangun security tooling, mengembangkan aplikasi, serta mengaudit dan mengoperasikan sistemnya, termasuk Apexsions dan Portfolio 71. Perjalanan lengkapnya ada di halaman Tentang.";
  if (/terima kasih|thanks|makasih/.test(question)) return "Sama-sama. Kamu bisa bertanya lagi tentang karya Rifqi atau menghubunginya lewat halaman Kontak.";
  if (/\b(halo|hello|hi|hey|hai|pagi|siang|malam)\b/.test(question)) return rivaGreeting;
  return "Saya bisa menjawab tentang xssscope, Apexsions, Portfolio 71, CTF-Toolkit, keahlian Rifqi, CV, dan kontaknya. Untuk pertanyaan di luar itu, silakan hubungi Rifqi langsung.";
}
