import { type ReactNode } from "react";
/** Decorative crop only: reading content never waits for an entrance. */
export function Aperture({ children, className = "" }: {
    children: ReactNode;
    className?: string;
}) {
    return <div className={`public-aperture ${className}`}>{children}</div>;
}
