import { useEffect, useState } from "react";
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

function RateLimiterCapacityMeter() {
  const [timeLeft, setTimeLeft] = useState(30);
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 1 ? prev - 1 : 30));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const percent = Math.min(100, Math.max(0, ((30 - timeLeft) / 30) * 100));

  return (
    <div className="error-rate-limit-meter" aria-label="Token Bucket Rate-Limiter Capacity Meter">
      <div className="meter-header">
        <span className="hud-alert-tag">[TOKEN_BUCKET_RATE_LIMITER: CAPACITY_EXHAUSTED]</span>
        <span className="meter-countdown font-mono">PULSE_WINDOW: {timeLeft}s</span>
      </div>
      <div className="meter-track" aria-hidden="true">
        <div className="meter-fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="meter-footer text-xs font-mono">
        <span>BUCKET_CAPACITY: 60/60 TOKENS</span>
        <span>REFILL_RATE: 1.00 TOKEN/SEC</span>
      </div>
    </div>
  );
}

export function ErrorPage({ statusCode = "404" }: { statusCode?: string }) {
  const navigate = useNavigate();
  const code = errors[statusCode] ? statusCode : "404";
  const error = errors[code];
  function goBack() {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate("/");
  }

  return (
    <Layout>
      <div className="public-container">
        <div className="public-error">
          <p className="error-code" aria-label={`Kode kesalahan ${code}`}>{code}</p>
          <h1>{error.title}</h1>
          <p>{error.description}</p>

          {code === "403" && (
            <div className="error-breach-hud" aria-label="Security Perimeter Breach HUD">
              <div className="hud-bracket top-left" aria-hidden="true" />
              <div className="hud-bracket top-right" aria-hidden="true" />
              <div className="hud-bracket bottom-left" aria-hidden="true" />
              <div className="hud-bracket bottom-right" aria-hidden="true" />
              <div className="hud-header">
                <span className="hud-alert-tag">[ZERO-TRUST ACL LOCKOUT: ACCESS_DENIED]</span>
                <span className="hud-code">PERIMETER_ENCLAVE: ISOLATED</span>
              </div>
              <div className="hud-telemetry">
                <div><span>SECURITY_ZONE:</span> RESTRICTED_ENCLAVE</div>
                <div><span>IDENTITY_ASSERTION:</span> UNTRUSTED_IDENTITY</div>
                <div><span>ENFORCEMENT:</span> STRICT_ISOLATION_BARRIER</div>
              </div>
            </div>
          )}

          {code === "404" && (
            <div className="error-memory-dump" aria-label="Unmapped Address Space Inspection">
              <div className="dump-header">
                <span className="dump-title">FAULT: 0x00000000_NULL_PTR</span>
                <span className="dump-flag">[PAGE_FAULT: UNMAPPED_SPACE]</span>
              </div>
              <pre className="dump-body font-mono text-xs">
{`0x00000000: 00 00 00 00  00 00 00 00  | ........ | NULL_PTR_DEREFERENCE
0x00000008: DE AD BE EF  CA FE BA BE  | ........ | UNMAPPED_VIRTUAL_ADDR
0x00000010: FF FF FF FF  00 00 00 00  | ........ | TARGET_DESCRIPTOR_VOID`}
              </pre>
            </div>
          )}

          {(code === "500" || code === "502") && (
            <div className="error-circuit-seam" aria-label="Fractured Circuit Seam Diagnostics">
              <div className="circuit-fracture-line" aria-hidden="true">
                <div className="fracture-seg" />
                <div className="fracture-point" />
                <div className="fracture-gap" />
                <div className="fracture-point" />
                <div className="fracture-seg" />
              </div>
              <div className="circuit-daemon-status">
                <div className="daemon-badge">[DAEMON_DISCONNECT: SERVICE_CORE_OFFLINE]</div>
                <div className="daemon-meta">
                  <span>CIRCUIT_STATUS: FRACTURED_SEAM_OPEN</span>
                  <span>DAEMON_LINK: IPC_SOCKET_CLOSED (ERR_CONNECTION_REFUSED)</span>
                  <span>RESILIENCE_MODE: STANDBY_EXPONENTIAL_BACKOFF</span>
                </div>
              </div>
            </div>
          )}

          {code === "429" && <RateLimiterCapacityMeter />}

          <div className="public-error-actions">
            <button className="public-text-link" type="button" onClick={goBack}>
              <ArrowLeft />Kembali
            </button>
            <Link className="public-text-link" to="/">
              Ke beranda <ArrowUpRight />
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default ErrorPage;
