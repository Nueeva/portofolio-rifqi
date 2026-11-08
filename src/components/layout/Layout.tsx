import { lazy, Suspense, type ReactNode } from "react";
import { usePublicDesign } from "@/components/public/PublicDesignContext";
const LegacyLayout = lazy(() => import("./LegacyLayout").then(m => ({ default: m.Layout })));
export function Layout({ children }: {
    children: ReactNode;
}) {
    const { isPublic } = usePublicDesign();
    return isPublic ? <>{children}</> : <Suspense fallback={null}><LegacyLayout>{children}</LegacyLayout></Suspense>;
}
