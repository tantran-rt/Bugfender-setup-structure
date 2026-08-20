import type { Metadata } from "next";
import "../public/styles/globals.css";
import localFont from "next/font/local";
import { LayoutProvider, Auth } from "@/components";
import { WebVitals } from "@/components/web-vitals";
import { useMemo } from "react";
import { store } from "@/redux/store";
import { SupportWrapper } from "@/components/SupportWrapper";
import ScannerProviderWrapper from "@/components/scanditize/ScannerProviderWrapper";
import BugfenderBootstrap from "@/components/bugfender-bootstrap";

const inter = localFont({
  src: "../public/fonts/Inter-VariableFont_opsz,wght.ttf",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Proof",
  description:
    "PROOF is the world's first remote, fully observed drug & alcohol testing solution that is Effortless, Accurate, Secure, and Defensible.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <BugfenderBootstrap />
        <LayoutProvider>
          <ScannerProviderWrapper>
            <Auth>
              {children}
              <SupportWrapper />
            </Auth>
          </ScannerProviderWrapper>
        </LayoutProvider>
      </body>
    </html>
  );
}
