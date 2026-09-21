import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { ProgressProvider } from "@/components/progress-provider";

export const metadata: Metadata = {
  title: { default: "DeutschMate — German from zero to C1", template: "%s · DeutschMate" },
  description: "A structured, interactive German learning platform from absolute beginner (A1) to advanced C1.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ProgressProvider>
          <SiteHeader />
          {children}
          <footer className="site-footer"><div className="shell"><strong>DeutschMate</strong><span>Build German systematically from A1 to C1.</span></div></footer>
        </ProgressProvider>
      </body>
    </html>
  );
}
