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

export const metadata: Metadata = {
  title: "Divya Sadhana · Admin",
  description: "Administration console for Divya Sadhana",
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
