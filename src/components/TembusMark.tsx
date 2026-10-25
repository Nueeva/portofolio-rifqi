/**
 * Tembus — mark resmi Rifqi Ariansyah.
 * Gerbang yang ditembus sinyal; kanal negatifnya juga membaca sebagai huruf "N" (Nueeva).
 * Geometri grid 16x16 (viewBox 256), satu path compound dari master final-kit.
 * Memakai currentColor agar mengikuti konteks warna pemakainya.
 */
export function TembusMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 256 256"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M144 176L144 160L176 160L176 144L128 144L128 112L144 112L144 32L224 32L224 224L144 224L144 208L176 208L176 176Z M32 32L96 32L96 96L128 96L128 112L96 112L96 144L128 144L128 176L144 176L144 208L96 208L96 224L32 224Z" />
    </svg>
  );
}
