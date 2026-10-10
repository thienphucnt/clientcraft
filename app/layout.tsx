import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-provider";

const geistSans = Geist({
  variable: "--font-font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ClientCraft — High-Performance Privacy-First Web Utility Hub",
  description:
    "100% client-side in-memory tools: SVG/Raster Image Compressor, JSON to TypeScript/Zod Converter, and AI Prompt Privacy Scrubber. Zero telemetry, offline PWA ready.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
  keywords: [
    "client-side",
    "image compressor",
    "json to typescript",
    "json to zod",
    "privacy scrubber",
    "ai prompt sanitizer",
    "pwa",
    "offline-first",
    "privacy-first",
  ],
  authors: [{ name: "ClientCraft Architect" }],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#090d16" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var m=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&m)){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
