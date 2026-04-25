import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Juice Co. POS",
  description: "Sistema de punto de venta Juice Co.",
};

const APP_VERSION = "v1.0.1";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        {/* Versión fija en esquina inferior derecha */}
        <div style={{
          position: "fixed",
          bottom: 8,
          right: 12,
          fontSize: 11,
          color: "#bbb",
          fontWeight: "bold",
          letterSpacing: 1,
          zIndex: 9999,
          pointerEvents: "none",
          userSelect: "none",
        }}>
          {APP_VERSION}
        </div>
      </body>
    </html>
  );
}
