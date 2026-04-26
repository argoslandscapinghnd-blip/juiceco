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
  title: "Lemon Lab POS",
  description: "Sistema de punto de venta Lemon Lab.",
};

const APP_VERSION = "v2.2.0";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;1,300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
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