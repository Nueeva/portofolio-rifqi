# Design References — disimpan user 2026-10-25

"If you design with AI, this is all you need"

1. **getlayers.ai** — prompts for cinematic 3D websites
2. **godly.website** — award-winning websites
3. **landdding.com** — top notch landings
4. **fontinlogo.com** — fonts behind brands
5. **60fps.design** — mobile UI animations

Catatan user: "save this for later" + dicoba diterapkan ke portofolio-rifqi (2026-10-25).


## Diterapkan ke portofolio-rifqi (2026-10-25)

Satu pass poles koheren, tanpa mengubah konten faktual dan tanpa mengganti
HeroHoloScene (diorama rak server + perisai hologram tetap):

- **getlayers.ai (sinematik)** — lapisan cahaya di hero: spotlight radial
  emerald menggenang di belakang adegan hologram (kanan-bawah) + aurora wash
  yang drift pelan 18s (`.hero-spotlight`, `.hero-aurora`, `animate-aurora`
  di index.css), theme-aware untuk dark/light.
- **godly.website (award layout)** — skala display lebih berani: H1 hero
  naik ke text-7xl tracking -0.03em, headline font-display, ritme section
  dilonggarkan (overview py-28, footer py-14).
- **landdding.com (landing kelas atas)** — hierarki satu-layar hero tetap:
  badge → nama → headline → terminal → CTA → statistik, sekarang dengan
  reveal blur-clear berjenjang.
- **fontinlogo.com (tipografi brand)** — satu display face khas untuk
  momen brand: **Space Grotesk** untuk semua heading + wordmark
  Navbar/Footer; Inter tetap body, JetBrains Mono tetap label/data.
  Selection teks emerald.
- **60fps.design (micro-interaction)** — kurva rumah easeOutQuint
  `cubic-bezier(0.22, 1, 0.36, 1)` diseragamkan di ScrollReveal,
  PageTransition, Index, Projects, About; token `ease-out-expo`
  `cubic-bezier(0.16, 1, 0.3, 1)` di Tailwind; kartu `.card-lift`
  (naik 6px + border glow emerald ala Opal); tombol global dapat press
  state `active:scale-[0.98]`; menu mobile morph-in; gambar proyek
  zoom 700ms out-expo.
