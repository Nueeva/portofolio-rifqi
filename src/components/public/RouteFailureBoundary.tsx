import { Component, type ReactNode } from "react";
export class RouteFailureBoundary extends Component<{
    children: ReactNode;
}, {
    failed: boolean;
}> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    render() { return this.state.failed ? <div className="public-container public-page" role="alert"><h1 tabIndex={-1}>Halaman belum dapat dimuat.</h1><p>Periksa koneksi, lalu coba muat ulang.</p><button className="public-text-link" onClick={() => window.location.reload()}>Muat ulang halaman</button><a href="/">Kembali ke beranda</a></div> : this.props.children; }
}
