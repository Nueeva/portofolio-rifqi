import { PublicSettingsProvider } from "@/hooks/usePublicSettings";
import type { ReactNode } from "react";
import { ConsoleLayout } from "@/components/admin/ConsoleLayout";
import "@/components/admin/admin-console.css";
export function Layout({ children }: { children: ReactNode }) {
  return (
    <PublicSettingsProvider>
      <ConsoleLayout>{children}</ConsoleLayout>
    </PublicSettingsProvider>
  );
}
