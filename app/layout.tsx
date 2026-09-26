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
        <a className="skip-link" href="#page-content">Skip to content</a>
        <ProgressProvider>
          <div className="product-shell">
            <SiteHeader />
            <div className="product-main" id="page-content" tabIndex={-1}>{children}</div>
          </div>
        </ProgressProvider>
      </body>
    </html>
  );
}
