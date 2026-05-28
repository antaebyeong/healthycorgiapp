import type { Metadata, Viewport } from "next";
import { PwaRegister } from "./pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "헬시코기",
  description: "헬시코기 운동 인증과 출석 확인 PWA",
  applicationName: "헬시코기",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg"
  },
  appleWebApp: {
    capable: true,
    title: "헬시코기",
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  themeColor: "#3182F6",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-[#EEF4FF] antialiased">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
