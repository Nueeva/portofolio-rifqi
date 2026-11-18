import { type ReactNode } from "react";
/** Decorative crop only: reading content never waits for an entrance. */
export function Aperture({ children, className = "", "data-vt-visual": vtVisual }: {
    children: ReactNode;
    className?: string;
    "data-vt-visual"?: string;
}) {
    return <div className={`public-aperture ${className}`} data-vt-visual={vtVisual}>{children}</div>;
}
