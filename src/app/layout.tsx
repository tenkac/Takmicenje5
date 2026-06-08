import type { Metadata, Viewport } from "next";
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

// ADDED VIEWPORT CONFIG FOR PWA & MOBILE
export const viewport: Viewport = {
  themeColor: "#000000", // Makes the status bar match your dark theme
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Prevents the screen from zooming in when you tap an input field
};

//  UPDATED METADATA FOR PWA AND IOS
export const metadata: Metadata = {
  title: "Takmičenje 5",
  description: "Takmičenje 5.0 • World Cup 2026 Edicija",
  manifest: "/manifest.json", // Tells the browser this is an app
  appleWebApp: {
    capable: true, // Enables the standalone full-screen mode on iOS
    statusBarStyle: "black-translucent",
    title: "Takmičenje 5", // Name shown on the iPhone home screen
  },
  icons: {
    apple: "/icon-192x192.png", // Make sure this image is inside your public folder!
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}