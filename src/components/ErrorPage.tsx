import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";

const errors: Record<string, { title: string; description: string }> = {
  "403": { title: "Akses terbatas.", description: "Kamu tidak memiliki izin untuk membuka halaman ini. Kembali ke halaman sebelumnya atau kunjungi beranda." },
  "404": { title: "Halaman tidak ditemukan.", description: "Tautan ini mungkin sudah berubah atau alamatnya kurang tepat. Kamu masih bisa menjelajahi karya dari beranda." },
  "500": { title: "Ada kendala di sistem.", description: "Halaman ini belum dapat diproses. Silakan coba kembali beberapa saat lagi." },
  "502": { title: "Layanan belum terhubung.", description: "Respons dari layanan yang dibutuhkan belum tersedia. Silakan coba kembali beberapa saat lagi." },
  "503": { title: "Layanan sementara tidak tersedia.", description: "Halaman ini belum dapat diakses saat ini. Silakan coba kembali nanti." },
  "429": { title: "Terlalu banyak permintaan.", description: "Beri jeda sebentar sebelum mencoba kembali. Kamu bisa kembali ke beranda sementara itu." },
};

export function ErrorPage({ statusCode = "404" }: { statusCode?: string }) {
  const navigate = useNavigate();
  const code = errors[statusCode] ? statusCode : "404";
  const error = errors[code];
  function goBack() {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate("/");
  }
  return <Layout><div className="public-container"><div className="public-error">
    <p className="error-code" aria-label={`Kode kesalahan ${code}`}>{code}</p><h1>{error.title}</h1><p>{error.description}</p>
    <div className="public-error-actions"><button className="public-text-link" type="button" onClick={goBack}><ArrowLeft />Kembali</button><Link className="public-text-link" to="/">Ke beranda <ArrowUpRight /></Link></div>
  </div></div></Layout>;
}

export default ErrorPage;
