import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { PWAInstaller } from "@/components/PWAInstaller";
import { ServiceWorkerProvider } from "@/components/ServiceWorkerProvider";
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
  title: "Price Tracker - Track Product Prices & Get Alerts",
  description:
    "Track prices from Amazon and get instant alerts when prices drop below your target.",
  manifest: "/manifest.json",
  themeColor: "#000000",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Price Tracker",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Price Tracker",
    title: "Price Tracker - Track Product Prices & Get Alerts",
    description: "Track prices from Amazon and get instant alerts when prices drop below your target.",
  },
  twitter: {
    card: "summary",
    title: "Price Tracker - Track Product Prices & Get Alerts",
    description: "Track prices from Amazon and get instant alerts when prices drop below your target.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Price Tracker" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ServiceWorkerProvider>
          {children}
          <PWAInstaller />
          <Toaster position="top-right" richColors />
        </ServiceWorkerProvider>
      </body>
    </html>
  );
}
