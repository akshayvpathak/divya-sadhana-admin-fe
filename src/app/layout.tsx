import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers/Providers";
import { AuthProvider } from "@/context/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// No `weight` array on purpose: that pins the variable font to static
// instances, which silently clamps `font-black` on the amount displays.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Backs `font-mono`: payment refs, SKUs, tracking numbers, failure codes.
const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

// Only needed so Open Graph image URLs resolve absolutely; without it Next falls
// back to localhost and warns at build time.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://divyasadhana.org";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Divya Sadhana · Admin",
  description: "Administration console for Divya Sadhana",
  // The `<link rel="icon">` and `<link rel="apple-touch-icon">` tags come from
  // `favicon.ico` / `icon.png` / `apple-icon.png` sitting next to this file —
  // Next's file convention emits them (hashed, so they bust the browser cache).
  openGraph: {
    type: "website",
    siteName: "Divya Sadhana",
    title: "Divya Sadhana · Admin",
    description: "Administration console for Divya Sadhana",
    images: [
      {
        url: "/brand/divyasadhana-seal-512.png",
        width: 512,
        height: 512,
        alt: "Divya Sadhana Adhyatmik Trust",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-page font-sans text-ink">
        <AuthProvider>
          <Providers>
            {children}
            <ToastContainer
              position="top-right"
              theme="light"
              toastClassName="!rounded-xl !border !border-line !bg-surface !text-ink !shadow-pop"
            />
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
