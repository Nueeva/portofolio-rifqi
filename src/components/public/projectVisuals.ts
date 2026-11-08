export interface ProjectVisualSpec {
    title: string;
    options: string[];
    captions: string[];
}
export const projectVisuals: Record<string, ProjectVisualSpec> = {
    "curated-xssscope": { title: "xssscope", options: ["HTML", "Atribut", "Script"], captions: ["Konteks markup ditelusuri sebelum kandidat diverifikasi.", "Posisi input dalam atribut menentukan bentuk pengujian.", "Refleksi pada konteks script memerlukan analisis yang sesuai."] },
    "curated-apexsions": { title: "Apexsions", options: ["Game", "Bridge", "Operasi"], captions: ["Sembilan plugin internal berbagi ApexsionsCore.", "Bridge dua arah menghubungkan game dengan website Azuriom.", "Dua host; fallback SQLite menjaga layanan inti ketika PostgreSQL gagal."] },
    "curated-portfolio71": { title: "Portfolio 71", options: ["Siswa", "Guru", "Admin"], captions: ["Siswa memublikasikan karya dalam profil yang dapat dibagikan.", "Guru memverifikasi karya melalui workflow lima tahap.", "Admin mengelola platform dengan batas akses berbasis peran."] },
    "curated-ctf-toolkit": { title: "CTF-Toolkit", options: ["Web", "Crypto", "Forensics", "Reversing"], captions: ["Helper Python melengkapi persiapan pengujian web.", "Helper dikumpulkan untuk pekerjaan kriptografi yang berulang.", "Persiapan forensik melengkapi instrumen seperti Wireshark.", "Persiapan reversing melengkapi instrumen seperti Ghidra."] }
};
